/**
 * 批量丰富植物数据库 - 模板版
 * 为每种植物生成：详细描述、养护指南、养护小贴士、植物寓意
 */

import fs from 'fs';

// 加载数据库
const dbPath = './plant-database.json';
const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

console.log(`📊 加载植物数据库：${data.plants.length} 种植物`);

// 植物分类配置
const categoryConfig = {
  foliage: {
    name: '观叶植物',
    description: '以观赏叶片为主要价值的植物，叶片形态各异，色彩丰富，是室内绿化的主力军。',
    symbolism: '象征着生命力与希望，寓意事业蒸蒸日上，家庭和睦美满。'
  },
  succulent: {
    name: '多肉植物',
    description: '叶片肥厚多汁，形态可爱，耐旱性强，是懒人植物的代表。',
    symbolism: '象征着坚韧不拔和顽强生命力，寓意在逆境中也能茁壮成长。'
  },
  flower: {
    name: '花卉植物',
    description: '以观赏花朵为主要价值，花色艳丽，花香怡人，为生活增添色彩。',
    symbolism: '象征着美好与幸福，寓意生活如花般绚烂多彩。'
  },
  indoor: {
    name: '室内绿植',
    description: '适合室内环境的绿色植物，净化空气，美化环境，提升生活品质。',
    symbolism: '象征着健康与和谐，寓意家庭温馨，生活安宁。'
  },
  herb: {
    name: '香草植物',
    description: '具有特殊香气的植物，可食用可观赏，兼具实用与美观价值。',
    symbolism: '象征着纯洁与美好，寓意生活充满芬芳与甜蜜。'
  },
  fern: {
    name: '蕨类植物',
    description: '古老的植物种类，叶片优雅，喜湿润环境，为室内增添自然气息。',
    symbolism: '象征着永恒与真诚，寓意友谊长存，爱情永恒。'
  },
  palm: {
    name: '棕榈植物',
    description: '热带风情的代表，树形优美，叶片舒展，营造度假氛围。',
    symbolism: '象征着胜利与成功，寓意事业有成，前程似锦。'
  },
  outdoor: {
    name: '户外植物',
    description: '适合户外种植的植物，适应性强，为庭院增添绿意。',
    symbolism: '象征着自由与开放，寓意心胸开阔，生活自在。'
  }
};

// 光照配置
const lightConfig = {
  1: {
    name: '耐阴',
    guide: '适合放置在光线较弱的角落，如卫生间、北向房间。避免阳光直射，长期阴暗环境也能正常生长。',
    tip: '☀️ 定期移到明亮处"晒太阳"，防止徒长和叶片褪色'
  },
  2: {
    name: '散射光',
    guide: '喜欢明亮的散射光，可放置在离窗户 1-2 米处，或纱帘后的窗台。避免正午强烈阳光直射。',
    tip: '☀️ 定期转动花盆方向，让植株受光均匀，防止偏冠'
  },
  3: {
    name: '明亮散射光',
    guide: '需要充足的明亮光线，可放置在东向或西向窗台。夏季需遮阴，冬季可接受柔和直射光。',
    tip: '☀️ 夏季拉上纱帘避免暴晒，冬季可多晒太阳'
  },
  4: {
    name: '半日照',
    guide: '需要部分直射阳光，适合放置在南向窗台或阳台。上午或傍晚的柔和阳光最佳。',
    tip: '☀️ 避免正午烈日，可搭建遮阳网保护叶片'
  },
  5: {
    name: '全日照',
    guide: '需要充足的直射阳光，适合户外或南向阳台种植。光照不足会导致生长不良、不开花。',
    tip: '☀️ 保证每天至少 6 小时直射光，定期清理叶片灰尘'
  }
};

// 浇水配置
const waterConfig = {
  'low': {
    name: '少水',
    guide: '耐旱性强，浇水宜少不宜多。等土壤完全干透后再浇水，冬季可每月浇水 1-2 次。',
    tip: '💧 宁干勿湿，积水容易烂根'
  },
  'medium': {
    name: '中等',
    guide: '保持土壤微湿，手指插入土中 2-3 厘米感觉干燥时浇水。夏季每周 1-2 次，冬季每 10-15 天一次。',
    tip: '💧 见干见湿，浇则浇透，避免半截水'
  },
  'high': {
    name: '多水',
    guide: '喜湿润环境，保持土壤经常湿润但不积水。夏季需频繁浇水，可配合喷雾增加湿度。',
    tip: '💧 保持土壤湿润，但托盘不要长期积水'
  },
  '少水': { name: '少水', guide: '耐旱性强，等土壤干透再浇水，每月 1-2 次即可。', tip: '💧 宁干勿湿' },
  '中等': { name: '中等', guide: '保持土壤微湿，表土干燥时浇水，夏季每周 1-2 次。', tip: '💧 见干见湿' },
  '多水': { name: '多水', guide: '保持土壤湿润，夏季需频繁浇水并喷雾增湿。', tip: '💧 保持湿润不积水' }
};

// 通用养护小贴士
const generalCareTips = [
  '💧 浇水前用手指测试土壤湿度，避免凭感觉浇水',
  '☀️ 定期转动花盆方向，让植株受光均匀',
  '🌡️ 远离空调出风口和暖气片，避免温度骤变',
  '💨 保持良好通风，预防病虫害发生',
  '🧹 定期用湿布擦拭叶片，保持光合作用效率',
  '🪴 每年春季换盆一次，选择稍大一号的花盆',
  '✂️ 及时剪除枯黄叶片，促进新枝萌发',
  '🌱 生长期适当施肥，薄肥勤施',
  '🐛 定期检查叶片正反面，早发现病虫害',
  '💧 使用室温水浇水，避免冷水刺激根系'
];

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
         plant.symbolism &&
         plant.symbolism.length > 20;
}

// 生成植物详情
function enrichPlant(plant) {
  const category = categoryConfig[plant.category] || categoryConfig.indoor;
  const light = lightConfig[plant.light] || lightConfig[2];
  const water = waterConfig[plant.water] || waterConfig['medium'];
  
  // 生成描述
  const originText = plant.origin ? `原产于${plant.origin}，` : '';
  const familyText = plant.family ? `属于${plant.family}，` : '';
  const difficultyText = plant.difficulty <= 2 ? '非常容易养护，' : plant.difficulty <= 3 ? '养护难度适中，' : '需要一定养护经验，';
  
  plant.description = `${plant.name}${plant.scientificName ? '（学名：' + plant.scientificName + '）' : ''}，${familyText}${originText}是${category.name}。${category.description}${difficultyText}${light.name}环境，${water.name}养护。${plant.tags?.includes('净化空气') ? '具有优秀的空气净化能力，能有效吸收甲醛、苯等有害物质。' : ''}叶片${plant.tags?.includes('新手友好') ? '翠绿有光泽，' : '形态优美，'}观赏价值高，是${plant.difficulty <= 2 ? '新手入门的理想选择。' : '室内绿化的优质选择。'}`;
  
  // 生成寓意
  const tagSymbolism = {
    '新手友好': '象征着新的开始和成长，',
    '耐阴': '象征着适应力和韧性，',
    '净化空气': '象征着健康与纯净，',
    '开花': '象征着美好与希望，',
    '多肉': '象征着坚强与独立，',
    '香草': '象征着温馨与甜蜜，',
    '观叶': '象征着生机与活力，'
  };
  
  let symbolism = category.symbolism;
  if (plant.tags) {
    for (const tag of plant.tags) {
      if (tagSymbolism[tag]) {
        symbolism = tagSymbolism[tag] + symbolism;
        break;
      }
    }
  }
  plant.symbolism = symbolism;
  
  // 生成养护指南
  plant.careGuide = {
    light: light.guide,
    water: water.guide,
    temperature: `适宜生长温度${plant.temperature || '18-28°C'}。${plant.difficulty <= 2 ? '适应性强，' : '需要注意'}冬季保暖，夏季避免高温闷热。${plant.origin?.includes('热带') ? '原产热带，不耐寒，' : ''}温度低于 10°C 时需采取保暖措施。`,
    humidity: `适宜空气湿度${plant.humidity || '40-70%'}。${plant.humidity?.includes('70') || plant.humidity?.includes('60') ? '喜欢较高湿度，' : '对湿度要求不高，'}干燥季节可定期喷雾增湿，或放置水盘增加局部湿度。`,
    soil: `喜欢疏松、透气、排水良好的土壤。${plant.category === 'succulent' ? '可使用多肉专用土，添加颗粒土增加透气性。' : plant.category === 'fern' ? '可使用腐叶土混合泥炭土，保持湿润。' : '通用营养土即可，可添加珍珠岩或蛭石改善透气性。'}换盆时可在盆底垫陶粒，增强排水。`,
    fertilizer: `${plant.difficulty <= 2 ? '对肥料要求不高，' : '需要定期施肥，'}生长期（春夏季）每${plant.difficulty <= 2 ? '1-2' : '2'}周施一次稀释液肥。${plant.category === 'flower' ? '花期前增施磷钾肥，促进开花。' : '秋冬季减少或停止施肥。'}薄肥勤施，避免浓肥烧根。`,
    pruning: `及时剪除枯黄、病变的叶片和枝条。${plant.category === 'foliage' ? '可适当修剪促进分枝，让株型更饱满。' : plant.category === 'flower' ? '花后及时修剪残花，促进再次开花。' : '定期整理株型，保持美观。'}剪下的健康枝条可${plant.category === 'succulent' ? '晾干后扦插。' : '用于扦插繁殖。'}`
  };
  
  // 生成养护小贴士
  plant.careTips = [
    light.tip,
    water.tip,
    generalCareTips[2], // 温度
    generalCareTips[3], // 通风
    generalCareTips[4], // 清洁
    generalCareTips[5], // 换盆
    generalCareTips[6]  // 修剪
  ];
  
  return plant;
}

// 主函数
function enrichPlants() {
  const plantsToEnrich = data.plants.filter(p => !hasCompleteData(p));
  console.log(`🌱 需要丰富的植物：${plantsToEnrich.length} 种`);
  
  let successCount = 0;
  
  for (let i = 0; i < plantsToEnrich.length; i++) {
    const plant = plantsToEnrich[i];
    console.log(`[${i + 1}/${plantsToEnrich.length}] 处理：${plant.name}`);
    
    enrichPlant(plant);
    successCount++;
  }
  
  // 保存
  fs.writeFileSync('./plant-database-enriched.json', JSON.stringify(data, null, 2), 'utf-8');
  
  console.log('\n========================================');
  console.log('✅ 植物数据库增强完成！');
  console.log(`📊 总计植物：${data.plants.length} 种`);
  console.log(`🌟 成功丰富：${successCount} 种`);
  console.log(`💾 已保存到：plant-database-enriched.json`);
  console.log('========================================');
}

// 运行
enrichPlants();
