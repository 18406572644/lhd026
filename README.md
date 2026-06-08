# 🎯 随机挑战生成与完成系统

一个基于 Nuxt3 + Element Plus + NestJS + PostgreSQL 的全栈随机挑战管理系统，活力趣味 UI 设计。

## ✨ 功能特性

- 🎲 **随机抽取挑战** - 支持按难度筛选，酷炫抽取动画
- 📚 **自定义挑战库** - 完整的 CRUD 操作，支持难度分级
- ✅ **完成记录** - 记录挑战完成时间、用时、心得
- 📊 **数据统计** - 多维度数据可视化展示
- 📤 **挑战分享** - 一键分享挑战给好友
- 🔥 **连续天数** - 记录坚持连续挑战的天数
- ⭐ **积分系统** - 不同难度挑战对应不同积分
- 🎨 **活力 UI** - 渐变配色、圆角卡片、流畅动画

## 🛠️ 技术栈

### 前端
- **Nuxt 3** - Vue 3 全栈框架
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Sass** - CSS 预处理器
- **Axios** - HTTP 客户端

### 后端
- **NestJS** - Node.js 企业级框架
- **TypeORM** - ORM 框架
- **PostgreSQL** - 关系型数据库
- **Class Validator** - 参数校验

## 📁 项目结构

```
lhd026/
├── client/                 # 前端项目
│   ├── assets/css/         # 全局样式
│   ├── components/         # 组件
│   ├── composables/        # 组合式函数
│   ├── layouts/            # 布局
│   ├── pages/              # 页面
│   ├── stores/             # Pinia 状态管理
│   └── nuxt.config.ts      # Nuxt 配置
├── server/                 # 后端项目
│   ├── src/
│   │   ├── challenges/     # 挑战模块
│   │   ├── records/        # 记录模块
│   │   ├── common/         # 公共类型
│   │   ├── app.module.ts   # 应用模块
│   │   ├── main.ts         # 入口文件
│   │   └── seed.ts         # 数据种子
│   └── .env                # 环境配置
└── package.json            # 根目录配置
```

## 🚀 快速开始

### 前置要求
- Node.js >= 18
- PostgreSQL >= 14
- npm 或 yarn

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 安装前后端所有依赖
npm run install:all
```

### 2. 配置数据库

1. 确保 PostgreSQL 服务已启动
2. 创建数据库：
```sql
CREATE DATABASE challenge_tracker;
```

3. 修改 `server/.env` 配置（如需要）：
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=challenge_tracker
```

### 3. 初始化数据

```bash
# 填充预设挑战数据
npm run seed
```

### 4. 启动开发服务器

```bash
# 同时启动前后端（推荐）
npm run dev

# 或者分别启动
npm run dev:server  # 后端: http://localhost:3001
npm run dev:client  # 前端: http://localhost:3000
```

### 5. 访问应用

- 前端：http://localhost:3000
- 后端 API：http://localhost:3001/api

## 📡 API 接口

### 挑战接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/challenges` | 获取所有挑战 |
| GET | `/api/challenges?difficulty=easy` | 按难度筛选 |
| POST | `/api/challenges` | 创建挑战 |
| GET | `/api/challenges/random` | 随机抽取挑战 |
| GET | `/api/challenges/stats` | 获取统计数据 |
| GET | `/api/challenges/:id` | 获取单个挑战 |
| GET | `/api/challenges/:id/share` | 获取分享数据 |
| PATCH | `/api/challenges/:id` | 更新挑战 |
| DELETE | `/api/challenges/:id` | 删除挑战 |

### 记录接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/records` | 获取所有完成记录 |
| POST | `/api/records` | 创建完成记录 |
| GET | `/api/records/challenge/:id` | 获取指定挑战的记录 |
| DELETE | `/api/records/:id` | 删除记录 |

## 📱 页面说明

### 首页 (`/`)
- 随机抽取挑战
- 难度筛选
- 抽取动画效果
- 完成/再抽/跳过/分享操作
- 快速统计概览

### 挑战库 (`/challenges`)
- 挑战列表展示
- 添加/编辑/删除挑战
- 难度筛选
- 关键词搜索
- 难度分布统计

### 完成记录 (`/records`)
- 历史完成记录
- 连续天数统计
- 删除记录功能

### 数据统计 (`/stats`)
- 概览卡片（总数/完成/积分/完成率）
- 饼图（难度分布）
- 柱状图（各难度对比）
- 折线图（近7天/月度趋势）
- 分类统计进度条

## 🎯 难度分级

| 难度 | 颜色 | 推荐积分 |
|------|------|----------|
| 简单 | 🟢 绿色 | 10-20 |
| 中等 | 🟡 橙色 | 20-50 |
| 困难 | 🔴 红色 | 50-80 |
| 专家 | 🟣 紫色 | 80-200 |

## 📦 生产构建

```bash
# 构建前后端
npm run build

# 启动生产服务器
npm run start:server
npm run start:client
```

## 🎨 UI 设计特色

- **渐变配色**：紫粉渐变为主色调，搭配多种活力渐变
- **圆角设计**：大量使用圆角卡片，营造轻松活泼氛围
- **多层阴影**：卡片悬停时有明显的阴影变化
- **流畅动画**：页面切换、卡片悬停、抽取过程都有动画
- **响应式布局**：完美适配桌面端和移动端

## 📝 License

MIT
