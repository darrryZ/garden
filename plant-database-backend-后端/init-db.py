#!/usr/bin/env python3
"""
初始化脚本：将 plant-database.json 中的植物数据导入 SQLite 数据库
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database'))

from database import GardenDatabase

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'garden.db')
PLANT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'plant-database.json')

def init_plant_types():
    """从 plant-database.json 导入植物类型"""
    
    if not os.path.exists(PLANT_DB_PATH):
        print(f"❌ 植物数据库文件不存在: {PLANT_DB_PATH}")
        return False
    
    with open(PLANT_DB_PATH, 'r', encoding='utf-8') as f:
        plant_db = json.load(f)
    
    print(f"📚 加载了 {plant_db['totalCount']} 种植物")
    
    db = GardenDatabase(DB_PATH)
    
    # 检查是否已有数据
    existing = db.get_all_plant_types()
    if len(existing) > 20:
        print(f"✅ 数据库已有 {len(existing)} 种植物类型，跳过导入")
        return True
    
    # 分类映射
    category_map = {
        'foliage': '绿叶',
        'flower': '花卉',
        'succulent': '多肉',
        'herb': '香草',
        'vegetable': '蔬菜',
        'fruit': '水果',
        'tree': '树木',
        'shrub': '灌木',
        'cactus': '多肉',
        'fern': '绿叶',
        'vine': '绿叶',
        'aquatic': '水生',
        'bonsai': '盆景',
        'air': '空气植物'
    }
    
    imported_count = 0
    skipped_count = 0
    
    for plant in plant_db['plants']:
        # 映射分类
        category = category_map.get(plant['category'], '其他')
        
        # 构建养护说明
        care_instructions = {
            'difficulty': plant.get('difficulty', 1),
            'light': plant.get('light', 2),
            'water': plant.get('water', 'medium'),
            'temperature': plant.get('temperature', ''),
            'humidity': plant.get('humidity', ''),
            'soil': plant.get('soil', ''),
            'fertilizer': plant.get('fertilizer', ''),
            'growthRate': plant.get('growthRate', ''),
            'toxicity': plant.get('toxicity', ''),
            'propagation': plant.get('propagation', ''),
            'careTips': plant.get('careTips', []),
            'commonIssues': plant.get('commonIssues', [])
        }
        
        # 检查是否已存在
        existing_types = db.get_all_plant_types()
        if any(pt['name'] == plant['name'] for pt in existing_types):
            skipped_count += 1
            if skipped_count <= 3:
                print(f"  ⏭️  跳过已存在: {plant['name']}")
            continue
        
        # 创建植物类型
        try:
            db.create_plant_type(
                name=plant['name'],
                scientific_name=plant.get('scientificName', ''),
                category=category,
                description=plant.get('description', ''),
                care_instructions=json.dumps(care_instructions, ensure_ascii=False),
                icon_url=plant.get('image', {}).get('url') if isinstance(plant.get('image'), dict) else None
            )
            imported_count += 1
            if imported_count <= 10 or imported_count % 50 == 0:
                print(f"  ✅ 导入: {plant['name']} ({category})")
        except Exception as e:
            print(f"  ❌ 导入失败: {plant['name']} - {e}")
    
    print(f"\n🎉 成功导入 {imported_count} 种植物类型")
    print(f"   跳过 {skipped_count} 种已存在的")
    
    # 显示统计
    all_types = db.get_all_plant_types()
    categories = {}
    for pt in all_types:
        cat = pt['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\n📊 植物类型统计:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"   {cat}: {count} 种")
    
    return True

if __name__ == '__main__':
    print("🌱 Rose Garden 数据库初始化")
    print("=" * 50)
    init_plant_types()
    print("=" * 50)
    print("✅ 初始化完成!")
