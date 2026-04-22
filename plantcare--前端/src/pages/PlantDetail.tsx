import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Heart, Sun, Thermometer, Droplets, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlantById, getPlants, getCategoryName } from '@/services/plantService';
import { addFavorite, getFavorites, removeFavoriteByPlantId } from '@/services/favoriteService';
import { useAuth } from '@/contexts/AuthContext';
import { request } from '@/lib/api';
import type { Plant } from '@/types';

export function PlantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [plant, setPlant] = useState<Plant | null>(null);
  const [similarPlants, setSimilarPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isInGarden, setIsInGarden] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([getPlantById(id), getFavorites()])
      .then(async ([result, favorites]) => {
        if (!result) {
          setNotFound(true);
          return;
        }

        setPlant(result);
        setIsFavorite(favorites.some(item => item.plantId === result.id));

        if (result.originalCategory) {
          const related = await getPlants({ category: result.originalCategory, limit: 6 });
          setSimilarPlants(related.filter(item => item.id !== result.id).slice(0, 3));
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const categoryLabel = useMemo(() => getCategoryName(plant?.originalCategory), [plant?.originalCategory]);

  const handleAddToGarden = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }
    if (!plant) return;
    setIsAdding(true);
    const res = await request('POST', '/api/user-plants', {
      plantId: plant.id,
      nickname: plant.name,
    });
    setIsAdding(false);
    if (res.success) {
      setIsInGarden(true);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      alert('请先登录后再收藏');
      return;
    }
    if (!plant || favoriteLoading) return;

    setFavoriteLoading(true);
    try {
      const success = isFavorite ? await removeFavoriteByPlantId(plant.id) : await addFavorite(plant.id);
      if (success) {
        setIsFavorite(!isFavorite);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleShare = async () => {
    if (!plant) return;

    const shareData = {
      title: `${plant.name} - 智能植护`,
      text: `来看看 ${plant.name} 的养护信息吧`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    alert('链接已复制，可分享到微信/朋友圈');
  };

  if (isLoading) {
    return (
      <div className="pb-32 min-h-screen bg-white">
        <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-lg font-bold">植物卡片</h1>
          <div className="w-10" />
        </header>
        <div className="px-6 flex items-center justify-center h-64">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (notFound || !plant) {
    return (
      <div className="pb-32 min-h-screen bg-white">
        <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-lg font-bold">植物卡片</h1>
          <div className="w-10" />
        </header>
        <div className="px-6 flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-gray-500">植物未找到</p>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 min-h-screen bg-white">
      <header className="flex justify-between items-center p-6 sticky top-0 bg-white/80 backdrop-blur z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-lg font-bold">植物卡片</h1>
        <button onClick={handleShare} className="p-2 rounded-full hover:bg-gray-100">
          <Share2 size={20} />
        </button>
      </header>

      <div className="px-6">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="relative w-full md:w-1/2 aspect-square">
            <img
              src={plant.image}
              alt={plant.name}
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="w-full md:w-1/2">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-3xl font-bold">{plant.name}</h2>
              <Button
                size="icon"
                className="rounded-full w-12 h-12 bg-primary/20 text-primary hover:bg-primary/30"
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}
              >
                <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
              </Button>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed mb-4">{plant.description}</p>

            <button className="text-xs text-gray-400 mb-6 flex items-center gap-1">
              产品知识 <ChevronLeft size={12} className="rotate-180" />
            </button>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">分类</span>
                <span className="text-xs font-medium">{categoryLabel}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">科属</span>
                <span className="text-xs font-medium">{plant.family || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">难度</span>
                <span className="text-xs font-medium">{'⭐'.repeat(plant.difficultyLevel || 3)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {plant.tags && plant.tags.length > 0 ? (
                plant.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">暂无标签</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-primary rounded-[40px] p-8 text-white space-y-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Sun size={20} />
              </div>
              <span className="text-xs font-medium">光照</span>
              <span className="text-[10px] opacity-80">{plant.light}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Thermometer size={20} />
              </div>
              <span className="text-xs font-medium">温度</span>
              <span className="text-[10px] opacity-80">{plant.temperature}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Droplets size={20} />
              </div>
              <span className="text-xs font-medium">湿度</span>
              <span className="text-[10px] opacity-80">{plant.humidity}</span>
            </div>
          </div>

          <Button
            className="w-full py-8 rounded-2xl bg-white/30 hover:bg-white/40 text-white font-bold text-lg border-none shadow-none disabled:opacity-60"
            onClick={handleAddToGarden}
            disabled={isInGarden || isAdding}
          >
            {isInGarden ? '已在花园中' : isAdding ? '添加中...' : '+加入我的花园'}
          </Button>
        </div>

        {similarPlants.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">相似植物推荐</h3>
              <Link to={`/all-plants?category=${plant.originalCategory ?? ''}`} className="text-xs text-primary">
                查看更多
              </Link>
            </div>
            <div className="space-y-3">
              {similarPlants.map(item => (
                <Link key={item.id} to={`/plant/${item.id}`} className="flex items-center gap-3 bg-gray-50 rounded-3xl p-3">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
