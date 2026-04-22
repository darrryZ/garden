# 植愈App智能搜索系统

## 🎯 功能特点

智能搜索系统能够根据用户输入自动判断查询意图，返回相应的内容：

| 查询类型 | 示例 | 返回内容 |
|---------|------|---------|
| **植物信息** | "绿萝" | 植物基本信息、简介、养护要点、常见问题 |
| **症状诊断** | "多肉叶片软了" | 症状原因分析、判断方法、解决方案 |
| **病害治疗** | "芦荟烂根怎么办" | 病害症状、治疗步骤、推荐药剂 |
| **养护指南** | "龟背竹怎么养" | 光照、浇水、温度、湿度、土壤等详细养护 |
| **施肥建议** | "月季怎么施肥" | 四季施肥计划、肥料类型、使用频率 |

## 🚀 快速开始

```javascript
const { smartSearch } = require('./smart-search.js');

// 搜索植物信息
const result = smartSearch('绿萝');
console.log(result.title);    // 🌿 绿萝
console.log(result.content);  // 植物详细信息

// 症状诊断
const result2 = smartSearch('叶子发黄');
console.log(result2.title);   // 🔍 症状诊断
console.log(result2.content); // 发黄原因和解决方案
```

## 📋 使用示例

### 1. 搜索植物信息
```javascript
smartSearch('绿萝')
// 返回：
// {
//   type: 'plant_info',
//   title: '🌿 绿萝',
//   content: '基本信息、简介、养护要点、常见问题...'
// }
```

### 2. 症状诊断
```javascript
smartSearch('多肉叶片软了')
// 返回：
// {
//   type: 'symptom_diagnosis',
//   title: '🔍 石莲花 - 症状诊断',
//   content: '多肉叶片变软的可能原因：正常消耗、缺水、烂根、休眠期...'
// }
```

### 3. 病害治疗
```javascript
smartSearch('芦荟烂根怎么办')
// 返回：
// {
//   type: 'disease_treatment',
//   title: '💊 芦荟 - 病害防治',
//   content: '根腐病症状、治疗步骤、推荐药剂...'
// }
```

### 4. 养护指南
```javascript
smartSearch('龟背竹怎么养')
// 返回：
// {
//   type: 'care_guide',
//   title: '🌱 龟背竹 - 养护指南',
//   content: '光照、浇水、温度、湿度、土壤、施肥、修剪...'
// }
```

### 5. 施肥建议
```javascript
smartSearch('月季怎么施肥')
// 返回：
// {
//   type: 'fertilizer_advice',
//   title: '💊 月季 - 施肥指南',
//   content: '四季施肥计划...'
// }
```

## 🔍 支持的植物

系统支持825种植物，包括：

- **观叶植物**：绿萝、吊兰、虎皮兰、龟背竹、橡皮树等
- **多肉植物**：芦荟、玉树、石莲花、金枝玉叶等
- **开花植物**：月季、茉莉、栀子、长寿花、蟹爪兰等
- **香草植物**：薄荷、迷迭香、罗勒、薰衣草等
- **蕨类植物**：铁线蕨、波士顿蕨、鸟巢蕨等
- **仙人掌**：仙人掌、仙人球等
- **爬藤植物**：常春藤等
- **水培植物**：碗莲、睡莲等

## 🎨 界面集成建议

### 顶部搜索框设计

```html
<div class="search-box">
  <input 
    type="text" 
    placeholder="搜索植物名称或症状，如：绿萝、叶子发黄..."
    id="searchInput"
  />
  <button onclick="search()">🔍</button>
</div>

<div id="searchResults"></div>
```

```javascript
function search() {
  const query = document.getElementById('searchInput').value;
  const result = smartSearch(query);
  
  // 根据类型显示不同样式
  const resultDiv = document.getElementById('searchResults');
  resultDiv.innerHTML = `
    <div class="result-card ${result.type}">
      <h2>${result.title}</h2>
      <div class="content">${formatContent(result.content)}</div>
    </div>
  `;
}
```

### 结果卡片样式建议

| 类型 | 颜色主题 | 图标 |
|-----|---------|------|
| plant_info | 绿色 | 🌿 |
| symptom_diagnosis | 橙色 | 🔍 |
| disease_treatment | 红色 | 💊 |
| care_guide | 蓝色 | 🌱 |
| fertilizer_advice | 紫色 | 💊 |

## 📊 数据结构

### 返回结果格式

```javascript
{
  type: 'plant_info',        // 查询类型
  plant: {...},              // 植物信息（如果有）
  title: '🌿 绿萝',          // 标题
  content: '...',            // 内容（Markdown格式）
  
  // 症状诊断特有
  matchedSymptoms: [...],    // 匹配的症状
  
  // 病害治疗特有
  matchedDiseases: [...],    // 匹配的病害
  
  // 建议列表特有
  suggestions: [...]         // 建议列表
}
```

## 🔧 扩展功能

### 添加新的症状关键词

编辑 `smart-search.js` 中的 `symptomKeywords`：

```javascript
const symptomKeywords = {
  '黄': ['leaf_yellowing'],
  '软': ['succulent_leaf_soft', 'leaf_wilt'],
  '蔫': ['leaf_wilt', 'succulent_leaf_soft'],
  // 添加新的关键词映射
  '新关键词': ['对应症状ID']
};
```

### 添加新的植物别名

编辑 `smart-search.js` 中的 `plantMappings`：

```javascript
const plantMappings = {
  '植物名称': ['别名1', '别名2', '别名3'],
  // 添加新的植物
  '新植物': ['别名1', '别名2']
};
```

## 📝 注意事项

1. **植物识别**：系统优先匹配常见植物别名，如"多肉"会匹配到"石莲花"
2. **症状识别**：支持中文症状描述，如"黄"、"软"、"蔫"等
3. **模糊搜索**：如果无法精确匹配，会尝试模糊搜索植物名称
4. **性能优化**：建议在前端添加防抖，避免频繁调用搜索

## 🎉 示例查询

| 查询 | 类型 | 说明 |
|-----|------|------|
| "绿萝" | 植物信息 | 返回绿萝的完整信息 |
| "多肉叶片软了" | 症状诊断 | 返回多肉叶片变软的原因和解决 |
| "芦荟烂根" | 病害治疗 | 返回根腐病治疗方案 |
| "龟背竹怎么养" | 养护指南 | 返回详细养护方法 |
| "月季施肥" | 施肥建议 | 返回四季施肥计划 |
| "叶子发黄" | 症状诊断 | 返回叶片发黄原因（通用） |

---

*为植愈App定制 | 智能搜索，科学养护*
