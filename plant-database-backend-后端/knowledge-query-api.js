/**
 * 植愈App知识库查询API
 * 支持按植物名称查询症状、病害、养护知识
 */

const fs = require('fs');
const path = require('path');

// 加载知识库
const knowledgeBase = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'plant-knowledge-base.json'), 'utf-8')
);

/**
 * 根据植物名称查找植物信息
 * @param {string} plantName - 植物名称（如：绿萝、多肉、龟背竹）
 * @returns {object|null} 植物信息
 */
function findPlantByName(plantName) {
  const nameLower = plantName.toLowerCase();
  
  for (const plant of knowledgeBase.plants) {
    // 匹配植物名称
    if (plant.name.toLowerCase().includes(nameLower)) {
      return plant;
    }
    // 匹配学名
    if (plant.scientificName && 
        plant.scientificName.toLowerCase().includes(nameLower)) {
      return plant;
    }
    // 匹配别名（如果有）
    if (plant.aliases) {
      for (const alias of plant.aliases) {
        if (alias.toLowerCase().includes(nameLower)) {
          return plant;
        }
      }
    }
  }
  return null;
}

/**
 * 获取症状详细信息
 * @param {string} symptomId - 症状ID
 * @returns {object|null} 症状详情
 */
function getSymptomDetail(symptomId) {
  for (const symptom of knowledgeBase.symptoms_reference) {
    if (symptom.id === symptomId) {
      return symptom;
    }
  }
  return null;
}

/**
 * 获取病害详细信息
 * @param {string} diseaseId - 病害ID
 * @returns {object|null} 病害详情
 */
function getDiseaseDetail(diseaseId) {
  for (const disease of knowledgeBase.diseases_reference) {
    if (disease.id === diseaseId) {
      return disease;
    }
  }
  return null;
}

/**
 * 查询植物知识
 * @param {string} query - 用户查询
 * @returns {object} 查询结果
 */
function queryPlantKnowledge(query) {
  const result = {
    query: query,
    plant: null,
    matchedSymptoms: [],
    matchedDiseases: [],
    careGuide: null,
    fertilizerSchedule: null,
    response: ""
  };
  
  // 1. 识别植物名称
  const plantNames = extractPlantNames(query);
  
  if (plantNames.length > 0) {
    // 使用第一个匹配的植物
    result.plant = findPlantByName(plantNames[0]);
  }
  
  if (!result.plant) {
    result.response = "抱歉，我没有找到这种植物的信息。请确认植物名称是否正确。";
    return result;
  }
  
  // 2. 获取植物知识库信息
  const kb = result.plant.knowledge_base;
  
  // 3. 匹配症状
  const symptomKeywords = ["软", "黄", "枯萎", "蔫", "斑点", "长", "不开花", "掉"];
  for (const keyword of symptomKeywords) {
    if (query.includes(keyword)) {
      for (const symptomId of kb.common_symptoms) {
        const symptom = getSymptomDetail(symptomId);
        if (symptom && !result.matchedSymptoms.find(s => s.id === symptomId)) {
          result.matchedSymptoms.push(symptom);
        }
      }
    }
  }
  
  // 4. 匹配病害
  const diseaseKeywords = ["病", "霉", "斑", "烂", "虫", "害"];
  for (const keyword of diseaseKeywords) {
    if (query.includes(keyword)) {
      for (const diseaseId of kb.common_diseases) {
        const disease = getDiseaseDetail(diseaseId);
        if (disease && !result.matchedDiseases.find(d => d.id === diseaseId)) {
          result.matchedDiseases.push(disease);
        }
      }
    }
  }
  
  // 5. 获取养护指南
  result.careGuide = {
    tips: kb.care_tips,
    commonIssues: result.plant.commonIssues || [],
    careDetails: result.plant.careGuide || {}
  };
  
  // 6. 获取施肥计划
  result.fertilizerSchedule = kb.fertilizer_schedule;
  
  // 7. 生成回复
  result.response = generateResponse(result);
  
  return result;
}

/**
 * 从查询中提取植物名称
 * @param {string} query - 用户查询
 * @returns {array} 植物名称列表
 */
function extractPlantNames(query) {
  const queryLower = query.toLowerCase();
  const matchedNames = [];
  
  // 常见植物名称快速匹配
  const commonPlants = {
    "绿萝": ["绿萝"],
    "芦荟": ["芦荟", "aloe"],
    "玉树": ["玉树"],
    "石莲花": ["石莲花", "多肉", "肉肉", "succulent"],
    "龟背竹": ["龟背竹", "龟背"],
    "芦荟": ["芦荟"],
    "吊兰": ["吊兰"],
    "虎皮兰": ["虎皮兰", "虎尾兰"],
    "仙人掌": ["仙人掌", "仙人球"],
    "月季": ["月季", "玫瑰"],
    "茉莉": ["茉莉"],
    "栀子": ["栀子", "栀子花"],
    "发财树": ["发财树"],
    "金钱树": ["金钱树"],
    "君子兰": ["君子兰"],
    "兰花": ["兰花"],
    "蝴蝶兰": ["蝴蝶兰"],
    "蟹爪兰": ["蟹爪兰"],
    "长寿花": ["长寿花"],
    "薄荷": ["薄荷"],
    "迷迭香": ["迷迭香"],
    "罗勒": ["罗勒"],
    "蕨": ["蕨", "蕨类"],
    "铁线蕨": ["铁线蕨"],
    "波士顿蕨": ["波士顿蕨"],
    "常春藤": ["常春藤"],
    "绿萝": ["绿萝"],
    "橡皮树": ["橡皮树", "橡胶树"],
    "琴叶榕": ["琴叶榕"],
    "幸福树": ["幸福树"],
    "平安树": ["平安树"],
    "富贵竹": ["富贵竹"],
    "文竹": ["文竹"],
    "观音竹": ["观音竹"],
    "铜钱草": ["铜钱草"],
    "碗莲": ["碗莲"],
    "睡莲": ["睡莲"],
    "水培": ["水培", "水养"]
  };
  
  for (const [plantName, aliases] of Object.entries(commonPlants)) {
    for (const alias of aliases) {
      if (queryLower.includes(alias.toLowerCase())) {
        matchedNames.push(plantName);
        break;
      }
    }
  }
  
  // 如果没有匹配到，尝试从数据库中搜索
  if (matchedNames.length === 0) {
    for (const plant of knowledgeBase.plants.slice(0, 100)) { // 只搜索前100个提高性能
      if (queryLower.includes(plant.name.toLowerCase())) {
        matchedNames.push(plant.name);
      }
    }
  }
  
  return matchedNames;
}

/**
 * 生成自然语言回复
 * @param {object} result - 查询结果
 * @returns {string} 格式化回复
 */
function generateResponse(result) {
  let text = "";
  
  // 标题
  text += `## 🌿 ${result.plant.name} 养护指南\n\n`;
  
  // 基本信息
  text += `**基本信息**\n`;
  text += `- 学名：${result.plant.scientificName}\n`;
  text += `- 科属：${result.plant.family}\n`;
  text += `- 难度：${result.plant.difficulty}/5\n`;
  text += `- 原产地：${result.plant.origin}\n\n`;
  
  // 症状诊断
  if (result.matchedSymptoms.length > 0) {
    text += `---\n\n## 🔍 症状诊断\n\n`;
    result.matchedSymptoms.forEach((symptom, index) => {
      text += `### ${index + 1}. ${symptom.name}\n`;
      if (symptom.causes && symptom.causes.length > 0) {
        text += `**可能原因：**\n`;
        symptom.causes.forEach(cause => {
          text += `- **${cause.name}**：${cause.description}\n`;
          text += `  - 判断：${cause.judgment}\n`;
          if (cause.solution && cause.solution.steps) {
            text += `  - 处理：${cause.solution.steps[0]}\n`;
          }
        });
      }
      text += `\n`;
    });
  }
  
  // 病害防治
  if (result.matchedDiseases.length > 0) {
    text += `---\n\n## 💊 病害防治\n\n`;
    result.matchedDiseases.forEach((disease, index) => {
      text += `### ${index + 1}. ${disease.name}\n`;
      text += `- **症状**：${disease.symptoms}\n`;
      if (disease.solution) {
        text += `- **治疗**：${disease.solution.steps.slice(0, 2).join('；')}\n`;
        if (disease.solution.medicine) {
          text += `- **药剂**：${disease.solution.medicine}\n`;
        }
      }
      if (disease.contagious) {
        text += `- ⚠️ **注意**：此病有传染性，请隔离病株\n`;
      }
      text += `\n`;
    });
  }
  
  // 养护要点
  if (result.careGuide) {
    text += `---\n\n## 🌱 养护要点\n\n`;
    if (result.plant.careGuide) {
      const cg = result.plant.careGuide;
      if (cg.light) text += `- **光照**：${cg.light}\n`;
      if (cg.water) text += `- **浇水**：${cg.water}\n`;
      if (cg.temperature) text += `- **温度**：${cg.temperature}\n`;
      if (cg.humidity) text += `- **湿度**：${cg.humidity}\n`;
      if (cg.soil) text += `- **土壤**：${cg.soil}\n`;
    }
    
    if (result.careGuide.tips && result.careGuide.tips.length > 0) {
      text += `\n**养护技巧：**\n`;
      result.careGuide.tips.forEach(tip => {
        text += `- ${tip}\n`;
      });
    }
    text += `\n`;
  }
  
  // 施肥计划
  if (result.fertilizerSchedule) {
    text += `---\n\n## 💊 施肥计划\n\n`;
    const schedule = result.fertilizerSchedule;
    if (schedule.spring) {
      text += `- **春季**：${schedule.spring.fertilizer}，${schedule.spring.frequency}\n`;
    }
    if (schedule.summer) {
      text += `- **夏季**：${schedule.summer.fertilizer}，${schedule.summer.frequency}\n`;
    }
    if (schedule.autumn) {
      text += `- **秋季**：${schedule.autumn.fertilizer}，${schedule.autumn.frequency}\n`;
    }
    if (schedule.winter) {
      text += `- **冬季**：${schedule.winter.fertilizer}，${schedule.winter.frequency}\n`;
    }
    text += `\n`;
  }
  
  // 常见问题
  if (result.careGuide && result.careGuide.commonIssues.length > 0) {
    text += `---\n\n## ⚠️ 常见问题\n\n`;
    result.careGuide.commonIssues.forEach(issue => {
      text += `- ${issue}\n`;
    });
    text += `\n`;
  }
  
  return text;
}

// ==================== 使用示例 ====================

// 示例1：查询多肉叶片软了
console.log("=".repeat(60));
console.log("示例1：多肉叶片软了");
console.log("=".repeat(60));
const result1 = queryPlantKnowledge("我的多肉叶片软了怎么办");
console.log(result1.response);

// 示例2：查询绿萝黄叶
console.log("\n" + "=".repeat(60));
console.log("示例2：绿萝叶子发黄");
console.log("=".repeat(60));
const result2 = queryPlantKnowledge("绿萝叶子发黄是什么原因");
console.log(result2.response);

// 导出函数供后端使用
module.exports = {
  queryPlantKnowledge,
  findPlantByName,
  getSymptomDetail,
  getDiseaseDetail,
  knowledgeBase
};
