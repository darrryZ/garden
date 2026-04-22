/**
 * 植物日记模块
 * 管理用户的植物生长日记、照片和养护记录
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'user-data.json');

function getDefaultUserData() {
  return {
    users: [],
    userPlants: [],
    reminders: [],
    diaryEntries: [],
    favorites: [],
    feedback: [],
    version: '1.0.0'
  };
}

function normalizeUserData(data = {}) {
  return {
    ...getDefaultUserData(),
    ...data,
    users: Array.isArray(data.users) ? data.users : [],
    userPlants: Array.isArray(data.userPlants) ? data.userPlants : [],
    reminders: Array.isArray(data.reminders) ? data.reminders : [],
    diaryEntries: Array.isArray(data.diaryEntries) ? data.diaryEntries : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
    feedback: Array.isArray(data.feedback) ? data.feedback : [],
  };
}

// 确保数据文件存在
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getDefaultUserData(), null, 2));
  }
}

// 加载用户数据
function loadUserData() {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return normalizeUserData(JSON.parse(data));
  } catch (error) {
    console.error('加载用户数据失败:', error);
    return getDefaultUserData();
  }
}

// 保存用户数据
function saveUserData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(normalizeUserData(data), null, 2));
}

/**
 * 创建日记条目
 * @param {string} userId - 用户 ID
 * @param {object} entryData - 日记数据
 * @returns {object} 创建结果
 */
function createEntry(userId, entryData) {
  const data = loadUserData();
  
  const newEntry = {
    id: uuidv4(),
    userId,
    userPlantId: entryData.userPlantId,
    title: entryData.title,
    content: entryData.content,
    mood: entryData.mood || 'neutral',
    images: entryData.images || [],
    tags: entryData.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.diaryEntries.push(newEntry);
  saveUserData(data);
  
  return { success: true, data: newEntry };
}

/**
 * 获取用户的日记列表
 * @param {string} userId - 用户 ID
 * @param {object} options - 查询选项
 * @returns {array} 日记列表
 */
function getUserEntries(userId, options = {}) {
  const data = loadUserData();
  
  let entries = data.diaryEntries.filter(entry => entry.userId === userId);
  
  // 按植物筛选
  if (options.userPlantId) {
    entries = entries.filter(entry => entry.userPlantId === options.userPlantId);
  }
  
  // 排序（默认最新在前）
  entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // 分页
  const page = options.page || 1;
  const limit = options.limit || 20;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  return entries.slice(start, end);
}

/**
 * 获取单个日记条目
 * @param {string} userId - 用户 ID
 * @param {string} entryId - 日记 ID
 * @returns {object|null} 日记条目
 */
function getEntry(userId, entryId) {
  const data = loadUserData();
  
  const entry = data.diaryEntries.find(
    entry => entry.id === entryId && entry.userId === userId
  );
  
  return entry || null;
}

/**
 * 更新日记条目
 * @param {string} userId - 用户 ID
 * @param {string} entryId - 日记 ID
 * @param {object} updates - 更新内容
 * @returns {object} 更新结果
 */
function updateEntry(userId, entryId, updates) {
  const data = loadUserData();
  
  const entryIndex = data.diaryEntries.findIndex(
    entry => entry.id === entryId && entry.userId === userId
  );
  
  if (entryIndex === -1) {
    return { success: false, error: '日记不存在' };
  }
  
  const updatedEntry = {
    ...data.diaryEntries[entryIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  data.diaryEntries[entryIndex] = updatedEntry;
  saveUserData(data);
  
  return { success: true, data: updatedEntry };
}

/**
 * 删除日记条目
 * @param {string} userId - 用户 ID
 * @param {string} entryId - 日记 ID
 * @returns {object} 删除结果
 */
function deleteEntry(userId, entryId) {
  const data = loadUserData();
  
  const entryIndex = data.diaryEntries.findIndex(
    entry => entry.id === entryId && entry.userId === userId
  );
  
  if (entryIndex === -1) {
    return { success: false, error: '日记不存在' };
  }
  
  data.diaryEntries.splice(entryIndex, 1);
  saveUserData(data);
  
  return { success: true };
}

/**
 * 获取用户的日记统计
 * @param {string} userId - 用户 ID
 * @returns {object} 统计信息
 */
function getEntryStats(userId) {
  const data = loadUserData();
  
  const entries = data.diaryEntries.filter(entry => entry.userId === userId);
  
  // 按月统计
  const monthlyStats = {};
  entries.forEach(entry => {
    const month = entry.createdAt.substring(0, 7); // YYYY-MM
    monthlyStats[month] = (monthlyStats[month] || 0) + 1;
  });
  
  // 情绪统计
  const moodStats = {};
  entries.forEach(entry => {
    moodStats[entry.mood] = (moodStats[entry.mood] || 0) + 1;
  });
  
  return {
    total: entries.length,
    monthlyStats,
    moodStats,
    latestEntry: entries.length > 0 ? entries[0] : null
  };
}

module.exports = {
  createEntry,
  getUserEntries,
  getEntry,
  updateEntry,
  deleteEntry,
  getEntryStats
};
