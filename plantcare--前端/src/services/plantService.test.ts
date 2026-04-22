/**
 * Property 5: 数据映射完整性
 * Validates: Requirements 3.1, 4.1, 4.2
 *
 * 对任意后端植物对象，经过 mapBackendPlant 转换后，
 * 前端 Plant 接口的所有必填字段都应有非空值。
 *
 * Tag: Feature: frontend-backend-integration, Property 5: 数据映射完整性
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { mapBackendPlant, type BackendPlant } from './plantService';

// 后端 category 可能的值
const categoryArb = fc.option(
  fc.oneof(
    fc.constant('foliage'),
    fc.constant('succulent'),
    fc.constant('flowering'),
    fc.constant('herb'),
    fc.constant('cactus'),
    fc.constant('climbing'),
    fc.constant('fern'),
    fc.constant('aquatic'),
    fc.string({ minLength: 1, maxLength: 20 }), // 未知分类
  ),
  { nil: undefined }
);

// 难度 1-5 或 undefined
const difficultyArb = fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined });

// careGuide 任意子字段
const careGuideArb = fc.option(
  fc.record({
    light: fc.option(fc.string(), { nil: undefined }),
    temperature: fc.option(fc.string(), { nil: undefined }),
    humidity: fc.option(fc.string(), { nil: undefined }),
    watering: fc.option(fc.string(), { nil: undefined }),
    fertilizing: fc.option(fc.string(), { nil: undefined }),
  }),
  { nil: undefined }
);

// 随机后端植物对象生成器
const backendPlantArb: fc.Arbitrary<BackendPlant> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 50 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  scientificName: fc.option(fc.string(), { nil: undefined }),
  family: fc.option(fc.string(), { nil: undefined }),
  category: categoryArb,
  difficulty: difficultyArb,
  description: fc.option(fc.string(), { nil: undefined }),
  images: fc.option(
    fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
    { nil: undefined }
  ),
  careGuide: careGuideArb,
  tags: fc.option(fc.array(fc.string()), { nil: undefined }),
});

describe('mapBackendPlant - Property 5: 数据映射完整性', () => {
  it('对任意后端植物对象，映射后所有必填字段均非空', () => {
    fc.assert(
      fc.property(backendPlantArb, (backendPlant) => {
        const plant = mapBackendPlant(backendPlant);

        // 所有必填字段必须存在且非空
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

        // category 必须是合法枚举值
        expect(['Indoor', 'Outdoor', 'Office', 'Others']).toContain(plant.category);

        // difficulty 必须是合法枚举值
        expect(['Easy', 'Medium', 'Hard']).toContain(plant.difficulty);

        // size 必须是合法枚举值
        expect(['Small', 'Medium', 'Large']).toContain(plant.size);

        // image 必须是非空字符串
        expect(typeof plant.image).toBe('string');
        expect(plant.image.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
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

  it('无 images 时使用 picsum 占位图', () => {
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
