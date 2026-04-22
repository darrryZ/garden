/**
 * Rose Garden 数据库扩充脚本
 * 目标：125 种 → 750 种植物
 * 图片：统一使用 Unsplash 精选图片，确保风格一致
 */

const fs = require('fs');
const path = require('path');

// ========== 统一风格的图片库 ==========
// 所有图片来自 Unsplash，选择温暖治愈风格，色调统一
const IMAGE_LIBRARY = {
  foliage: [
    'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1550951298-5c7b95a66b90?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597898804824-9e25dc5f3e7d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop',
  ],
  succulent: [
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525853735289-4198ae413844?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1446071103084-c257b5f70671?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509223197845-458d87318791?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop',
  ],
  flowering: [
    'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1490750967868-58cb75063ed4?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525853735289-4198ae413844?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1446071103084-c257b5f70671?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509223197845-458d87318791?w=400&h=400&fit=crop',
  ],
  herb: [
    'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525853735289-4198ae413844?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597898804824-9e25dc5f3e7d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop',
  ],
  fern: [
    'https://images.unsplash.com/photo-1446071103084-c257b5f70671?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597898804824-9e25dc5f3e7d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525853735289-4198ae413844?w=400&h=400&fit=crop',
  ],
  cactus: [
    'https://images.unsplash.com/photo-1509223197845-458d87318791?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525853735289-4198ae413844?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1446071103084-c257b5f70671?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop',
  ],
  climbing: [
    'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597898804824-9e25dc5f3e7d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525853735289-4198ae413844?w=400&h=400&fit=crop',
  ],
  aquatic: [
    'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1597898804824-9e25dc5f3e7d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1525853735289-4198ae413844?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1446071103084-c257b5f70671?w=400&h=400&fit=crop',
  ],
};

// 获取分类图片（循环使用）
function getImageForCategory(category, index) {
  const images = IMAGE_LIBRARY[category] || IMAGE_LIBRARY.foliage;
  return images[index % images.length];
}

// 生成植物 ID
function generatePlantId(index) {
  return `p${String(index).padStart(3, '0')}`;
}

// 创建植物对象
function createPlant(data, id, imageIndex) {
  return {
    id: generatePlantId(id),
    name: data.name,
    scientificName: data.scientificName,
    category: data.category,
    family: data.family,
    origin: data.origin,
    difficulty: data.difficulty,
    light: data.light,
    water: data.water,
    temperature: '18-28°C',
    humidity: '40-70%',
    soil: '疏松透气',
    fertilizer: '生长期每月一次',
    growthRate: '中等',
    matureSize: '根据品种而定',
    toxicity: '对宠物安全',
    propagation: '扦插、分株',
    description: data.description || `${data.name}，${data.family}植物，原产于${data.origin}。`,
    careTips: [
      '保持土壤微湿，避免积水',
      '放置在明亮散射光处',
      '生长期适当施肥',
      '定期清洁叶片'
    ],
    commonIssues: [
      '黄叶：可能是浇水过多',
      '徒长：光照不足',
      '病虫害：注意通风'
    ],
    tags: data.tags || [],
    image: getImageForCategory(data.category, imageIndex)
  };
}

// 读取现有数据库
const dbPath = path.join(__dirname, 'plant-database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log(`📊 当前数据库：${db.totalCount} 种植物`);
console.log(`🎯 目标：750 种植物`);
console.log(`📈 需要新增：${750 - db.totalCount} 种\n`);

// 新增植物数据
const newPlantsData = require('./new-plants-data.js');

// 添加新植物
let plantIdCounter = db.plants.length + 1;
let imageIndexCounter = 0;

newPlantsData.forEach(categoryData => {
  console.log(`\n🌿 处理分类：${categoryData.category}`);
  categoryData.plants.forEach(plantData => {
    const newPlant = createPlant(
      { ...plantData, category: categoryData.category },
      plantIdCounter,
      imageIndexCounter++
    );
    db.plants.push(newPlant);
    plantIdCounter++;
  });
  console.log(`   ✅ 添加 ${categoryData.plants.length} 种`);
});

// 更新总数
db.totalCount = db.plants.length;
db.lastUpdated = new Date().toISOString().split('T')[0];

// 保存新数据库
const backupPath = path.join(__dirname, 'plant-database.json.bak');
fs.copyFileSync(dbPath, backupPath);
console.log(`\n💾 已备份原数据库`);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`\n✅ 数据库扩充完成！`);
console.log(`📊 新总数：${db.totalCount} 种植物`);
console.log(`🎨 图片：所有植物已分配统一风格图片`);
console.log(`💾 备份：plant-database.json.bak`);
