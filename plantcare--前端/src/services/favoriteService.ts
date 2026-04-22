import { request } from '../lib/api';
import { getPlantById } from './plantService';
import type { Plant } from '../types';

export interface FavoriteRecord {
  id: string;
  plantId: string;
  createdAt: string;
}

export interface FavoritePlant extends Plant {
  favoriteId: string;
  favoritedAt: string;
}

export async function getFavorites(): Promise<FavoriteRecord[]> {
  const res = await request<any>('GET', '/api/favorites');
  if (!res.success || !res.data) return [];

  const payload = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  return payload.map((item: any) => ({
    id: item.id,
    plantId: item.plantId,
    createdAt: item.createdAt,
  }));
}

export async function getFavoritePlants(): Promise<FavoritePlant[]> {
  const favorites = await getFavorites();

  const plants = await Promise.all(
    favorites.map(async favorite => {
      const plant = await getPlantById(favorite.plantId);
      if (!plant) return null;

      return {
        ...plant,
        favoriteId: favorite.id,
        favoritedAt: favorite.createdAt,
      };
    })
  );

  return plants.filter((item): item is FavoritePlant => item !== null);
}

export async function addFavorite(plantId: string): Promise<boolean> {
  const res = await request('POST', '/api/favorites', { plantId });
  return res.success;
}

export async function removeFavorite(favoriteId: string): Promise<boolean> {
  const res = await request('DELETE', `/api/favorites/${favoriteId}`);
  return res.success;
}

export async function removeFavoriteByPlantId(plantId: string): Promise<boolean> {
  const res = await request('DELETE', `/api/favorites/plant/${plantId}`);
  return res.success;
}
