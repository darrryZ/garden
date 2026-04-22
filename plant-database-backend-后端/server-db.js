/**
 * Rose Garden 植物数据库后端 API (数据库版本)
 * 使用 SQLite 数据库存储用户和植物数据
 * 
 * 启动命令: node server-db.js
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dbAdapter = require('./db-adapter');

const app = express();
const PORT = process.env.PORT || 3003;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 加载植物数据库（只读，用于植物信息查询）
let plantDatabase = null;

function loadPlantDatabase() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'plant-database.json'), 'utf8');
    plantDatabase = JSON.parse(data);
    console.log(`✅ 植物数据库加载成功，共 ${plantDatabase.totalCount} 种植物`);
  } catch (error) {
    console.error('❌ 加载植物数据库失败:', error.message);
  }
}

loadPlantDatabase();

// ==================== 认证中间件 ====================
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }
  
  const decoded = await dbAdapter.user.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: '认证令牌无效或已过期' });
  }
  
  req.userId = decoded.userId;
  req.user = decoded;
  next();
}

// ==================== 认证路由 ====================

// 用户注册
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: '请提供用户名、邮箱和密码' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: '密码长度至少6位' });
    }
    
    const result = await dbAdapter.user.register(username, email, password);
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 用户登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: '请提供邮箱和密码' });
    }
    
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    const result = await dbAdapter.user.login(email, password, ipAddress, userAgent);
    res.status(result.success ? 200 : 401).json(result);
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 用户登出
app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await dbAdapter.user.logout(token);
    res.json({ success: true, message: '登出成功' });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await dbAdapter.user.getUser(req.userId);
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, error: '用户不存在' });
    }
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 花园路由 ====================

// 获取用户的所有花园
app.get('/api/gardens', authMiddleware, async (req, res) => {
  try {
    const gardens = await dbAdapter.garden.getByUser(req.userId);
    res.json({ success: true, data: gardens });
  } catch (error) {
    console.error('获取花园列表错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 创建花园
app.post('/api/gardens', authMiddleware, async (req, res) => {
  try {
    const { name, description, location, sizeSqm } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: '请提供花园名称' });
    }
    
    const result = await dbAdapter.garden.create(req.userId, { name, description, location, sizeSqm });
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('创建花园错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取花园详情
app.get('/api/gardens/:id', authMiddleware, async (req, res) => {
  try {
    const garden = await dbAdapter.garden.getById(req.params.id);
    if (!garden) {
      return res.status(404).json({ success: false, error: '花园不存在' });
    }
    if (garden.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权访问此花园' });
    }
    res.json({ success: true, data: garden });
  } catch (error) {
    console.error('获取花园详情错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 更新花园
app.put('/api/gardens/:id', authMiddleware, async (req, res) => {
  try {
    const garden = await dbAdapter.garden.getById(req.params.id);
    if (!garden) {
      return res.status(404).json({ success: false, error: '花园不存在' });
    }
    if (garden.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权修改此花园' });
    }
    
    const result = await dbAdapter.garden.update(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('更新花园错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 删除花园
app.delete('/api/gardens/:id', authMiddleware, async (req, res) => {
  try {
    const garden = await dbAdapter.garden.getById(req.params.id);
    if (!garden) {
      return res.status(404).json({ success: false, error: '花园不存在' });
    }
    if (garden.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权删除此花园' });
    }
    
    const result = await dbAdapter.garden.delete(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('删除花园错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 植物类型路由 ====================

// 获取所有植物类型
app.get('/api/plant-types', async (req, res) => {
  try {
    const { category } = req.query;
    const types = await dbAdapter.plant.getAllTypes(category);
    res.json({ success: true, data: types });
  } catch (error) {
    console.error('获取植物类型错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取植物类型详情
app.get('/api/plant-types/:id', async (req, res) => {
  try {
    const type = await dbAdapter.plant.getTypeById(req.params.id);
    if (type) {
      res.json({ success: true, data: type });
    } else {
      res.status(404).json({ success: false, error: '植物类型不存在' });
    }
  } catch (error) {
    console.error('获取植物类型详情错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 用户植物路由 ====================

// 获取用户的植物列表
app.get('/api/user-plants', authMiddleware, async (req, res) => {
  try {
    const { gardenId } = req.query;
    const plants = await dbAdapter.plant.getByUser(req.userId, gardenId);
    res.json({ success: true, data: plants });
  } catch (error) {
    console.error('获取植物列表错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 添加植物
app.post('/api/user-plants', authMiddleware, async (req, res) => {
  try {
    const { gardenId, plantTypeId, nickname, acquiredDate, notes, positionX, positionY } = req.body;
    
    if (!nickname) {
      return res.status(400).json({ success: false, error: '请提供植物昵称' });
    }
    
    const result = await dbAdapter.plant.add(req.userId, {
      gardenId,
      plantTypeId: plantTypeId || req.body.plantId,  // 支持前端传来的 plantId
      nickname,
      acquiredDate,
      notes,
      positionX,
      positionY
    });
    
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('添加植物错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取植物详情
app.get('/api/user-plants/:id', authMiddleware, async (req, res) => {
  try {
    const plant = await dbAdapter.plant.getById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权访问此植物' });
    }
    res.json({ success: true, data: plant });
  } catch (error) {
    console.error('获取植物详情错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 更新植物
app.put('/api/user-plants/:id', authMiddleware, async (req, res) => {
  try {
    const plant = await dbAdapter.plant.getById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权修改此植物' });
    }
    
    const result = await dbAdapter.plant.update(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('更新植物错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 删除植物
app.delete('/api/user-plants/:id', authMiddleware, async (req, res) => {
  try {
    const plant = await dbAdapter.plant.getById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权删除此植物' });
    }
    
    const result = await dbAdapter.plant.delete(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('删除植物错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 浇水
app.post('/api/user-plants/:id/water', authMiddleware, async (req, res) => {
  try {
    const plant = await dbAdapter.plant.getById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作此植物' });
    }
    
    const result = await dbAdapter.plant.water(req.params.id, req.userId, req.body.notes);
    res.json(result);
  } catch (error) {
    console.error('浇水错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 施肥
app.post('/api/user-plants/:id/fertilize', authMiddleware, async (req, res) => {
  try {
    const plant = await dbAdapter.plant.getById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权操作此植物' });
    }
    
    const result = await dbAdapter.plant.fertilize(req.params.id, req.userId, req.body.notes);
    res.json(result);
  } catch (error) {
    console.error('施肥错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取植物的养护记录
app.get('/api/user-plants/:id/care-logs', authMiddleware, async (req, res) => {
  try {
    const plant = await dbAdapter.plant.getById(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权访问此植物' });
    }
    
    const logs = await dbAdapter.plant.getCareLogs(req.params.id, parseInt(req.query.limit) || 50);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('获取养护记录错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 获取需要养护的植物
app.get('/api/user-plants/needs-care/list', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const plants = await dbAdapter.plant.getNeedingCare(req.userId, days);
    res.json({ success: true, data: plants });
  } catch (error) {
    console.error('获取需要养护的植物错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 日记路由 ====================

// 获取日记条目
app.get('/api/diary', authMiddleware, async (req, res) => {
  try {
    const { userPlantId } = req.query;
    if (!userPlantId) {
      return res.status(400).json({ success: false, error: '请提供植物ID' });
    }
    
    // 验证植物归属
    const plant = await dbAdapter.plant.getById(userPlantId);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权访问此植物' });
    }
    
    // 获取养护记录作为日记条目
    const logs = await dbAdapter.plant.getCareLogs(userPlantId, 100);
    
    // 转换为日记格式
    const diaryEntries = logs.map(log => ({
      id: log.id,
      userId: req.userId,
      userPlantId: userPlantId,
      title: log.action_type === 'water' ? '浇水记录' : 
             log.action_type === 'fertilize' ? '施肥记录' : '养护记录',
      content: log.notes || `${log.action_type} 操作`,
      photos: log.photo_url ? [log.photo_url] : [],
      createdAt: log.performed_at,
      updatedAt: log.performed_at
    }));
    
    res.json({ success: true, data: diaryEntries });
  } catch (error) {
    console.error('获取日记错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 创建日记条目
app.post('/api/diary', authMiddleware, async (req, res) => {
  try {
    const { userPlantId, title, content, photos } = req.body;
    
    if (!userPlantId || !title || !content) {
      return res.status(400).json({ success: false, error: '请提供植物ID、标题和内容' });
    }
    
    // 验证植物归属
    const plant = await dbAdapter.plant.getById(userPlantId);
    if (!plant) {
      return res.status(404).json({ success: false, error: '植物不存在' });
    }
    if (plant.userId !== req.userId) {
      return res.status(403).json({ success: false, error: '无权访问此植物' });
    }
    
    // 创建养护记录作为日记条目
    const result = await dbAdapter.plant.addCareLog(userPlantId, req.userId, 'diary', {
      title,
      content,
      photos
    });
    
    res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('创建日记错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// ==================== 植物数据库路由（只读）====================

// 获取所有植物
app.get('/api/plants', (req, res) => {
  if (!plantDatabase) {
    return res.status(500).json({ success: false, error: '植物数据库未加载' });
  }
  
  const { category, search, page = 1, limit = 20 } = req.query;
  let plants = [...plantDatabase.plants];
  
  // 按分类筛选
  if (category) {
    plants = plants.filter(p => p.category === category);
  }
  
  // 搜索
  if (search) {
    const searchLower = search.toLowerCase();
    plants = plants.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.scientificName.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower)
    );
  }
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginatedPlants = plants.slice(start, end);
  
  res.json({
    success: true,
    data: {
      plants: paginatedPlants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: plants.length,
        totalPages: Math.ceil(plants.length / limit)
      }
    }
  });
});

// 获取单个植物详情
app.get('/api/plants/:id', (req, res) => {
  if (!plantDatabase) {
    return res.status(500).json({ success: false, error: '植物数据库未加载' });
  }
  
  const plant = plantDatabase.plants.find(p => p.id === req.params.id);
  if (plant) {
    res.json({ success: true, data: plant });
  } else {
    res.status(404).json({ success: false, error: '植物不存在' });
  }
});

// 获取植物分类
app.get('/api/categories', (req, res) => {
  if (!plantDatabase) {
    return res.status(500).json({ success: false, error: '植物数据库未加载' });
  }
  
  res.json({
    success: true,
    data: plantDatabase.categories
  });
});

// 获取统计数据
app.get('/api/stats', (req, res) => {
  if (!plantDatabase) {
    return res.status(500).json({ success: false, error: '植物数据库未加载' });
  }
  
  res.json({
    success: true,
    data: {
      totalPlants: plantDatabase.totalCount,
      totalCategories: plantDatabase.categories.length,
      categories: plantDatabase.categories.map(c => ({
        name: c.name,
        count: c.count
      }))
    }
  });
});

// 搜索植物
app.get('/api/search', (req, res) => {
  if (!plantDatabase) {
    return res.status(500).json({ success: false, error: '植物数据库未加载' });
  }
  
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.status(400).json({ success: false, error: '请提供搜索关键词' });
  }
  
  const searchLower = q.toLowerCase().trim();
  
  // 搜索匹配的植物
  const matchedPlant = plantDatabase.plants.find(p => 
    p.name.toLowerCase().includes(searchLower) ||
    p.scientificName.toLowerCase().includes(searchLower)
  );
  
  if (matchedPlant) {
    res.json({
      success: true,
      data: {
        plant: matchedPlant,
        query: q
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        plant: null,
        query: q,
        message: '未找到相关植物'
      }
    });
  }
});

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`\n🌹 Rose Garden 植物数据库 API (数据库版本)`);
  console.log(`========================================`);
  console.log(`✅ 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 使用 SQLite 数据库: ./database/garden.db`);
  console.log(`🔐 认证: /api/auth/*`);
  console.log(`🌱 花园: /api/gardens`);
  console.log(`🌿 植物: /api/user-plants`);
  console.log(`📚 植物类型: /api/plant-types`);
  console.log(`========================================\n`);
});

module.exports = app;
