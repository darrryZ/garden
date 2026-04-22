const fs = require('fs').promises;
const path = require('path');

const USER_DATA_FILE = path.join(__dirname, 'user-data.json');

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

// 读取用户数据
async function readUserData() {
  try {
    const data = await fs.readFile(USER_DATA_FILE, 'utf8');
    return normalizeUserData(JSON.parse(data));
  } catch {
    return getDefaultUserData();
  }
}

// 写入用户数据
async function writeUserData(data) {
  await fs.writeFile(USER_DATA_FILE, JSON.stringify(normalizeUserData(data), null, 2));
}

// 生成 ID
function generateId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==================== 用户植物管理 ====================

// 添加植物到我的收藏
async function addUserPlant(userId, plantData) {
  const data = await readUserData();
  
  const newUserPlant = {
    id: generateId('up'),
    userId,
    plantId: plantData.plantId,
    nickname: plantData.nickname || null,
    acquiredDate: plantData.acquiredDate || new Date().toISOString().split('T')[0],
    location: plantData.location || null,
    notes: plantData.notes || null,
    lastWatered: plantData.lastWatered || null,
    waterFrequency: plantData.waterFrequency || 7,
    lastFertilized: plantData.lastFertilized || null,
    fertilizeFrequency: plantData.fertilizeFrequency || 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.userPlants.push(newUserPlant);
  await writeUserData(data);
  
  return newUserPlant;
}

// 获取用户的所有植物
async function getUserPlants(userId) {
  const data = await readUserData();
  return data.userPlants.filter(up => up.userId === userId);
}

// 更新用户植物
async function updateUserPlant(userId, userPlantId, updates) {
  const data = await readUserData();
  const index = data.userPlants.findIndex(up => up.id === userPlantId && up.userId === userId);
  
  if (index === -1) {
    return null;
  }
  
  const allowedFields = ['nickname', 'location', 'notes', 'waterFrequency', 'fertilizeFrequency', 'lastWatered', 'lastFertilized'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      data.userPlants[index][field] = updates[field];
    }
  });
  
  data.userPlants[index].updatedAt = new Date().toISOString();
  await writeUserData(data);
  
  return data.userPlants[index];
}

// 删除用户植物
async function deleteUserPlant(userId, userPlantId) {
  const data = await readUserData();
  const index = data.userPlants.findIndex(up => up.id === userPlantId && up.userId === userId);
  
  if (index === -1) {
    return false;
  }
  
  data.userPlants.splice(index, 1);
  
  // 同时删除相关提醒
  data.reminders = data.reminders.filter(r => r.userPlantId !== userPlantId);
  
  await writeUserData(data);
  return true;
}

// ==================== 提醒管理 ====================

// 创建提醒
async function createReminder(userId, reminderData) {
  const data = await readUserData();
  
  const newReminder = {
    id: generateId('r'),
    userId,
    userPlantId: reminderData.userPlantId,
    type: reminderData.type, // 'water' | 'fertilize'
    title: reminderData.title,
    dueDate: reminderData.dueDate,
    completed: false,
    recurring: reminderData.recurring || false,
    interval: reminderData.interval || 7, // 天数
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  data.reminders.push(newReminder);
  await writeUserData(data);
  
  return newReminder;
}

// 获取用户的提醒
async function getUserReminders(userId, options = {}) {
  const data = await readUserData();
  let reminders = data.reminders.filter(r => r.userId === userId);
  
  if (options.completed !== undefined) {
    reminders = reminders.filter(r => r.completed === options.completed);
  }
  
  if (options.type) {
    reminders = reminders.filter(r => r.type === options.type);
  }
  
  // 按到期日排序
  reminders.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  
  return reminders;
}

// 完成提醒
async function completeReminder(userId, reminderId) {
  const data = await readUserData();
  const reminder = data.reminders.find(r => r.id === reminderId && r.userId === userId);
  
  if (!reminder) {
    return null;
  }
  
  reminder.completed = true;
  reminder.completedAt = new Date().toISOString();
  reminder.updatedAt = new Date().toISOString();
  
  // 如果是循环提醒，创建下一个提醒
  if (reminder.recurring) {
    const nextReminder = {
      ...reminder,
      id: generateId('r'),
      completed: false,
      completedAt: null,
      dueDate: new Date(new Date(reminder.dueDate).getTime() + reminder.interval * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    data.reminders.push(nextReminder);
  }
  
  await writeUserData(data);
  return reminder;
}

// 删除提醒
async function deleteReminder(userId, reminderId) {
  const data = await readUserData();
  const index = data.reminders.findIndex(r => r.id === reminderId && r.userId === userId);
  
  if (index === -1) {
    return false;
  }
  
  data.reminders.splice(index, 1);
  await writeUserData(data);
  return true;
}

// 获取即将到期的提醒（用于首页展示）
async function getUpcomingReminders(userId, days = 7) {
  const data = await readUserData();
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return data.reminders
    .filter(r => r.userId === userId && !r.completed)
    .filter(r => {
      const dueDate = new Date(r.dueDate);
      return dueDate >= now && dueDate <= future;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

module.exports = {
  addUserPlant,
  getUserPlants,
  updateUserPlant,
  deleteUserPlant,
  createReminder,
  getUserReminders,
  completeReminder,
  deleteReminder,
  getUpcomingReminders,
  readUserData,
  writeUserData
};
