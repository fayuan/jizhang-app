# 💰 记账

一个简洁、易用的个人财务管理桌面应用，帮你轻松记录每一笔开销。

---

## ✨ 功能特点

- **快速记账** — 输入金额、选择分类，三步完成一笔记录
- **二级分类** — 12 个一级大类 + 丰富的二级小分类，覆盖日常所有支出场景
- **自定义分类** — 支持添加、修改、删除自己的分类（系统预置分类不可修改）
- **账单查看** — 按日期或分类筛选，支出统计一目了然
- **数据可视化** — 分类占比饼图，消费结构清晰直观
- **本地存储** — 所有数据保存在本地 SQLite 数据库，无需联网，隐私安全
- **数据管理** — 支持数据导出、备份和恢复

---

## 📸 界面预览

应用包含四个主要页面：

| 页面 | 说明 |
|------|------|
| 📝 **记账** | 记一笔支出：金额、日期、分类、备注 |
| 📊 **账单** | 查看历史账单，按日期和分类筛选 |
| 📈 **统计** | 支出统计概览，分类占比饼图 |
| ⚙️ **分类管理** | 管理自定义分类，添加/修改/删除 |

---

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| [Electron](https://www.electronjs.org/) | 桌面应用框架，支持 Windows 和 macOS |
| [React](https://react.dev/) | 前端 UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全的 JavaScript 超集 |
| [Ant Design](https://ant.design/) | UI 组件库，中文友好 |
| [SQLite (sql.js)](https://sql.js.org/) | 本地数据库，纯 JS 实现，无需安装 |
| [ECharts](https://echarts.apache.org/) | 数据可视化图表 |
| [electron-vite](https://electron-vite.org/) | 构建工具，快速开发与热更新 |

---

## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18.x 或更高版本
- npm 9.x 或更高版本

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/fayuan/jizhang-app.git
cd jizhang-app

# 2. 安装依赖
npm install

# 3. 启动开发模式（Electron 窗口 + 热更新）
npm run dev

# 4. 构建生产版本
npm run build

# 5. 打包为可执行文件（Windows）
npm run pack
```

---

## 📁 项目结构

```
记账APP/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── index.ts    # 应用入口，窗口管理
│   │   ├── database.ts # 数据库初始化与操作
│   │   └── ipc.ts      # IPC 通信处理
│   ├── preload/        # 预加载脚本（安全桥接）
│   │   └── index.ts
│   └── renderer/       # 渲染进程（React 前端）
│       ├── index.html
│       └── src/
│           ├── App.tsx  # 主界面组件
│           ├── types.ts # TypeScript 类型定义
│           └── main.tsx # React 入口
├── electron.vite.config.ts  # 构建配置
├── package.json
└── CLAUDE.md           # 产品文档 & 开发约定
```

---

## 📦 版本记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-12 | v0.1 | 产品文档创建，技术栈选型 |
| 2026-07-12 | v0.2 | 项目初始化，开发服务器成功启动 |
| 2026-07-15 | v0.3 | 支持用户自定义分类管理 |

---

## 📄 许可证

[MIT](LICENSE)