# n8n 工作流对接指南（v2 — JSON 文件存储方案）

> **重要变更**：本版本将任务状态存储从 `$getWorkflowStaticData` 改为 **JSON 文件**。
> 原方案在多任务并发时，n8n 内存快照会互相覆盖导致任务丢失。
> JSON 文件方案每次读写都是最新数据，彻底解决并发问题。

---

## 为什么要改？

`$getWorkflowStaticData` 的致命缺陷：

```
任务A启动 → 读内存 {} → 写 {A: processing}
任务B启动 → 读内存 {A} → 写 {A, B: processing}
任务A完成(30秒后) → 用自己的旧快照覆盖 → DB只剩 {A: done}
                                                ↑ B 的记录被抹掉！
```

JSON 文件方案：

```
任务A启动 → 读文件 {} → 写文件 {A: processing}
任务B启动 → 读文件 {A} → 写文件 {A, B: processing}
任务A完成 → 读文件 {A, B} → 写文件 {A: done, B: processing}  ← B 安全！
```

---

## 前置准备

在 n8n 服务器上确保 `/tmp/` 目录可写（Linux/Docker 默认可写）。

如果是 Docker 部署且需要数据持久化（重启后保留），建议挂载卷：
```bash
docker run -v n8n_tasks:/tmp/n8n_tasks ...
```
或使用其他持久化路径如 `/data/n8n_tasks.json`。

---

## 通用工具函数

以下代码块需要粘贴到**每一个**需要读写任务状态的 Code 节点**最顶部**：

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}
// ===== 工具函数结束 =====
```

> **提示**：每个 Code 节点的代码都是 `工具函数 + 业务逻辑`，工具函数完全相同，只是业务逻辑不同。

---

## 阶段一：状态查询接口

### 「读取状态」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

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
  return {
    json: {
      success: true,
      status: 'processing',
      message: '任务正在初始化，请稍候...',
      taskId: taskId
    }
  };
}

return {
  json: {
    success: true,
    taskId: taskId,
    status: task.status || 'processing',
    stepName: task.stepName || '',
    message: task.message || '',
    preview: task.preview || null,
    previewHistory: task.previewHistory || [],
    allowRevise: task.allowRevise || false,
    allowConfirm: task.allowConfirm || false,
    xhsImages: task.xhsImages || [],
    currentImageIndex: task.currentImageIndex || 0,
    history: task.history || []
  }
};
```

---

## 阶段二：启动流程

### 「Code in JavaScript」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

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

const body = $input.first().json.body;
const taskId = body.sessionId || ('task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8));

saveTask(taskId, {
  status: 'processing',
  stepName: '',
  message: '工作流已启动，正在生成内容...',
  preview: null,
  previewHistory: [],
  allowRevise: false,
  allowConfirm: false,
  xhsImages: [],
  currentImageIndex: 0,
  history: [],
  createdAt: Date.now()
});

return {
  json: {
    success: true,
    taskId: taskId,
    status: 'processing',
    message: '工作流已启动，正在生成内容...'
  }
};
```

### 「Code in JavaScript2」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

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

const aiResult = $input.first().json.output || $input.first().json;
const text = typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult);
const taskId = $('Code in JavaScript').item.json.taskId;

saveTask(taskId, {
  status: 'waiting_user_feedback',
  stepName: 'draft',
  message: '初稿已生成，请预览并确认或提出修改意见',
  preview: { text: text, images: [], videos: [] },
  previewHistory: [
    { version: 1, label: '初稿', text: text, timestamp: Date.now() }
  ],
  allowRevise: true,
  allowConfirm: true,
  history: [
    { role: 'system', type: 'status', content: '✅ AI 已生成初稿', timestamp: Date.now() }
  ]
});

return { json: { taskId: taskId, status: 'done' } };
```

---

## 阶段三：用户操作流程（修改/确认）

### 「codes」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

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

const body = $input.first().json.body;
const action = body.action;
const feedback = body.feedback;
const previousText = body.previousText;
const taskId = body.taskId;

let prompt = '';

if (action === 'revise') {
  if (previousText) {
    prompt = '以下是你之前生成的初稿：\n\n' + previousText + '\n\n用户提出了修改意见：' +
      feedback + '\n\n请根据修改意见重新生成完整文案，保持原有格式和结构。';
  } else {
    prompt = '用户对你上一版的文案提出了新的修改意见：' + feedback +
      '\n\n请根据修改意见重新生成完整文案。';
  }
  saveTask(taskId, {
    status: 'processing',
    stepName: '',
    message: '修改意见已接收，重新生成中...',
    allowRevise: false,
    allowConfirm: false
  });
} else if (action === 'confirm') {
  prompt = '用户已确认当前文案，请直接原样输出最终完整版文案，不做任何修改。';
  saveTask(taskId, {
    status: 'processing',
    stepName: '',
    message: '确认成功，正在生成配图...',
    allowRevise: false,
    allowConfirm: false
  });
} else if (action === 'generate_images') {
  saveTask(taskId, {
    status: 'processing',
    stepName: '',
    message: '正在生成第 1 张图片...',
    allowRevise: false,
    allowConfirm: false
  });
}

return {
  json: {
    prompt: prompt,
    action: action,
    taskId: taskId,
    previousText: previousText || '',
    feedback: feedback || ''
  }
};
```

### 「Code in JavaScript3」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}

function saveTask(taskId, data) {
  const tasks = readTasks();
  tasks[taskId] = { ...(tasks[taskId] || {}), ...data };
  writeTasks(tasks);
}
// ===== 工具函数结束 =====

const aiText = $input.first().json.output || $input.first().json.text ||
  JSON.stringify($input.first().json);
const action = $('codes').item.json.action;
const taskId = $('codes').item.json.taskId;

const isConfirm = action === 'confirm';

const updateData = {
  status: isConfirm ? 'completed' : 'waiting_user_feedback',
  stepName: isConfirm ? 'final' : 'draft',
  message: isConfirm ? '最终版已生成！' : '已根据修改意见重新生成，请再次确认',
  preview: { text: aiText, images: [], videos: [] },
  allowRevise: !isConfirm,
  allowConfirm: !isConfirm,
  history: [
    {
      role: 'system',
      type: 'status',
      content: isConfirm ? '最终版已生成' : '已根据修改意见重新生成',
      timestamp: Date.now()
    }
  ]
};

// 追加版本历史
if (!isConfirm && aiText) {
  const task = getTask(taskId);
  const history = (task && task.previewHistory) ? task.previewHistory : [];
  history.push({
    version: history.length + 1,
    label: '修改版本',
    text: aiText,
    timestamp: Date.now()
  });
  updateData.previewHistory = history;
}

saveTask(taskId, updateData);

return { json: { taskId: taskId, status: 'done' } };
```

### 「构建回复」节点 — 不变

此节点不涉及 staticData，无需修改。

---

## 阶段四：图片生成与逐张审核

### 「Code in JavaScript1」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

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

const previousText = $('codes').item.json.previousText || '';
const taskId = $('codes').item.json.taskId || '';

let cleanText = previousText;
const coverStart = cleanText.indexOf('[封面]');
if (coverStart > 0) cleanText = cleanText.substring(coverStart);

const sections = cleanText.split('<page>').map(s => s.trim()).filter(s => s);
const typeMap = { '封面': 'cover', '内容': 'content', '总结': 'summary' };
const pages = sections.map((content, index) => {
  const typeMatch = content.match(/^\[(\S+?)\]/);
  const type = typeMatch ? (typeMap[typeMatch[1]] || 'content') : 'content';
  return { index, type, content };
});

const coverPage = pages.find(p => p.type === 'cover') || pages[0];
const otherPages = pages.filter(p => p.type !== 'cover');

saveTask(taskId, {
  status: 'processing',
  message: '正在生成第 1 张图片...',
  allPages: pages,
  outline: cleanText,
  userRequest: '根据文案内容生成配图',
  previousText: previousText,
  xhsImages: [],
  currentImageIndex: 0,
  totalImages: pages.length
});

return {
  json: {
    taskId, previousText, outline: cleanText,
    userRequest: '根据文案内容生成配图',
    coverPage, otherPages, pageCount: pages.length
  }
};
```

### 「保存封面图」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const taskId = $('codes').item.json.taskId;
const coverImageUrl = $input.first().json.imageUrl || '';
const task = getTask(taskId);

if (!task) {
  return { json: { taskId, imageUrl: coverImageUrl } };
}

const xhsImages = task.xhsImages || [];
xhsImages.push({ url: coverImageUrl, status: 'pending', index: 0 });

const tasks = readTasks();
tasks[taskId] = {
  ...task,
  status: 'waiting_user_feedback',
  stepName: 'xhs_image_review',
  message: '请审核第 1 张图片（封面图）',
  xhsImages: xhsImages,
  currentImageIndex: 0
};
writeTasks(tasks);

return { json: { taskId, imageUrl: coverImageUrl, currentIndex: 0 } };
```

### 「处理图片通过」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const body = $('codes').item.json;
const imageIndex = parseInt(body.previousText || '0');
const taskId = body.taskId;
const task = getTask(taskId);

if (!task) {
  return { json: { taskId, error: '任务不存在' } };
}

const xhsImages = [...(task.xhsImages || [])];
if (xhsImages[imageIndex]) {
  xhsImages[imageIndex] = { ...xhsImages[imageIndex], status: 'approved' };
}

const nextIndex = imageIndex + 1;
const totalImages = task.totalImages || (task.allPages ? task.allPages.length : 0);

const tasks = readTasks();
tasks[taskId] = { ...task, xhsImages };
writeTasks(tasks);

return {
  json: {
    taskId, imageIndex, nextIndex, totalImages,
    hasMore: nextIndex < totalImages,
    allPages: task.allPages || [],
    outline: task.outline || '',
    userRequest: task.userRequest || '根据文案内容生成配图'
  }
};
```

### 「准备下一张」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

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

const data = $input.first().json;
const nextPage = data.allPages[data.nextIndex];
const task = getTask(data.taskId) || {};
const coverImage = (task.xhsImages && task.xhsImages[0]) ? task.xhsImages[0].url : '';

return {
  json: {
    page: nextPage,
    outline: data.outline,
    userRequest: data.userRequest,
    coverImage: coverImage,
    taskId: data.taskId,
    nextIndex: data.nextIndex
  }
};
```

### 「保存新图片」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const taskId = $('准备下一张').item.json.taskId;
const nextIndex = $('准备下一张').item.json.nextIndex;
const newImageUrl = $input.first().json.imageUrl || '';
const task = getTask(taskId);

const xhsImages = [...(task.xhsImages || [])];
xhsImages.push({ url: newImageUrl, status: 'pending', index: nextIndex });

const tasks = readTasks();
tasks[taskId] = {
  ...task,
  status: 'waiting_user_feedback',
  stepName: 'xhs_image_review',
  message: `请审核第 ${nextIndex + 1} 张图片`,
  xhsImages: xhsImages,
  currentImageIndex: nextIndex
};
writeTasks(tasks);

return { json: { taskId, done: false } };
```

### 「标记完成」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const taskId = $input.first().json.taskId;
const task = getTask(taskId);
const allImageUrls = (task.xhsImages || []).map(img => img.url);

const tasks = readTasks();
tasks[taskId] = {
  ...task,
  status: 'completed',
  stepName: 'final',
  message: '所有图片已生成完成！',
  preview: {
    text: task.previousText || '',
    images: allImageUrls,
    videos: []
  },
  allowRevise: false,
  allowConfirm: false
};
writeTasks(tasks);

return { json: { taskId, status: 'completed' } };
```

### 「处理图片拒绝」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const body = $('codes').item.json;
const imageIndex = parseInt(body.previousText || '0');
const feedback = body.feedback || '';
const taskId = body.taskId;
const task = getTask(taskId);

if (!task) return { json: { taskId, error: '任务不存在' } };

const xhsImages = [...(task.xhsImages || [])];
if (xhsImages[imageIndex]) {
  xhsImages[imageIndex] = { ...xhsImages[imageIndex], status: 'rejected' };
}

const tasks = readTasks();
tasks[taskId] = {
  ...task,
  status: 'processing',
  message: `正在根据意见重新生成第 ${imageIndex + 1} 张图片...`,
  xhsImages: xhsImages
};
writeTasks(tasks);

const targetPage = task.allPages ? task.allPages[imageIndex] : null;
const coverImage = (task.xhsImages && task.xhsImages[0]) ? task.xhsImages[0].url : '';

return {
  json: {
    taskId, imageIndex, feedback,
    page: targetPage,
    outline: task.outline || '',
    userRequest: feedback
      ? `${task.userRequest || '根据文案内容生成配图'}。修改意见：${feedback}`
      : (task.userRequest || '根据文案内容生成配图'),
    coverImage: coverImage
  }
};
```

### 「保存重新生成图片」节点 — 完整代码

```javascript
// ===== 任务状态文件读写工具 =====
const fs = require('fs');
const TASKS_FILE = '/tmp/n8n_tasks.json';

function readTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch { return {}; }
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks), 'utf8');
}

function getTask(taskId) {
  return readTasks()[taskId] || null;
}
// ===== 工具函数结束 =====

const taskId = $('处理图片拒绝').item.json.taskId;
const imageIndex = $('处理图片拒绝').item.json.imageIndex;
const newImageUrl = $input.first().json.imageUrl || '';
const task = getTask(taskId);

const xhsImages = [...(task.xhsImages || [])];
xhsImages[imageIndex] = { url: newImageUrl, status: 'pending', index: imageIndex };

const tasks = readTasks();
tasks[taskId] = {
  ...task,
  status: 'waiting_user_feedback',
  stepName: 'xhs_image_review',
  message: `第 ${imageIndex + 1} 张图片已重新生成，请再次审核`,
  xhsImages: xhsImages,
  currentImageIndex: imageIndex
};
writeTasks(tasks);

return { json: { taskId, done: false } };
```

---

## 阶段五：更新 Web 端配置

打开 `src/config.js`，确认以下地址正确指向你的 n8n 实例：

```javascript
XIAOHONGSHU: {
  START_WORKFLOW_URL: 'http://你的IP:5678/webhook/start-workflows',
  STATUS_QUERY_URL: 'http://你的IP:5678/webhook/lunxuns',
  USER_ACTION_URL: 'http://你的IP:5678/webhook/user-actions',
},
```

> `webhook-test` 路径用于测试（需手动点 Listen），`webhook` 路径在工作流激活后自动响应。

---

## 操作步骤总结

1. **逐个打开** n8n 中的 Code 节点
2. **全选删除**旧代码
3. **粘贴**本指南中对应节点的完整代码
4. **保存**节点
5. 全部替换完后，**激活工作流**

---

## 测试流程

### 测试一：多任务并发
1. 提交任务 A
2. 立即提交任务 B
3. 两个任务都应正常到达「待确认」状态
4. 进行中列表中两个任务都显示正确状态

### 测试二：状态实时性
1. 提交任务后，观察进行中列表
2. 状态应从「处理中」自动变为「待确认」
3. 不需要点击任务进去才能看到真实状态

### 测试三：图片审核流程
1. 确认文案后，应切换到图片审核界面
2. 逐张审核（通过/拒绝）功能正常
3. 全部通过后显示完成

---

## 故障排查

**Q: n8n Code 节点报错 `Cannot find module 'fs'`**
- 检查 n8n 版本，`require('fs')` 需要 n8n 允许 Code 节点使用 Node.js 内建模块
- 在 n8n 设置中确认 `NODE_FUNCTION_ALLOW_BUILTIN=fs` 环境变量已设置

**Q: 文件写入报错 `EACCES: permission denied`**
- 确认 `/tmp/` 目录可写
- Docker 用户：确认容器有 `/tmp` 写权限

**Q: 任务状态不更新**
- SSH 到服务器，手动查看文件内容：`cat /tmp/n8n_tasks.json | python3 -m json.tool`
- 确认文件中有对应 taskId 的记录

**Q: 文件越来越大怎么办**
- 可以定期手动清理：`echo '{}' > /tmp/n8n_tasks.json`
- 或在「标记完成」节点中添加清理逻辑（删除超过 7 天的任务）
