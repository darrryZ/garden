import { request } from '../lib/api';
import type { Plant } from '../types';

// 后端植物数据类型
export interface BackendPlant {
  id: string;
  name: string;
  scientificName?: string;
  family?: string;
  category?: string; // foliage/succulent/flowering/herb/cactus/climbing/fern/aquatic
  difficulty?: number; // 1-5
  description?: string;
  image?: string;
  images?: string[];
  careGuide?: {
    light?: string;
    temperature?: string;
    humidity?: string;
    watering?: string;
    fertilizing?: string;
  };
  tags?: string[];
}

// 后端 /api/plants 响应格式
interface PlantsResponse {
  plants: BackendPlant[];
  total: number;
}

// difficulty 数字 → 前端字符串
function mapDifficulty(difficulty?: number): Plant['difficulty'] {
  if (difficulty === undefined || difficulty === null) return 'Medium';
  if (difficulty <= 2) return 'Easy';
  if (difficulty === 3) return 'Medium';
  return 'Hard';
}

// category 字符串 → 前端分类
function mapCategory(category?: string): Plant['category'] {
  switch (category) {
    case 'foliage':
    case 'climbing':
    case 'fern':
    case 'aquatic':
      return 'Indoor';
    case 'succulent':
    case 'cactus':
      return 'Outdoor';
    case 'herb':
      return 'Office';
    default:
      return 'Others';
  }
}

// 后端原始分类 → 中文分类名称
const categoryNames: Record<string, string> = {
  foliage: '观叶植物',
  flowering: '观花植物',
  succulent: '多肉植物',
  herbaceous: '草本植物',
  vine: '藤蔓植物',
  woody: '木本植物',
};

// 后端植物对象 → 前端 Plant 接口
export function mapBackendPlant(backendPlant: BackendPlant): Plant {
  const {
    id,
    name,
    scientificName,
    family,
    category,
    difficulty,
    description,
    images,
    careGuide,
  } = backendPlant;

  // 处理图片字段，优先使用backendPlant.image
  const image =
    backendPlant.image || (images && images.length > 0 ? images[0] : `https://picsum.photos/seed/${id}/400/300`);

  return {
    id,
    name,
    scientificName,
    family,
    category: mapCategory(category),
    originalCategory: category,
    difficulty: mapDifficulty(difficulty),
    difficultyLevel: difficulty || 3,
    image,
    description: description ?? '',
    light: careGuide?.light || '适中',
    temperature: careGuide?.temperature || '15-25°C',
    humidity: careGuide?.humidity || '适中',
    size: 'Medium',
    tags: backendPlant.tags,
  };
}

// 获取分类中文名称
export function getCategoryName(categoryId?: string): string {
  return categoryId ? categoryNames[categoryId] || categoryId : '植物';
}

// 获取植物列表
export async function getPlants(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<Plant[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page !== undefined) query.set('page', String(params.page));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));

    const qs = query.toString();
    const path = qs ? `/api/plants?${qs}` : '/api/plants';

    const res = await request<any>('GET', path);
    if (!res.success || !res.data) {
      console.log('API请求失败:', res.error);
      return [];
    }

    // 后端返回的是 { success: true, data: { plants: [...], pagination: {...} } }
    // request函数返回的是 { success: true, data: {...} }
    // 所以 res.data 就是后端返回的 data 字段
    let responseData = res.data;
    
    // 处理双重嵌套的情况：如果 res.data 还有 data 字段，取里面的
    if (responseData.data && responseData.data.plants) {
      responseData = responseData.data;
    }
    
    // 兼容多种响应格式
    let list: BackendPlant[] = [];
    if (Array.isArray(responseData)) {
      // 直接返回数组的情况
      list = responseData;
    } else if (responseData.plants) {
      // 包含plants字段的情况（新后端格式）
      list = responseData.plants;
    }
    console.log('植物列表数据:', list.length, '条');
    return list.map(mapBackendPlant);
  } catch (error) {
    console.error('获取植物列表失败:', error);
    return [];
  }
}

// 获取单个植物详情
export async function getPlantById(id: string): Promise<Plant | null> {
  const res = await request<any>('GET', `/api/plants/${id}`);
  if (!res.success || !res.data) return null;
  
  // 处理双重嵌套的情况
  let plantData = res.data;
  if (plantData.data && plantData.data.id) {
    plantData = plantData.data;
  }
  
  return mapBackendPlant(plantData);
}
