const fs = require('fs');
const path = require('path');

// 植物图片映射 - 使用 Unsplash 免费图片
const plantImages = {
  // 观叶植物
  '绿萝': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  '虎尾兰': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '吊兰': 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
  '龟背竹': 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400',
  '橡皮树': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  '琴叶榕': 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400',
  '天堂鸟': 'https://images.unsplash.com/photo-1550951298-5c7b95a66b90?w=400',
  '发财树': 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?w=400',
  '幸福树': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '金钱树': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  '常春藤': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  '万年青': 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
  '竹芋': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '合果芋': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  '孔雀竹芋': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  '白掌': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '红掌': 'https://images.unsplash.com/photo-1550951298-5c7b95a66b90?w=400',
  '彩叶芋': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  '网纹草': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  '镜面草': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '铁线蕨': 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
  '波士顿蕨': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '鸟巢蕨': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  '鹿角蕨': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  '狼尾蕨': 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
  '肾蕨': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '卷柏': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  
  // 多肉植物
  '石莲花': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '芦荟': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '生石花': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '玉露': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '熊童子': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '佛珠': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '桃蛋': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '吉娃娃': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '虹之玉': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '薄雪万年草': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '千佛手': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '黄丽': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '胧月': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '静夜': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '白牡丹': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '黑王子': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '紫珍珠': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '初恋': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '冰梅': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '雪莲': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '山地玫瑰': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '法师': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '钱串': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '小米星': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '乙女心': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '八千代': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '虹之玉锦': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '锦晃星': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '露娜莲': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '花月夜': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  
  // 仙人掌
  '金琥': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '仙人球': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '仙人掌': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '蟹爪兰': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '绯花玉': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '鸾凤玉': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '星兜': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '银手指': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  '白檀': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  '子孙球': 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400',
  
  // 观花植物
  '茉莉花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '栀子花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '月季': 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400',
  '长寿花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '蟹爪莲': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '蝴蝶兰': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '仙客来': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '杜鹃花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '绣球花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '君子兰': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '兰花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '菊花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '康乃馨': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '风信子': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '郁金香': 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400',
  '百合': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '玫瑰': 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=400',
  '牡丹': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '芍药': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '茶花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '桂花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '瑞香': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '含笑': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '米兰': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '九里香': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '夜来香': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '薰衣草': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '迷迭香': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '薄荷': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '罗勒': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  
  // 香草植物
  '百里香': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '鼠尾草': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '牛至': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '莳萝': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '细香葱': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '欧芹': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '紫苏': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '柠檬草': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  
  // 爬藤植物
  '绿萝': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  '常春藤': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  '爬山虎': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  '凌霄花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '紫藤': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '铁线莲': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  '金银花': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  
  // 水培植物
  '富贵竹': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '水培绿萝': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  '铜钱草': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '水培吊兰': 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
  '水培白掌': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
  '水培红掌': 'https://images.unsplash.com/photo-1550951298-5c7b95a66b90?w=400',
  '水培虎皮兰': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
};

// 默认图片（按分类）
const defaultImages = {
  'foliage': 'https://images.unsplash.com/photo-1596724857861-9b5b97c5ec0c?w=400',
  'succulent': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  'flowering': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  'herb': 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400',
  'fern': 'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=400',
  'cactus': 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400',
  'climbing': 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?w=400',
  'aquatic': 'https://images.unsplash.com/photo-1599598425947-520afb0fd5b7?w=400',
};

// 读取数据库文件
const dbPath = path.join(__dirname, 'plant-database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 为每个植物添加图片
let updatedCount = 0;
db.plants = db.plants.map(plant => {
  if (plantImages[plant.name]) {
    plant.image = plantImages[plant.name];
    updatedCount++;
  } else {
    // 使用分类默认图片
    plant.image = defaultImages[plant.category] || defaultImages['foliage'];
  }
  return plant;
});

// 保存更新后的数据库
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');

console.log(`✅ 已为 ${updatedCount}/${db.plants.length} 种植物添加图片`);
console.log('数据库已更新！');