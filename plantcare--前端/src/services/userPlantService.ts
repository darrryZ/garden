import { request } from '../lib/api';
import { getPlantById } from './plantService';
import type { OwnedPlant } from '../types';

// 后端 UserPlant 数据结构
interface BackendUserPlant {
  id: string;
  userId: string;
  plantId: string;
  nickname: string | null;
  acquiredDate: string;
  location?: string | null;
  notes?: string | null;
  lastWatered?: string | null;
  waterFrequency?: number;
  lastFertilized?: string | null;
  fertilizeFrequency?: number;
  createdAt: string;
  updatedAt: string;
}

// 获取用户植物列表（合并植物基础信息）
export async function getUserPlants(): Promise<OwnedPlant[]> {
  const res = await request<any>('GET', '/api/user-plants');
  if (!res.success || !res.data) return [];
  
  // 处理双重嵌套的情况
  let userPlantsData = res.data;
  if (userPlantsData.data && Array.isArray(userPlantsData.data)) {
    userPlantsData = userPlantsData.data;
  }
  if (!Array.isArray(userPlantsData)) return [];

  const results = await Promise.all(
    userPlantsData.map(async (up: BackendUserPlant) => {
      const plant = await getPlantById(up.plantId);
      if (!plant) return null;

      const ownedPlant: OwnedPlant = {
        ...plant,
        id: up.id,
        nickname: up.nickname ?? plant.name,
        addedDate: up.acquiredDate,
        healthStatus: 'Healthy',
        lastWatered: up.lastWatered ?? undefined,
        lastFertilized: up.lastFertilized ?? undefined,
        waterFrequency: up.waterFrequency ?? 7,
        fertilizeFrequency: up.fertilizeFrequency ?? 30,
        notes: up.notes ?? undefined,
        location: up.location ?? undefined,
        milestones: [],
        tasks: [],
      };
      return ownedPlant;
    })
  );

  return results.filter((p): p is OwnedPlant => p !== null);
}

// 添加植物到花园
export async function addUserPlant(data: {
  plantId: string;
  nickname: string;
}): Promise<boolean> {
  const res = await request('POST', '/api/user-plants', {
    plantId: data.plantId,  // 后端期望 plantId
    nickname: data.nickname
  });
  return res.success;
}

// 删除用户植物
export async function deleteUserPlant(id: string): Promise<boolean> {
  const res = await request('DELETE', `/api/user-plants/${id}`);
  return res.success;
}

// 更新用户植物信息（如名称）
export async function updateUserPlant(
  id: string,
  data: {
    nickname?: string;
    location?: string;
    notes?: string;
    waterFrequency?: number;
    fertilizeFrequency?: number;
    lastWatered?: string;
    lastFertilized?: string;
  }
): Promise<boolean> {
  const res = await request('PUT', `/api/user-plants/${id}`, data);
  return res.success;
}

// 获取单个用户植物详情
export async function getUserPlantById(id: string): Promise<OwnedPlant | null> {
  const res = await request<any>('GET', `/api/user-plants/${id}`);
  if (!res.success || !res.data) return null;
  
  // res.data 是后端返回的 { success: true, data: plant }
  // 所以真正的植物数据在 res.data.data
  const up = res.data.data || res.data;
  
  if (!up || !up.plantId) {
    console.error('plantId is missing in user plant data:', up);
    return null;
  }
  
  const plant = await getPlantById(up.plantId);
  if (!plant) return null;

  const ownedPlant: OwnedPlant = {
    ...plant,
    id: up.id,
    nickname: up.nickname ?? plant.name,
    addedDate: up.acquiredDate,
    healthStatus: 'Healthy',
    lastWatered: up.lastWatered ?? undefined,
    lastFertilized: up.lastFertilized ?? undefined,
    waterFrequency: up.waterFrequency ?? 7,
    fertilizeFrequency: up.fertilizeFrequency ?? 30,
    notes: up.notes ?? undefined,
    location: up.location ?? undefined,
    milestones: [],
    tasks: [],
  };
  return ownedPlant;
}
