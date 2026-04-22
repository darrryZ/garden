const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const USER_DATA_FILE = path.join(__dirname, 'user-data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'rose-garden-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// 确保用户数据文件存在
async function ensureUserDataFile() {
  try {
    await fs.access(USER_DATA_FILE);
  } catch {
    await fs.writeFile(USER_DATA_FILE, JSON.stringify({
      users: [],
      userPlants: [],
      reminders: [],
      version: '1.0.0'
    }, null, 2));
  }
}

// 读取用户数据
async function readUserData() {
  await ensureUserDataFile();
  const data = await fs.readFile(USER_DATA_FILE, 'utf8');
  return JSON.parse(data);
}

// 写入用户数据
async function writeUserData(data) {
  await fs.writeFile(USER_DATA_FILE, JSON.stringify(data, null, 2));
}

// 生成用户ID
function generateUserId() {
  return 'u' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 生成JWT Token
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// 验证JWT Token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// 注册
async function register(username, email, password) {
  const data = await readUserData();
  
  // 检查邮箱是否已存在
  if (data.users.find(u => u.email === email)) {
    return { success: false, error: '邮箱已被注册' };
  }
  
  // 检查用户名是否已存在
  if (data.users.find(u => u.username === username)) {
    return { success: false, error: '用户名已被使用' };
  }
  
  // 加密密码
  const passwordHash = await bcrypt.hash(password, 10);
  
  // 创建新用户
  const newUser = {
    id: generateUserId(),
    username,
    email,
    passwordHash,
    avatar: null,
    bio: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.users.push(newUser);
  await writeUserData(data);
  
  // 生成Token
  const token = generateToken(newUser);
  
  return {
    success: true,
    data: {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar
      },
      token
    }
  };
}

// 登录
async function login(email, password) {
  const data = await readUserData();
  
  // 查找用户
  const user = data.users.find(u => u.email === email);
  if (!user) {
    return { success: false, error: '用户不存在' };
  }
  
  // 验证密码
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: '密码错误' };
  }
  
  // 生成Token
  const token = generateToken(user);
  
  return {
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar
      },
      token
    }
  };
}

// 获取当前用户
async function getCurrentUser(userId) {
  const data = await readUserData();
  const user = data.users.find(u => u.id === userId);
  if (!user) return null;
  
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio || '',
    createdAt: user.createdAt
  };
}

// 更新用户信息
async function updateUser(userId, updates) {
  const data = await readUserData();
  const userIndex = data.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: '用户不存在' };
  }
  
  // 允许更新的字段
  const allowedUpdates = ['username', 'avatar', 'bio'];
  allowedUpdates.forEach(key => {
    if (updates[key] !== undefined) {
      data.users[userIndex][key] = updates[key];
    }
  });
  
  data.users[userIndex].updatedAt = new Date().toISOString();
  await writeUserData(data);
  
  return {
    success: true,
    data: {
      id: data.users[userIndex].id,
      username: data.users[userIndex].username,
      email: data.users[userIndex].email,
      avatar: data.users[userIndex].avatar,
      bio: data.users[userIndex].bio || ''
    }
  };
}

// 修改密码
async function changePassword(userId, oldPassword, newPassword) {
  const data = await readUserData();
  const user = data.users.find(u => u.id === userId);
  if (!user) {
    return { success: false, error: '用户不存在' };
  }
  
  // 验证旧密码
  const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isValid) {
    return { success: false, error: '原密码错误' };
  }
  
  // 更新密码
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.updatedAt = new Date().toISOString();
  await writeUserData(data);
  
  return { success: true, message: '密码修改成功' };
}

module.exports = {
  register,
  login,
  getCurrentUser,
  updateUser,
  changePassword,
  verifyToken,
  readUserData,
  writeUserData
};
