# 旅行规划 Agent

基于 LangChain + DeepSeek + FastAPI + React 的智能旅行规划 Agent，支持社区互动功能。

## 快速开始

### 方式一：一键启动（Windows PowerShell）

```powershell
.\start.ps1
```

### 方式二：手动启动

#### 后端

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# pip install -r requirements.txt

# 设置环境变量
$env:DEEPSEEK_API_KEY="your-api-key"   # Windows PowerShell
$env:AMAP_API_KEY="your-amap-key"      # 高德地图API（可选）
$env:SENZING_API_KEY="your-senzing-key" # 心知天气API（可选）

# 启动服务
python -m uvicorn app.main:app --reload --port 8000
```

#### 前端

```bash
cd frontend
npm install
npm run dev
```

## 项目结构

```
travel-agent/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   └── travel_agent.py    # LangChain Agent 核心逻辑
│   │   ├── api/
│   │   │   ├── auth.py           # 认证API（登录/注册）
│   │   │   ├── community.py       # 社区API（帖子/日记）
│   │   │   └── travel.py          # 旅行规划API
│   │   ├── models/
│   │   │   └── database.py       # SQLAlchemy 数据库模型
│   │   ├── schemas/
│   │   │   └── travel.py          # Pydantic 数据模型
│   │   ├── services/
│   │   │   └── weather_map.py     # 天气和地图服务
│   │   └── main.py               # FastAPI 应用入口
│   ├── uploads/                   # 上传文件存储
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   │   └── images/               # 登录页背景图片
│   ├── src/
│   │   ├── api/
│   │   │   ├── api.ts           # 旅行规划API调用
│   │   │   └── community.ts     # 社区API调用
│   │   ├── components/
│   │   │   └── Layout.tsx       # 页面布局组件
│   │   ├── pages/
│   │   │   ├── TravelAgentPage.tsx   # AI旅行规划页面
│   │   │   ├── CommunityPage.tsx      # 社区首页
│   │   │   ├── LoginPage.tsx         # 登录/注册页面
│   │   │   ├── ProfilePage.tsx       # 个人中心
│   │   │   ├── AdminPage.tsx         # 管理后台
│   │   │   ├── CreateDiaryPage.tsx   # 创建日记
│   │   │   └── DiaryDetailPage.tsx   # 日记详情
│   │   ├── App.tsx              # React 主组件
│   │   ├── types.ts             # TypeScript 类型定义
│   │   └── main.tsx             # 应用入口
│   └── package.json
├── 图片资源/                      # 登录页背景图片素材
├── start.ps1                    # Windows 一键启动脚本
└── README.md
```

## 功能特性

### 旅行规划
- ✅ 自然语言解析（目的地、天数、预算、偏好）
- ✅ DeepSeek LLM 智能生成行程
- ✅ 每日交通建议（公交/地铁/步行）
- ✅ 自动预算分配
- ✅ 高德地图景点餐厅集成
- ✅ 心知天气实时天气和预报
- ✅ 城市介绍（历史/美食/景点）
- ✅ Markdown 行程表生成
- ✅ 保存/复制/导出图片功能
- ✅ 按天查看行程详情

### 用户系统
- ✅ 用户注册和登录
- ✅ JWT 认证
- ✅ 个人中心管理
- ✅ 管理员后台

### 社区功能
- ✅ 帖子发布和浏览
- ✅ 日记分享
- ✅ 图片上传
- ✅ 查看他人的旅行计划

### 界面特色
- 🎨 可爱漫画风格界面
- 🎬 电影字幕式诗意文字轮播
- 🖼️ 四宫格主题背景（城市/草原/雪山/大海）
- 📱 响应式设计

## API 端点

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 旅行规划
- `POST /api/travel/plan` - 生成旅行计划
- `GET /api/health` - 健康检查

### 社区
- `GET /api/diaries` - 获取日记列表
- `POST /api/diaries` - 创建日记
- `GET /api/diaries/{id}` - 获取日记详情
- `DELETE /api/diaries/{id}` - 删除日记
- `POST /api/diaries/{id}/like` - 点赞日记
- `GET /api/saved-plans` - 获取保存的计划
- `POST /api/saved-plans` - 保存计划
- `DELETE /api/saved-plans/{id}` - 删除保存的计划

### 管理
- `GET /api/admin/users` - 获取用户列表（管理员）
- `DELETE /api/admin/users/{id}` - 删除用户（管理员）

## 技术栈

- **后端**: Python + FastAPI + SQLAlchemy + LangChain
- **前端**: React + TypeScript + Tailwind CSS + Vite
- **数据库**: MySQL
- **LLM**: DeepSeek-chat
- **地图**: 高德地图 API
- **天气**: 心知天气 API

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key |
| `AMAP_API_KEY` | 是 | 高德地图 API Key（用于景点和链接） |
| `SENZING_API_KEY` | 是 | 心知天气 API Key |
| `MYSQL_URL` | 否 | MySQL 数据库连接URL（默认使用SQLite） |
| `SECRET_KEY` | 否 | JWT 密钥（自动生成） |
