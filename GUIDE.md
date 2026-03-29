# WorkflowStudio - n8n 对接与 Docker 部署指南

---

## 目录

1. [项目概述](#1-项目概述)
2. [架构说明](#2-架构说明)
3. [n8n 工作流对接指南](#3-n8n-工作流对接指南)
4. [Docker 部署](#4-docker-部署)
5. [GitHub 发布与服务器部署](#5-github-发布与服务器部署)
6. [常见问题](#6-常见问题)

---

## 1. 项目概述

WorkflowStudio 是一个 **AI 内容生成工作台**，支持小红书图文和抖音短视频脚本的自动化生成。前端通过 3 个 Webhook 接口与 n8n 后端通信，实现：

- 提交生成任务 → AI 处理 → 返回初稿 → 用户反馈/修改 → 生成终稿

### 技术栈

| 层级    | 技术                          |
|---------|-------------------------------|
| 前端    | React 18 + Vite + Tailwind CSS |
| 后端    | n8n 工作流自动化               |
| 部署    | Docker (Nginx) + GitHub Actions |

---

## 2. 架构说明

```
┌─────────────────┐         ┌─────────────────────────────┐
│  WorkflowStudio │         │          n8n 后端             │
│   (前端 SPA)     │         │                             │
│                 │  POST   │  /webhook/start-workflow     │
│  提交表单 ──────┼────────→│  → 接收参数                  │
│                 │         │  → 调用 AI (GPT/Claude)      │
│                 │  GET    │  → 生成初稿                  │
│  轮询状态 ──────┼────────→│  /webhook/query-status       │
│                 │         │  → 返回进度/预览内容          │
│                 │  POST   │                             │
│  修改/确认 ─────┼────────→│  /webhook/user-action        │
│                 │         │  → 处理反馈                  │
│                 │         │  → 生成终稿                  │
└─────────────────┘         └─────────────────────────────┘
```

---

## 3. n8n 工作流对接指南

### 3.1 需要创建的 3 个 Webhook

在 n8n 中需要创建 **3 个独立的 Workflow**，每个对应一个 Webhook 端点：

---

### Webhook 1: 启动工作流 (`/webhook/start-workflow`)

**触发方式**: Webhook (POST)

**前端发送的请求体**:
```json
{
  "platform": "xiaohongshu",        // "xiaohongshu" 或 "douyin"
  "sessionId": "uuid-xxx-xxx",      // 前端唯一会话ID
  "params": {
    "主题/产品": "夏季防晒霜",
    "目标人群": "25-35岁都市女性",
    "文案风格": "种草分享",
    "核心卖点": "SPF50+ PA++++\n轻薄不油腻",
    "发布目的": "产品推广",
    "字数范围": "300-500字",
    "图片张数": "3",
    "图片风格": "清新自然",
    "标题风格": "疑问式",
    "标签/关键词": "防晒, 夏季好物",
    "补充说明": ""
  }
}
```

**小红书平台 (`xiaohongshu`) 的 `params` 字段**:

| 字段名       | 类型   | 必填 | 说明                                       |
|-------------|--------|------|--------------------------------------------|
| 主题/产品    | string | 是   | 生成内容的主题                               |
| 目标人群     | string | 是   | 目标受众描述                                 |
| 文案风格     | string | 是   | 种草分享/干货教程/真实测评/情感共鸣/对比评测/开箱体验/日常分享/攻略指南 |
| 核心卖点     | string | 是   | 产品亮点，多条用换行分隔                       |
| 发布目的     | string | 否   | 品牌种草/产品推广/涨粉引流/分享记录/知识科普/活动宣传 |
| 字数范围     | string | 否   | 100-200字 / 200-300字 / 300-500字 / 500-800字 / 800字以上 |
| 图片张数     | string | 否   | 1/2/3/4/6/9                                |
| 图片风格     | string | 否   | 清新自然/高级质感/可爱少女/简约大气/复古文艺/科技感/INS风/日系 |
| 标题风格     | string | 否   | 疑问式/数字式/感叹式/对比式/悬念式/痛点式       |
| 标签/关键词   | string | 否   | 逗号分隔的标签                               |
| 补充说明     | string | 否   | 额外注意事项                                 |

**抖音平台 (`douyin`) 的 `params` 字段**:

| 字段名                  | 类型   | 必填 | 说明                                      |
|------------------------|--------|------|-------------------------------------------|
| 主题/产品               | string | 是   | 生成内容的主题                              |
| 目标人群                | string | 是   | 目标受众描述                                |
| 视频时长                | string | 是   | 15秒/30秒/60秒/3分钟/5分钟                  |
| 脚本风格                | string | 是   | 轻松搞笑/专业讲解/情感故事/快节奏种草/沉浸式体验/对比测评/街头采访 |
| 视频类型（口播/混剪/剧情）| string | 是   | 口播/混剪/剧情/实拍/动画                     |
| 分镜数量                | string | 否   | 3-4个/4-6个/6-8个/8个以上                   |
| 核心卖点                | string | 是   | 产品亮点，多条用换行分隔                       |
| 画面风格                | string | 否   | 明亮清新/暗调质感/电影感/日系温暖/赛博朋克/极简白/复古滤镜 |
| BGM 风格               | string | 否   | 轻快活泼/热血激昂/治愈温馨/电子音乐/古风国潮/流行说唱/纯音乐 |
| CTA/行动引导            | string | 否   | 引导行动的文案                              |
| 补充说明                | string | 否   | 额外注意事项                                |

**n8n 需要返回的响应**:
```json
{
  "success": true,
  "taskId": "task_1234567890_abc123",    // n8n 生成的唯一任务 ID
  "status": "processing",               // 固定值
  "message": "工作流已启动，正在生成内容..."
}
```

**n8n 工作流设计建议**:

```
Webhook (接收) → Function (生成taskId，存入数据库/变量) →
  └→ IF (platform = xiaohongshu)
       └→ AI Agent (小红书文案生成 Prompt)
       └→ AI Image Generation (可选)
  └→ IF (platform = douyin)
       └→ AI Agent (抖音脚本生成 Prompt)
  → 将结果存储 (数据库/Redis/内存)
  → Respond to Webhook (返回 taskId)
```

---

### Webhook 2: 查询状态 (`/webhook/query-status`)

**触发方式**: Webhook (GET)

**前端请求**: `GET /webhook/query-status?taskId=task_1234567890_abc123`

**n8n 需要返回的响应** (根据不同阶段):

#### 阶段 A: 处理中
```json
{
  "success": true,
  "taskId": "task_1234567890_abc123",
  "status": "processing",
  "stepName": "generating",
  "message": "正在调用 AI 模型生成内容...",
  "preview": null,
  "history": [
    {
      "role": "system",
      "type": "status",
      "content": "✅ 工作流已启动\n平台：小红书",
      "timestamp": 1700000000000
    }
  ],
  "allowRevise": false,
  "allowConfirm": false
}
```

#### 阶段 B: 初稿完成，等待用户反馈
```json
{
  "success": true,
  "taskId": "task_1234567890_abc123",
  "status": "waiting_user_feedback",
  "stepName": "draft",
  "message": "初稿已生成，请预览并确认或提出修改意见",
  "preview": {
    "text": "✨ 夏季防晒霜 | 用了一个月的真实感受 ✨\n\n姐妹们...(文案内容)",
    "images": [
      "https://your-domain.com/generated/img1.jpg",
      "https://your-domain.com/generated/img2.jpg"
    ],
    "videos": []
  },
  "history": [
    { "role": "system", "type": "status", "content": "✅ 工作流已启动", "timestamp": 1700000000000 },
    { "role": "system", "type": "status", "content": "📝 AI 正在生成初稿内容...", "timestamp": 1700000003000 },
    { "role": "system", "type": "preview", "content": "{...preview JSON...}", "timestamp": 1700000006000 }
  ],
  "allowRevise": true,
  "allowConfirm": true
}
```

#### 阶段 C: 最终完成
```json
{
  "success": true,
  "taskId": "task_1234567890_abc123",
  "status": "completed",
  "stepName": "final",
  "message": "内容生成完成！可以复制或下载。",
  "preview": {
    "text": "✨ 最终版文案内容 ✨\n...",
    "images": ["https://..."],
    "videos": []
  },
  "history": [...],
  "allowRevise": false,
  "allowConfirm": false
}
```

**关键字段说明**:

| 字段           | 类型     | 说明                                                                 |
|---------------|----------|----------------------------------------------------------------------|
| `status`      | string   | `processing` / `waiting_user_feedback` / `completed` / `failed`     |
| `stepName`    | string   | `generating` / `draft` / `revising` / `finalizing` / `final`       |
| `preview`     | object   | 包含 `text`(文案), `images`(图片URL数组), `videos`(视频URL数组)       |
| `history`     | array    | 消息历史，每条包含 `role`, `type`, `content`, `timestamp`             |
| `allowRevise` | boolean  | 是否显示"提交修改意见"按钮                                             |
| `allowConfirm`| boolean  | 是否显示"确认"按钮                                                    |

**前端轮询机制**:
- `processing` 状态下：每 **3 秒** 轮询一次
- `waiting_user_feedback` 状态下：每 **9 秒** 轮询一次
- `completed` 或 `failed` 状态下：停止轮询
- 总超时：**5 分钟**（300 秒）

---

### Webhook 3: 用户操作 (`/webhook/user-action`)

**触发方式**: Webhook (POST)

**前端发送的请求体**:

修改意见：
```json
{
  "taskId": "task_1234567890_abc123",
  "action": "revise",
  "feedback": "标题改为数字式，增加更多emoji，文案更活泼一些"
}
```

确认继续：
```json
{
  "taskId": "task_1234567890_abc123",
  "action": "confirm",
  "feedback": ""
}
```

**n8n 需要返回的响应**:
```json
{
  "success": true,
  "status": "processing",
  "message": "修改意见已接收，正在重新生成"
}
```

**n8n 工作流设计建议**:
```
Webhook (接收) → IF (action = "revise")
  └→ 是：将 feedback 传给 AI → 重新生成 → 更新任务状态
  └→ 否(confirm)：基于初稿生成最终版 → 更新任务状态
→ Respond to Webhook
```

---

### 3.2 n8n 完整工作流设计

推荐使用数据库（如 PostgreSQL/MySQL）或 Redis 来存储任务状态。以下是推荐架构：

#### 工作流 A: Start Workflow

```
[Webhook: POST /webhook/start-workflow]
    │
    ▼
[Function: 生成 taskId]
    │ taskId = "task_" + Date.now() + "_" + randomString
    │ 将 taskId + params 存入数据库，status = "processing"
    ▼
[Respond to Webhook: 返回 { success, taskId, status }]
    │
    ▼
[Wait: 1秒] (让前端先收到响应)
    │
    ▼
[IF: platform === "xiaohongshu"]
    ├─ 是 → [OpenAI/Claude Node: 小红书文案 Prompt]
    │        │
    │        ▼
    │       [OpenAI/Stable Diffusion: 生成图片] (可选)
    │        │
    │        ▼
    │       [Function: 更新数据库 status="waiting_user_feedback"]
    │
    └─ 否 → [OpenAI/Claude Node: 抖音脚本 Prompt]
             │
             ▼
            [Function: 更新数据库 status="waiting_user_feedback"]
```

#### 工作流 B: Query Status

```
[Webhook: GET /webhook/query-status]
    │ 参数: taskId
    ▼
[Database: 查询 taskId 的当前状态]
    │
    ▼
[Function: 组装响应数据]
    │ 根据 status 决定返回内容
    │ 包含 preview, history, allowRevise, allowConfirm
    ▼
[Respond to Webhook: 返回完整状态]
```

#### 工作流 C: User Action

```
[Webhook: POST /webhook/user-action]
    │ 参数: taskId, action, feedback
    ▼
[Database: 更新 status = "processing"]
    │
    ▼
[Respond to Webhook: 返回确认]
    │
    ▼
[IF: action === "revise"]
    ├─ 是 → [Function: 组装修改 Prompt (原稿 + feedback)]
    │        │
    │        ▼
    │       [AI Node: 根据修改意见重新生成]
    │        │
    │        ▼
    │       [Database: 更新 status="completed", 存储终稿]
    │
    └─ 否 → [AI Node: 基于初稿生成终稿]
             │
             ▼
            [Database: 更新 status="completed", 存储终稿]
```

---

### 3.3 AI Prompt 示例

#### 小红书文案 Prompt

```
你是一位专业的小红书文案创作者。请根据以下信息生成一篇小红书笔记：

主题/产品：{{$json.params["主题/产品"]}}
目标人群：{{$json.params["目标人群"]}}
文案风格：{{$json.params["文案风格"]}}
核心卖点：{{$json.params["核心卖点"]}}
字数范围：{{$json.params["字数范围"]}}
标题风格：{{$json.params["标题风格"]}}

要求：
1. 标题要吸引眼球，使用指定的标题风格
2. 文案要符合小红书平台调性
3. 适当使用emoji增强可读性
4. 在文末添加相关话题标签
5. 控制在指定字数范围内
```

#### 抖音脚本 Prompt

```
你是一位专业的短视频编导。请根据以下信息生成一份抖音短视频脚本：

主题/产品：{{$json.params["主题/产品"]}}
目标人群：{{$json.params["目标人群"]}}
视频时长：{{$json.params["视频时长"]}}
脚本风格：{{$json.params["脚本风格"]}}
视频类型：{{$json.params["视频类型（口播 / 混剪 / 剧情）"]}}
分镜数量：{{$json.params["分镜数量"]}}
核心卖点：{{$json.params["核心卖点"]}}
画面风格：{{$json.params["画面风格"]}}
BGM风格：{{$json.params["BGM 风格"]}}
CTA引导：{{$json.params["CTA/行动引导"]}}

要求：
1. 按分镜格式输出，每个分镜包含：时间段、画面描述、台词/旁白、BGM/音效、转场方式
2. 开场3秒必须有强吸引力的hook
3. 结尾有明确的CTA行动引导
4. 符合指定的脚本风格和时长要求
```

---

### 3.4 前端配置切换

修改 `src/config.js`，将 Mock 模式关闭并填入真实地址：

```javascript
const config = {
  // 替换为你的 n8n 地址
  START_WORKFLOW_URL: 'https://your-n8n.example.com/webhook/start-workflow',
  STATUS_QUERY_URL: 'https://your-n8n.example.com/webhook/query-status',
  USER_ACTION_URL: 'https://your-n8n.example.com/webhook/user-action',

  POLL_INTERVAL: 3000,
  POLL_TIMEOUT: 300000,

  // 关闭 Mock 模式
  MOCK_ENABLED: false,

  // ...其他配置不变
}
```

### 3.5 CORS 跨域配置

在 n8n 中需要确保 Webhook 允许跨域请求。有两种方式：

**方式 A: n8n 环境变量 (推荐)**

```bash
# 在 n8n 的 .env 或 docker-compose 中添加
N8N_EDITOR_BASE_URL=https://your-n8n.example.com
WEBHOOK_URL=https://your-n8n.example.com
```

**方式 B: 在 Nginx 反向代理中配置**

如果你的 n8n 前面有 Nginx，添加：
```nginx
location /webhook/ {
    proxy_pass http://n8n:5678;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";
    if ($request_method = OPTIONS) {
        return 204;
    }
}
```

---

## 4. Docker 部署

### 4.1 本地构建

```bash
# 构建镜像
docker build -t workflow-studio .

# 运行（Mock 模式）
docker run -d -p 3000:80 workflow-studio

# 运行（连接真实 n8n）
docker run -d -p 3000:80 \
  -e N8N_BASE_URL=https://your-n8n.example.com \
  -e MOCK_ENABLED=false \
  workflow-studio
```

### 4.2 使用 docker-compose

```bash
# 编辑 docker-compose.yml 中的环境变量，然后：
docker-compose up -d
```

### 4.3 环境变量说明

| 变量名              | 说明                                | 默认值                              |
|--------------------|-------------------------------------|--------------------------------------|
| `N8N_BASE_URL`     | n8n 服务地址（统一设置三个接口的前缀） | `https://your-n8n-domain.com`       |
| `START_WORKFLOW_URL`| 启动工作流接口（单独覆盖）            | 从 N8N_BASE_URL 推导                |
| `STATUS_QUERY_URL` | 查询状态接口（单独覆盖）              | 从 N8N_BASE_URL 推导                |
| `USER_ACTION_URL`  | 用户操作接口（单独覆盖）              | 从 N8N_BASE_URL 推导                |
| `MOCK_ENABLED`     | 是否开启 Mock 模式                   | `false`                              |
| `PORT`             | 映射到宿主机的端口（docker-compose）   | `3000`                               |

---

## 5. GitHub 发布与服务器部署

### 5.1 推送到 GitHub

```bash
# 初始化（如未初始化）
git init
git add .
git commit -m "feat: add Docker support and n8n integration guide"

# 创建 GitHub 仓库后
git remote add origin https://github.com/YOUR_USERNAME/n8n-workflow-studio.git
git push -u origin main
```

### 5.2 自动构建 Docker 镜像

项目已包含 `.github/workflows/docker-publish.yml`，推送代码到 main 分支后会自动：

1. 构建 Docker 镜像
2. 推送到 GitHub Container Registry (`ghcr.io`)
3. 打标签: `latest` + commit SHA

**首次使用需确认**:
- GitHub 仓库的 Settings → Actions → General → Workflow permissions → 选择 **Read and write permissions**

### 5.3 服务器部署

在你的服务器上执行以下操作：

#### 方式 A: 直接 docker run

```bash
# 登录 GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 拉取镜像
docker pull ghcr.io/YOUR_USERNAME/n8n-workflow-studio:latest

# 运行
docker run -d \
  --name workflow-studio \
  --restart unless-stopped \
  -p 3000:80 \
  -e N8N_BASE_URL=https://your-n8n.example.com \
  -e MOCK_ENABLED=false \
  ghcr.io/YOUR_USERNAME/n8n-workflow-studio:latest
```

#### 方式 B: docker-compose (推荐)

在服务器上创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  workflow-studio:
    image: ghcr.io/YOUR_USERNAME/n8n-workflow-studio:latest
    container_name: workflow-studio
    ports:
      - "3000:80"
    environment:
      - N8N_BASE_URL=https://your-n8n.example.com
      - MOCK_ENABLED=false
    restart: unless-stopped
```

```bash
# 登录 ghcr.io
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# 启动
docker-compose up -d

# 更新
docker-compose pull && docker-compose up -d
```

#### 方式 C: 创建一键部署脚本

在服务器上保存以下脚本 `deploy.sh`:

```bash
#!/bin/bash
set -e

GITHUB_USER="YOUR_USERNAME"
IMAGE="ghcr.io/${GITHUB_USER}/n8n-workflow-studio:latest"
N8N_URL="https://your-n8n.example.com"

echo "==> 拉取最新镜像..."
docker pull $IMAGE

echo "==> 停止旧容器..."
docker stop workflow-studio 2>/dev/null || true
docker rm workflow-studio 2>/dev/null || true

echo "==> 启动新容器..."
docker run -d \
  --name workflow-studio \
  --restart unless-stopped \
  -p 3000:80 \
  -e N8N_BASE_URL=$N8N_URL \
  -e MOCK_ENABLED=false \
  $IMAGE

echo "==> 部署完成！访问 http://$(hostname -I | awk '{print $1}'):3000"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

### 5.4 GitHub Token 创建

如果你的仓库是私有的，需要创建 Token：

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. 勾选 `read:packages` 权限
4. 复制 Token，在服务器上使用

如果仓库是 **公开** 的，Docker 镜像也会是公开的，无需 Token 即可拉取。

---

## 6. 常见问题

### Q1: 如何验证 n8n 连接是否正常？

前端右上角有连接状态指示灯（Header 组件）。也可以在浏览器控制台检查网络请求。

### Q2: 前端轮询超时怎么办？

默认超时 5 分钟。如果 AI 生成需要更长时间，修改 `config.js` 中的 `POLL_TIMEOUT` 值（单位毫秒）。

### Q3: 如何支持更多平台？

1. 在 `src/formSchema.js` 中添加新平台的表单 Schema
2. 在 `src/components/PlatformTabs.jsx` 中添加新 Tab
3. 在 n8n 中创建对应平台的 AI Prompt 和工作流分支

### Q4: 如何更新已部署的版本？

```bash
# 服务器上执行
docker pull ghcr.io/YOUR_USERNAME/n8n-workflow-studio:latest
docker-compose up -d
# 或
./deploy.sh
```

### Q5: 如何使用自定义域名？

在 Nginx/Caddy 中配置反向代理：

```nginx
server {
    listen 443 ssl;
    server_name studio.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
