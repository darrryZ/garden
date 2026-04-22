/**
 * 植愈App智能搜索系统
 * 根据用户输入自动判断查询类型并返回相应信息
 */

const fs = require('fs');
const path = require('path');

// 加载知识库
const knowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'plant-knowledge-base.json'), 'utf-8')
);

/**
 * 智能搜索主函数
 * @param {string} query - 用户搜索内容
 * @returns {object} 搜索结果
 */
function smartSearch(query) {
  const queryLower = query.toLowerCase().trim();
  
  // 1. 分析查询意图
  const intent = analyzeIntent(queryLower);
  
  // 2. 根据意图执行搜索
  switch (intent.type) {
    case 'plant_info':
      return searchPlantInfo(queryLower, intent.plantName);
    case 'symptom_diagnosis':
      return searchSymptom(queryLower, intent.plantName);
    case 'disease_treatment':
      return searchDisease(queryLower, intent.plantName);
    case 'care_guide':
      return searchCareGuide(queryLower, intent.plantName);
    case 'fertilizer_advice':
      return searchFertilizer(queryLower, intent.plantName);
    default:
      return fuzzySearch(queryLower);
  }
}

/**
 * 分析查询意图
 * @param {string} query - 查询内容
 * @returns {object} 意图分析结果
 */
function analyzeIntent(query) {
  const result = {
    type: 'unknown',
    plantName: null,
    keywords: []
  };
  
  // 提取植物名称
  result.plantName = extractPlantName(query);
  
  // 症状关键词
  const symptomKeywords = [
    '黄', '软', '蔫', '枯萎', '萎蔫', '下垂', '斑点', '斑', '烂', '掉叶',
    '不长', '徒长', '徒', '倒伏', '焦', '枯', '干', '皱', '卷', '变形'
  ];
  
  // 病害关键词
  const diseaseKeywords = [
    '病', '霉', '菌', '腐', '烂根', '烂', '虫', '害', '蚜虫', '红蜘蛛', '介壳虫', '白粉', '黑腐'
  ];
  
  // 养护关键词
  const careKeywords = [
    '怎么养', '怎么浇水', '怎么施肥', '光照', '温度', '湿度', '土壤',
    '换盆', '修剪', '繁殖', '扦插', '分株'
  ];
  
  // 肥料关键词
  const fertilizerKeywords = [
    '肥', '施肥', '肥料', '营养', '用什么肥', '怎么施肥', '多久施肥'
  ];
  
  // 判断意图
  if (fertilizerKeywords.some(k => query.includes(k))) {
    result.type = 'fertilizer_advice';
  } else if (diseaseKeywords.some(k => query.includes(k))) {
    result.type = 'disease_treatment';
  } else if (symptomKeywords.some(k => query.includes(k))) {
    result.type = 'symptom_diagnosis';
  } else if (careKeywords.some(k => query.includes(k))) {
    result.type = 'care_guide';
  } else if (result.plantName && query.length < 15) {
    // 短查询，只包含植物名，返回植物信息
    result.type = 'plant_info';
  }
  
  return result;
}

/**
 * 提取植物名称
 * @param {string} query - 查询内容
 * @returns {string|null} 植物名称
 */
function extractPlantName(query) {
  // 常见植物名称映射
  const plantMappings = {
    // 观叶植物
    '绿萝': ['绿萝', '黄金葛'],
    '吊兰': ['吊兰'],
    '虎皮兰': ['虎皮兰', '虎尾兰'],
    '龟背竹': ['龟背竹', '龟背'],
    '橡皮树': ['橡皮树', '橡胶树'],
    '琴叶榕': ['琴叶榕'],
    '发财树': ['发财树'],
    '金钱树': ['金钱树'],
    '幸福树': ['幸福树'],
    '平安树': ['平安树'],
    '富贵竹': ['富贵竹'],
    '文竹': ['文竹'],
    '铜钱草': ['铜钱草'],
    '常春藤': ['常春藤'],
    
    // 多肉植物
    '芦荟': ['芦荟'],
    '玉树': ['玉树'],
    '石莲花': ['石莲花', '多肉', '肉肉', 'succulent'],
    '金枝玉叶': ['金枝玉叶'],
    '观音莲': ['观音莲'],
    '玉露': ['玉露'],
    '生石花': ['生石花', '屁股花'],
    
    // 仙人掌
    '仙人掌': ['仙人掌', '仙人球', '仙人掌科'],
    
    // 开花植物
    '月季': ['月季', '玫瑰'],
    '茉莉': ['茉莉', '茉莉花'],
    '栀子': ['栀子', '栀子花'],
    '长寿花': ['长寿花'],
    '蟹爪兰': ['蟹爪兰'],
    '君子兰': ['君子兰'],
    '蝴蝶兰': ['蝴蝶兰'],
    '兰花': ['兰花'],
    
    // 香草植物
    '薄荷': ['薄荷'],
    '迷迭香': ['迷迭香'],
    '罗勒': ['罗勒', '九层塔'],
    '薰衣草': ['薰衣草'],
    
    // 蕨类植物
    '铁线蕨': ['铁线蕨'],
    '波士顿蕨': ['波士顿蕨'],
    '鸟巢蕨': ['鸟巢蕨'],
    
    // 水培植物
    '碗莲': ['碗莲'],
    '睡莲': ['睡莲'],
    '水培': ['水培', '水养']
  };
  
  for (const [plantName, aliases] of Object.entries(plantMappings)) {
    for (const alias of aliases) {
      if (query.includes(alias.toLowerCase())) {
        return plantName;
      }
    }
  }
  
  // 如果没匹配到，尝试从数据库中搜索
  for (const plant of knowledgeBase.plants) {
    if (query.includes(plant.name.toLowerCase())) {
      return plant.name;
    }
  }
  
  return null;
}

/**
 * 搜索植物信息
 * @param {string} query - 查询内容
 * @param {string} plantName - 植物名称
 * @returns {object} 搜索结果
 */
function searchPlantInfo(query, plantName) {
  const plant = findPlant(plantName);
  
  if (!plant) {
    return {
      type: 'not_found',
      message: `抱歉，没有找到"${plantName}"的信息。请检查植物名称是否正确。`
    };
  }
  
  return {
    type: 'plant_info',
    plant: plant,
    title: `🌿 ${plant.name}`,
    content: formatPlantInfo(plant)
  };
}

/**
 * 搜索症状诊断
 * @param {string} query - 查询内容
 * @param {string} plantName - 植物名称
 * @returns {object} 搜索结果
 */
function searchSymptom(query, plantName) {
  const results = {
    type: 'symptom_diagnosis',
    plant: null,
    matchedSymptoms: [],
    title: '',
    content: ''
  };
  
  // 如果有植物名，先找到植物
  if (plantName) {
    results.plant = findPlant(plantName);
  }
  
  // 匹配症状
  const symptomKeywords = {
    '黄': ['leaf_yellowing'],
    '软': ['succulent_leaf_soft', 'leaf_wilt'],
    '蔫': ['leaf_wilt', 'succulent_leaf_soft'],
    '枯萎': ['leaf_wilt'],
    '萎蔫': ['leaf_wilt'],
    '下垂': ['leaf_wilt'],
    '斑点': ['leaf_spots'],
    '不长': ['slow_growth'],
    '徒长': ['etiolation'],
    '掉叶': ['leaf_drop']
  };
  
  const matchedSymptomIds = new Set();
  for (const [keyword, symptomIds] of Object.entries(symptomKeywords)) {
    if (query.includes(keyword)) {
      symptomIds.forEach(id => matchedSymptomIds.add(id));
    }
  }
  
  // 获取症状详情
  for (const symptomId of matchedSymptomIds) {
    const symptom = knowledgeBase.symptoms_reference.find(s => s.id === symptomId);
    if (symptom) {
      results.matchedSymptoms.push(symptom);
    }
  }
  
  // 生成回复
  results.title = results.plant 
    ? `🔍 ${results.plant.name} - 症状诊断`
    : '🔍 症状诊断';
  results.content = formatSymptomDiagnosis(results);
  
  return results;
}

/**
 * 搜索病害治疗
 * @param {string} query - 查询内容
 * @param {string} plantName - 植物名称
 * @returns {object} 搜索结果
 */
function searchDisease(query, plantName) {
  const results = {
    type: 'disease_treatment',
    plant: plantName ? findPlant(plantName) : null,
    matchedDiseases: [],
    title: '',
    content: ''
  };
  
  // 匹配病害
  const diseaseKeywords = {
    '黑腐': ['black_rot'],
    '炭疽': ['anthracnose'],
    '白粉': ['powdery_mildew'],
    '灰霉': ['gray_mold'],
    '根腐': ['root_rot_disease'],
    '烂根': ['root_rot_disease'],
    '蚜虫': ['aphids'],
    '红蜘蛛': ['spider_mites'],
    '介壳虫': ['scale_insects']
  };
  
  const matchedDiseaseIds = new Set();
  for (const [keyword, diseaseIds] of Object.entries(diseaseKeywords)) {
    if (query.includes(keyword)) {
      diseaseIds.forEach(id => matchedDiseaseIds.add(id));
    }
  }
  
  // 获取病害详情
  for (const diseaseId of matchedDiseaseIds) {
    const disease = knowledgeBase.diseases_reference.find(d => d.id === diseaseId);
    if (disease) {
      results.matchedDiseases.push(disease);
    }
  }
  
  // 生成回复
  results.title = results.plant
    ? `💊 ${results.plant.name} - 病害防治`
    : '💊 病害防治';
  results.content = formatDiseaseTreatment(results);
  
  return results;
}

/**
 * 搜索养护指南
 * @param {string} query - 查询内容
 * @param {string} plantName - 植物名称
 * @returns {object} 搜索结果
 */
function searchCareGuide(query, plantName) {
  const plant = findPlant(plantName);
  
  if (!plant) {
    return {
      type: 'not_found',
      message: `抱歉，没有找到"${plantName}"的养护信息。`
    };
  }
  
  return {
    type: 'care_guide',
    plant: plant,
    title: `🌱 ${plant.name} - 养护指南`,
    content: formatCareGuide(plant)
  };
}

/**
 * 搜索施肥建议
 * @param {string} query - 查询内容
 * @param {string} plantName - 植物名称
 * @returns {object} 搜索结果
 */
function searchFertilizer(query, plantName) {
  const plant = findPlant(plantName);
  
  if (!plant) {
    return {
      type: 'not_found',
      message: `抱歉，没有找到"${plantName}"的施肥信息。`
    };
  }
  
  return {
    type: 'fertilizer_advice',
    plant: plant,
    title: `💊 ${plant.name} - 施肥指南`,
    content: formatFertilizerGuide(plant)
  };
}

/**
 * 模糊搜索
 * @param {string} query - 查询内容
 * @returns {object} 搜索结果
 */
function fuzzySearch(query) {
  const results = [];
  
  // 在植物名称中搜索
  for (const plant of knowledgeBase.plants.slice(0, 100)) {
    if (plant.name.toLowerCase().includes(query) ||
        (plant.scientificName && plant.scientificName.toLowerCase().includes(query))) {
      results.push(plant);
    }
  }
  
  if (results.length === 0) {
    return {
      type: 'not_found',
      message: '抱歉，没有找到相关信息。请尝试输入植物名称或症状描述。'
    };
  }
  
  if (results.length === 1) {
    return searchPlantInfo(query, results[0].name);
  }
  
  return {
    type: 'suggestions',
    message: '找到多个相关植物，请选择：',
    suggestions: results.slice(0, 5).map(p => p.name)
  };
}

/**
 * 查找植物
 * @param {string} plantName - 植物名称
 * @returns {object|null} 植物信息
 */
function findPlant(plantName) {
  if (!plantName) return null;
  
  const nameLower = plantName.toLowerCase();
  
  for (const plant of knowledgeBase.plants) {
    if (plant.name.toLowerCase() === nameLower ||
        plant.name.toLowerCase().includes(nameLower)) {
      return plant;
    }
  }
  
  return null;
}

// ==================== 格式化函数 ====================

function formatPlantInfo(plant) {
  let text = '';
  
  text += `**基本信息**\n`;
  text += `- 学名：${plant.scientificName || '未知'}\n`;
  text += `- 科属：${plant.family || '未知'}\n`;
  text += `- 难度：${plant.difficulty || '?'}/5\n`;
  text += `- 原产地：${plant.origin || '未知'}\n\n`;
  
  if (plant.description) {
    text += `**简介**\n${plant.description}\n\n`;
  }
  
  if (plant.careGuide) {
    text += `**养护要点**\n`;
    const cg = plant.careGuide;
    if (cg.light) text += `- 光照：${cg.light}\n`;
    if (cg.water) text += `- 浇水：${cg.water}\n`;
    if (cg.temperature) text += `- 温度：${cg.temperature}\n`;
    if (cg.humidity) text += `- 湿度：${cg.humidity}\n`;
    if (cg.soil) text += `- 土壤：${cg.soil}\n`;
    text += `\n`;
  }
  
  if (plant.commonIssues && plant.commonIssues.length > 0) {
    text += `**常见问题**\n`;
    plant.commonIssues.forEach(issue => {
      text += `- ${issue}\n`;
    });
  }
  
  return text;
}

function formatSymptomDiagnosis(results) {
  let text = '';
  
  if (results.matchedSymptoms.length === 0) {
    text += '未能识别具体症状，请详细描述植物的问题。\n';
    text += '例如：叶子发黄、叶片变软、有虫害等。\n';
    return text;
  }
  
  results.matchedSymptoms.forEach((symptom, index) => {
    text += `### ${index + 1}. ${symptom.name}\n\n`;
    
    if (symptom.causes && symptom.causes.length > 0) {
      text += `**可能原因：**\n\n`;
      symptom.causes.forEach(cause => {
        text += `**${cause.name}**\n`;
        text += `- 描述：${cause.description}\n`;
        text += `- 判断：${cause.judgment}\n`;
        if (cause.solution && cause.solution.steps) {
          text += `- 解决：${cause.solution.steps.join('；')}\n`;
        }
        if (cause.solution && cause.solution.recovery_time) {
          text += `- 恢复：${cause.solution.recovery_time}\n`;
        }
        text += `\n`;
      });
    }
  });
  
  return text;
}

function formatDiseaseTreatment(results) {
  let text = '';
  
  if (results.matchedDiseases.length === 0) {
    text += '未能识别具体病害，请详细描述症状。\n';
    text += '例如：叶片有黑斑、有白色粉末、茎部发黑等。\n';
    return text;
  }
  
  results.matchedDiseases.forEach((disease, index) => {
    text += `### ${index + 1}. ${disease.name}\n\n`;
    text += `- **症状**：${disease.symptoms}\n`;
    text += `- **紧急度**：${getUrgencyText(disease.urgency)}\n`;
    
    if (disease.solution) {
      text += `- **治疗步骤**：\n`;
      disease.solution.steps.forEach((step, i) => {
        text += `  ${i + 1}. ${step}\n`;
      });
      
      if (disease.solution.medicine) {
        text += `- **推荐药剂**：${disease.solution.medicine}\n`;
      }
    }
    
    if (disease.contagious) {
      text += `- ⚠️ **注意**：此病有传染性，请隔离病株\n`;
    }
    
    text += `\n`;
  });
  
  return text;
}

function formatCareGuide(plant) {
  let text = '';
  
  if (plant.careGuide) {
    const cg = plant.careGuide;
    if (cg.light) text += `**光照**\n${cg.light}\n\n`;
    if (cg.water) text += `**浇水**\n${cg.water}\n\n`;
    if (cg.temperature) text += `**温度**\n${cg.temperature}\n\n`;
    if (cg.humidity) text += `**湿度**\n${cg.humidity}\n\n`;
    if (cg.soil) text += `**土壤**\n${cg.soil}\n\n`;
    if (cg.fertilizer) text += `**施肥**\n${cg.fertilizer}\n\n`;
    if (cg.pruning) text += `**修剪**\n${cg.pruning}\n\n`;
  }
  
  if (plant.knowledge_base && plant.knowledge_base.care_tips) {
    text += `**养护技巧**\n`;
    plant.knowledge_base.care_tips.forEach(tip => {
      text += `- ${tip}\n`;
    });
  }
  
  return text;
}

function formatFertilizerGuide(plant) {
  let text = '';
  
  if (plant.knowledge_base && plant.knowledge_base.fertilizer_schedule) {
    const schedule = plant.knowledge_base.fertilizer_schedule;
    
    text += `**四季施肥计划**\n\n`;
    
    if (schedule.spring) {
      text += `🌸 **春季**\n`;
      text += `- 肥料：${schedule.spring.fertilizer}\n`;
      text += `- 频率：${schedule.spring.frequency}\n`;
      if (schedule.spring.dilution) {
        text += `- 稀释：${schedule.spring.dilution}\n`;
      }
      text += `\n`;
    }
    
    if (schedule.summer) {
      text += `☀️ **夏季**\n`;
      text += `- 肥料：${schedule.summer.fertilizer}\n`;
      text += `- 频率：${schedule.summer.frequency}\n`;
      if (schedule.summer.note) {
        text += `- 注意：${schedule.summer.note}\n`;
      }
      text += `\n`;
    }
    
    if (schedule.autumn) {
      text += `🍂 **秋季**\n`;
      text += `- 肥料：${schedule.autumn.fertilizer}\n`;
      text += `- 频率：${schedule.autumn.frequency}\n`;
      text += `\n`;
    }
    
    if (schedule.winter) {
      text += `❄️ **冬季**\n`;
      text += `- 肥料：${schedule.winter.fertilizer}\n`;
      text += `- 频率：${schedule.winter.frequency}\n`;
      text += `\n`;
    }
  }
  
  if (plant.careGuide && plant.careGuide.fertilizer) {
    text += `**施肥要点**\n${plant.careGuide.fertilizer}\n`;
  }
  
  return text;
}

function getUrgencyText(urgency) {
  const map = {
    'low': '⭐ 低',
    'medium': '⭐⭐ 中',
    'high': '⭐⭐⭐ 高',
    'critical': '🔴 紧急'
  };
  return map[urgency] || urgency;
}

// ==================== 使用示例 ====================

console.log('=== 植愈智能搜索系统 ===\n');

const testQueries = [
  '绿萝',                          // 植物信息
  '多肉叶片软了',                  // 症状诊断
  '芦荟烂根怎么办',                // 病害治疗
  '龟背竹怎么养',                  // 养护指南
  '月季怎么施肥',                  // 施肥建议
  '叶子发黄是什么原因',            // 症状诊断（无植物名）
];

testQueries.forEach((query, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试 ${index + 1}: "${query}"`);
  console.log('='.repeat(60));
  
  const result = smartSearch(query);
  console.log(`类型: ${result.type}`);
  console.log(`标题: ${result.title || '无'}`);
  console.log('\n内容:\n' + result.content);
});

// 导出函数
module.exports = {
  smartSearch,
  analyzeIntent,
  extractPlantName,
  findPlant
};
