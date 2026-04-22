/**
 * Rose Garden 植物数据库后端 API
 * 提供植物数据的 RESTful API 接口
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const auth = require('./auth');
const userPlants = require('./userPlants');
const diary = require('./diary');
const searchApi = require('./search-api');
const userFeatures = require('./userFeatures');

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 加载植物数据库
let plantDatabase = null;

function loadDatabase() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'plant-database.json'), 'utf8');
    plantDatabase = JSON.parse(data);
    console.log(`✅ 数据库加载成功，共 ${plantDatabase.totalCount} 种植物`);
  } catch (error) {
    console.error('❌ 加载数据库失败:', error.message);
    process.exit(1);
  }
}

// 初始化加载
loadDatabase();

// ==================== 认证中间件 ====================
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }
  
  const decoded = auth.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: '认证令牌无效或已过期' });
  }
  
  req.userId = decoded.userId;
  next();
}

// ==================== API 路由 ====================

/**
 * POST /api/auth/register
 * 用户注册
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供用户名、邮箱和密码' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: '密码长度至少6位' 
      });
    }
    
    const result = await auth.register(username, email, password);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供邮箱和密码' 
      });
    }
    
    const result = await auth.login(email, password);
    res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await auth.getCurrentUser(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * PUT /api/auth/profile
 * 更新用户信息
 */
app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const result = await auth.updateUser(req.userId, req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/change-password
 * 修改密码
 */
app.post('/api/auth/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供原密码和新密码' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: '新密码长度至少6位' 
      });
    }
    
    const result = await auth.changePassword(req.userId, oldPassword, newPassword);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: plantDatabase?.version || 'unknown',
    totalPlants: plantDatabase?.totalCount || 0,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/categories
 * 获取所有分类
 */
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: plantDatabase.categories
  });
});

/**
 * GET /api/difficulty-levels
 * 获取难度等级
 */
app.get('/api/difficulty-levels', (req, res) => {
  res.json({
    success: true,
    data: plantDatabase.difficultyLevels
  });
});

/**
 * GET /api/light-levels
 * 获取光照等级
 */
app.get('/api/light-levels', (req, res) => {
  res.json({
    success: true,
    data: plantDatabase.lightLevels
  });
});

/**
 * GET /api/water-frequency
 * 获取浇水频率
 */
app.get('/api/water-frequency', (req, res) => {
  res.json({
    success: true,
    data: plantDatabase.waterFrequency
  });
});

/**
 * GET /api/plants
 * 获取植物列表（支持筛选和分页）
 * 
 * 查询参数:
 * - category: 分类ID (foliage, succulent, flowering, etc.)
 * - difficulty: 难度等级 (1-5)
 * - light: 光照等级 (1-5)
 * - water: 浇水频率 (rare, low, medium, high, frequent)
 * - search: 搜索关键词
 * - page: 页码 (默认 1)
 * - limit: 每页数量 (默认 20, 最大 100)
 */
app.get('/api/plants', (req, res) => {
  try {
    let plants = [...plantDatabase.plants];
    
    // 分类筛选
    if (req.query.category) {
      plants = plants.filter(p => p.category === req.query.category);
    }
    
    // 难度筛选
    if (req.query.difficulty) {
      const difficulty = parseInt(req.query.difficulty);
      plants = plants.filter(p => p.difficulty === difficulty);
    }
    
    // 光照筛选
    if (req.query.light) {
      const light = parseInt(req.query.light);
      plants = plants.filter(p => p.light === light);
    }
    
    // 浇水频率筛选
    if (req.query.water) {
      plants = plants.filter(p => p.water === req.query.water);
    }
    
    // 搜索功能
    if (req.query.search) {
      const keyword = req.query.search.toLowerCase();
      plants = plants.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.scientificName.toLowerCase().includes(keyword) ||
        p.family.toLowerCase().includes(keyword) ||
        p.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }
    
    // 分页
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlants = plants.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        plants: paginatedPlants,
        pagination: {
          total: plants.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(plants.length / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plants/:id
 * 获取单个植物详情
 */
app.get('/api/plants/:id', (req, res) => {
  try {
    const plant = plantDatabase.plants.find(p => p.id === req.params.id);
    
    if (!plant) {
      return res.status(404).json({
        success: false,
        error: '植物未找到'
      });
    }
    
    res.json({
      success: true,
      data: plant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/plants/random/:count
 * 获取随机植物
 */
app.get('/api/plants/random/:count', (req, res) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 1, 20);
    const shuffled = [...plantDatabase.plants].sort(() => 0.5 - Math.random());
    const randomPlants = shuffled.slice(0, count);
    
    res.json({
      success: true,
      data: randomPlants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/stats
 * 获取统计数据
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      total: plantDatabase.totalCount,
      byCategory: {},
      byDifficulty: {},
      byLight: {}
    };
    
    // 按分类统计
    plantDatabase.plants.forEach(p => {
      stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
      stats.byDifficulty[p.difficulty] = (stats.byDifficulty[p.difficulty] || 0) + 1;
      stats.byLight[p.light] = (stats.byLight[p.light] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 注册搜索API路由
app.use('/api', searchApi);

// ==================== 用户植物管理 API ====================

/**
 * POST /api/user-plants
 * 添加植物到我的收藏
 */
app.post('/api/user-plants', authMiddleware, async (req, res) => {
  try {
    const { plantId, nickname, acquiredDate, location, notes, waterFrequency, fertilizeFrequency } = req.body;
    
    if (!plantId) {
      return res.status(400).json({ success: false, error: '请提供植物 ID' });
    }
    
    const userPlant = await userPlants.addUserPlant(req.userId, {
      plantId,
      nickname,
      acquiredDate,
      location,
      notes,
      waterFrequency,
      fertilizeFrequency
    });
    
    res.status(201).json({ success: true, data: userPlant });
  } catch (error) {
    console.error('添加植物错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/user-plants
 * 获取我的所有植物
 */
app.get('/api/user-plants', authMiddleware, async (req, res) => {
  try {
    const userPlantsList = await userPlants.getUserPlants(req.userId);
    res.json({ success: true, data: userPlantsList });
  } catch (error) {
    console.error('获取植物列表错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/user-plants/:id
 * 获取单个植物详情
 */
app.get('/api/user-plants/:id', authMiddleware, async (req, res) => {
  try {
    const userPlantsList = await userPlants.getUserPlants(req.userId);
    const plant = userPlantsList.find(up => up.id === req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    res.json({ success: true, data: plant });
  } catch (error) {
    console.error('获取植物详情错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * PUT /api/user-plants/:id
 * 更新我的植物
 */
app.put('/api/user-plants/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await userPlants.updateUserPlant(req.userId, req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('更新植物错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/user-plants/:id
 * 删除我的植物
 */
app.delete('/api/user-plants/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await userPlants.deleteUserPlant(req.userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除植物错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 提醒管理 API ====================

/**
 * POST /api/reminders
 * 创建提醒
 */
app.post('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const { userPlantId, type, title, dueDate, recurring, interval } = req.body;
    
    if (!userPlantId || !type || !title || !dueDate) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供植物 ID、提醒类型、标题和到期日期' 
      });
    }
    
    const reminder = await userPlants.createReminder(req.userId, {
      userPlantId,
      type,
      title,
      dueDate,
      recurring,
      interval
    });
    
    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    console.error('创建提醒错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/reminders
 * 获取我的提醒
 */
app.get('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const { completed, type } = req.query;
    const options = {};
    if (completed !== undefined) options.completed = completed === 'true';
    if (type) options.type = type;
    
    const reminders = await userPlants.getUserReminders(req.userId, options);
    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('获取提醒列表错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/reminders/upcoming
 * 获取即将到期的提醒
 */
app.get('/api/reminders/upcoming', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const reminders = await userPlants.getUpcomingReminders(req.userId, days);
    res.json({ success: true, data: reminders });
  } catch (error) {
    console.error('获取即将到期提醒错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * POST /api/reminders/:id/complete
 * 完成提醒
 */
app.post('/api/reminders/:id/complete', authMiddleware, async (req, res) => {
  try {
    const reminder = await userPlants.completeReminder(req.userId, req.params.id);
    if (!reminder) {
      return res.status(404).json({ success: false, error: '提醒不存在' });
    }
    res.json({ success: true, data: reminder });
  } catch (error) {
    console.error('完成提醒错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/reminders/:id
 * 删除提醒
 */
app.delete('/api/reminders/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await userPlants.deleteReminder(req.userId, req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: '提醒不存在' });
    }
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除提醒错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 日记 API ====================

/**
 * POST /api/diary
 * 创建日记条目
 */
app.post('/api/diary', authMiddleware, async (req, res) => {
  try {
    const { userPlantId, title, content, mood, images, tags } = req.body;
    
    if (!userPlantId || !title) {
      return res.status(400).json({ 
        success: false, 
        error: '请提供植物 ID 和标题' 
      });
    }
    
    const result = diary.createEntry(req.userId, {
      userPlantId,
      title,
      content: content || '',
      mood,
      images,
      tags
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('创建日记错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/diary
 * 获取用户的日记列表
 */
app.get('/api/diary', authMiddleware, async (req, res) => {
  try {
    const { userPlantId, page, limit } = req.query;
    
    const entries = diary.getUserEntries(req.userId, {
      userPlantId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    });
    
    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('获取日记列表错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/diary/:id
 * 获取单个日记条目
 */
app.get('/api/diary/:id', authMiddleware, async (req, res) => {
  try {
    const entry = diary.getEntry(req.userId, req.params.id);
    
    if (!entry) {
      return res.status(404).json({ success: false, error: '日记不存在' });
    }
    
    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('获取日记错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * PUT /api/diary/:id
 * 更新日记条目
 */
app.put('/api/diary/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, mood, images, tags } = req.body;
    
    const result = diary.updateEntry(req.userId, req.params.id, {
      title,
      content,
      mood,
      images,
      tags
    });
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('更新日记错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/diary/:id
 * 删除日记条目
 */
app.delete('/api/diary/:id', authMiddleware, async (req, res) => {
  try {
    const result = diary.deleteEntry(req.userId, req.params.id);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('删除日记错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

/**
 * GET /api/diary/stats
 * 获取日记统计
 */
app.get('/api/diary/stats', authMiddleware, async (req, res) => {
  try {
    const stats = diary.getEntryStats(req.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取日记统计错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 收藏 / 反馈 API ====================

app.get('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const favorites = await userFeatures.getFavorites(req.userId);
    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error('获取收藏列表错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.post('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const { plantId } = req.body;

    if (!plantId) {
      return res.status(400).json({ success: false, error: '请提供植物 ID' });
    }

    const result = await userFeatures.addFavorite(req.userId, plantId);
    res.status(result.alreadyExists ? 200 : 201).json({ success: true, data: result.favorite });
  } catch (error) {
    console.error('添加收藏错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.delete('/api/favorites/:favoriteId', authMiddleware, async (req, res) => {
  try {
    const deleted = await userFeatures.removeFavorite(req.userId, req.params.favoriteId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: '收藏不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除收藏错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.delete('/api/favorites/plant/:plantId', authMiddleware, async (req, res) => {
  try {
    const deleted = await userFeatures.removeFavoriteByPlantId(req.userId, req.params.plantId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: '收藏不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除收藏错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.post('/api/feedback', authMiddleware, async (req, res) => {
  try {
    const { category, message, contact, screenshot } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, error: '请填写反馈内容' });
    }

    const feedback = await userFeatures.createFeedback(req.userId, {
      category,
      message: String(message).trim(),
      contact: contact ? String(contact).trim() : '',
      screenshot: screenshot || '',
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    console.error('提交反馈错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 404 处理 - 必须在所有路由之后
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API 接口未找到'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('\n🌱 Rose Garden 植物数据库 API 服务');
  console.log('=' .repeat(50));
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📚 API 文档:`);
  console.log(`   GET  /api/health           - 健康检查`);
  console.log(`   GET  /api/categories       - 分类列表`);
  console.log(`   GET  /api/plants           - 植物列表（支持筛选/分页/搜索）`);
  console.log(`   GET  /api/plants/:id       - 植物详情`);
  console.log(`   GET  /api/plants/random/:n - 随机植物`);
  console.log(`   GET  /api/stats            - 统计数据`);
  console.log('=' .repeat(50));
});

module.exports = app;
