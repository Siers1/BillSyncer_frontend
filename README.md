# 共享账本前端仓库

基于 Vue 3 + TypeScript + Element Plus 的多人协作账本管理系统前端，提供现代化的用户界面和流畅的交互体验。

## 核心功能

- 📊 **账本管理** - 创建、编辑、删除账本，支持多账本管理
- 💰 **消费记录** - 记录和查询消费明细，支持多种支付方式
- 👥 **多人协作** - 邀请成员共享账本，支持角色权限管理（创建者/管理员/成员）
- 🤖 **AI 分析** - 集成 AI 智能消费分析，流式展示分析结果
- 🔔 **实时通知** - 基于 WebSocket 的消息推送和未读提醒
- 🎨 **现代 UI** - 基于 Element Plus 的美观界面设计

## 技术栈

- **前端框架**: Vue 3.5.18 + TypeScript 5.8.0 + Vite 7.0.6
- **UI 组件库**: Element Plus 2.11.2
- **状态管理**: Pinia 3.0.3 + Vue Router 4.5.1
- **网络请求**: Axios 1.11.0
- **开发工具**: Prettier + Vue TSC

## 快速开始

### 克隆仓库
```bash
git clone <your-repository-url>
cd ConsumptionBill
```

### 环境要求
- Node.js: ^20.19.0 或 >=22.12.0
- npm: 最新版本

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
访问地址：`http://localhost:5173`

### 构建生产版本
```bash
npm run build
```

### 其他命令
```bash
# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 代码检查
npm run lint
```

## Docker 部署

### 构建镜像
```bash
# 首先构建前端资源
npm run build

# 构建 Docker 镜像
docker build -t consumption-bill-frontend .
```

### 运行容器
```bash
docker run -d -p 80:80 --name consumption-bill-frontend consumption-bill-frontend
```

访问地址：`http://localhost`

## 项目结构

```
src/
├── api/                  # API 接口定义
├── assets/              # 静态资源
├── components/          # 公共组件
├── dto/                 # 数据传输对象
├── pages/               # 页面组件
│   ├── BillListPage.vue # 账本列表页
│   ├── RecordsPage.vue  # 消费记录页
│   ├── InfoPage.vue     # 个人信息页
│   └── ...
├── router/              # 路由配置
├── stores/              # 状态管理
├── utils/               # 工具函数
│   ├── request.ts       # 请求封装
│   ├── websocket.ts     # WebSocket 服务
│   └── DateUtil.ts      # 日期工具
├── App.vue              # 根组件
└── main.ts              # 应用入口
```

## 核心配置

### Vite 代理配置
开发环境下，API 请求通过 Vite 代理到后端服务：
```typescript
proxy: {
  '^/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

### Nginx 配置
生产环境使用 Nginx 作为 Web 服务器，支持：
- Vue Router 历史模式
- 静态资源缓存
- 反向代理后端 API（`/api/` -> `http://backend:8080/`）
- 流式传输支持（AI 分析功能）
- Gzip 压缩

## 作者

**Siersi**

---

⭐ 如果这个项目对您有帮助，欢迎 Star！
