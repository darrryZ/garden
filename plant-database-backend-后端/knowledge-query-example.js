/**
 * 植愈App知识库查询示例
 * 演示如何根据用户问题查询知识库并返回结构化回复
 */

const symptomsDB = require('./knowledge-symptoms-care.json');
const fertilizersDB = require('./knowledge-fertilizers-pesticides.json');

/**
 * 查询症状知识库
 * @param {string} query - 用户查询
 * @param {string} plantType - 植物类型（可选）
 * @returns {object} 查询结果
 */
function querySymptoms(query, plantType = null) {
  const queryLower = query.toLowerCase();
  const results = [];
  
  // 遍历所有症状
  for (const symptom of symptomsDB.symptoms) {
    // 检查关键词匹配
    const matched = symptom.keywords.some(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
    
    // 检查植物类型匹配
    const typeMatch = !plantType || 
                      symptom.plant_types.includes('all') ||
                      symptom.plant_types.includes(plantType);
    
    if (matched && typeMatch) {
      results.push(symptom);
    }
  }
  
  return results;
}

/**
 * 查询病害知识库
 * @param {string} query - 用户查询
 * @param {string} plantType - 植物类型（可选）
 * @returns {object} 查询结果
 */
function queryDiseases(query, plantType = null) {
  const queryLower = query.toLowerCase();
  const results = [];
  
  for (const disease of symptomsDB.diseases) {
    const matched = disease.keywords.some(keyword => 
      queryLower.includes(keyword.toLowerCase())
    );
    
    const typeMatch = !plantType || 
                      disease.plant_types.includes('all') ||
                      disease.plant_types.includes(plantType);
    
    if (matched && typeMatch) {
      results.push(disease);
    }
  }
  
  return results;
}

/**
 * 生成回复内容
 * @param {string} query - 用户原始问题
 * @param {array} symptoms - 匹配的症状
 * @param {array} diseases - 匹配的病害
 * @returns {object} 结构化回复
 */
function generateResponse(query, symptoms, diseases) {
  const response = {
    query: query,
    analysis: {
      plantType: 'succulent', // 从查询中识别
      symptoms: [],
      possibleDiseases: []
    },
    causes: [],
    solutions: [],
    urgency: 'medium',
    recommendations: []
  };
  
  // 处理症状
  for (const symptom of symptoms) {
    response.analysis.symptoms.push(symptom.name);
    
    for (const cause of symptom.causes) {
      response.causes.push({
        name: cause.name,
        description: cause.description,
        judgment: cause.judgment,
        urgency: cause.urgency,
        solution: cause.solution
      });
      
      // 更新紧急度
      if (cause.urgency === 'high' && response.urgency !== 'critical') {
        response.urgency = 'high';
      } else if (cause.urgency === 'critical') {
        response.urgency = 'critical';
      }
    }
  }
  
  // 处理病害
  for (const disease of diseases) {
    response.analysis.possibleDiseases.push(disease.name);
    response.solutions.push({
      type: 'disease',
      name: disease.name,
      symptoms: disease.symptoms,
      steps: disease.solution.steps,
      medicine: disease.solution.medicine,
      contagious: disease.contagious,
      urgency: disease.urgency
    });
    
    if (disease.urgency === 'critical') {
      response.urgency = 'critical';
    }
  }
  
  // 生成建议
  response.recommendations = generateRecommendations(response);
  
  return response;
}

/**
 * 生成养护建议
 */
function generateRecommendations(response) {
  const recommendations = [];
  
  if (response.urgency === 'critical') {
    recommendations.push({
      type: 'warning',
      content: '⚠️ 情况紧急，建议立即处理！'
    });
  }
  
  if (response.analysis.possibleDiseases.length > 0) {
    recommendations.push({
      type: 'action',
      content: '建议隔离病株，避免传染其他植物'
    });
  }
  
  recommendations.push({
    type: 'check',
    content: '请检查土壤湿度，用手指插入土壤2-3cm感受干湿'
  });
  
  return recommendations;
}

/**
 * 格式化回复为自然语言
 * @param {object} response - 结构化回复
 * @returns {string} 自然语言回复
 */
function formatResponse(response) {
  let text = '';
  
  // 标题
  text += `## 🔍 诊断结果\n\n`;
  
  // 分析
  text += `**识别到的问题：**\n`;
  response.analysis.symptoms.forEach(s => {
    text += `- ${s}\n`;
  });
  
  if (response.analysis.possibleDiseases.length > 0) {
    text += `\n**可能的病害：**\n`;
    response.analysis.possibleDiseases.forEach(d => {
      text += `- ${d}\n`;
    });
  }
  
  // 紧急度
  const urgencyEmoji = {
    'low': '⭐',
    'medium': '⭐⭐',
    'high': '⭐⭐⭐',
    'critical': '🔴'
  };
  text += `\n**紧急度：** ${urgencyEmoji[response.urgency]}\n\n`;
  
  // 可能原因
  text += `---\n\n## 🎯 可能原因分析\n\n`;
  response.causes.forEach((cause, index) => {
    text += `### ${index + 1}. ${cause.name}\n`;
    text += `- **判断方法：** ${cause.judgment}\n`;
    text += `- **解决方案：**\n`;
    cause.solution.steps.forEach((step, i) => {
      text += `  ${i + 1}. ${step}\n`;
    });
    if (cause.solution.recovery_time) {
      text += `- **恢复周期：** ${cause.solution.recovery_time}\n`;
    }
    text += `\n`;
  });
  
  // 病害治疗
  if (response.solutions.length > 0) {
    text += `---\n\n## 💊 病害治疗方案\n\n`;
    response.solutions.forEach(sol => {
      if (sol.type === 'disease') {
        text += `### ${sol.name}\n`;
        text += `- **症状：** ${sol.symptoms}\n`;
        text += `- **治疗步骤：**\n`;
        sol.steps.forEach((step, i) => {
          text += `  ${i + 1}. ${step}\n`;
        });
        if (sol.medicine) {
          text += `- **推荐药剂：** ${sol.medicine}\n`;
        }
        if (sol.contagious) {
          text += `- ⚠️ **注意：** 此病有传染性，请隔离病株\n`;
        }
        text += `\n`;
      }
    });
  }
  
  // 建议
  text += `---\n\n## 📋 植愈建议\n\n`;
  response.recommendations.forEach(rec => {
    if (rec.type === 'warning') {
      text += `🔴 ${rec.content}\n\n`;
    } else {
      text += `✅ ${rec.content}\n\n`;
    }
  });
  
  return text;
}

// ==================== 使用示例 ====================

// 示例查询：多肉叶片软了，并且有病害
const userQuery = "我的多肉现在叶片软了，并且有病害";

// 1. 识别植物类型（实际应用中可用NLP或让用户选择）
const plantType = 'succulent';

// 2. 查询症状
const matchedSymptoms = querySymptoms(userQuery, plantType);
console.log('匹配的症状：', matchedSymptoms.map(s => s.name));

// 3. 查询病害
const matchedDiseases = queryDiseases(userQuery, plantType);
console.log('匹配的病害：', matchedDiseases.map(d => d.name));

// 4. 生成回复
const response = generateResponse(userQuery, matchedSymptoms, matchedDiseases);

// 5. 格式化为自然语言
const formattedResponse = formatResponse(response);

console.log('\n================== 最终回复 ==================\n');
console.log(formattedResponse);

// 导出函数供后端使用
module.exports = {
  querySymptoms,
  queryDiseases,
  generateResponse,
  formatResponse
};