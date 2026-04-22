/**
 * 数据库适配器 - 优化版
 * 使用持久化 Python 进程提高性能
 */

const { spawn } = require('child_process');
const path = require('path');

// Python 脚本路径
const PYTHON_SCRIPT = path.join(__dirname, 'database', 'db-bridge.py');

// 持久化 Python 进程
let pythonProcess = null;
let requestId = 0;
const pendingRequests = new Map();

/**
 * 启动持久化 Python 进程
 */
function startPythonProcess() {
  if (pythonProcess) return;

  console.log('🐍 启动 Python 数据库进程...');
  
  pythonProcess = spawn('python3', ['-u', PYTHON_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';

  pythonProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    
    // 处理完整的 JSON 响应（以换行分隔）
    let lines = buffer.split('\n');
    buffer = lines.pop(); // 保留不完整的最后一部分
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          const { id, result, error } = response;
          
          if (pendingRequests.has(id)) {
            const { resolve, reject } = pendingRequests.get(id);
            pendingRequests.delete(id);
            
            if (error) {
              reject(new Error(error));
            } else {
              resolve(result);
            }
          }
        } catch (e) {
          console.error('解析响应失败:', line, e.message);
        }
      }
    }
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error('Python 错误:', data.toString());
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python 进程退出，代码: ${code}`);
    pythonProcess = null;
    // 拒绝所有待处理的请求
    for (const { reject } of pendingRequests.values()) {
      reject(new Error('Python 进程已关闭'));
    }
    pendingRequests.clear();
  });

  pythonProcess.on('error', (err) => {
    console.error('启动 Python 进程失败:', err);
    pythonProcess = null;
  });
}

/**
 * 执行数据库操作
 */
async function dbCall(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!pythonProcess) {
      startPythonProcess();
    }

    const id = ++requestId;
    const request = { id, method, params };
    
    // 设置超时
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('数据库操作超时'));
      }
    }, 30000); // 30秒超时

    pendingRequests.set(id, { 
      resolve: (value) => {
        clearTimeout(timeout);
        resolve(value);
      }, 
      reject: (reason) => {
        clearTimeout(timeout);
        reject(reason);
      }
    });

    // 发送请求
    pythonProcess.stdin.write(JSON.stringify(request) + '\n', (err) => {
      if (err) {
        pendingRequests.delete(id);
        reject(err);
      }
    });
  });
}

// ==================== 用户管理 ====================
const userAdapter = {
  async register(username, email, password) {
    const result = await dbCall('register', { username, email, password });
    if (result.success) {
      return {
        success: true,
        data: {
          id: `u${result.data.id}`,
          username: result.data.username,
          email: result.data.email,
          createdAt: result.data.created_at
        }
      };
    }
    return result;
  },

  async login(email, password, ipAddress, userAgent) {
    const result = await dbCall('login', { email, password, ip_address: ipAddress, user_agent: userAgent });
    if (result.success) {
      return {
        success: true,
        data: {
          user: {
            id: `u${result.data.user.id}`,
            username: result.data.user.username,
            email: result.data.user.email,
            displayName: result.data.user.display_name
          },
          token: result.data.session_token
        }
      };
    }
    return result;
  },

  async logout(token) {
    return await dbCall('logout', { token });
  },

  async validateSession(token) {
    return await dbCall('validate_session', { session_token: token });
  },

  async getUser(userId) {
    const result = await dbCall('get_user_by_id', { user_id: parseInt(userId.replace('u', '')) });
    if (result.success) {
      return {
        id: `u${result.data.id}`,
        username: result.data.username,
        email: result.data.email,
        displayName: result.data.display_name,
        createdAt: result.data.created_at
      };
    }
    return null;
  },

  async verifyToken(token) {
    const result = await dbCall('validate_session', { session_token: token });
    if (result.success && result.data) {
      return {
        userId: `u${result.data.user_id}`,
        username: result.data.username,
        email: result.data.email
      };
    }
    return null;
  }
};

// ==================== 花园管理 ====================
const gardenAdapter = {
  async getByUser(userId) {
    const result = await dbCall('get_gardens', { user_id: parseInt(userId.replace('u', '')) });
    if (result.success) {
      return result.data.map(g => ({
        id: `g${g.id}`,
        name: g.name,
        description: g.description,
        location: g.location,
        userId: `u${g.user_id}`,
        createdAt: g.created_at
      }));
    }
    return [];
  },

  async getById(gardenId) {
    const result = await dbCall('get_garden_by_id', { garden_id: parseInt(gardenId.replace('g', '')) });
    if (result.success) {
      const g = result.data;
      return {
        id: `g${g.id}`,
        name: g.name,
        description: g.description,
        location: g.location,
        userId: `u${g.user_id}`,
        createdAt: g.created_at
      };
    }
    return null;
  },

  async create(gardenData) {
    const result = await dbCall('create_garden', {
      user_id: parseInt(gardenData.userId.replace('u', '')),
      name: gardenData.name,
      description: gardenData.description,
      location: gardenData.location
    });
    if (result.success) {
      const g = result.data;
      return {
        id: `g${g.id}`,
        name: g.name,
        description: g.description,
        location: g.location,
        userId: `u${g.user_id}`,
        createdAt: g.created_at
      };
    }
    return null;
  },

  async update(gardenId, updates) {
    return await dbCall('update_garden', {
      garden_id: parseInt(gardenId.replace('g', '')),
      ...updates
    });
  },

  async delete(gardenId) {
    return await dbCall('delete_garden', { garden_id: parseInt(gardenId.replace('g', '')) });
  }
};

// ==================== 用户植物管理 ====================
const plantAdapter = {
  async getByUser(userId) {
    const result = await dbCall('get_user_plants', { user_id: parseInt(userId.replace('u', '')) });
    if (result.success) {
      return result.data.map(p => ({
        id: `up${p.id}`,
        plantId: `p${String(p.plant_type_id).padStart(3, '0')}`,  // 格式化为 p001, p006 等
        userId: `u${p.user_id}`,
        gardenId: p.garden_id ? `g${p.garden_id}` : null,
        nickname: p.custom_name,  // Python返回的是 custom_name
        dateAdded: p.date_added,
        acquiredDate: p.date_added,  // 前端兼容字段
        status: p.status,
        lastWatered: p.last_watered,
        lastFertilized: p.last_fertilized,
        notes: p.notes
      }));
    }
    return [];
  },

  async getById(plantId) {
    const result = await dbCall('get_plant_by_id', { plant_id: parseInt(plantId.replace('up', '')) });
    if (result.success) {
      const p = result.data;
      return {
        id: `up${p.id}`,
        plantId: `p${String(p.plant_type_id).padStart(3, '0')}`,  // 格式化为 p001, p006 等
        userId: `u${p.user_id}`,
        gardenId: p.garden_id ? `g${p.garden_id}` : null,
        nickname: p.custom_name,  // Python返回的是 custom_name
        dateAdded: p.date_added,
        acquiredDate: p.date_added,  // 前端兼容字段
        status: p.status,
        lastWatered: p.last_watered,
        lastFertilized: p.last_fertilized,
        notes: p.notes
      };
    }
    return null;
  },

  async add(userId, plantData) {
    // 支持多种ID格式: p19, pt19, 或直接数字
    const plantTypeId = plantData.plantTypeId || plantData.plantId;
    const plantTypeNum = typeof plantTypeId === 'string' 
      ? parseInt(plantTypeId.replace(/^p/, '').replace(/^pt/, ''))
      : plantTypeId;
    
    const result = await dbCall('add_plant', {
      user_id: parseInt(userId.replace('u', '')),
      plant_type_id: plantTypeNum,
      garden_id: plantData.gardenId ? parseInt(plantData.gardenId.replace('g', '')) : null,
      custom_name: plantData.nickname  // Python桥接期望 custom_name
    });
    if (result.success) {
      const p = result.data;
      return {
        success: true,
        data: {
          id: `up${p.id}`,
          plantId: `p${p.plant_type_id}`,
          userId: `u${p.user_id}`,
          gardenId: p.garden_id ? `g${p.garden_id}` : null,
          nickname: p.custom_name,  // Python返回的是 custom_name
          dateAdded: p.date_added,
          acquiredDate: p.date_added,  // 前端兼容字段
          status: p.status,
          lastWatered: p.last_watered,
          lastFertilized: p.last_fertilized,
          notes: p.notes
        }
      };
    }
    return { success: false, error: result.error || '添加植物失败' };
  },

  async update(plantId, updates) {
    return await dbCall('update_plant', {
      plant_id: parseInt(plantId.replace('up', '')),
      custom_name: updates.nickname,  // 前端发送 nickname，后端期望 custom_name
      status: updates.status,
      notes: updates.notes,
      garden_id: updates.gardenId
    });
  },

  async delete(plantId) {
    return await dbCall('delete_user_plant', { user_plant_id: parseInt(plantId.replace('up', '')) });
  },

  async water(plantId) {
    return await dbCall('water_plant', { user_plant_id: parseInt(plantId.replace('up', '')) });
  },

  async fertilize(plantId) {
    return await dbCall('fertilize_plant', { user_plant_id: parseInt(plantId.replace('up', '')) });
  },

  async addCareLog(plantId, userId, actionType, data) {
    return await dbCall('add_plant_care_log', {
      user_plant_id: parseInt(plantId.replace('up', '')),
      user_id: parseInt(userId.replace('u', '')),
      action_type: actionType,
      notes: data.content || data.notes,
      photo_url: data.photos && data.photos.length > 0 ? data.photos[0] : null
    });
  },

  async getCareLogs(plantId, limit = 50) {
    const result = await dbCall('get_plant_care_logs', {
      user_plant_id: parseInt(plantId.replace('up', '')),
      limit: limit
    });
    if (result.success) {
      return result.data.map(log => ({
        id: `pcl${log.id}`,
        userPlantId: `up${log.user_plant_id}`,
        userId: `u${log.user_id}`,
        actionType: log.action_type,
        notes: log.notes,
        photoUrl: log.photo_url,
        performedAt: log.performed_at
      }));
    }
    return [];
  }
};

// ==================== 植物类型 ====================
const plantTypeAdapter = {
  async getAll() {
    const result = await dbCall('get_plant_types', {});
    if (result.success) {
      return result.data.map(pt => ({
        id: `pt${pt.id}`,
        name: pt.name,
        scientificName: pt.scientific_name,
        category: pt.category,
        difficulty: pt.difficulty,
        light: pt.light_requirement,
        water: pt.water_frequency,
        temperature: pt.temperature_range,
        humidity: pt.humidity_preference,
        description: pt.description,
        image: pt.image_url,
        careGuide: pt.care_guide ? JSON.parse(pt.care_guide) : null
      }));
    }
    return [];
  },

  async getById(plantTypeId) {
    const result = await dbCall('get_plant_type_by_id', { plant_type_id: parseInt(plantTypeId.replace('pt', '')) });
    if (result.success) {
      const pt = result.data;
      return {
        id: `pt${pt.id}`,
        name: pt.name,
        scientificName: pt.scientific_name,
        category: pt.category,
        difficulty: pt.difficulty,
        light: pt.light_requirement,
        water: pt.water_frequency,
        temperature: pt.temperature_range,
        humidity: pt.humidity_preference,
        description: pt.description,
        image: pt.image_url,
        careGuide: pt.care_guide ? JSON.parse(pt.care_guide) : null
      };
    }
    return null;
  }
};

// ==================== 导出 ====================
module.exports = {
  user: userAdapter,
  garden: gardenAdapter,
  plant: plantAdapter,
  plantType: plantTypeAdapter,
  // 导出底层调用函数供测试使用
  _dbCall: dbCall
};
