#!/usr/bin/env python3
"""
植物数据库智能丰富工具
基于植物科属、类别、原产地等特征，生成个性化的养护内容
避免通用模板，让每种植物的养护指南都有针对性
"""

import json
import random
from datetime import datetime

# ============== 植物科属特征知识库 ==============

# 按科分类的养护特征
FAMILY_CARE_PROFILES = {
    '天南星科': {
        'light': '喜明亮的散射光，忌强光直射。适合室内东向或北向窗台，距离窗户 1-2 米处。夏季需遮阴 50%-70%，冬季可适当增加光照。',
        'water': '喜湿润但怕积水。生长期保持土壤微湿，表土发白时浇水。夏季每周 2-3 次，秋冬季每 7-10 天一次。',
        'humidity': '喜高湿度环境，适宜湿度 60%-80%。干燥季节需经常向叶面及周围喷雾，或使用加湿器。',
        'soil': '疏松、肥沃、排水良好的微酸性土壤。推荐：腐叶土 4 份 + 泥炭土 3 份 + 珍珠岩 2 份 + 河沙 1 份。',
        'temperature': '适宜温度 18-28°C。冬季不低于 10°C，低于 15°C 生长缓慢。',
        'fertilizer': '生长期（4-9 月）每 2 周施一次稀释的观叶植物液肥。秋冬季停止施肥。',
        'pruning': '及时剪除枯黄叶片和老化枝条。藤蔓过长可截短促进分枝。',
        'tips': [
            '💧 天南星科植物汁液有毒，修剪时戴手套，避免接触皮肤和误食',
            '🧹 定期用湿软布擦拭叶片，保持光泽和光合作用效率',
            '🪴 气生根发达的品种可引导其攀附支架或垂吊生长',
            '💨 保持通风可预防红蜘蛛和介壳虫',
        ],
        'common_issues': [
            '黄叶：浇水过多或土壤积水导致烂根',
            '叶尖干枯：空气湿度不足或浇水不及时',
            '叶片变小：光照不足或长期未换盆缺肥',
            '病虫害：通风不良易生红蜘蛛、介壳虫',
        ]
    },
    '天门冬科': {
        'light': '适应性强，耐阴也耐阳。半阴环境生长最佳，可接受早晚柔和阳光。夏季避免烈日暴晒。',
        'water': '宁干勿湿，极耐旱。春秋季每 2 周浇一次，夏季每周一次，冬季每月一次或更少。',
        'humidity': '对湿度要求不高，40%-60% 即可。干燥环境也能适应。',
        'soil': '排水良好的沙质土壤。推荐：园土 2 份 + 腐叶土 2 份 + 河沙 2 份 + 珍珠岩 1 份。',
        'temperature': '适宜温度 18-27°C。耐寒性较强，可短期耐受 5°C 低温。',
        'fertilizer': '春夏季每月施一次稀薄液肥或缓释肥。秋冬季停止施肥。',
        'pruning': '及时剪除枯黄叶片。花后剪去花茎，避免消耗养分。',
        'tips': [
            '💧 浇水前务必确认土壤完全干燥，可用竹签插入土中检查',
            '🌡️ 冬季保持土壤偏干可增强抗寒能力',
            '🪴 浅盆种植更佳，避免深盆积水烂根',
            '⚠️ 部分品种叶片汁液有毒，避免儿童和宠物误食',
        ],
        'common_issues': [
            '叶片发软：浇水过多或土壤积水',
            '叶尖干枯：正常老化或空气过于干燥',
            '斑纹变淡：长期光照不足',
            '烂根：浇水频繁或土壤排水不良',
        ]
    },
    '桑科': {
        'light': '喜明亮的散射光，也能耐半阴。室内明亮处均可摆放，避免夏季强光直射。',
        'water': '宁干勿湿，忌积水。春秋季每 10-15 天浇一次，夏季每周一次，冬季每 20-30 天一次。',
        'humidity': '喜欢湿润环境，50%-70% 为宜。干燥季节可向叶面喷雾。',
        'soil': '疏松、透气、排水良好的微酸性土壤。推荐：泥炭土 3 份 + 珍珠岩 2 份 + 河沙 2 份。',
        'temperature': '适宜温度 20-30°C。冬季不低于 10°C，怕冷怕冻。',
        'fertilizer': '生长期每月施一次复合肥或有机肥。冬季停止施肥。',
        'pruning': '春季可适当修剪过密枝条，保持株型美观。及时摘除黄叶。',
        'tips': [
            '💧 桑科植物最怕积水烂根，务必等土壤干透再浇水',
            '🌡️ 越冬注意保暖，远离冷风和空调出风口',
            '🪴 盆底确保有排水孔，垫陶粒或碎石增强排水',
            '🌳 茎干避免碰撞损伤，伤口易感染病菌',
        ],
        'common_issues': [
            '落叶：浇水过多、温度过低或光照不足',
            '叶片发黄：土壤积水或长期缺肥',
            '徒长：光照不足导致节间拉长',
            '茎干腐烂：伤口感染或浇水过多',
        ]
    },
    '五加科': {
        'light': '喜明亮的散射光，也耐半阴。避免夏季强光直射，否则叶片易灼伤。',
        'water': '喜湿润，生长期保持土壤湿润。春夏季每周 2-3 次，秋冬季每周 1-2 次。',
        'humidity': '喜欢高湿度，60%-80% 最佳。需经常喷雾或使用加湿器。',
        'soil': '疏松、肥沃、排水良好的腐殖质土壤。推荐：腐叶土 3 份 + 泥炭土 2 份 + 珍珠岩 2 份。',
        'temperature': '适宜温度 18-25°C。冬季不低于 8°C。',
        'fertilizer': '生长期每 2 周施一次稀薄液肥。可用观叶植物专用肥。',
        'pruning': '及时剪除枯黄叶片。藤蔓过长可修剪或引导攀爬。',
        'tips': [
            '💧 保持土壤湿润但不积水，夏季高温可增加浇水',
            '💨 高湿度是关键，经常喷雾保持叶面湿润',
            '🌿 定期用湿布擦拭叶片，保持光泽',
            '🪴 提供支架供藤蔓攀爬，造型更美观',
        ],
        'common_issues': [
            '叶缘焦枯：空气干燥或浇水不足',
            '叶片脱落：温度过低或土壤积水',
            '生长缓慢：光照不足或缺肥',
            '病虫害：通风不良易生蚜虫、红蜘蛛',
        ]
    },
    '竹芋科': {
        'light': '喜半阴环境，忌强光直射。放在室内明亮但无直射光处最佳。',
        'water': '喜湿润，生长期保持土壤微湿。春夏季每周 2-3 次，秋冬季每周 1-2 次。用软水浇水。',
        'humidity': '喜高湿度，70%-80% 最佳。需经常喷雾，否则叶缘易焦枯。',
        'soil': '疏松、肥沃、排水良好的微酸性土壤。推荐：腐叶土 3 份 + 泥炭土 2 份 + 珍珠岩 2 份。',
        'temperature': '适宜温度 18-25°C。冬季不低于 15°C，怕冷。',
        'fertilizer': '生长期每 2-3 周施一次稀薄液肥。秋冬季减少施肥。',
        'pruning': '及时剪除枯黄叶片和老化叶片。保持株型整洁。',
        'tips': [
            '💧 竹芋对水质敏感，最好用晾晒过的自来水或雨水',
            '💨 湿度是关键，干燥环境叶缘会焦枯卷曲',
            '🌡️ 冬季注意保暖，低于 15°C 易受冻害',
            '🌙 部分品种叶片夜间会闭合，属正常现象',
        ],
        'common_issues': [
            '叶缘焦枯：空气湿度不足或水质过硬',
            '叶片卷曲：湿度太低或浇水不足',
            '斑纹变淡：光照过强或施肥过多',
            '生长停滞：温度过低或土壤积水',
        ]
    },
}

# 按类别的额外特征
CATEGORY_PROFILES = {
    'foliage': {  # 观叶植物
        'focus': '叶片观赏',
        'tips': [
            '🧹 定期清洁叶片可保持光泽和光合作用效率',
            '🌿 观叶植物以氮肥为主，可使叶片更绿更大',
            '✂️ 及时修剪过密枝条，保持通风和株型美观',
        ]
    },
    'succulent': {  # 多肉植物
        'focus': '耐旱储水',
        'tips': [
            '💧 宁干勿湿是多肉养护的第一原则',
            '☀️ 除夏季外给予充足光照，防止徒长',
            '🪴 使用颗粒含量高的土壤，增强排水性',
            '🌡️ 夏季高温时适当遮阴通风，避免晒伤',
        ]
    },
    'flowering': {  # 观花植物
        'focus': '促花保花',
        'tips': [
            '🌸 花期前增施磷钾肥，促进花芽分化',
            '✂️ 花后及时剪去残花，避免消耗养分',
            '☀️ 花期需要充足光照，但避免正午强光',
            '💧 花期适当控水可延长花期',
        ]
    },
    'fern': {  # 蕨类植物
        'focus': '喜阴湿',
        'tips': [
            '💨 蕨类喜高湿度，干燥季节需经常喷雾',
            '🌡️ 避免阳光直射，放在明亮散射光处',
            '💧 保持土壤持续湿润，但避免积水',
            '🌿 老化的羽状叶及时剪除，促进新叶生长',
        ]
    },
    'cactus': {  # 仙人掌
        'focus': '极耐旱',
        'tips': [
            '💧 极耐旱，春秋季每 2-3 周浇水一次，冬季可断水',
            '☀️ 需要充足阳光，每天至少 4-6 小时直射光',
            '🪴 使用排水极好的颗粒土，盆底垫陶粒',
            '🌡️ 冬季保持干燥可增强抗寒能力',
        ]
    },
    'climbing': {  # 爬藤植物
        'focus': '攀援生长',
        'tips': [
            '🌿 提供支架或网格供藤蔓攀爬',
            '✂️ 定期修剪过长的藤蔓，促进侧枝萌发',
            '💧 生长期保持土壤湿润，夏季增加浇水',
            '🪴 可垂吊或攀援，造型多样',
        ]
    },
    'herb': {  # 香草植物
        'focus': '芳香食用',
        'tips': [
            '🌿 香草需要充足光照才能散发浓郁香气',
            '✂️ 经常采摘可促进分枝，使植株更茂盛',
            '💧 保持土壤微湿，但避免积水',
            '🍽️ 采收前 2-3 天停止施肥，保证食用安全',
        ]
    },
    'aquatic': {  # 水培植物
        'focus': '水培养护',
        'tips': [
            '💧 每周换水一次，保持水质清洁',
            '🪴 水位不要过高，留出部分根系呼吸',
            '🧹 清洗容器时顺便清洗根系黏液',
            '💊 可添加少量水培营养液促进生长',
        ]
    },
}

# 原产地气候特征
ORIGIN_PROFILES = {
    '热带': {
        'temp_note': '原产热带，喜温暖，冬季需保暖（不低于 15°C）',
        'humidity_note': '喜高湿度环境，干燥季节需经常喷雾',
    },
    '亚热带': {
        'temp_note': '原产亚热带，较耐寒，冬季不低于 8°C 即可',
        'humidity_note': '适应性强，对湿度要求中等',
    },
    '温带': {
        'temp_note': '原产温带，耐寒性较好，可耐受短期 5°C 低温',
        'humidity_note': '对湿度要求不高，干燥环境也能适应',
    },
    '沙漠': {
        'temp_note': '原产沙漠地区，耐高温，昼夜温差大也能适应',
        'humidity_note': '极耐干燥，无需额外增加湿度',
    },
    '地中海': {
        'temp_note': '原产地中海，喜温暖干燥，夏季注意通风',
        'humidity_note': '耐干燥，湿度过高反而易生病',
    },
}


def get_family_profile(family):
    """获取科属养护特征"""
    # 精确匹配
    if family in FAMILY_CARE_PROFILES:
        return FAMILY_CARE_PROFILES[family]
    
    # 模糊匹配（包含关键词）
    for key, profile in FAMILY_CARE_PROFILES.items():
        if key in family or family in key:
            return profile
    
    # 默认返回天南星科（室内植物最常见）
    return FAMILY_CARE_PROFILES['天南星科']


def get_category_profile(category):
    """获取类别特征"""
    return CATEGORY_PROFILES.get(category, CATEGORY_PROFILES['foliage'])


def get_origin_profile(origin):
    """获取原产地特征"""
    for key, profile in ORIGIN_PROFILES.items():
        if key in origin:
            return profile
    return ORIGIN_PROFILES['亚热带']  # 默认


def generate_description(plant):
    """生成个性化的植物描述"""
    name = plant['name']
    family = plant.get('family', '未知科')
    origin = plant.get('origin', '热带地区')
    category = plant.get('category', 'foliage')
    difficulty = plant.get('difficulty', 2)
    
    # 类别描述
    category_descs = {
        'foliage': f'{name}是{family}的常绿观叶植物，叶片翠绿优美，四季常青，是极佳的室内绿化装饰植物。',
        'succulent': f'{name}是{family}的多肉植物，叶片肥厚多汁，形态可爱，是懒人养植的首选。',
        'flowering': f'{name}是{family}的观花植物，花朵艳丽，花期较长，既可观赏又可点缀家居。',
        'fern': f'{name}是{family}的蕨类植物，叶片纤细优美，形态飘逸，具有独特的热带风情。',
        'cactus': f'{name}是{family}的仙人掌科植物，形态奇特，刺座精美，是极具个性的观赏植物。',
        'climbing': f'{name}是{family}的藤本植物，藤蔓攀援，可塑性强，适合打造垂直绿化。',
        'herb': f'{name}是{family}的香草植物，叶片芳香怡人，既可观赏又可食用或制作香包。',
        'aquatic': f'{name}是{family}的水生植物，可水培种植，干净卫生，观赏根系生长也别有趣味。',
    }
    
    base_desc = category_descs.get(category, f'{name}是{family}植物，具有较高的观赏价值。')
    
    # 养护难度描述
    diff_desc = f'养护难度{"较低" if difficulty <= 2 else "中等"}，适合{"新手" if difficulty <= 2 else "有一定经验的"}植物爱好者种植。'
    
    # 原产地描述
    origin_desc = f'原产于{origin}，适应性强，在室内环境下也能良好生长。'
    
    return f'{base_desc}{origin_desc}{diff_desc}'


def generate_care_guide(plant):
    """生成个性化的养护指南"""
    family = plant.get('family', '天南星科')
    category = plant.get('category', 'foliage')
    origin = plant.get('origin', '热带')
    
    family_profile = get_family_profile(family)
    category_profile = get_category_profile(category)
    origin_profile = get_origin_profile(origin)
    
    care_guide = {}
    
    # 光照
    care_guide['light'] = family_profile['light']
    
    # 浇水
    care_guide['water'] = family_profile['water']
    
    # 温度
    care_guide['temperature'] = f'{family_profile["temperature"]}。{origin_profile["temp_note"]}。'
    
    # 湿度
    care_guide['humidity'] = f'{family_profile["humidity"]}。{origin_profile["humidity_note"]}。'
    
    # 土壤
    care_guide['soil'] = family_profile['soil']
    
    # 施肥
    care_guide['fertilizer'] = family_profile['fertilizer']
    
    # 修剪
    care_guide['pruning'] = family_profile['pruning']
    
    return care_guide


def generate_care_tips(plant):
    """生成个性化的养护小贴士"""
    family = plant.get('family', '天南星科')
    category = plant.get('category', 'foliage')
    name = plant['name']
    
    family_profile = get_family_profile(family)
    category_profile = get_category_profile(category)
    
    tips = []
    
    # 添加科属特征提示
    tips.extend(family_profile['tips'][:2])
    
    # 添加类别特征提示
    tips.extend(category_profile['tips'][:2])
    
    # 添加通用但个性化的提示
    tips.extend([
        f'🪴 每 1-2 年春季为{name}换盆一次，换盆时适当修剪老根',
        f'🔍 定期观察{name}的生长状态，及时发现并处理问题',
    ])
    
    return tips[:7]  # 限制在 7 条


def generate_common_issues(plant):
    """生成常见问题"""
    family = plant.get('family', '天南星科')
    family_profile = get_family_profile(family)
    return family_profile.get('common_issues', [])


def enrich_database():
    """丰富植物数据库"""
    # 加载数据库
    with open('plant-database-enriched.json', 'r', encoding='utf-8') as f:
        db = json.load(f)
    
    print(f"📊 当前数据库共有 {len(db['plants'])} 种植物")
    print(f"📝 开始智能丰富...\n")
    
    updated_count = 0
    
    for i, plant in enumerate(db['plants']):
        name = plant['name']
        family = plant.get('family', '天南星科')
        
        # 检查是否是通用模板内容（通过检查 careGuide 是否包含通用词汇）
        care_guide = plant.get('careGuide', {})
        is_generic = False
        
        # 检测是否是通用模板
        if care_guide:
            light_text = care_guide.get('light', '')
            if '根据植物特性' in light_text or '不同季节调整' in light_text:
                is_generic = True
        
        # 无论是否有描述，都更新养护指南和贴士
        old_care_guide = plant.get('careGuide', {})
        plant['careGuide'] = generate_care_guide(plant)
        plant['careTips'] = generate_care_tips(plant)
        plant['commonIssues'] = generate_common_issues(plant)
        
        # 如果检测到是通用模板，也更新描述
        if is_generic or not plant.get('description') or len(plant.get('description', '')) < 30:
            plant['description'] = generate_description(plant)
        
        updated_count += 1
        
        if (i + 1) % 100 == 0:
            print(f"  已处理 {i + 1}/{len(db['plants'])} 种植物...")
    
    # 更新版本信息
    db['version'] = '2.0.0'
    db['lastUpdated'] = datetime.now().strftime('%Y-%m-%d')
    db['enrichedCount'] = updated_count
    
    # 保存
    output_file = 'plant-database-smart.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 丰富完成！")
    print(f"📊 更新植物：{updated_count} 种")
    print(f"💾 已保存到：{output_file}")
    
    # 显示示例
    print(f"\n📋 示例（前 3 种植物）：")
    for plant in db['plants'][:3]:
        print(f"\n  {plant['name']} ({plant['family']})")
        print(f"  描述：{plant['description'][:80]}...")
        print(f"  养护贴士：{len(plant.get('careTips', []))} 条")


if __name__ == '__main__':
    enrich_database()
