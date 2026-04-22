# Rose Garden 植物数据库后端 (数据库版本)

使用 SQLite 数据库存储用户和植物数据，替代原来的 JSON 文件存储。

## 文件结构

```
plant-database-backend-后端/
├── database/
│   ├── database.py      # 核心数据库模块 (Python)
│   ├── db-bridge.py     # Node.js 桥接脚本
│   └── garden.db        # SQLite 数据库文件
├── db-adapter.js        # Node.js 数据库适配器
├── server-db.js         # 新的数据库版服务器
├── init-db.py           # 数据库初始化脚本
├── server.js            # 原 JSON 版服务器 (保留)
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库（首次运行）

```bash
python3 init-db.py
```

这会：
- 创建 SQLite 数据库文件
- 导入 plant-database.json 中的 800+ 种植物类型
- 创建必要的表结构

### 3. 启动数据库版服务器

```bash
node server-db.js
```

服务器将在 `http://localhost:3002` 启动

## API 接口

### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 花园

- `GET /api/gardens` - 获取用户的所有花园
- `POST /api/gardens` - 创建花园
- `GET /api/gardens/:id` - 获取花园详情
- `PUT /api/gardens/:id` - 更新花园
- `DELETE /api/gardens/:id` - 删除花园

### 用户植物

- `GET /api/user-plants` - 获取用户的植物列表
- `POST /api/user-plants` - 添加植物
- `GET /api/user-plants/:id` - 获取植物详情
- `PUT /api/user-plants/:id` - 更新植物
- `DELETE /api/user-plants/:id` - 删除植物
- `POST /api/user-plants/:id/water` - 浇水
- `POST /api/user-plants/:id/fertilize` - 施肥
- `GET /api/user-plants/:id/care-logs` - 获取养护记录
- `GET /api/user-plants/needs-care/list` - 获取需要养护的植物

### 植物类型

- `GET /api/plant-types` - 获取所有植物类型
- `GET /api/plant-types/:id` - 获取植物类型详情

### 植物数据库（只读）

- `GET /api/plants` - 获取所有植物
- `GET /api/plants/:id` - 获取单个植物详情
- `GET /api/categories` - 获取植物分类
- `GET /api/stats` - 获取统计数据

## 数据迁移

如果要从旧版 JSON 数据迁移：

1. 启动新服务器
2. 使用相同的账号重新注册（数据会存入数据库）
3. 重新添加花园和植物

旧版数据保留在 `user-data.json` 中，可以随时切换回旧服务器。

## 切换回旧版

如需使用原来的 JSON 存储：

```bash
node server.js
```

## 数据库表结构

### users - 用户表
- id, username, email, password_hash, display_name, avatar_url, created_at, updated_at

### user_sessions - 会话表
- id, user_id, session_token, ip_address, user_agent, expires_at, created_at

### gardens - 花园表
- id, user_id, name, description, location, size_sqm, created_at, updated_at

### plant_types - 植物类型表
- id, name, scientific_name, category, description, care_instructions, icon_url, is_preset, created_at

### user_plants - 用户植物表
- id, user_id, garden_id, plant_type_id, custom_name, status, planted_at, last_watered_at, last_fertilized_at, position_x, position_y, notes, created_at, updated_at

### plant_care_logs - 养护记录表
- id, plant_id, user_id, action_type, action_details, photo_url, performed_at

## 技术说明

- **数据库**: SQLite3
- **后端**: Node.js + Express
- **桥接**: Python Shell (python-shell)
- **Python 模块**: 自定义 GardenDatabase 类

## 优势

✅ 数据持久化 - 不再担心 JSON 文件损坏  
✅ 并发安全 - SQLite 支持多线程读写  
✅ 查询效率 - SQL 查询比遍历 JSON 快得多  
✅ 数据关系 - 支持外键和关联查询  
✅ 实时更新 - 无需重新加载整个文件  
✅ 扩展性 - 易于添加新表和字段  

## 注意事项

- 需要 Python 3 环境
- 数据库文件 `garden.db` 会自动创建
- 首次运行需要执行 `init-db.py` 导入植物数据
