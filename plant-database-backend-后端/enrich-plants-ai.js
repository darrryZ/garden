/**
 * 使用 AI 批量丰富植物数据库
 * 为每种植物生成：详细描述、养护指南、养护小贴士、植物寓意
 */

import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// 加载数据库
const dbPath = './plant-database.json';
const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

console.log(`📊 加载植物数据库：${data.plants.length} 种植物`);

// 植物分类中文名
const categoryNames = {
  foliage: '观叶植物',
  succulent: '多肉植物',
  flower: '花卉植物',
  indoor: '室内绿植',
  outdoor: '户外植物',
  herb: '香草植物',
  fern: '蕨类植物',
  palm: '棕榈植物'
};

// 光照级别
const lightLevels = {
  1: '耐阴，适合低光照环境',
  2: '半阴，喜欢散射光',
  3: '明亮散射光，避免直射',
  4: '半日照，需要部分直射光',
  5: '全日照，需要充足直射光'
};

// 已处理的植物 ID
let processed = new Set();

// 检查是否已有完整数据
function hasCompleteData(plant) {
  return plant.careGuide && 
         plant.careGuide.light && 
         plant.careGuide.water && 
         plant.careGuide.soil &&
         plant.description && 
         plant.description.length > 50 &&
         plant.careTips && 
         plant.careTips.length >= 5 &&
         plant.symbolism;
}

// 生成植物详情
async function generatePlantDetails(plant) {
  const categoryName = categoryNames[plant.category] || '室内绿植';
  const lightInfo = lightLevels[plant.light] || '喜欢明亮的散射光';
  
  const prompt = `请为${plant.name}（学名：${plant.scientificName}，${categoryName}）生成详细的植物资料。

植物基本信息：
- 科属：${plant.family || '未知'}
- 原产地：${plant.origin || '未知'}
- 光照需求：${lightInfo}
- 浇水频率：${plant.water || '中等'}
- 适宜温度：${plant.temperature || '18-28°C'}
- 适宜湿度：${plant.humidity || '40-70%'}

请按以下 JSON 格式返回（不要其他文字）：
{
  "description": "200-300 字的详细描述，包括外观特征、生长习性、观赏价值、空气净化能力等",
  "symbolism": "50-100 字的植物寓意和象征意义",
  "careGuide": {
    "light": "50-80 字的光照要求详细说明",
    "water": "50-80 字的浇水方法和频率说明",
    "temperature": "50-80 字的温度管理说明",
    "humidity": "50-80 字的湿度控制说明",
    "soil": "50-80 字的土壤配制说明",
    "fertilizer": "50-80 字的施肥指南",
    "pruning": "50-80 字的修剪技巧"
  },
  "careTips": [
    "💧 浇水相关的实用小贴士",
    "☀️ 光照相关的实用小贴士",
    "🌡️ 温度相关的实用小贴士",
    "💨 通风相关的实用小贴士",
    "🧹 日常护理相关的实用小贴士",
    "🪴 换盆相关的实用小贴士",
    "✂️ 修剪繁殖相关的实用小贴士"
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt
    });
    
    const text = response.text;
    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error(`❌ 生成 ${plant.name} 失败:`, error.message);
    return null;
  }
}

// 主函数
async function enrichPlants() {
  const plantsToEnrich = data.plants.filter(p => !hasCompleteData(p));
  console.log(`🌱 需要丰富的植物：${plantsToEnrich.length} 种`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < plantsToEnrich.length; i++) {
    const plant = plantsToEnrich[i];
    console.log(`\n[${i + 1}/${plantsToEnrich.length}] 处理：${plant.name} (${plant.scientificName})`);
    
    const details = await generatePlantDetails(plant);
    
    if (details) {
      // 更新植物数据
      Object.assign(plant, details);
      successCount++;
      console.log(`✅ 成功`);
      
      // 每处理 5 个保存一次
      if (successCount % 5 === 0) {
        fs.writeFileSync('./plant-database-enriched.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log(`💾 已保存进度`);
      }
    } else {
      failCount++;
      console.log(`❌ 失败，使用默认模板`);
      // 使用默认模板
      plant.description = plant.description || `${plant.name}是${plant.family || '天南星科'}的${categoryNames[plant.category] || '室内'}植物，原产于${plant.origin || '热带地区'}。叶片翠绿，形态优美，是受欢迎的室内观叶植物。`;
      plant.symbolism = plant.symbolism || `${plant.name}象征着生命力与希望，寓意坚韧不拔、蒸蒸日上。`;
      plant.careGuide = {
        light: `适合放置在${lightLevels[plant.light] || '明亮的散射光'}处，避免强烈阳光直射。`,
        water: `保持土壤微湿，表土干燥时浇水。夏季每周 1-2 次，冬季减少浇水频率。`,
        temperature: `适宜生长温度 18-28°C，冬季不低于 10°C，避免冷风直吹。`,
        humidity: `喜欢湿润环境，可定期喷雾增加湿度，尤其在干燥季节。`,
        soil: `使用疏松、透气、排水良好的营养土，可添加珍珠岩改善透气性。`,
        fertilizer: `生长期（春夏季）每 2 周施一次稀释液肥，秋冬季减少施肥。`,
        pruning: `及时剪除枯黄叶片，促进新枝萌发，保持株型美观。`
      };
      plant.careTips = [
        '💧 浇水前用手指测试土壤湿度，避免过度浇水',
        '☀️ 定期转动花盆，让植株受光均匀',
        '🌡️ 远离空调出风口和暖气片，避免温度骤变',
        '💨 保持良好通风，预防病虫害',
        '🧹 定期用湿布擦拭叶片，保持光合作用效率',
        '🪴 每年春季换盆一次，选择稍大一号的花盆',
        '✂️ 剪下的健康枝条可用于扦插繁殖'
      ];
    }
    
    // 避免 API 限流
    if ((i + 1) % 10 === 0) {
      console.log('⏸️  休息 3 秒...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // 最终保存
  fs.writeFileSync('./plant-database-enriched.json', JSON.stringify(data, null, 2), 'utf-8');
  
  console.log('\n========================================');
  console.log('✅ 植物数据库增强完成！');
  console.log(`📊 总计植物：${data.plants.length} 种`);
  console.log(`🌟 成功丰富：${successCount} 种`);
  console.log(`📝 使用模板：${failCount} 种`);
  console.log(`💾 已保存到：plant-database-enriched.json`);
  console.log('========================================');
}

// 运行
enrichPlants().catch(console.error);
