import { useState, useEffect, useRef } from 'react';
import { Search, ScanLine, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { getPlants, getCategoryName } from '@/services/plantService';
import { request } from '@/lib/api';
import type { Plant } from '@/types';

const CATEGORIES = [
  { id: 'foliage', name: '观叶植物', icon: '🌿', color: 'bg-green-50', examples: '绿萝、龟背竹、琴叶榕' },
  { id: 'flowering', name: '观花植物', icon: '🌸', color: 'bg-pink-50', examples: '月季、绣球、兰花' },
  { id: 'succulent', name: '多肉植物', icon: '🌵', color: 'bg-yellow-50', examples: '景天、仙人掌' },
  { id: 'herbaceous', name: '草本植物', icon: '🌾', color: 'bg-lime-50', examples: '薄荷、罗勒' },
  { id: 'vine', name: '藤蔓植物', icon: '🌿', color: 'bg-teal-50', examples: '常春藤、绿萝' },
];

// 搜索结果响应格式
interface SearchResult {
  id: string;
  name: string;
  scientificName?: string;
  category?: string;
  difficulty?: number;
  description?: string;
  images?: string[];
  careGuide?: {
    light?: string;
    temperature?: string;
    humidity?: string;
  };
}

export function Discovery() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始加载热门植物（只取前10个）
  useEffect(() => {
    setIsLoading(true);
    getPlants({ limit: 10 }).then((data) => {
      console.log('获取热门植物数据:', data);
      setPlants(data);
      setIsLoading(false);
    }).catch((error) => {
      console.error('获取热门植物失败:', error);
      setIsLoading(false);
    });
  }, []);

  // 搜索防抖 500ms
  useEffect(() => {
    if (!searchQuery.trim()) {
      // 搜索词清空时恢复热门植物
      setIsLoading(true);
      getPlants({ limit: 10 }).then((data) => {
        setPlants(data);
        setIsLoading(false);
      });
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      const res = await request<any>('GET', `/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.success && res.data) {
        // 处理双重嵌套的情况
        let searchData = res.data;
        if (searchData.data) {
          searchData = searchData.data;
        }
        // 将搜索结果映射为前端 Plant 格式（复用 plantService 的映射逻辑）
        const { mapBackendPlant } = await import('@/services/plantService');
        if (searchData.plant) {
          // 搜索返回的是单个植物信息
          setPlants([mapBackendPlant(searchData.plant)]);
        } else {
          setPlants([]);
        }
      } else {
        setPlants([]);
      }
      setIsLoading(false);
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  // 分类点击 - 跳转到全部植物页面
  const handleCategoryClick = (categoryId: string) => {
    navigate(`/all-plants?category=${categoryId}`);
  };

  return (
    <div className="pb-24 px-6 pt-6 max-w-md mx-auto">
      <header className="flex justify-between items-center mb-8">
        <button className="p-2 -ml-2">
          <Menu size={28} />
        </button>
      </header>

      <h1 className="text-3xl font-bold mb-6">发现植物</h1>

      <div className="relative mb-8">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
        <Input
          placeholder="搜索植物/问题"
          className="pl-12 pr-12 py-6 bg-gray-50 border-none rounded-2xl text-base"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
          <ScanLine size={20} />
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">植物分类</h2>
        <div className="grid grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => handleCategoryClick(cat.id)}
            >
              <div
                className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all`}
              >
                {cat.icon}
              </div>
              <span className="text-xs font-medium text-gray-600">
                {cat.name}
              </span>
              {cat.examples && (
                <span className="text-[10px] text-gray-400 text-center px-1 truncate w-full">
                  {cat.examples}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">热门植物</h2>
          <Link to="/all-plants" className="text-sm text-primary font-medium">
            全部植物 →
          </Link>
        </div>

        {isLoading ? (
          // 骨架屏
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[200px] bg-gray-200 rounded-[32px] aspect-[2/3] animate-pulse"
              />
            ))}
          </div>
        ) : plants.length === 0 ? (
          // 空结果提示
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-4xl mb-4">🌿</span>
            <p className="text-base">未找到相关植物</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
            {plants.map((plant) => (
              <Link key={plant.id} to={`/plant/${plant.id}`}>
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="min-w-[200px] bg-gray-100 rounded-[32px] overflow-hidden relative aspect-[2/3]"
                >
                  {/* 分类标签 - 左上角 */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-2 z-10">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium">{getCategoryName(plant.originalCategory)}</span>
                  </div>

                  {/* 难度星级 - 右上角 */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 z-10">
                    <span className="text-xs">{'⭐'.repeat(plant.difficultyLevel || 3)}</span>
                  </div>

                  <img
                    src={plant.image}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* 底部描述区域 */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-4 rounded-2xl">
                    <h3 className="font-bold text-lg mb-1">{plant.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{plant.description}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
