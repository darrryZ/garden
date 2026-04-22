import { describe, expect, it } from 'vitest';
import { mapBackendPlant } from './plantService';

describe('mapBackendPlant', () => {
  it('fills required fields for typical backend payloads', () => {
    const cases = [
      { id: 'a', name: '绿萝' },
      {
        id: 'b',
        name: '龟背竹',
        category: 'foliage',
        difficulty: 2,
        careGuide: {
          light: '明亮散射光',
          temperature: '18-28°C',
          humidity: '60%',
        },
        tags: ['耐阴'],
      },
      {
        id: 'c',
        name: '仙人掌',
        category: 'cactus',
        difficulty: 4,
        images: ['https://example.com/cactus.jpg'],
      },
    ];

    for (const backendPlant of cases) {
      const plant = mapBackendPlant(backendPlant);
      expect(plant.id).toBeTruthy();
      expect(plant.name).toBeTruthy();
      expect(plant.category).toBeTruthy();
      expect(plant.image).toBeTruthy();
      expect(plant.description).not.toBeUndefined();
      expect(plant.difficulty).toBeTruthy();
      expect(plant.light).toBeTruthy();
      expect(plant.temperature).toBeTruthy();
      expect(plant.humidity).toBeTruthy();
      expect(plant.size).toBeTruthy();
    }
  });

  it('difficulty 映射规则正确', () => {
    expect(mapBackendPlant({ id: 'x', name: 'x', difficulty: 1 }).difficulty).toBe('Easy');
    expect(mapBackendPlant({ id: 'x', name: 'x', difficulty: 2 }).difficulty).toBe('Easy');
    expect(mapBackendPlant({ id: 'x', name: 'x', difficulty: 3 }).difficulty).toBe('Medium');
    expect(mapBackendPlant({ id: 'x', name: 'x', difficulty: 4 }).difficulty).toBe('Hard');
    expect(mapBackendPlant({ id: 'x', name: 'x', difficulty: 5 }).difficulty).toBe('Hard');
    expect(mapBackendPlant({ id: 'x', name: 'x' }).difficulty).toBe('Medium');
  });

  it('category 映射规则正确', () => {
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'foliage' }).category).toBe('Indoor');
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'climbing' }).category).toBe('Indoor');
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'fern' }).category).toBe('Indoor');
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'aquatic' }).category).toBe('Indoor');
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'succulent' }).category).toBe('Outdoor');
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'cactus' }).category).toBe('Outdoor');
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'herb' }).category).toBe('Office');
    expect(mapBackendPlant({ id: 'x', name: 'x', category: 'flowering' }).category).toBe('Others');
    expect(mapBackendPlant({ id: 'x', name: 'x' }).category).toBe('Others');
  });

  it('无 images 时使用占位图', () => {
    const plant = mapBackendPlant({ id: 'abc123', name: 'test' });
    expect(plant.image).toBe('https://picsum.photos/seed/abc123/400/300');
  });

  it('有 images 时使用第一张', () => {
    const plant = mapBackendPlant({
      id: 'x',
      name: 'x',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
    });
    expect(plant.image).toBe('https://example.com/img1.jpg');
  });
});
