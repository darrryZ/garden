# 植愈App植物知识库

## 📁 文件说明

| 文件 | 说明 | 大小 |
|-----|------|------|
| `plant-database.json` | 原始植物数据库（825种植物） | ~2MB |
| `plant-knowledge-base.json` | **整合知识库**（推荐直接使用） | ~3MB |
| `knowledge-query-api.js` | Node.js查询API | - |
| `knowledge-symptoms-care.json` | 症状诊断知识库 | - |
| `knowledge-fertilizers-pesticides.json` | 肥料药剂知识库 | - |

## 🌟 整合知识库结构

```json
{
  "version": "2.0",
  "total_plants": 825,
  "categories": [...],        // 8大分类
  "symptoms_reference": [...], // 症状库
  "diseases_reference": [...], // 病害库
  "fertilizers_reference": {...}, // 肥料库
  "plants": [                  // 825种植物详情
    {
      "id": "p001",
      "name": "绿萝",
      "category": "foliage",
      "difficulty": 1,
      // ... 原有植物信息
      "knowledge_base": {      // 新增知识库信息
        "common_symptoms": [...],
        "common_diseases": [...],
        "common_pests": [...],
        "fertilizer_schedule": {...},
        "care_tips": [...]
      }
    }
  ]
}
```

## 💡 使用方式

### 方式1：直接使用整合知识库

```javascript
const fs = require('fs');
const knowledgeBase = JSON.parse(
  fs.readFileSync('plant-knowledge-base.json', 'utf-8')
);

// 查找植物
const plant = knowledgeBase.plants.find(p => p.name === '绿萝');

// 获取知识库信息
const kb = plant.knowledge_base;
console.log(kb.common_symptoms);      // 常见症状
console.log(kb.common_diseases);      // 常见病害
console.log(kb.fertilizer_schedule);  // 施肥计划
console.log(kb.care_tips);            // 养护技巧
```

### 方式2：使用查询API

```javascript
const api = require('./knowledge-query-api.js');

// 查询植物问题
const result = api.queryPlantKnowledge('我的多肉叶片软了');
console.log(result.response);  // 格式化回复
```

## 📊 数据内容

### 8大植物分类
- 🌿 观叶植物 (foliage)
- 🌵 多肉植物 (succulent)
- 🌸 观花植物 (flowering)
- 🌱 香草植物 (herb)
- 🍃 蕨类植物 (fern)
- 🌵 仙人掌 (cactus)
- 🌿 爬藤植物 (climbing)
- 💧 水培植物 (aquatic)

### 症状诊断
- 多肉叶片变软
- 叶片发黄
- 叶片枯萎

每种症状包含：原因、判断方法、解决方案、恢复周期

### 病害防治
- 黑腐病（紧急）
- 炭疽病
- 白粉病
- 灰霉病
- 根腐病

每种病害包含：症状、治疗步骤、推荐药剂、传染性

### 施肥计划
按季节划分：春季、夏季、秋季、冬季
包含：肥料类型、使用频率、稀释比例

## 🔧 扩展知识库

如需添加更多症状或病害，编辑以下文件后重新运行整合脚本：
1. `knowledge-symptoms-care.json` - 添加症状
2. `knowledge-fertilizers-pesticides.json` - 添加肥料/药剂
3. 重新运行整合脚本更新 `plant-knowledge-base.json`

## 📝 示例查询

| 用户问题 | 识别植物 | 返回内容 |
|---------|---------|---------|
| "多肉叶片软了" | 石莲花 | 多肉叶片变软原因+治疗方案 |
| "绿萝叶子发黄" | 绿萝 | 叶片发黄原因+养护指南 |
| "芦荟烂根怎么办" | 芦荟 | 根腐病治疗+多肉养护 |

---

*为植愈App定制 | 科学养护，绿色生活*
