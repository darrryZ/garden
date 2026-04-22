const { v4: uuidv4 } = require('uuid');
const { readUserData, writeUserData } = require('./auth');

async function getFavorites(userId) {
  const data = await readUserData();
  return data.favorites
    .filter(item => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function addFavorite(userId, plantId) {
  const data = await readUserData();
  const existing = data.favorites.find(item => item.userId === userId && item.plantId === plantId);

  if (existing) {
    return { alreadyExists: true, favorite: existing };
  }

  const favorite = {
    id: `fav_${uuidv4()}`,
    userId,
    plantId,
    createdAt: new Date().toISOString(),
  };

  data.favorites.push(favorite);
  await writeUserData(data);

  return { alreadyExists: false, favorite };
}

async function removeFavorite(userId, favoriteId) {
  const data = await readUserData();
  const index = data.favorites.findIndex(item => item.userId === userId && item.id === favoriteId);

  if (index === -1) {
    return false;
  }

  data.favorites.splice(index, 1);
  await writeUserData(data);
  return true;
}

async function removeFavoriteByPlantId(userId, plantId) {
  const data = await readUserData();
  const index = data.favorites.findIndex(item => item.userId === userId && item.plantId === plantId);

  if (index === -1) {
    return false;
  }

  data.favorites.splice(index, 1);
  await writeUserData(data);
  return true;
}

async function createFeedback(userId, feedbackData) {
  const data = await readUserData();
  const feedback = {
    id: `fb_${uuidv4()}`,
    userId,
    category: feedbackData.category || 'general',
    message: feedbackData.message,
    contact: feedbackData.contact || '',
    screenshot: feedbackData.screenshot || '',
    createdAt: new Date().toISOString(),
  };

  data.feedback.push(feedback);
  await writeUserData(data);

  return feedback;
}

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  removeFavoriteByPlantId,
  createFeedback,
};
