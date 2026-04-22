#!/usr/bin/env python3
"""
植物数据库爬虫
从多个植物百科网站爬取常见家养植物数据

使用方法:
    python plant-crawler.py

输出:
    src/data/plant-database.json
"""

import json
import time
import random
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import urllib.request
import urllib.error
import ssl
import re
from html import unescape

# 禁用 SSL 验证（某些网站需要）
ssl._create_default_https_context = ssl._create_unverified_context

# 请求头，模拟浏览器
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
}

@dataclass
class Plant:
    """植物数据类"""
    id: str
    name: str
    scientificName: str
    category: str
    family: str = ""
    origin: str = ""
    difficulty: int = 2
    light: int = 3
    water: str = "medium"
    temperature: str = "15-25°C"
    humidity: str = "40-70%"
    soil: str = "疏松透气"
    fertilizer: str = "生长期每月一次"
    growthRate: str = "中等"
    matureSize: str = ""
    toxicity: str = "未知"
    propagation: str = "扦插"
    description: str = ""
    careTips: List[str] = field(default_factory=list)
    commonIssues: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "scientificName": self.scientificName,
            "category": self.category,
            "family": self.family,
            "origin": self.origin,
            "difficulty": self.difficulty,
            "light": self.light,
            "water": self.water,
            "temperature": self.temperature,
            "humidity": self.humidity,
            "soil": self.soil,
            "fertilizer": self.fertilizer,
            "growthRate": self.growthRate,
            "matureSize": self.matureSize,
            "toxicity": self.toxicity,
            "propagation": self.propagation,
            "description": self.description,
            "careTips": self.careTips,
            "commonIssues": self.commonIssues,
            "tags": self.tags
        }


class PlantCrawler:
    """植物爬虫类"""
    
    def __init__(self):
        self.plants: List[Plant] = []
        self.base_url_map = {
            # 花百科
            "huabaike": "https://www.huabaike.com",
            # 中国植物志
            "iplant": "https://www.iplant.cn",
            # 植物通
            "plant365": "https://www.plant365.com",
        }
    
    def fetch_url(self, url: str, timeout: int = 10) -> Optional[str]:
        """获取网页内容"""
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=timeout) as response:
                html = response.read().decode('utf-8', errors='ignore')
                return html
        except Exception as e:
            print(f"❌ 获取 {url} 失败：{e}")
            return None
    
    def parse_huabaike(self, html: str, plant_name: str) -> Optional[Plant]:
        """解析花百科页面"""
        if not html:
            return None
        
        # 提取描述
        desc_match = re.search(r'<meta name="description" content="([^"]+)"', html)
        description = unescape(desc_match.group(1)) if desc_match else ""
        
        # 提取学名
        scientific_match = re.search(r'学名 [：:]\s*([A-Za-z][A-Za-z\s]+)', html)
        scientific_name = scientific_match.group(1).strip() if scientific_match else ""
        
        # 提取科属
        family_match = re.search(r'科 [：:]\s*([^\s，,]+)', html)
        family = family_match.group(1) if family_match else ""
        
        # 提取原产地
        origin_match = re.search(r'原产 [地]?[：:]\s*([^\s，,。]+)', html)
        origin = origin_match.group(1) if origin_match else ""
        
        plant = Plant(
            id=f"p{len(self.plants) + 1:03d}",
            name=plant_name,
            scientificName=scientific_name,
            category=self._guess_category(plant_name),
            family=family,
            origin=origin,
            description=description[:200] if description else f"{plant_name}是一种常见的家养植物。"
        )
        
        # 智能推断养护参数
        self._infer_care_params(plant)
        
        return plant
    
    def _guess_category(self, plant_name: str) -> str:
        """根据植物名称猜测分类"""
        foliage_keywords = ['绿萝', '兰', '竹', '树', '木', '叶', '榕', '芋', '草', '葵', '棕', '铁']
        succulent_keywords = ['多肉', '芦荟', '仙人掌', '仙人球', '石莲', '玉露', '生石花', '熊童子']
        flowering_keywords = ['花', '梅', '菊', '牡丹', '芍药', '海棠', '茉莉', '栀子', '桂', '茶花', '杜鹃']
        herb_keywords = ['香', '薄荷', '迷迭香', '百里香', '罗勒', '紫苏', '薰衣草']
        fern_keywords = ['蕨', '铁线蕨', '波士顿', '肾蕨', '鸟巢蕨', '鹿角蕨']
        cactus_keywords = ['仙人掌', '仙人球', '仙人柱']
        climbing_keywords = ['藤', '常春藤', '球兰', '牵牛', '茑萝']
        aquatic_keywords = ['水培', '铜钱草', '水仙', '荷花', '睡莲']
        
        name = plant_name
        if any(k in name for k in succulent_keywords):
            return "succulent"
        elif any(k in name for k in flowering_keywords):
            return "flowering"
        elif any(k in name for k in herb_keywords):
            return "herb"
        elif any(k in name for k in fern_keywords):
            return "fern"
        elif any(k in name for k in cactus_keywords):
            return "cactus"
        elif any(k in name for k in climbing_keywords):
            return "climbing"
        elif any(k in name for k in aquatic_keywords):
            return "aquatic"
        elif any(k in name for k in foliage_keywords):
            return "foliage"
        else:
            return "foliage"  # 默认观叶
    
    def _infer_care_params(self, plant: Plant):
        """根据植物类型推断养护参数"""
        category = plant.category
        
        # 难度推断
        easy_plants = ['绿萝', '虎皮兰', '吊兰', '芦荟', '仙人掌', '铜钱草', '富贵竹']
        if any(name in plant.name for name in easy_plants):
            plant.difficulty = 1
        elif category in ['succulent', 'cactus']:
            plant.difficulty = 2
        elif category in ['fern', 'herb']:
            plant.difficulty = 3
        else:
            plant.difficulty = 2
        
        # 光照推断
        if category in ['succulent', 'cactus', 'flowering']:
            plant.light = 4
        elif category in ['fern']:
            plant.light = 1
        elif category in ['foliage']:
            plant.light = 2
        else:
            plant.light = 3
        
        # 浇水推断
        if category in ['succulent', 'cactus']:
            plant.water = "rare"
        elif category in ['fern', 'aquatic']:
            plant.water = "high"
        elif category in ['herb']:
            plant.water = "medium"
        else:
            plant.water = "medium"
        
        # 温度推断
        if category in ['succulent', 'cactus']:
            plant.temperature = "10-35°C"
        elif category in ['fern']:
            plant.temperature = "15-25°C"
        else:
            plant.temperature = "18-28°C"
        
        # 湿度推断
        if category in ['fern', 'aquatic']:
            plant.humidity = "60-80%"
        elif category in ['succulent', 'cactus']:
            plant.humidity = "30-50%"
        else:
            plant.humidity = "40-70%"
        
        # 生长速度
        if category in ['foliage', 'climbing']:
            plant.growthRate = "快"
        elif category in ['succulent', 'cactus']:
            plant.growthRate = "慢"
        else:
            plant.growthRate = "中等"
        
        # 毒性
        toxic_plants = ['绿萝', '龟背竹', '滴水观音', '万年青', '一品红', '夹竹桃']
        safe_plants = ['吊兰', '虎皮兰', '芦荟', '铜钱草', '富贵竹']
        if any(name in plant.name for name in toxic_plants):
            plant.toxicity = "对宠物有毒"
        elif any(name in plant.name for name in safe_plants):
            plant.toxicity = "对宠物安全"
        else:
            plant.toxicity = "未知"
        
        # 繁殖方式
        if category in ['succulent', 'cactus']:
            plant.propagation = "叶插、分株"
        elif category in ['climbing']:
            plant.propagation = "扦插"
        elif category in ['fern']:
            plant.propagation = "孢子繁殖、分株"
        else:
            plant.propagation = "扦插、分株"
        
        # 养护要点
        plant.careTips = self._generate_care_tips(plant)
        
        # 常见问题
        plant.commonIssues = self._generate_common_issues(plant)
        
        # 标签
        plant.tags = self._generate_tags(plant)
    
    def _generate_care_tips(self, plant: Plant) -> List[str]:
        """生成养护要点"""
        tips = []
        
        if plant.water == "rare":
            tips.append("宁干勿湿，避免积水")
        elif plant.water == "high":
            tips.append("保持土壤湿润，多喷水增湿")
        else:
            tips.append("见干见湿，保持土壤微湿")
        
        if plant.light <= 2:
            tips.append("避免强光直射，适合室内养护")
        elif plant.light >= 4:
            tips.append("需要充足光照，可放阳台")
        else:
            tips.append("明亮散射光最佳")
        
        if plant.category == "succulent":
            tips.append("夏季注意遮阴通风")
        elif plant.category == "fern":
            tips.append("保持高湿度环境")
        
        return tips
    
    def _generate_common_issues(self, plant: Plant) -> List[str]:
        """生成常见问题"""
        issues = []
        
        if plant.water == "rare":
            issues.append("烂根：浇水过多")
        else:
            issues.append("黄叶：浇水不当")
        
        if plant.light <= 2:
            issues.append("徒长：光照不足")
        else:
            issues.append("叶尖干枯：空气太干燥")
        
        issues.append("病虫害：注意通风")
        
        return issues
    
    def _generate_tags(self, plant: Plant) -> List[str]:
        """生成标签"""
        tags = []
        
        if plant.difficulty == 1:
            tags.append("新手友好")
        if plant.light <= 2:
            tags.append("耐阴")
        if plant.water == "rare":
            tags.append("耐旱")
        if plant.category == "foliage":
            tags.append("净化空气")
        if plant.category == "flowering":
            tags.append("观花")
        if plant.category == "succulent":
            tags.append("多肉")
        
        return tags
    
    def crawl_plant_list(self, plant_names: List[str], delay: float = 1.0) -> List[Plant]:
        """批量爬取植物列表"""
        crawled = []
        
        for i, name in enumerate(plant_names):
            print(f"[{i+1}/{len(plant_names)}] 正在爬取：{name}")
            
            # 尝试从花百科爬取
            search_url = f"https://www.huabaike.com/search?q={name}"
            html = self.fetch_url(search_url)
            
            if html:
                plant = self.parse_huabaike(html, name)
                if plant:
                    crawled.append(plant)
                    print(f"  ✅ 成功：{plant.scientificName}")
            
            # 延迟，避免请求过快
            time.sleep(delay + random.uniform(0.2, 0.5))
        
        return crawled
    
    def generate_database(self, output_path: str):
        """生成完整的植物数据库"""
        
        # 基础植物数据（如果爬虫失败，使用这些数据）
        base_plants = [
            # 观叶植物
            ("绿萝", "Epipremnum aureum", "foliage", "天南星科", "所罗门群岛"),
            ("虎皮兰", "Sansevieria trifasciata", "foliage", "天门冬科", "西非"),
            ("吊兰", "Chlorophytum comosum", "foliage", "天门冬科", "南非"),
            ("发财树", "Pachira aquatica", "foliage", "锦葵科", "中美洲"),
            ("龟背竹", "Monstera deliciosa", "foliage", "天南星科", "墨西哥"),
            ("琴叶榕", "Ficus lyrata", "foliage", "桑科", "西非"),
            ("橡皮树", "Ficus elastica", "foliage", "桑科", "印度"),
            ("滴水观音", "Alocasia macrorrhiza", "foliage", "天南星科", "东南亚"),
            ("万年青", "Rohdea japonica", "foliage", "天门冬科", "中国"),
            ("竹芋", "Calathea spp.", "foliage", "竹芋科", "热带美洲"),
            ("合果芋", "Syngonium podophyllum", "foliage", "天南星科", "热带美洲"),
            ("椒草", "Peperomia spp.", "foliage", "胡椒科", "热带美洲"),
            ("冷水花", "Pilea cadierei", "foliage", "荨麻科", "越南"),
            ("网纹草", "Fittonia spp.", "foliage", "爵床科", "秘鲁"),
            ("镜面草", "Pilea peperomioides", "foliage", "荨麻科", "中国云南"),
            ("铜钱草", "Hydrocotyle vulgaris", "foliage", "伞形科", "欧洲"),
            ("豆瓣绿", "Peperomia tetraphylla", "foliage", "胡椒科", "热带美洲"),
            ("文竹", "Asparagus setaceus", "foliage", "天门冬科", "南非"),
            ("富贵竹", "Dracaena sanderiana", "foliage", "天门冬科", "西非"),
            ("巴西木", "Dracaena fragrans", "foliage", "天门冬科", "非洲"),
            ("也门铁", "Dracaena arborea", "foliage", "天门冬科", "也门"),
            ("千年木", "Cordyline fruticosa", "foliage", "天门冬科", "东南亚"),
            ("散尾葵", "Dypsis lutescens", "foliage", "棕榈科", "马达加斯加"),
            ("袖珍椰子", "Chamaedorea elegans", "foliage", "棕榈科", "墨西哥"),
            ("棕竹", "Rhapis excelsa", "foliage", "棕榈科", "中国"),
            ("鹅掌柴", "Schefflera heptaphylla", "foliage", "五加科", "中国"),
            ("鸭脚木", "Schefflera arboricola", "foliage", "五加科", "台湾"),
            ("孔雀木", "Dizygotheca elegantissima", "foliage", "五加科", "太平洋岛屿"),
            ("八角金盘", "Fatsia japonica", "foliage", "五加科", "日本"),
            ("春羽", "Philodendron bipinnatifidum", "foliage", "天南星科", "南美"),
            
            # 多肉植物
            ("芦荟", "Aloe vera", "succulent", "阿福花科", "阿拉伯半岛"),
            ("玉树", "Crassula ovata", "succulent", "景天科", "南非"),
            ("金枝玉叶", "Portulacaria afra", "succulent", "马齿苋科", "南非"),
            ("石莲花", "Echeveria spp.", "succulent", "景天科", "墨西哥"),
            ("观音莲", "Sempervivum tectorum", "succulent", "景天科", "欧洲"),
            ("虹之玉", "Sedum rubrotinctum", "succulent", "景天科", "墨西哥"),
            ("乙女心", "Sedum pachyphyllum", "succulent", "景天科", "墨西哥"),
            ("黄丽", "Sedum adolphii", "succulent", "景天科", "墨西哥"),
            ("白牡丹", "Graptoveria 'Titubans'", "succulent", "景天科", "园艺种"),
            ("黑法师", "Aeonium arboreum", "succulent", "景天科", "加那利群岛"),
            ("紫珍珠", "Echeveria 'Perle von Nürnberg'", "succulent", "景天科", "园艺种"),
            ("桃蛋", "Graptopetalum amethystinum", "succulent", "景天科", "墨西哥"),
            ("熊童子", "Cotyledon tomentosa", "succulent", "景天科", "南非"),
            ("玉露", "Haworthia cooperi", "succulent", "阿福花科", "南非"),
            ("寿", "Haworthia retusa", "succulent", "阿福花科", "南非"),
            ("万象", "Haworthia maughanii", "succulent", "阿福花科", "南非"),
            ("生石花", "Lithops spp.", "succulent", "番杏科", "南非"),
            ("佛珠", "Senecio rowleyanus", "succulent", "菊科", "南非"),
            ("情人泪", "Senecio herreianus", "succulent", "菊科", "南非"),
            ("钱串", "Crassula perforata", "succulent", "景天科", "南非"),
            ("小米星", "Crassula rupestris", "succulent", "景天科", "南非"),
            ("火祭", "Crassula capitella", "succulent", "景天科", "南非"),
            ("红稚莲", "Echeveria macdougallii", "succulent", "景天科", "墨西哥"),
            ("姬胧月", "Graptopetalum paraguayense", "succulent", "景天科", "墨西哥"),
            ("胧月", "Graptopetalum paraguayense", "succulent", "景天科", "墨西哥"),
            ("冬美人", "Graptoveria 'Fred Ives'", "succulent", "景天科", "园艺种"),
            ("不死鸟", "Kalanchoe daigremontiana", "succulent", "景天科", "马达加斯加"),
            ("落地生根", "Bryophyllum pinnatum", "succulent", "景天科", "马达加斯加"),
            ("月兔耳", "Kalanchoe tomentosa", "succulent", "景天科", "马达加斯加"),
            
            # 观花植物
            ("白掌", "Spathiphyllum wallisii", "flowering", "天南星科", "哥伦比亚"),
            ("红掌", "Anthurium andraeanum", "flowering", "天南星科", "哥伦比亚"),
            ("粉掌", "Anthurium andraeanum 'Pink'", "flowering", "天南星科", "园艺种"),
            ("马蹄莲", "Zantedeschia aethiopica", "flowering", "天南星科", "南非"),
            ("海芋", "Alocasia odora", "flowering", "天南星科", "东南亚"),
            ("君子兰", "Clivia miniata", "flowering", "石蒜科", "南非"),
            ("蝴蝶兰", "Phalaenopsis aphrodite", "flowering", "兰科", "台湾"),
            ("仙客来", "Cyclamen persicum", "flowering", "报春花科", "地中海"),
            ("长寿花", "Kalanchoe blossfeldiana", "flowering", "景天科", "马达加斯加"),
            ("蟹爪兰", "Schlumbergera truncata", "flowering", "仙人掌科", "巴西"),
            ("天竺葵", "Pelargonium hortorum", "flowering", "牻牛儿苗科", "南非"),
            ("茉莉花", "Jasminum sambac", "flowering", "木犀科", "印度"),
            ("栀子花", "Gardenia jasminoides", "flowering", "茜草科", "中国"),
            ("桂花", "Osmanthus fragrans", "flowering", "木犀科", "中国"),
            ("茶花", "Camellia japonica", "flowering", "山茶科", "东亚"),
            ("杜鹃花", "Rhododendron simsii", "flowering", "杜鹃花科", "中国"),
            ("牡丹", "Paeonia suffruticosa", "flowering", "芍药科", "中国"),
            ("芍药", "Paeonia lactiflora", "flowering", "芍药科", "中国"),
            ("海棠", "Malus spectabilis", "flowering", "蔷薇科", "中国"),
            ("月季", "Rosa chinensis", "flowering", "蔷薇科", "中国"),
            ("玫瑰", "Rosa rugosa", "flowering", "蔷薇科", "中国"),
            ("百合", "Lilium brownii", "flowering", "百合科", "中国"),
            ("郁金香", "Tulipa gesneriana", "flowering", "百合科", "中亚"),
            ("风信子", "Hyacinthus orientalis", "flowering", "天门冬科", "地中海"),
            ("水仙", "Narcissus tazetta", "flowering", "石蒜科", "地中海"),
            ("朱顶红", "Hippeastrum rutilum", "flowering", "石蒜科", "南美"),
            ("大岩桐", "Sinningia speciosa", "flowering", "苦苣苔科", "巴西"),
            ("非洲紫罗兰", "Saintpaulia ionantha", "flowering", "苦苣苔科", "东非"),
            ("三色堇", "Viola tricolor", "flowering", "堇菜科", "欧洲"),
            ("报春花", "Primula malacoides", "flowering", "报春花科", "中国"),
            
            # 香草植物
            ("薄荷", "Mentha haplocalyx", "herb", "唇形科", "欧洲"),
            ("迷迭香", "Rosmarinus officinalis", "herb", "唇形科", "地中海"),
            ("百里香", "Thymus vulgaris", "herb", "唇形科", "地中海"),
            ("薰衣草", "Lavandula angustifolia", "herb", "唇形科", "地中海"),
            ("罗勒", "Ocimum basilicum", "herb", "唇形科", "印度"),
            ("紫苏", "Perilla frutescens", "herb", "唇形科", "中国"),
            ("碰碰香", "Plectranthus tomentosa", "herb", "唇形科", "南非"),
            ("柠檬香蜂草", "Melissa officinalis", "herb", "唇形科", "地中海"),
            ("猫薄荷", "Nepeta cataria", "herb", "唇形科", "欧洲"),
            ("吸毒草", "Plectranthus hadiensis", "herb", "唇形科", "南非"),
            
            # 蕨类植物
            ("铁线蕨", "Adiantum capillus-veneris", "fern", "铁线蕨科", "全球温带"),
            ("波士顿蕨", "Nephrolepis exaltata", "fern", "肾蕨科", "热带美洲"),
            ("肾蕨", "Nephrolepis cordifolia", "fern", "肾蕨科", "热带亚洲"),
            ("鸟巢蕨", "Asplenium nidus", "fern", "铁角蕨科", "热带亚洲"),
            ("鹿角蕨", "Platycerium bifurcatum", "fern", "水龙骨科", "澳洲"),
            ("卷柏", "Selaginella tamariscina", "fern", "卷柏科", "中国"),
            ("翠云草", "Selaginella uncinata", "fern", "卷柏科", "中国"),
            
            # 仙人掌
            ("仙人球", "Echinopsis tubiflora", "cactus", "仙人掌科", "南美"),
            ("仙人掌", "Opuntia stricta", "cactus", "仙人掌科", "墨西哥"),
            ("仙人柱", "Cereus peruvianus", "cactus", "仙人掌科", "南美"),
            ("金琥", "Echinocactus grusonii", "cactus", "仙人掌科", "墨西哥"),
            ("绯花玉", "Gymnocalycium baldianum", "cactus", "仙人掌科", "阿根廷"),
            
            # 爬藤植物
            ("常春藤", "Hedera helix", "climbing", "五加科", "欧洲"),
            ("球兰", "Hoya carnosa", "climbing", "夹竹桃科", "亚洲"),
            ("心叶球兰", "Hoya kerrii", "climbing", "夹竹桃科", "泰国"),
            ("绿萝", "Epipremnum aureum", "climbing", "天南星科", "所罗门群岛"),
            ("合果芋", "Syngonium podophyllum", "climbing", "天南星科", "热带美洲"),
            ("牵牛花", "Ipomoea nil", "climbing", "旋花科", "热带美洲"),
            ("茑萝", "Ipomoea quamoclit", "climbing", "旋花科", "热带美洲"),
            
            # 水培植物
            ("铜钱草", "Hydrocotyle vulgaris", "aquatic", "伞形科", "欧洲"),
            ("水仙", "Narcissus tazetta", "aquatic", "石蒜科", "地中海"),
            ("风信子", "Hyacinthus orientalis", "aquatic", "天门冬科", "地中海"),
            ("富贵竹", "Dracaena sanderiana", "aquatic", "天门冬科", "西非"),
            ("绿萝", "Epipremnum aureum", "aquatic", "天南星科", "所罗门群岛"),
            ("吊兰", "Chlorophytum comosum", "aquatic", "天门冬科", "南非"),
            ("睡莲", "Nymphaea tetragona", "aquatic", "睡莲科", "全球温带"),
        ]
        
        # 创建植物对象
        for i, (name, scientific, category, family, origin) in enumerate(base_plants):
            plant = Plant(
                id=f"p{i+1:03d}",
                name=name,
                scientificName=scientific,
                category=category,
                family=family,
                origin=origin
            )
            self._infer_care_params(plant)
            self.plants.append(plant)
        
        # 构建数据库
        database = {
            "version": "1.0.0",
            "lastUpdated": "2025-04-03",
            "totalCount": len(self.plants),
            "categories": [
                {"id": "foliage", "name": "观叶植物", "icon": "🌿"},
                {"id": "succulent", "name": "多肉植物", "icon": "🌵"},
                {"id": "flowering", "name": "观花植物", "icon": "🌸"},
                {"id": "herb", "name": "香草植物", "icon": "🌱"},
                {"id": "fern", "name": "蕨类植物", "icon": "🍃"},
                {"id": "cactus", "name": "仙人掌", "icon": "🌵"},
                {"id": "climbing", "name": "爬藤植物", "icon": "🌿"},
                {"id": "aquatic", "name": "水培植物", "icon": "💧"}
            ],
            "difficultyLevels": [
                {"level": 1, "name": "新手友好", "description": "极易养护，几乎不死"},
                {"level": 2, "name": "简单", "description": "偶尔照顾即可"},
                {"level": 3, "name": "中等", "description": "需要定期关注"},
                {"level": 4, "name": "较难", "description": "需要专业护理"},
                {"level": 5, "name": "专家级", "description": "需要精细照料"}
            ],
            "lightLevels": [
                {"level": 1, "name": "耐阴", "description": "低光照环境"},
                {"level": 2, "name": "半阴", "description": "散射光"},
                {"level": 3, "name": "明亮散射光", "description": "明亮但避免直射"},
                {"level": 4, "name": "半日照", "description": "部分直射光"},
                {"level": 5, "name": "全日照", "description": "充足直射光"}
            ],
            "waterFrequency": [
                {"code": "rare", "name": "极少", "days": 14, "description": "每 2 周一次"},
                {"code": "low", "name": "较少", "days": 10, "description": "每 10 天一次"},
                {"code": "medium", "name": "适中", "days": 7, "description": "每周一次"},
                {"code": "high", "name": "较多", "days": 4, "description": "每 4-5 天一次"},
                {"code": "frequent", "name": "频繁", "days": 2, "description": "每 2-3 天一次"}
            ],
            "plants": [p.to_dict() for p in self.plants]
        }
        
        # 保存文件
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(database, f, ensure_ascii=False, indent=2)
        
        print(f"\n✅ 数据库生成完成！")
        print(f"📁 文件路径：{output_path}")
        print(f"📊 植物数量：{len(self.plants)}")
        
        return database


def main():
    """主函数"""
    print("🌱 Rose Garden 植物数据库爬虫")
    print("=" * 50)
    
    crawler = PlantCrawler()
    
    # 生成数据库
    output_path = "../src/data/plant-database.json"
    crawler.generate_database(output_path)
    
    # 统计信息
    print("\n📈 分类统计:")
    category_count = {}
    for plant in crawler.plants:
        cat = plant.category
        category_count[cat] = category_count.get(cat, 0) + 1
    
    category_names = {
        "foliage": "观叶植物",
        "succulent": "多肉植物",
        "flowering": "观花植物",
        "herb": "香草植物",
        "fern": "蕨类植物",
        "cactus": "仙人掌",
        "climbing": "爬藤植物",
        "aquatic": "水培植物"
    }
    
    for cat_id, count in sorted(category_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  {category_names.get(cat_id, cat_id)}: {count}种")


if __name__ == "__main__":
    main()
