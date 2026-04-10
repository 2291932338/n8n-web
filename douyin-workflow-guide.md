# 抖音视频分镜工作流搭建指南（n8n + Dify）

> 本指南面向工作流新手，从零开始搭建"输入主题 → 生成完整分镜素材包"的自动化流程。
> 最终效果：在 Web 端填写视频主题和要求，系统自动生成分镜文档 + 配图 + 配音 + 字幕，打包为可下载文件夹。

---

## 1. 总体架构

### 1.1 整体流程图

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Web 前端    │────▶│   n8n 工作流   │────▶│   Dify AI    │
│ (React 应用)  │◀────│ (流程编排引擎)  │◀────│ (分镜文档生成) │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │  AI 服务 API  │
                    │ (图片/配音等)  │
                    └─────────────┘
```

### 1.2 各组件职责

| 组件 | 职责 | 类比 |
|------|------|------|
| **Web 前端** | 用户填写主题和要求，查看进度，下载素材包 | 餐厅点菜台 |
| **n8n** | 接收请求、调度各个 AI 服务、文件管理、打包下载 | 餐厅厨师长（调度各个厨师） |
| **Dify** | 接收主题参数，生成结构化分镜文档 | 菜谱设计师（写出详细配方） |
| **图片 API** | 根据分镜描述生成配图 | 平面设计师 |
| **TTS API** | 根据旁白文本生成配音 | 配音演员 |
| **n8n Code 节点** | 根据字幕文本生成 SRT 文件 | 字幕组 |

### 1.3 数据流向

```
用户提交表单
  ↓
n8n Webhook 接收请求
  ↓
n8n 调用 Dify API → 生成结构化分镜文档（JSON）
  ↓
n8n 保存分镜文档，返回给前端审核
  ↓
用户审核：确认 or 修改意见
  ↓ (确认后)
n8n 遍历每个分镜场景 {
  → 调用图片 API 生成配图（场景01_配图.png）
  → 调用 TTS API 生成配音（场景01_配音.mp3）
  → Code 节点生成字幕（场景01_字幕.srt）
}
  ↓
n8n 打包所有文件 → 生成下载链接
  ↓
前端显示完成 + 下载按钮
```

---

## 2. 环境准备

### 2.1 服务器要求

- **最低配置**：2 核 CPU、4GB 内存、40GB 硬盘
- **推荐配置**：4 核 CPU、8GB 内存、100GB 硬盘
- **操作系统**：Ubuntu 20.04+ / CentOS 7+ / 任意支持 Docker 的系统
- **必须安装**：Docker 和 Docker Compose

#### 安装 Docker（如已安装可跳过）

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt-get install docker-compose-plugin

# 验证安装
docker --version
docker compose version
```

### 2.2 部署 n8n

创建 n8n 的 Docker Compose 文件：

```bash
# 创建工作目录
mkdir -p ~/n8n-douyin && cd ~/n8n-douyin

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://你的服务器IP:5678/
      - N8N_PAYLOAD_SIZE_MAX=100
      - NODE_FUNCTION_ALLOW_EXTERNAL=axios
      - NODE_FUNCTION_ALLOW_BUILTIN=fs,path,child_process    # 允许 Code 节点使用 fs、path、child_process 内置模块
    volumes:
      - n8n_data:/home/node/.n8n
      - ./output:/output    # 素材输出目录
      - ./temp:/temp        # 临时文件目录
      - ./tasks:/tmp/tasks  # 任务状态文件持久化目录（容器内路径取决于你的 N8N_RESTRICT_FILE_ACCESS_TO 配置）

volumes:
  n8n_data:
EOF

# 启动 n8n
docker compose up -d

# 查看日志确认启动成功
docker compose logs -f n8n
```

> **重要**：将 `你的服务器IP` 替换为你的实际服务器公网 IP 或域名。

打开浏览器访问 `http://你的服务器IP:5678`，按提示完成 n8n 初始化（设置用户名密码）。

### 2.3 部署 Dify

你可以选择 Dify Cloud（无需部署）或自行部署：

#### 方式 A：使用 Dify Cloud（推荐新手）

1. 访问 https://cloud.dify.ai 注册账号
2. 登录后即可使用，无需部署
3. 免费额度足够测试使用

#### 方式 B：Docker 自部署

```bash
# 克隆 Dify 代码
git clone https://github.com/langgenius/dify.git
cd dify/docker

# 复制环境配置
cp .env.example .env

# 启动所有服务
docker compose up -d

# 等待约 2 分钟，访问 http://你的服务器IP:80
```

### 2.4 文件存储准备

在 n8n 服务器上创建输出目录：

```bash
# 创建素材输出根目录
mkdir -p ~/n8n-douyin/output
chmod 777 ~/n8n-douyin/output

# 创建临时文件目录
mkdir -p ~/n8n-douyin/temp
chmod 777 ~/n8n-douyin/temp

# 创建任务状态文件目录（用于持久化任务状态）
mkdir -p ~/n8n-douyin/tasks
chmod 777 ~/n8n-douyin/tasks
```

> **重要**：抖音工作流使用 `/home/node/tasks/n8n_douyin_tasks.json` 文件存储任务状态（与小红书的 `/home/node/tasks/n8n_tasks.json` 分开），通过 Docker volume 挂载实现持久化。这种方式比 n8n 的 `staticData` 临时存储更可靠，支持多任务并发且重启不丢数据。
>
> **文件路径说明**：Code 节点中的 `TASKS_FILE` 路径必须在 `N8N_RESTRICT_FILE_ACCESS_TO` 允许的目录内。如果你的 Docker 配置为 `N8N_RESTRICT_FILE_ACCESS_TO=/home/node/tasks`，则路径应为 `/home/node/tasks/n8n_douyin_tasks.json`。

---

## 3. Dify 配置

### 3.1 创建知识库

知识库帮助 AI 生成更专业的分镜文档。

1. 登录 Dify，点击左侧「知识库」→「创建知识库」
2. 命名为：`视频分镜参考资料`
3. 上传参考资料（以下是建议的文档内容，你可以自己准备）：

**建议准备的参考文档：**

<details>
<summary>📄 分镜模板示例.txt（点击展开复制）</summary>

```
# 抖音视频分镜模板参考

## 分镜要素说明
每个分镜场景应包含以下要素：
1. 场景编号和标题
2. 时长（秒数）
3. 镜头类型（特写/中景/远景/俯拍/仰拍/平拍/跟拍）
4. 画面描述（具体到能生成图片的程度）
5. 旁白/对白文本（配音用）
6. 字幕文本（显示在画面上的文字）
7. 转场方式（硬切/淡入淡出/滑动/缩放）
8. BGM 建议（此处的音乐情绪）
9. 备注（特殊拍摄要求或注意事项）

## 各视频时长的分镜数量参考
- 15秒视频：3-4个分镜
- 30秒视频：4-6个分镜
- 60秒视频：6-10个分镜
- 3分钟视频：15-25个分镜
- 5分钟视频：25-40个分镜

## 镜头运用技巧
- 开头3秒用特写或悬念镜头抓住注意力
- 中间穿插远景和特写交替，保持节奏感
- 重要卖点用特写+慢动作强调
- 结尾用CTA画面+口播引导行动

## 分镜节奏参考
- 快节奏种草：每个镜头1.5-3秒
- 专业讲解：每个镜头3-5秒
- 情感故事：每个镜头3-8秒
- 沉浸式体验：每个镜头5-10秒
```
</details>

4. 上传后，Dify 会自动处理文档
5. 检索设置保持默认即可（向量检索 + Top 3）

### 3.2 创建分镜生成应用

1. 点击左侧「工作室」→「创建应用」→ 选择「聊天助手」
2. 命名为：`抖音分镜文档生成器`
3. 进入应用设置页面

#### 3.2.1 关联知识库

在「上下文」区域：
1. 点击「添加」
2. 选择刚才创建的「视频分镜参考资料」知识库
3. 保存

#### 3.2.2 系统提示词

在「提示词」区域，粘贴以下完整的系统提示词：

<details>
<summary>📋 完整系统提示词（点击展开复制）</summary>

```
你是一个专业的抖音短视频分镜脚本撰写专家。你的任务是根据用户提供的主题和要求，生成一份详细的、可直接用于视频制作的分镜文档。

## 输出格式要求

你必须严格按照以下 JSON 格式输出分镜文档，不要输出任何其他内容（不要输出 ```json 标记，直接输出纯 JSON）：

{
  "title": "视频标题",
  "topic": "视频主题",
  "totalDuration": "总时长（秒）",
  "targetAudience": "目标人群",
  "style": "整体风格",
  "scenes": [
    {
      "title": "场景标题（如：开场吸引）",
      "duration": "该场景时长（如：3秒）",
      "cameraAngle": "镜头类型（特写/中景/远景/俯拍/仰拍/平拍/跟拍/航拍）",
      "visualDescription": "画面详细描述。要足够具体，让AI绘图工具能根据此描述直接生成图片。包含：场景环境、主体动作、光线氛围、色调风格。示例：'阳光明媚的咖啡厅窗边，一杯拿铁拉花的特写，暖色调，浅景深，背景虚化可见绿植和木质桌面'",
      "narration": "旁白/对白文本。这段文字将被发送给TTS语音合成服务生成配音。注意控制字数与场景时长匹配（约每秒3-4个字）",
      "subtitle": "字幕文本。显示在画面上的文字，通常与旁白一致但可以更精简",
      "transition": "转场方式（硬切/淡入淡出/向左滑动/向右滑动/缩放/闪白）",
      "bgm": "此场景的BGM情绪建议（如：轻快明亮/紧张悬疑/温馨感动）",
      "notes": "特殊备注（如：此处需要慢动作/此处配合音效/此处文字动画入场）"
    }
  ]
}

## 分镜撰写原则

1. **开头3秒是关键**：第一个场景必须有强烈的视觉冲击或悬念，让观众停下来看
2. **旁白字数严格控制**：每秒对应3-4个中文字，不要超出。例如3秒的场景旁白不超过12个字
3. **画面描述要具体**：visualDescription 必须详细到可以直接交给AI生图，包含场景、主体、光线、色调、构图等
4. **节奏感**：长镜头和短镜头交替，避免节奏单调
5. **CTA（行动引导）**：最后一个场景或倒数第二个场景要有明确的行动引导
6. **转场多样**：不要所有场景都用硬切，穿插使用淡入淡出、滑动等转场
7. **场景数量**：根据视频总时长合理分配，15秒=3-4个，30秒=4-6个，60秒=6-10个，3分钟=15-25个

## 输入参数说明

用户会提供以下参数（部分可选）：
- 主题/产品（必填）
- 目标人群（必填）
- 视频时长（必填）
- 脚本风格（必填）
- 视频类型（口播/混剪/剧情/实拍/动画）（必填）
- 视频比例（9:16竖屏/16:9横屏/1:1方形）
- 分镜数量
- 核心卖点
- 画面风格
- 配音风格
- BGM风格
- CTA/行动引导
- 参考视频/灵感
- 补充说明

请根据这些参数生成分镜文档。确保每个场景的 visualDescription 足够详细，narration 字数与时长匹配。
```
</details>

#### 3.2.3 配置输入变量

在提示词下方，添加以下变量（点击 `+` 按钮添加）：

| 变量名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `topic` | 文本 | 是 | 主题/产品 |
| `audience` | 文本 | 是 | 目标人群 |
| `duration` | 文本 | 是 | 视频时长 |
| `style` | 文本 | 是 | 脚本风格 |
| `videoType` | 文本 | 是 | 视频类型 |
| `requirements` | 段落 | 否 | 其他要求（包含所有可选参数的汇总） |

在系统提示词末尾追加变量引用：

```
当前任务参数：
- 主题/产品：{{topic}}
- 目标人群：{{audience}}
- 视频时长：{{duration}}
- 脚本风格：{{style}}
- 视频类型：{{videoType}}
- 其他要求：{{requirements}}
```

#### 3.2.4 模型选择

- 推荐使用 **GPT-4o** 或 **Claude Sonnet** 模型
- 如成本敏感，可使用 **GPT-4o-mini** 或 **DeepSeek**
- 温度设为 **0.7**（兼顾创意和稳定性）
- 最大输出 token 设为 **4096**（分镜文档较长）

#### 3.2.5 保存并测试

1. 点击右上角「发布」
2. 在右侧测试区域输入测试参数验证输出
3. 确认输出为合法 JSON 格式

### 3.3 获取 API 密钥

1. 点击左侧「API 访问」
2. 点击「API 密钥」→「创建新密钥」
3. 复制并保存：
   - **API 密钥**（格式：`app-xxxxxxxxxxxxxxxx`）
   - **API 基础 URL**（如 `https://api.dify.ai/v1` 或你的自部署地址）

---

## 4. n8n 工作流搭建

> 以下是逐节点的详细搭建指南。每个节点都会说明：节点类型、配置方法、输入输出。

### 工作流总览

> **⚠️ 节点命名规则（非常重要）**：n8n 的 Code 节点可以通过 `$('节点名')` 引用其他节点的输出数据。这要求节点名**必须完全匹配**，包括空格和大小写。本指南中所有 `$('xxx')` 引用都假设你按以下名称命名节点：
> 
> | 节点 | 建议命名 |
> |------|----------|
> | 节点 1.2（保存任务状态） | `保存任务状态` |
> | 节点 2.3c（素材生成分支） | `素材生成分支` |
> | 节点 3.2（更新进度 + 创建输出目录） | `更新进度 + 创建输出目录` |
> 
> 如果你使用了不同的名称，请在代码中将 `$('xxx')` 改为你的实际节点名。

这个工作流需要创建 **3 个独立的工作流**（因为 n8n 中每个 Webhook 是一个入口）：

| 工作流 | 用途 | Webhook 路径 |
|--------|------|-------------|
| 工作流 1：启动 + 状态查询 | 接收任务、生成分镜、返回状态 | `/webhook/douyin-start-workflow` 和 `/webhook/douyin-query-status` |
| 工作流 2：用户操作 | 接收确认/修改意见 | `/webhook/douyin-user-action` |
| 工作流 3：素材生成 | 批量生成配图、配音、字幕 | 由工作流 2 内部触发 |
| 工作流 4：文件下载 | 返回 ZIP 素材包 | `/webhook/douyin-download` |

> **提示**：实际项目中你也可以合并为 1-2 个工作流，这里拆分是为了逻辑清晰。

---

### 工作流 1：启动 + 状态查询

#### 节点 1.1：Webhook - 接收启动请求

1. 在 n8n 中点击「+」创建新工作流，命名为 `抖音-启动与状态`
2. 添加节点：**Webhook**
3. 配置：
   - HTTP Method: `POST`
   - Path: `douyin-start-workflow`
   - Response Mode: `Respond to Webhook`（立即响应）

4. 连接下一节点前，先添加一个 **Respond to Webhook** 节点立即返回：
   ```json
   {
     "success": true,
     "taskId": "{{ $json.body.sessionId }}",
     "status": "processing",
     "message": "任务已接收，正在生成分镜文档..."
   }
   ```

#### 节点 1.2：Code 节点 - 保存任务状态

添加 **Code** 节点：

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}
// ===== 工具函数结束 =====

// 提取请求参数
const { sessionId, params, platform } = $input.first().json.body;

// 组装任务数据
const taskData = {
  taskId: sessionId,
  platform: platform || 'douyin',
  status: 'processing',
  stepName: 'douyin_storyboard_generating',
  message: '正在生成分镜文档...',
  params: params,
  createdAt: new Date().toISOString(),
};

// 保存到文件（持久化存储，多任务并发安全）
saveTask(sessionId, taskData);

return [{ json: taskData }];
```

#### 节点 1.3：HTTP Request - 调用 Dify API

添加 **HTTP Request** 节点：

- Method: `POST`
- URL: `你的Dify API地址/v1/chat-messages`（如 `https://api.dify.ai/v1/chat-messages`）
- Authentication: 选择「Header Auth」
  - Name: `Authorization`
  - Value: `Bearer app-你的API密钥`
- Body (JSON):

```json
{
  "inputs": {
    "topic": "{{ $json.params['主题/产品'] }}",
    "audience": "{{ $json.params['目标人群'] }}",
    "duration": "{{ $json.params['视频时长'] }}",
    "style": "{{ $json.params['脚本风格'] }}",
    "videoType": "{{ $json.params['视频类型'] }}",
    "requirements": "视频比例: {{ $json.params['视频比例'] || '9:16竖屏' }}\n分镜数量: {{ $json.params['分镜数量'] || '4-6个' }}\n核心卖点: {{ $json.params['核心卖点'] || '' }}\n画面风格: {{ $json.params['画面风格'] || '' }}\n配音风格: {{ $json.params['配音风格'] || '' }}\nBGM风格: {{ $json.params['BGM 风格'] || '' }}\nCTA: {{ $json.params['CTA/行动引导'] || '' }}\n参考: {{ $json.params['参考视频/灵感'] || '' }}\n补充: {{ $json.params['补充说明'] || '' }}"
  },
  "query": "请根据以上参数生成分镜文档",
  "response_mode": "blocking",
  "user": "{{ $json.taskId }}"
}
```

#### 节点 1.4：Code 节点 - 解析并保存分镜文档

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}
// ===== 工具函数结束 =====

const response = $input.first().json;
let answer = response.answer || response.data?.answer || '';

// 剥离 Dify 模型返回的 <think>...</think> 思考过程（DeepSeek 等模型会包含）
answer = answer.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();

// 尝试解析 JSON
let storyboard;
try {
  storyboard = JSON.parse(answer);
} catch {
  // 可能包含 ```json 标记，尝试提取
  const match = answer.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    storyboard = JSON.parse(match[1]);
  } else {
    // 尝试从混合文本中提取第一个 JSON 对象
    const jsonMatch = answer.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      storyboard = JSON.parse(jsonMatch[0]);
    } else {
      storyboard = { raw: answer };
    }
  }
}

// 更新任务状态（写入文件）
// ⚠️ 注意：下面 $('保存任务状态') 必须与你在 n8n 中节点 1.2 的标题完全一致
// 如果你的节点名不同（如 "Code"、"Code1" 等），请改成你的实际节点名
const taskId = $('保存任务状态').first().json.taskId;

// 提取 Dify 会话 ID（用于后续修改对话保留多轮记忆）
// Dify 在首次对话返回时会生成 conversation_id，后续带上它即可继续同一会话
const conversationId = response.conversation_id || response.data?.conversation_id || null;

// 生成文本预览
const previewText = typeof storyboard === 'object' && storyboard.scenes
  ? storyboard.scenes.map((s, i) => 
      `【场景${i+1}】${s.title || ''}\n时长: ${s.duration || ''}\n画面: ${s.visualDescription || ''}\n旁白: ${s.narration || ''}\n字幕: ${s.subtitle || ''}`
    ).join('\n\n')
  : answer;

saveTask(taskId, {
  status: 'waiting_user_feedback',
  stepName: 'waiting_user_feedback',
  message: '分镜文档已生成，请审核确认',
  storyboardDocument: storyboard,
  conversationId,                     // 新增：持久化 Dify 会话 ID
  allowRevise: true,
  allowConfirm: true,
  preview: { text: previewText },
});

return [{ json: { taskId, storyboard, conversationId } }];
```

#### 节点 1.5：Webhook - 状态查询

添加另一个 **Webhook** 节点（在同一个工作流中，n8n 支持多个 Webhook 入口）：

- HTTP Method: `GET`
- Path: `douyin-query-status`
- Response Mode: `Respond to Webhook`

连接到一个 **Code** 节点：

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const taskId = $input.first().json.query.taskId;
const task = getTask(taskId);

if (!task) {
  return [{
    json: {
      success: false,
      status: 'processing',
      message: '任务初始化中...',
    }
  }];
}

return [{
  json: {
    success: true,
    status: task.status,
    stepName: task.stepName,
    message: task.message,
    preview: task.preview || null,
    storyboardDocument: task.storyboardDocument || null,
    allowRevise: task.allowRevise || false,
    allowConfirm: task.allowConfirm || false,
    downloadUrl: task.downloadUrl || null,
    fileList: task.fileList || [],
    generationProgress: task.generationProgress || null,
  }
}];
```

然后连接 **Respond to Webhook** 节点，Response Body 设为 `{{ $json }}`。

---

### 工作流 2：用户操作处理

创建新工作流，命名为 `抖音-用户操作`。

#### 节点 2.1：Webhook - 接收用户操作

- HTTP Method: `POST`
- Path: `douyin-user-action`
- Response Mode: `Respond to Webhook`

#### 节点 2.2：Switch 节点 - 判断操作类型

添加 **Switch** 节点：
- 条件 1：`{{ $json.body.action }}` 等于 `revise` → 修改意见分支
- 条件 2：`{{ $json.body.action }}` 等于 `confirm` → 确认分支
- 条件 3：`{{ $json.body.action }}` 等于 `generate_media` → 素材生成分支

#### 节点 2.3a：修改意见分支

连接到 **Code** 节点：

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const { taskId, feedback } = $input.first().json.body;
const task = getTask(taskId);

saveTask(taskId, {
  status: 'processing',
  stepName: 'douyin_storyboard_generating',
  message: '正在根据修改意见重新生成分镜文档...',
  allowRevise: false,
  allowConfirm: false,
});

return [{ json: { taskId, feedback, params: task?.params, conversationId: task?.conversationId } }];
```

#### 节点 2.3a-2：HTTP Request - 调用 Dify API（修改意见）

添加 **HTTP Request** 节点：

- Method: `POST`
- URL: `https://api.dify.ai/v1/chat-messages`（或你的自部署地址）
- Authentication: `Header Auth`
  - Name: `Authorization`
  - Value: `Bearer 你的Dify_API_Key`
- Headers:
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- Body (JSON):
  ```json
  {
    "inputs": {
      "topic": "{{ $json.params.topic }}",
      "audience": "{{ $json.params.audience }}",
      "duration": "{{ $json.params.duration }}",
      "style": "{{ $json.params.style }}",
      "videoType": "{{ $json.params.videoType }}",
      "requirements": "{{ $json.params.requirements }}"
    },
    "query": "用户修改意见：{{ $json.feedback }}\n\n请根据以上修改意见重新生成分镜文档。",
    "response_mode": "blocking",
    "conversation_id": "{{ $json.conversationId }}",
    "user": "n8n-douyin-workflow"
  }
  ```

> **关键**：`conversation_id` 字段让 Dify 知道这是同一个会话的延续，模型可以看到之前生成的分镜内容，实现多轮对话记忆。

#### 节点 2.3a-3：Code - 解析并保存新分镜文档

添加 **Code** 节点：

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}
// ===== 工具函数结束 =====

const response = $input.first().json;
let answer = response.answer || response.data?.answer || '';
answer = answer.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();

let storyboard;
try {
  storyboard = JSON.parse(answer);
} catch {
  const match = answer.match(/```json\s*([\s\S]*?)```/);
  if (match) {
    storyboard = JSON.parse(match[1]);
  } else {
    const jsonMatch = answer.match(/\{[\s\S]*\}/);
    storyboard = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: answer };
  }
}

// ⚠️ 这里引用修改意见分支的 Code 节点（2.3a）拿 taskId
const taskId = $('Code').first().json.taskId;  // 改成你节点 2.3a 的实际标题

// 保留原有的 conversation_id（不会变）
const conversationId = response.conversation_id || $('Code').first().json.conversationId;

const previewText = typeof storyboard === 'object' && storyboard.scenes
  ? storyboard.scenes.map((s, i) =>
      `【场景${i+1}】${s.title || ''}\n时长: ${s.duration || ''}\n画面: ${s.visualDescription || ''}\n旁白: ${s.narration || ''}\n字幕: ${s.subtitle || ''}`
    ).join('\n\n')
  : answer;

saveTask(taskId, {
  status: 'waiting_user_feedback',
  stepName: 'waiting_user_feedback',
  message: '分镜文档已重新生成，请审核确认',
  storyboardDocument: storyboard,
  conversationId,                     // 保留会话 ID
  allowRevise: true,
  allowConfirm: true,
  preview: { text: previewText },
});

return [{ json: { taskId, storyboard, conversationId } }];
```

> **注意**：
> 1. `$('Code').first().json.taskId` 中的 `'Code'` 必须替换为你在 n8n 中节点 2.3a 的实际标题（如 "修改意见处理"）。
> 2. 此节点后**不需要**再接 Respond to Webhook，因为在 Switch 之前已经立即响应过了。前端通过轮询状态接口获取更新后的分镜文档。

#### 节点 2.3b：确认分支

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}
// ===== 工具函数结束 =====

const { taskId } = $input.first().json.body;

saveTask(taskId, {
  status: 'processing',
  message: '分镜已确认',
});

return [{ json: { success: true, message: '分镜已确认' } }];
```

#### 节点 2.3c：素材生成分支

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const { taskId } = $input.first().json.body;
const task = getTask(taskId);

saveTask(taskId, {
  status: 'processing',
  stepName: 'douyin_media_generating',
  message: '正在批量生成素材...',
});

// 传递分镜数据给下一步
// ⚠️ 关键：将 scenes 数组展开为多个独立 item，每个 item 携带自己的 sceneIndex
// 这样 Loop Over Items 节点可以逐个处理，无需 Split Out 节点，也不依赖 $itemIndex
const storyboard = task?.storyboardDocument;
const scenes = storyboard?.scenes || [];

return scenes.map((scene, index) => ({
  json: {
    taskId,
    scene,                        // 单个场景对象
    sceneIndex: index + 1,        // 从1开始的场景编号
    totalScenes: scenes.length,   // 总场景数
    params: task?.params,
  }
}));
```

连接到 **Respond to Webhook** 立即返回，然后继续素材生成流程。

---

### 工作流 3：素材批量生成

> 此部分作为工作流 2 的延续（素材生成分支的后续节点）。

#### 节点 3.1：Loop Over Items - 遍历分镜场景

添加 **Loop Over Items** 节点（或使用 SplitInBatches）：
- Batch Size: `1`（每次处理 1 个场景）
- Input: 上一步（节点 2.3c）已经将 scenes 数组展开为多个独立 item，每个 item 包含 `scene`、`sceneIndex`、`totalScenes` 等字段

> **⚠️ 不需要 Split Out 节点**：节点 2.3c 的 `return scenes.map(...)` 已经将数组展开为多个独立 item（每个 item 一个场景），Loop Over Items 会自动逐个处理。如果添加 Split Out 节点反而会丢失 `sceneIndex` 等字段。

对于每个场景，依次执行以下节点：

#### 节点 3.2：更新进度 + 创建输出目录

**Code** 节点：
```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const path = require('path');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

// 直接从当前 item 读取数据（节点 2.3c 已将每个场景展开为独立 item 并写入了 sceneIndex）
const { taskId, scene, sceneIndex, totalScenes } = $input.first().json;

// 构建输出文件夹路径（首次循环时创建目录 + 写入分镜文档）
const task = getTask(taskId);
const dateStr = task?.createdAt
  ? new Date(task.createdAt).toISOString().slice(0, 10).replace(/-/g, '')
  : new Date().toISOString().slice(0, 10).replace(/-/g, '');
const topic = task?.params?.['主题/产品'] || '未命名';
const folderName = `${dateStr}_${topic}`;
const outputDir = `/home/node/tasks/output/${folderName}`;

// 创建输出目录（如果不存在）
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });

  // 将分镜文档写入文件夹
  if (task?.storyboardDocument) {
    fs.writeFileSync(
      path.join(outputDir, '分镜文档.json'),
      JSON.stringify(task.storyboardDocument, null, 2),
      'utf8'
    );

    // 同时生成可读版文本
    const scenes = task.storyboardDocument.scenes || [];
    const readableText = scenes.map((s, i) =>
      `【场景${i+1}】${s.title || ''}\n时长: ${s.duration || ''}\n镜头: ${s.cameraAngle || ''}\n画面: ${s.visualDescription || ''}\n旁白: ${s.narration || ''}\n字幕: ${s.subtitle || ''}\n转场: ${s.transition || ''}\nBGM: ${s.bgm || ''}\n备注: ${s.notes || ''}`
    ).join('\n\n---\n\n');
    fs.writeFileSync(
      path.join(outputDir, '分镜文档_可读版.txt'),
      readableText,
      'utf8'
    );
  }
}

saveTask(taskId, {
  generationProgress: {
    current: sceneIndex - 1,
    total: totalScenes,
    currentStep: `正在生成第${sceneIndex}个分镜的素材...`,
  },
});

return [{ json: { taskId, scene, sceneIndex, totalScenes, outputDir } }];
```

#### 节点 3.3：生成配图

##### 3.3a：HTTP Request - 调用图片生成 API

> **这里需要你自己选择和配置图片生成服务。以下是以 DALL-E 3 为例的完整模板（含抖音配图专家提示词）：**

```
Method: POST
URL: https://api.openai.com/v1/images/generations
Headers: Authorization: Bearer 你的OpenAI API密钥
Body (JSON):
```

```json
{
  "model": "dall-e-3",
  "prompt": "你是一位顶级的抖音短视频分镜配图生成专家，拥有丰富的商业摄影、广告视觉设计和社交媒体内容创作经验。你的任务是根据分镜场景描述，生成一张能在抖音平台获得高停留率的配图。\n\n核心原则：\n1. 竖屏优先：严格9:16竖屏构图，所有视觉元素为手机全屏观看优化\n2. 3秒法则：画面必须在3秒内传达核心信息，第一眼就能抓住注意力\n3. 零文字：画面中绝对不出现任何文字、字母、数字、水印、Logo、标题、字幕、标签\n\n构图规范：\n- 主体占比：画面主体占据55%-70%面积，避免过满或过空\n- 安全区域：视觉重心偏上1/3处（抖音底部20%区域被评论栏和交互按钮遮挡）\n- 右侧留白：画面右侧8%区域避免放置关键元素（被点赞评论分享按钮遮挡）\n- 构图选择：根据场景自动选择最佳构图法——三分法（常规）、中心对称（产品特写）、对角线（动态场景）、框架构图（环境氛围）\n\n视觉质感：\n- 分辨率感：呈现4K级别的清晰度和细节\n- 光影：优先自然光，侧光或逆光营造层次感，避免正面平光和过度HDR\n- 景深：特写镜头使用f/1.4-2.8浅景深效果，远景保持全景深清晰\n- 色彩：饱和度适中偏高（+10%-15%），对比度略强，符合移动端屏幕显示特性\n- 质感：根据场景匹配——产品类追求商业摄影质感，生活类追求自然真实感，科技类追求未来感\n\n镜头语言适配（根据场景描述中的镜头类型自动调整）：\n- 特写：浅景深，细节纹理清晰可见，光影精致\n- 中景：主体与环境平衡，交代人物动作和空间关系\n- 远景/全景：环境氛围为主，主体作为画面锚点存在\n- 俯拍：鸟瞰视角，几何构图，适合展示布局和排列\n- 仰拍：低角度，营造力量感和仪式感\n- 跟拍：动态模糊暗示运动方向，主体保持清晰\n\n风格适配（根据场景的情绪和用途自动匹配视觉风格）：\n- 种草/测评：明亮干净的商业摄影风格，高饱和，白色或浅色背景\n- 教程/讲解：简洁专业，信息层次分明，柔和的中性色调\n- 情感/故事：电影感色调，胶片质感，情绪化光影\n- 美食：暖色调，微距质感，食物表面光泽和蒸汽细节\n- 科技/数码：冷色调偏蓝紫，金属质感，未来科技氛围\n- 生活/Vlog：自然随性，日系或韩系清新色调，生活气息\n- 运动/户外：高对比度，动态张力，鲜艳活力色彩\n\n人物处理（如涉及）：\n- 五官比例严格正确自然，避免任何变形\n- 肤色自然健康，避免过度美白或偏色\n- 表情与场景情绪一致\n- 服装和造型符合场景设定和目标人群审美\n\n禁止事项：\n- 禁止出现任何文字、字母、数字、符号\n- 禁止出现水印、Logo、品牌标识\n- 禁止出现UI元素、按钮、边框\n- 禁止出现拼贴、分屏、多图组合\n- 禁止出现不自然的AI伪影（多余手指、扭曲边缘、融合错误）\n- 禁止出现敏感、暴力、色情内容\n\n场景描述：\n{{ $json.scene.visualDescription }}",
  "size": "1024x1792",
  "quality": "hd",
  "n": 1
}
```

> **提示**：以上 Body JSON 可直接复制到 n8n HTTP Request 节点中使用。如果你用的不是 DALL-E 而是其他图片 API（通义万相、智谱 CogView 等），只需要把 `prompt` 字段的值复制过去，外层 JSON 结构按你的 API 要求调整。

**常见图片 API 选项：**

| 服务 | 优点 | API 文档 |
|------|------|----------|
| OpenAI DALL-E 3 | 质量高，接入简单 | https://platform.openai.com/docs/guides/images |
| Stability AI (SD) | 性价比高，可控性强 | https://platform.stability.ai/docs |
| Midjourney API | 效果最好 | 需要第三方代理 |
| 通义万相 | 国内访问快 | https://help.aliyun.com/document_detail/2712195.html |
| 智谱 CogView | 中文理解好 | https://open.bigmodel.cn/ |

##### 3.3b：HTTP Request - 下载图片文件

大多数图片 API 返回的是图片 URL，需要再发一次请求下载图片的二进制数据：

```
Method: GET
URL: {{ $json.data[0].url }}    ← 根据你的图片 API 实际返回字段调整
Response Format: File（选择 "File" 而非 "JSON"，这样 n8n 会把响应作为二进制数据处理）
```

> **提示**：如果你的图片 API 直接返回二进制图片（而非 URL），可以跳过这一步，直接用上一步的输出。

##### 3.3c：Write Binary File - 保存图片到磁盘

添加 **Write Binary File** 节点：

- File Name: `{{ $('更新进度 + 创建输出目录').first().json.outputDir }}/场景{{ String($('更新进度 + 创建输出目录').first().json.sceneIndex).padStart(2, '0') }}_配图.png`
- Property Name: `data`（默认值，即上一步 HTTP Request 下载的二进制数据）

> **节点名说明**：`$('更新进度 + 创建输出目录')` 必须与你在 n8n 中节点 3.2 的实际标题完全一致。

##### 3.3d：Code - 记录图片信息

```javascript
const sceneIndex = $('更新进度 + 创建输出目录').first().json.sceneIndex;
const taskId = $('更新进度 + 创建输出目录').first().json.taskId;
const outputDir = $('更新进度 + 创建输出目录').first().json.outputDir;
const fileName = `场景${String(sceneIndex).padStart(2, '0')}_配图.png`;

return [{
  json: {
    taskId,
    sceneIndex,
    fileName,
    filePath: `${outputDir}/${fileName}`,
    type: 'image',
  }
}];
```

#### 节点 3.4：生成配音（火山引擎 TTS）

> 火山引擎 TTS 返回的是流式 chunked JSON，音频数据以 base64 编码在 `data` 字段中返回，需要用 Code 节点处理。
> 一个 Code 节点即可完成：调用 API → 解析 chunked 响应 → 拼接 base64 → 写入 mp3 文件。

**Code** 节点：

```javascript
const axios = require('axios');
const fs = require('fs');

// ===== 配置区域（改成你自己的值）=====
const APP_ID = '你的AppId';           // 火山控制台 → 语音技术 → 应用管理
const ACCESS_KEY = '你的AccessKey';    // 同上页面的 Access Token
const RESOURCE_ID = 'seed-tts-1.0';   // 1.0 填 seed-tts-1.0，2.0 填 seed-tts-2.0
const SPEAKER = 'zh_female_shuangkuaisisi_moon_bigtts';  // 从火山音色列表选择
// ===== 配置结束 =====

const scene = $('更新进度 + 创建输出目录').first().json.scene;
const sceneIndex = $('更新进度 + 创建输出目录').first().json.sceneIndex;
const taskId = $('更新进度 + 创建输出目录').first().json.taskId;
const outputDir = $('更新进度 + 创建输出目录').first().json.outputDir;
const narration = scene.narration || scene.subtitle || '';

if (!narration) {
  return [{ json: { taskId, sceneIndex, fileName: null, type: 'audio', skipped: true } }];
}

// 调用火山 TTS API（HTTP Chunked 模式）
const response = await axios({
  method: 'POST',
  url: 'https://openspeech.bytedance.com/api/v3/tts/unidirectional',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-App-Id': APP_ID,
    'X-Api-Access-Key': ACCESS_KEY,
    'X-Api-Resource-Id': RESOURCE_ID,
  },
  data: {
    user: { uid: taskId },
    req_params: {
      text: narration,
      speaker: SPEAKER,
      audio_params: {
        format: 'mp3',
        sample_rate: 24000,
      },
    },
  },
  responseType: 'text',
});

// 解析 chunked 响应，提取所有 base64 音频片段
const rawText = typeof response.data === 'string'
  ? response.data
  : JSON.stringify(response.data);
const audioChunks = [];

const jsonPattern = /\{[^{}]*"code"\s*:\s*\d+[^{}]*\}/g;
let match;
while ((match = jsonPattern.exec(rawText)) !== null) {
  try {
    const chunk = JSON.parse(match[0]);
    if (chunk.code === 0 && chunk.data) {
      audioChunks.push(chunk.data);
    }
  } catch (e) {
    // 跳过解析失败的片段
  }
}

if (audioChunks.length === 0) {
  throw new Error('TTS 未返回音频数据，原始响应: ' + rawText.substring(0, 500));
}

// 拼接 base64 → 解码 → 写入 mp3 文件
const audioBuffer = Buffer.from(audioChunks.join(''), 'base64');
const fileName = `场景${String(sceneIndex).padStart(2, '0')}_配音.mp3`;
const filePath = `${outputDir}/${fileName}`;
fs.writeFileSync(filePath, audioBuffer);

return [{
  json: {
    taskId,
    sceneIndex,
    fileName,
    filePath,
    type: 'audio',
    audioSize: audioBuffer.length,
  }
}];
```

> **配置说明**：
> - `APP_ID` 和 `ACCESS_KEY`：在火山引擎控制台 → 语音技术 → 应用管理中获取
> - `RESOURCE_ID`：根据你开通的模型版本填写（`seed-tts-1.0` 或 `seed-tts-2.0`）
> - `SPEAKER`：从[火山音色列表](https://www.volcengine.com/docs/6561/97465)中选择，推荐用于抖音内容的音色
> - 需要在 docker-compose 环境变量中确保 `NODE_FUNCTION_ALLOW_EXTERNAL=axios`

#### 节点 3.5：生成字幕文件

**Code** 节点 - 生成 SRT 格式字幕并写入磁盘：

```javascript
const fs = require('fs');
const path = require('path');

const scene = $('更新进度 + 创建输出目录').first().json.scene;
const sceneIndex = $('更新进度 + 创建输出目录').first().json.sceneIndex;
const taskId = $('更新进度 + 创建输出目录').first().json.taskId;
const outputDir = $('更新进度 + 创建输出目录').first().json.outputDir;
const subtitleText = scene.subtitle || scene.narration || '';

if (!subtitleText) {
  return [{ json: { taskId, sceneIndex, fileName: null, type: 'subtitle', skipped: true } }];
}

// 解析时长（如 "3秒" → 3）
const durationMatch = (scene.duration || '').match(/(\d+)/);
const duration = durationMatch ? parseInt(durationMatch[1]) : 5;

// 生成 SRT 内容
const startTime = '00:00:00,000';
const endSec = duration;
const endTime = `00:00:${String(endSec).padStart(2, '0')},000`;
const srtContent = `1\n${startTime} --> ${endTime}\n${subtitleText}\n`;

const fileName = `场景${String(sceneIndex).padStart(2, '0')}_字幕.srt`;
const filePath = path.join(outputDir, fileName);

// 写入磁盘
fs.writeFileSync(filePath, srtContent, 'utf8');

return [{
  json: {
    taskId,
    sceneIndex,
    fileName,
    filePath,
    type: 'subtitle',
  }
}];
```

#### 节点 3.6：合并字幕 + ZIP 打包 + 更新状态

在循环结束后，汇总所有文件、生成合并字幕、打包 ZIP：

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

// 汇总所有文件记录
const files = $input.all().map(item => item.json);
const taskId = files[0]?.taskId;
const task = getTask(taskId);

if (!task) {
  return [{ json: { success: false, error: '任务不存在' } }];
}

// 计算输出目录路径
const dateStr = new Date(task.createdAt).toISOString().slice(0, 10).replace(/-/g, '');
const topic = task.params?.['主题/产品'] || '未命名';
const folderName = `${dateStr}_${topic}`;
const outputDir = `/home/node/tasks/output/${folderName}`;

// ===== 1. 生成合并字幕文件 =====
const storyboard = task.storyboardDocument;
if (storyboard?.scenes) {
  let srtIndex = 1;
  let currentTime = 0;  // 累计时间（秒）
  const srtParts = [];

  for (const scene of storyboard.scenes) {
    const text = scene.subtitle || scene.narration || '';
    if (!text) continue;

    const durationMatch = (scene.duration || '').match(/(\d+)/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 5;

    const startH = Math.floor(currentTime / 3600);
    const startM = Math.floor((currentTime % 3600) / 60);
    const startS = currentTime % 60;
    const endTime = currentTime + duration;
    const endH = Math.floor(endTime / 3600);
    const endM = Math.floor((endTime % 3600) / 60);
    const endS = endTime % 60;

    const fmt = (h, m, s) =>
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},000`;

    srtParts.push(`${srtIndex}\n${fmt(startH,startM,startS)} --> ${fmt(endH,endM,endS)}\n${text}\n`);
    srtIndex++;
    currentTime = endTime;
  }

  if (srtParts.length > 0) {
    fs.writeFileSync(
      path.join(outputDir, '完整字幕.srt'),
      srtParts.join('\n'),
      'utf8'
    );
  }
}

// ===== 2. ZIP 打包 =====
const zipPath = `/home/node/tasks/output/${folderName}.tar.gz`;

// 删除旧的 zip（如果存在）
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// 使用 tar 命令打包整个文件夹（n8n Docker 镜像自带 tar，无需额外安装）
execSync(`cd /home/node/tasks/output && tar -czf "${folderName}.tar.gz" "${folderName}/"`);

// 获取打包文件大小
const zipStats = fs.statSync(zipPath);
const zipSize = zipStats.size;

// ===== 3. 构建文件列表 =====
const diskFiles = fs.readdirSync(outputDir);
const allFiles = diskFiles.map(name => ({
  name,
  type: name.endsWith('.json') || name.endsWith('.txt') ? 'document'
    : name.endsWith('.png') || name.endsWith('.jpg') ? 'image'
    : name.endsWith('.mp3') || name.endsWith('.wav') ? 'audio'
    : name.endsWith('.srt') ? 'subtitle'
    : 'document',
}));

// ===== 4. 更新任务状态为完成 =====
// downloadUrl 指向下载接口（见工作流 4），前端用这个 URL 下载 ZIP
saveTask(taskId, {
  status: 'completed',
  stepName: 'douyin_batch_completed',
  message: '所有素材已生成完成！',
  fileList: allFiles,
  downloadUrl: `http://你的n8n地址:5678/webhook/douyin-download?taskId=${taskId}`,
  zipPath,
  zipSize,
  outputDir,
  generationProgress: null,
});

return [{ json: { success: true, fileCount: allFiles.length, zipSize } }];
```

> **注意**：
> 1. `zip` 命令在 n8n 官方 Docker 镜像中已预装。如果你使用自定义镜像，需确保安装了 `zip`（`apt-get install zip`）。
> 2. `execSync` 需要在 Docker 环境变量中配置 `NODE_FUNCTION_ALLOW_EXTERNAL=child_process,fs,path`，或者在 n8n 的 Code 节点设置中启用 `require`。
> 3. 如果 `zip` 命令不可用，可以改用 n8n 内置的 **Compression** 节点（如果你的 n8n 版本支持），或者用 `archiver` npm 包。

---

### 工作流 4：ZIP 文件下载

> 前端通过状态接口拿到 `downloadUrl`（格式为 `http://你的n8n地址:5678/webhook/douyin-download?taskId=xxx`），浏览器直接访问该地址即可下载文件。

在工作流 1（`抖音-启动与状态`）中新增一个 Webhook 入口，或者创建独立工作流均可。

#### 节点 4.1：Webhook - 下载入口

添加 **Webhook** 节点：

- HTTP Method: `GET`
- Path: `douyin-download`
- Response Mode: `Respond to Webhook`

#### 节点 4.2：Code - 查找文件路径

```javascript
const fs = require('fs');
const TASKS_FILE = '/home/node/tasks/n8n_douyin_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

const taskId = $input.first().json.query.taskId;
const tasks = readTasks();
const task = tasks[taskId];

if (!task || !task.zipPath) {
  return [{ json: { error: true, message: '文件不存在或任务未完成' } }];
}

if (!fs.existsSync(task.zipPath)) {
  return [{ json: { error: true, message: '打包文件未找到，可能已被清理' } }];
}

return [{ json: { zipPath: task.zipPath, error: false } }];
```

#### 节点 4.3：Read Binary File - 读取打包文件

添加 **Read Binary File** 节点（n8n 内置节点，在节点列表搜索 "Read Binary File"）：

- File Name: `{{ $json.zipPath }}`
- Property Name: `data`

> **说明**：这个节点会把磁盘上的文件读取为 n8n 的 binary 数据格式，后续 Respond to Webhook 节点可以直接以二进制方式返回。

#### 节点 4.4：Respond to Webhook - 返回文件

添加 **Respond to Webhook** 节点：

- Respond With: `Binary`（选择「Binary」而非「JSON」）
- Property Name: `data`

> **这样配置后**，浏览器访问 `http://你的n8n地址:5678/webhook/douyin-download?taskId=xxx` 会直接弹出文件下载对话框，下载的就是打包好的 tar.gz 文件。

> **替代方案**：如果你不想通过 Webhook 返回二进制文件（大文件可能超时），也可以：
> 1. 用 Nginx 直接代理 `/home/node/tasks/output/` 目录作为静态文件服务
> 2. 把 `downloadUrl` 设为 `http://你的服务器IP/output/xxx.tar.gz`
> 3. Nginx 配置示例：
>    ```nginx
>    location /output/ {
>        alias /path/to/n8n-data/tasks/output/;
>        autoindex off;
>    }
>    ```

---

## 5. Web 端配置

### 5.1 修改 config.js

编辑 `src/config.js`，将 Douyin 的 Webhook 地址改为你的 n8n 地址：

```javascript
DOUYIN: {
  START_WORKFLOW_URL: 'http://你的n8n地址:5678/webhook/douyin-start-workflow',
  STATUS_QUERY_URL: 'http://你的n8n地址:5678/webhook/douyin-query-status',
  USER_ACTION_URL: 'http://你的n8n地址:5678/webhook/douyin-user-action',
  // 以下为逐帧审核模式使用，批量模式不需要
  FRAME_ACTION_URL: 'http://你的n8n地址:5678/webhook/douyin-frame-action',
  GENERATE_VIDEO_URL: 'http://你的n8n地址:5678/webhook/douyin-generate-video',
  REGENERATE_VIDEO_URL: 'http://你的n8n地址:5678/webhook/douyin-regenerate-video',
},
```

### 5.2 构建和部署

```bash
# 构建生产版本
npm run build

# 部署到服务器（使用 Docker）
docker run -d \
  --name workflow-studio \
  --restart unless-stopped \
  -p 8901:80 \
  -e START_WORKFLOW_URL=http://你的n8n地址:5678/webhook/douyin-start-workflow \
  -e STATUS_QUERY_URL=http://你的n8n地址:5678/webhook/douyin-query-status \
  -e USER_ACTION_URL=http://你的n8n地址:5678/webhook/douyin-user-action \
  你的Docker镜像名
```

---

## 6. 测试与排查

### 6.1 端到端测试步骤

1. **测试 Dify**：
   - 在 Dify 应用测试页面输入参数
   - 确认输出为合法 JSON 格式的分镜文档
   - 确认场景数量合理、旁白字数与时长匹配

2. **测试 n8n 启动接口**：
   ```bash
   curl -X POST http://你的n8n地址:5678/webhook/douyin-start-workflow \
     -H "Content-Type: application/json" \
     -d '{
       "sessionId": "test-001",
       "platform": "douyin",
       "params": {
         "主题/产品": "智能手表测评",
         "目标人群": "25-35岁科技爱好者",
         "视频时长": "60秒",
         "脚本风格": "专业讲解",
         "视频类型": "口播",
         "工作流模式": "批量生成素材包"
       }
     }'
   ```

3. **测试状态查询**：
   ```bash
   curl "http://你的n8n地址:5678/webhook/douyin-query-status?taskId=test-001"
   ```

4. **测试 Web 端**：
   - 打开 Web 端，切换到「抖音」标签页
   - 选择「批量生成素材包」模式
   - 填写表单并提交
   - 观察状态变化
   - 审核分镜文档
   - 等待素材生成完成
   - 下载素材包

### 6.2 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Webhook 无响应 | n8n 工作流未激活 | 点击工作流右上角的开关激活 |
| Dify 返回错误 | API 密钥无效 | 检查 Authorization header |
| 分镜文档解析失败 | Dify 输出格式不对 | 检查系统提示词，确保要求输出纯 JSON |
| 状态一直是 processing | 任务文件读写异常 | 检查 `/home/node/tasks/n8n_douyin_tasks.json` 是否可读写，确认 Docker volume 挂载正确 |
| Referenced node doesn't exist | Code 中 `$('节点名')` 与实际节点名不匹配 | 检查 n8n 画布上的节点标题，确保与代码中的 `$('xxx')` 完全一致 |
| EACCES / ENOENT 文件错误 | 文件路径不在 `N8N_RESTRICT_FILE_ACCESS_TO` 范围内 | 确认 `TASKS_FILE` 路径与 Docker 环境变量一致（如 `/home/node/tasks/`） |
| 图片生成失败 | API 额度用尽 | 检查图片 API 的用量和余额 |
| 下载链接 404 | 文件路径配置错误 | 检查 output 目录挂载和文件路径 |
| 跨域错误 (CORS) | n8n 未配置跨域 | 在 n8n 的 Webhook 节点中启用 CORS |

### 6.3 查看 n8n 执行日志

1. 打开 n8n 管理界面
2. 点击左侧「Executions」查看执行历史
3. 点击任一执行记录查看每个节点的输入/输出
4. 失败的节点会显示红色，点击查看错误详情

---

## 7. 附录

### 7.1 分镜文档输出格式示例

```json
{
  "title": "智能手表：你的运动新搭档",
  "topic": "智能手表测评",
  "totalDuration": "60秒",
  "targetAudience": "25-35岁科技爱好者",
  "style": "专业讲解",
  "scenes": [
    {
      "title": "开场吸引",
      "duration": "3秒",
      "cameraAngle": "特写",
      "visualDescription": "一只手腕上佩戴着银色智能手表的特写镜头，手表屏幕显示心率数据，背景是健身房的模糊灯光，暖色调，浅景深",
      "narration": "这块表，改变了我的运动方式",
      "subtitle": "这块表，改变了我的运动方式",
      "transition": "闪白",
      "bgm": "紧张悬疑转明亮",
      "notes": "配合手表亮屏动画"
    },
    {
      "title": "产品展示",
      "duration": "5秒",
      "cameraAngle": "中景",
      "visualDescription": "木质桌面上的智能手表全景展示，旁边放着充电器和表带配件，柔和的自然光从左侧照入，白色背景，产品摄影风格",
      "narration": "今天来聊聊这款某某品牌的最新智能手表",
      "subtitle": "某某品牌 最新智能手表",
      "transition": "淡入淡出",
      "bgm": "轻快明亮",
      "notes": "可加产品名称文字标注"
    }
  ]
}
```

### 7.2 文件夹结构示例

```
20260405_智能手表测评/
├── 分镜文档.json              # 完整分镜文档
├── 分镜文档_可读版.txt         # 纯文本版本（方便阅读）
├── 场景01_配图.png            # 第1个场景的配图
├── 场景01_配音.mp3            # 第1个场景的配音
├── 场景01_字幕.srt            # 第1个场景的字幕
├── 场景02_配图.png
├── 场景02_配音.mp3
├── 场景02_字幕.srt
├── 场景03_配图.png
├── 场景03_配音.mp3
├── 场景03_字幕.srt
├── ...
├── 场景08_配图.png
├── 场景08_配音.mp3
├── 场景08_字幕.srt
└── 完整字幕.srt               # 所有场景字幕合并版
```

### 7.3 文件命名规则

| 文件类型 | 命名格式 | 示例 |
|----------|----------|------|
| 配图 | `场景{序号}_配图.png` | `场景01_配图.png` |
| 配音 | `场景{序号}_配音.mp3` | `场景01_配音.mp3` |
| 字幕 | `场景{序号}_字幕.srt` | `场景01_字幕.srt` |
| 视频片段 | `场景{序号}_视频.mp4` | `场景01_视频.mp4`（如有） |
| 分镜文档 | `分镜文档.json` | - |
| 合并字幕 | `完整字幕.srt` | - |
| 文件夹 | `{YYYYMMDD}_{主题}` | `20260405_智能手表测评` |

> 序号使用两位数字（01-99），按分镜顺序编号。

### 7.4 后续扩展建议

- **视频片段生成**：可对接视频生成 API（如 Runway、Pika、可灵等）为每个场景生成短视频片段
- **BGM 匹配**：可对接音乐 API 根据分镜中的 BGM 建议自动匹配背景音乐
- **自动剪辑**：可使用 FFmpeg 在 n8n 中自动将素材合成为初版视频
- **多语言支持**：修改 Dify 提示词即可支持英文、日文等多语言分镜
