import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { getPlants, getCategoryName } from '@/services/plantService';
import type { Plant } from '@/types';

const CATEGORY_NAMES: Record<string, string> = {
  foliage: '观叶植物',
  flowering: '观花植物',
  succulent: '多肉植物',
  herbaceous: '草本植物',
  vine: '藤蔓植物',
};

export function AllPlants() {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载植物（根据分类参数筛选）
  useEffect(() => {
    const loadPlants = async () => {
      setIsLoading(true);
      try {
        const params: { limit: number; category?: string } = { limit: 100 };
        if (category) {
          params.category = category;
        }
        const data = await getPlants(params);
        setPlants(data);
      } catch (error) {
        console.error('获取植物列表失败:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPlants();
  }, [category]);

  // 获取页面标题
  const pageTitle = category && CATEGORY_NAMES[category] 
    ? CATEGORY_NAMES[category] 
    : '全部植物';

  return (
    <div className="pb-24 px-6 pt-6 max-w-md mx-auto">
      <header className="flex items-center mb-8">
        <Link to="/" className="p-2 -ml-2">
          <ArrowLeft size={28} />
        </Link>
        <h1 className="text-3xl font-bold ml-4">{pageTitle}</h1>
      </header>

      {isLoading ? (
        // 骨架屏
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-[32px] aspect-[3/4] animate-pulse"
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
        <div className="grid grid-cols-2 gap-4">
          {plants.map((plant) => (
            <Link key={plant.id} to={`/plant/${plant.id}`}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="bg-gray-100 rounded-[32px] overflow-hidden relative aspect-[3/4]"
              >
                {/* 分类标签 - 左上角 */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1 z-10">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-[10px] font-medium">{getCategoryName(plant.originalCategory)}</span>
                </div>

                {/* 难度星级 - 右上角 */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-1.5 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                  <span className="text-[10px]">{'⭐'.repeat(plant.difficultyLevel || 3)}</span>
                </div>

                <img
                  src={plant.image}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />

                {/* 底部描述区域 */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-3 rounded-xl">
                  <h3 className="font-bold text-sm mb-1">{plant.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{plant.description}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
