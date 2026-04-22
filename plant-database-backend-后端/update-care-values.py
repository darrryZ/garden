#!/usr/bin/env python3
"""
更新数据库中的 temperature 和 humidity 字段
从 careGuide 中的长描述提取具体数值
"""

import json
import re

def extract_temperature(text):
    """从 careGuide temperature 文本中提取温度范围"""
    if not text:
        return None

    # 匹配模式：18-28°C、18-27℃、适宜温度 15-25°C 等
    patterns = [
        r'(\d+)[-~](\d+)[°℃]C?',
        r'适宜温度\s*(\d+)[-~](\d+)[°℃]C?',
        r'温度\s*(\d+)[-~](\d+)[°℃]C?',
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            low, high = match.group(1), match.group(2)
            return f"{low}-{high}°C"

    return None

def extract_humidity(text):
    """从 careGuide humidity 文本中提取湿度范围"""
    if not text:
        return None

    # 匹配模式：60%-80%、40-60% 等
    patterns = [
        r'(\d+)%?[-~](\d+)%',
        r'适宜湿度\s*(\d+)%?[-~](\d+)%',
        r'湿度\s*(\d+)%?[-~](\d+)%',
    ]

    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            low, high = match.group(1), match.group(2)
            return f"{low}-{high}%"

    return None

def main():
    db_path = '/mnt/d/软件/植物/plant-database-backend/plant-database.json'

    with open(db_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    updated_count = 0
    skipped_count = 0

    for plant in data['plants']:
        care_guide = plant.get('careGuide', {})

        # 更新 temperature
        cg_temp = care_guide.get('temperature', '')
        if cg_temp:
            new_temp = extract_temperature(cg_temp)
            if new_temp and new_temp != plant.get('temperature'):
                print(f"[{plant['name']}] temperature: {plant.get('temperature')} -> {new_temp}")
                plant['temperature'] = new_temp
                updated_count += 1

        # 更新 humidity
        cg_humidity = care_guide.get('humidity', '')
        if cg_humidity:
            new_humidity = extract_humidity(cg_humidity)
            if new_humidity and new_humidity != plant.get('humidity'):
                print(f"[{plant['name']}] humidity: {plant.get('humidity')} -> {new_humidity}")
                plant['humidity'] = new_humidity
                updated_count += 1

    # 保存更新后的数据库
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 更新完成！")
    print(f"   更新字段数: {updated_count}")
    print(f"   总植物数: {len(data['plants'])}")

if __name__ == '__main__':
    main()
