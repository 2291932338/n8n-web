/**
 * 全局配置文件
 * 所有接口地址、轮询间隔、开关等集中管理
 * 替换为真实 n8n 地址时，只需修改此文件
 */

const config = {
  // ========== 接口地址 ==========
  // 启动工作流
  START_WORKFLOW_URL: 'https://your-n8n-domain.com/webhook/start-workflow',
  // 查询任务状态
  STATUS_QUERY_URL: 'https://your-n8n-domain.com/webhook/query-status',
  // 用户操作回传（修改意见 / 确认继续）
  USER_ACTION_URL: 'https://your-n8n-domain.com/webhook/user-action',

  // ========== 轮询配置 ==========
  // 轮询间隔（毫秒）
  POLL_INTERVAL: 3000,
  // 轮询超时时间（毫秒），超时后停止轮询并提示
  POLL_TIMEOUT: 300000, // 5 分钟

  // ========== Mock 模式 ==========
  // true: 使用前端模拟数据，无需真实 n8n 接口
  // false: 使用真实接口
  MOCK_ENABLED: false,

  // Mock 模式下各步骤延迟（毫秒），模拟真实处理时间
  MOCK_DELAYS: {
    startWorkflow: 1500,
    processing: 3000,
    generatePreview: 4000,
    userAction: 1500,
    finalResult: 3000,
  },

  // ========== 应用配置 ==========
  APP_NAME: 'WorkflowStudio',
  APP_SUBTITLE: 'AI 内容生成工作台',

  // localStorage key 前缀
  STORAGE_PREFIX: 'wfs_',

  // 最大历史消息数
  MAX_HISTORY_MESSAGES: 100,
}

export default config
