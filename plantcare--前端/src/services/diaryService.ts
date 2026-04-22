import { request } from '../lib/api';
import type { Milestone } from '../types';

// 后端日记条目数据结构
interface BackendDiaryEntry {
  id: string;
  userId: string;
  userPlantId: string;
  title: string;
  content: string;
  mood?: string;
  photos?: string[];
  images?: string[]; // 后端使用 images
  createdAt: string;
  updatedAt: string;
}

// 将后端日记条目映射为前端里程碑格式
function mapToMilestone(entry: BackendDiaryEntry, index: number): Milestone {
  const date = new Date(entry.createdAt);
  const formatted = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  return {
    id: entry.id,
    date: formatted,
    title: entry.title,
    description: entry.content,
    mood: entry.mood,
    photos: entry.photos || entry.images || [],
    isLeft: index % 2 === 0, // 交替左右显示
  };
}

// 获取植物日记条目（映射为里程碑格式）
export async function getDiaryEntries(userPlantId: string): Promise<Milestone[]> {
  const res = await request<any>(
    'GET',
    `/api/diary?userPlantId=${userPlantId}`
  );
  if (!res.success || !res.data) return [];
  
  // 处理双重嵌套的情况
  let diaryData = res.data;
  if (diaryData.data && Array.isArray(diaryData.data)) {
    diaryData = diaryData.data;
  }
  if (!Array.isArray(diaryData)) return [];
  
  return diaryData.map((entry, index) => mapToMilestone(entry, index));
}

// 创建日记条目（支持图片和心情）
export async function createDiaryEntry(data: {
  userPlantId: string;
  title: string;
  content: string;
  mood?: string;
  photos?: string[];
}): Promise<boolean> {
  const res = await request('POST', '/api/diary', {
    ...data,
    images: data.photos, // 后端使用 images 字段
  });
  return res.success;
}
