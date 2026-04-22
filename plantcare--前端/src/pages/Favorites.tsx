import { useEffect, useState } from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getFavoritePlants, removeFavorite } from '@/services/favoriteService';
import type { FavoritePlant } from '@/services/favoriteService';

export function Favorites() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoritePlant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const data = await getFavoritePlants();
      setFavorites(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemove = async (favoriteId: string) => {
    await removeFavorite(favoriteId);
    await loadFavorites();
  };

  return (
    <div className="pb-24 min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-lg font-bold">我的收藏</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-16">加载中...</div>
        ) : favorites.length === 0 ? (
          <div className="rounded-[32px] bg-gray-50 py-16 px-6 text-center">
            <Heart className="mx-auto text-gray-300 mb-4" size={32} />
            <p className="text-gray-500 mb-6">你还没有收藏植物，去详情页点亮小心心吧。</p>
            <Link to="/all-plants">
              <Button className="rounded-full px-6">去逛逛</Button>
            </Link>
          </div>
        ) : (
          favorites.map(item => (
            <div key={item.favoriteId} className="rounded-[28px] border border-gray-100 p-4 shadow-sm">
              <div className="flex gap-4">
                <Link to={`/plant/${item.id}`} className="shrink-0">
                  <img src={item.image} alt={item.name} className="w-24 h-24 rounded-3xl object-cover" referrerPolicy="no-referrer" />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/plant/${item.id}`} className="font-bold text-lg line-clamp-1">
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-400 mt-1">{item.family || '植物'}</p>
                    </div>
                    <button onClick={() => handleRemove(item.favoriteId)} className="text-red-500 shrink-0">
                      取消
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">{item.description}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
