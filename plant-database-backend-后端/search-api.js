/**
 * 植愈App搜索API
 * Express路由，处理前端搜索请求
 */

const express = require('express');
const router = express.Router();
const { smartSearch } = require('./smart-search');

/**
 * GET /api/search
 * 智能搜索接口
 * 
 * 请求参数:
 * - q: 搜索关键词
 * 
 * 返回格式:
 * {
 *   success: true,
 *   data: {
 *     type: 'plant_info' | 'symptom_diagnosis' | 'disease_treatment' | 'care_guide' | 'fertilizer_advice',
 *     title: '标题',
 *     content: '内容',
 *     plant: { ... } // 植物信息（如果有）
 *   }
 * }
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '搜索关键词不能为空'
      });
    }
    
    // 执行智能搜索
    const result = smartSearch(q.trim());
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json({
      success: false,
      error: '搜索失败，请稍后重试'
    });
  }
});

/**
 * GET /api/search/suggestions
 * 搜索建议接口
 * 
 * 请求参数:
 * - q: 搜索关键词前缀
 * - limit: 返回数量（默认5）
 * 
 * 返回格式:
 * {
 *   success: true,
 *   data: [
 *     { id: '1', name: '绿萝', type: 'plant', icon: '🌿' },
 *     { id: '2', name: '叶子发黄', type: 'symptom', icon: '🟡' }
 *   ]
 * }
 */
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    // 获取搜索建议
    const suggestions = getSearchSuggestions(q.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: suggestions
    });
    
  } catch (error) {
    console.error('获取建议失败:', error);
    res.status(500).json({
      success: false,
      error: '获取建议失败'
    });
  }
});

/**
 * GET /api/plants/:id
 * 获取植物详情
 */
router.get('/plants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const plant = findPlantById(id);
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        error: '植物不存在'
      });
    }
    
    res.json({
      success: true,
      data: plant
    });
    
  } catch (error) {
    console.error('获取植物详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取植物详情失败'
    });
  }
});

/**
 * GET /api/symptoms
 * 获取所有症状列表
 */
router.get('/symptoms', async (req, res) => {
  try {
    const symptoms = getAllSymptoms();
    
    res.json({
      success: true,
      data: symptoms
    });
    
  } catch (error) {
    console.error('获取症状列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取症状列表失败'
    });
  }
});

/**
 * GET /api/diseases
 * 获取所有病害列表
 */
router.get('/diseases', async (req, res) => {
  try {
    const diseases = getAllDiseases();
    
    res.json({
      success: true,
      data: diseases
    });
    
  } catch (error) {
    console.error('获取病害列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取病害列表失败'
    });
  }
});

// ==================== 辅助函数 ====================

const knowledgeBase = require('./plant-knowledge-base.json');

/**
 * 获取搜索建议
 */
function getSearchSuggestions(query, limit = 5) {
  const queryLower = query.toLowerCase();
  const suggestions = [];
  
  // 植物建议
  const plantMatches = knowledgeBase.plants
    .filter(p => p.name.toLowerCase().includes(queryLower))
    .slice(0, limit)
    .map(p => ({
      id: p.id,
      name: p.name,
      type: 'plant',
      icon: getCategoryIcon(p.category)
    }));
  
  suggestions.push(...plantMatches);
  
  // 症状建议
  const symptomKeywords = [
    { name: '叶子发黄', icon: '🟡' },
    { name: '叶片变软', icon: '🍃' },
    { name: '叶子枯萎', icon: '🥀' },
    { name: '烂根', icon: '🦠' },
    { name: '有虫害', icon: '🐛' },
  ];
  
  const symptomMatches = symptomKeywords
    .filter(s => s.name.toLowerCase().includes(queryLower))
    .map((s, i) => ({
      id: `symptom-${i}`,
      name: s.name,
      type: 'symptom',
      icon: s.icon
    }));
  
  suggestions.push(...symptomMatches);
  
  return suggestions.slice(0, limit);
}

/**
 * 根据分类获取图标
 */
function getCategoryIcon(category) {
  const icons = {
    'foliage': '🌿',
    'succulent': '🌵',
    'flowering': '🌸',
    'herb': '🌱',
    'fern': '🍃',
    'cactus': '🌵',
    'climbing': '🌿',
    'aquatic': '💧'
  };
  return icons[category] || '🌿';
}

/**
 * 根据ID查找植物
 */
function findPlantById(id) {
  return knowledgeBase.plants.find(p => p.id === id);
}

/**
 * 获取所有症状
 */
function getAllSymptoms() {
  return knowledgeBase.symptoms_reference || [];
}

/**
 * 获取所有病害
 */
function getAllDiseases() {
  return knowledgeBase.diseases_reference || [];
}

module.exports = router;
