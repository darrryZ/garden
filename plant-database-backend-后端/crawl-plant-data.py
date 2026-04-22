#!/usr/bin/env python3
"""
植物数据爬虫 - 从多个植物网站抓取详细养护信息
目标网站：
- 花卉百科 (huabaike.com)
- 中国植物志 (iplant.cn)
- 养花大全 (yanghua.cc)
"""

import requests
import json
import time
import re
from bs4 import BeautifulSoup
from urllib.parse import quote, urljoin
import random

# 请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

class PlantCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(HEADERS)
        self.cached_data = {}
        
    def search_huabaike(self, plant_name):
        """从花卉百科搜索植物"""
        try:
            # 花卉百科搜索
            search_url = f"https://www.huabaike.com/search.php?q={quote(plant_name)}"
            resp = self.session.get(search_url, timeout=10)
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            # 查找第一个结果
            result = soup.select_one('.search-result-item a')
            if result:
                detail_url = urljoin('https://www.huabaike.com', result.get('href'))
                return self.parse_huabaike_detail(detail_url)
        except Exception as e:
            print(f"  ❌ 花卉百科搜索失败：{e}")
        return None
    
    def parse_huabaike_detail(self, url):
        """解析花卉百科详情页"""
        try:
            resp = self.session.get(url, timeout=10)
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            data = {
                'description': '',
                'careGuide': {},
                'careTips': []
            }
            
            # 提取描述
            desc_elem = soup.select_one('.plant-description, .intro-text')
            if desc_elem:
                data['description'] = desc_elem.get_text(strip=True)
            
            # 提取养护信息
            care_sections = soup.select('.care-section, .yanghu')
            for section in care_sections:
                title = section.select_one('h3, .title')
                content = section.select_one('p, .content')
                if title and content:
                    title_text = title.get_text(strip=True)
                    content_text = content.get_text(strip=True)
                    
                    if '光照' in title_text or '阳光' in title_text:
                        data['careGuide']['light'] = content_text
                    elif '浇水' in title_text or '水分' in title_text:
                        data['careGuide']['water'] = content_text
                    elif '温度' in title_text or '气温' in title_text:
                        data['careGuide']['temperature'] = content_text
                    elif '湿度' in title_text:
                        data['careGuide']['humidity'] = content_text
                    elif '土壤' in title_text or '盆土' in title_text:
                        data['careGuide']['soil'] = content_text
                    elif '施肥' in title_text or '肥料' in title_text:
                        data['careGuide']['fertilizer'] = content_text
                    elif '修剪' in title_text or '整形' in title_text:
                        data['careGuide']['pruning'] = content_text
            
            return data if data['description'] or data['careGuide'] else None
        except Exception as e:
            print(f"  ❌ 解析详情页失败：{e}")
        return None
    
    def search_yanghua(self, plant_name):
        """从养花大全搜索"""
        try:
            search_url = f"https://www.yanghua.cc/search?q={quote(plant_name)}"
            resp = self.session.get(search_url, timeout=10)
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            result = soup.select_one('.search-list-item a')
            if result:
                detail_url = urljoin('https://www.yanghua.cc', result.get('href'))
                return self.parse_yanghua_detail(detail_url)
        except Exception as e:
            print(f"  ❌ 养花大全搜索失败：{e}")
        return None
    
    def parse_yanghua_detail(self, url):
        """解析养花大全详情页"""
        try:
            resp = self.session.get(url, timeout=10)
            resp.encoding = 'utf-8'
            soup = BeautifulSoup(resp.text, 'html.parser')
            
            data = {
                'description': '',
                'careGuide': {},
                'careTips': []
            }
            
            # 提取养护方法
            methods = soup.select('.method-item, .care-tip')
            for method in methods:
                text = method.get_text(strip=True)
                if '光照' in text or '阳光' in text:
                    data['careGuide']['light'] = text
                elif '浇水' in text:
                    data['careGuide']['water'] = text
                elif '施肥' in text:
                    data['careGuide']['fertilizer'] = text
            
            # 提取小贴士
            tips = soup.select('.tip-item, .note')
            data['careTips'] = [tip.get_text(strip=True) for tip in tips[:5]]
            
            return data if data['careGuide'] or data['careTips'] else None
        except Exception as e:
            print(f"  ❌ 解析养花大全失败：{e}")
        return None
    
    def crawl_plant(self, plant_name, max_retries=2):
        """爬取单种植物信息"""
        print(f"  🔍 正在搜索：{plant_name}")
        
        for retry in range(max_retries):
            # 尝试多个网站
            for site_func in [self.search_huabaike, self.search_yanghua]:
                result = site_func(plant_name)
                if result:
                    print(f"  ✅ 找到数据")
                    return result
                time.sleep(1)  # 网站间延迟
            
            time.sleep(2)  # 重试前延迟
        
        print(f"  ⚠️ 未找到数据")
        return None


def generate_care_tips(plant_name, category, care_guide):
    """根据植物特性生成个性化养护小贴士"""
    tips = []
    
    # 根据类别生成特定提示
    if category == 'foliage':  # 观叶植物
        tips.extend([
            f'💧 {plant_name}浇水原则：见干见湿，手指插入土中2-3厘米感觉干燥再浇水',
            f'☀️ 定期转动花盆，让{plant_name}各面均匀接受光照，保持株型匀称',
            f'🧹 每月用湿软布擦拭叶片，去除灰尘，保持光合作用效率和观赏价值',
        ])
    elif category == 'succulent':  # 多肉植物
        tips.extend([
            f'💧 {plant_name}宁干勿湿，浇水前确保土壤完全干燥，避免积水烂根',
            f'☀️ 除夏季外可给予充足光照，光照不足会导致徒长和褪色',
            f'🌡️ 夏季高温时适当遮阴通风，避免暴晒导致叶片灼伤',
        ])
    elif category == 'flowering':  # 观花植物
        tips.extend([
            f'🌸 {plant_name}花期前增施磷钾肥，可促进花芽分化和开花',
            f'✂️ 花后及时剪去残花，避免消耗养分，促进下次开花',
            f'☀️ 花期需要充足光照，但避免正午强光直射',
        ])
    elif category == 'fern':  # 蕨类植物
        tips.extend([
            f'💨 {plant_name}喜高湿度，干燥季节需经常喷雾或使用加湿器',
            f'🌡️ 避免阳光直射，放在明亮散射光处最佳',
            f'💧 保持土壤持续湿润，但避免积水',
        ])
    elif category == 'cactus':  # 仙人掌
        tips.extend([
            f'💧 {plant_name}极耐旱，春秋季每2-3周浇水一次，冬季可断水',
            f'☀️ 需要充足阳光，每天至少4-6小时直射光',
            f'🪴 使用排水极好的颗粒土，盆底垫陶粒增强排水',
        ])
    elif category == 'climbing':  # 爬藤植物
        tips.extend([
            f'🌿 {plant_name}生长迅速，需提供支架或网格供其攀爬',
            f'✂️ 定期修剪过长的藤蔓，促进侧枝萌发，保持株型美观',
            f'💧 生长期保持土壤湿润，夏季需增加浇水频率',
        ])
    
    # 根据养护指南添加特定提示
    if care_guide:
        if care_guide.get('water'):
            water_text = care_guide['water']
            if '宁干' in water_text or '耐旱' in water_text:
                tips.append(f'⚠️ {plant_name}怕积水，浇水过多容易烂根')
            elif '湿润' in water_text:
                tips.append(f'💦 {plant_name}喜湿润，干燥时叶尖容易枯黄')
        
        if care_guide.get('light'):
            light_text = care_guide['light']
            if '耐阴' in light_text:
                tips.append(f'🏠 {plant_name}耐阴，适合放在室内光线较暗处')
            elif '直射' in light_text:
                tips.append(f'☀️ {plant_name}需要充足阳光，请放在向阳处')
        
        if care_guide.get('temperature'):
            temp_text = care_guide['temperature']
            if '冬季' in temp_text and ('10°C' in temp_text or '15°C' in temp_text):
                tips.append(f'🌡️ {plant_name}不耐寒，冬季需移入室内保暖')
    
    # 通用提示（根据植物特性调整）
    tips.extend([
        f'🪴 每1-2年春季换盆一次，换盆时适当修剪老根和枯根',
        f'💨 保持环境通风良好，可有效预防病虫害发生',
        f'🔍 定期观察叶片状态，及时发现并处理问题',
    ])
    
    return tips[:7]  # 限制在7条以内


def main():
    # 加载现有数据库
    with open('plant-database-enriched.json', 'r', encoding='utf-8') as f:
        db = json.load(f)
    
    print(f"📊 当前数据库共有 {len(db['plants'])} 种植物")
    print(f"📝 开始爬取更新...\n")
    
    crawler = PlantCrawler()
    updated_count = 0
    failed_count = 0
    
    # 只更新前50种植物作为测试
    for i, plant in enumerate(db['plants'][:50]):
        plant_name = plant['name']
        print(f"\n[{i+1}/50] {plant_name}")
        
        # 爬取数据
        crawled_data = crawler.crawl_plant(plant_name)
        
        if crawled_data:
            # 更新植物信息
            if crawled_data.get('description'):
                plant['description'] = crawled_data['description']
            
            if crawled_data.get('careGuide'):
                # 只更新之前是通用模板的字段
                for key, value in crawled_data['careGuide'].items():
                    if key in plant.get('careGuide', {}):
                        plant['careGuide'][key] = value
            
            if crawled_data.get('careTips'):
                plant['careTips'] = crawled_data['careTips']
            else:
                # 生成个性化小贴士
                plant['careTips'] = generate_care_tips(
                    plant_name, 
                    plant.get('category', 'foliage'),
                    plant.get('careGuide', {})
                )
            
            updated_count += 1
        else:
            # 即使没爬到数据，也生成个性化小贴士
            plant['careTips'] = generate_care_tips(
                plant_name,
                plant.get('category', 'foliage'),
                plant.get('careGuide', {})
            )
            failed_count += 1
        
        # 每10个植物保存一次进度
        if (i + 1) % 10 == 0:
            with open('plant-database-crawled.json', 'w', encoding='utf-8') as f:
                json.dump(db, f, ensure_ascii=False, indent=2)
            print(f"  💾 已保存进度...")
        
        time.sleep(random.uniform(2, 4))  # 随机延迟，避免被封
    
    # 保存最终结果
    with open('plant-database-crawled.json', 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 爬取完成！")
    print(f"📊 更新成功：{updated_count} 种")
    print(f"⚠️ 未找到数据：{failed_count} 种")
    print(f"💾 已保存到：plant-database-crawled.json")


if __name__ == '__main__':
    main()
