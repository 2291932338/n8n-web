/**
 * 全局配置文件
 * 所有接口地址、轮询间隔、开关等集中管理
 * 小红书和抖音的 n8n Webhook 地址相互独立，修改时请分别配置对应平台
 */

const config = {
  // ========== 小红书接口地址（保持原有配置不变）==========
  XIAOHONGSHU: {
    // 启动工作流
    START_WORKFLOW_URL: 'https://your-n8n-domain.com/webhook/start-workflow',
    // 查询任务状态（Mock 模式 / 轮询模式使用）
    STATUS_QUERY_URL: 'https://your-n8n-domain.com/webhook/query-status',
    // 用户操作回传（修改意见 / 确认继续）
    USER_ACTION_URL: 'https://your-n8n-domain.com/webhook/user-action',
  },

  // ========== 抖音接口地址（填写抖音专属 n8n Webhook）==========
  DOUYIN: {
    // 启动工作流
    START_WORKFLOW_URL: 'https://your-n8n-domain.com/webhook/douyin-start-workflow',
    // 查询任务状态（Mock 模式 / 轮询模式使用）
    STATUS_QUERY_URL: 'https://your-n8n-domain.com/webhook/douyin-query-status',
    // 用户操作回传（修改意见 / 确认继续）
    USER_ACTION_URL: 'https://your-n8n-domain.com/webhook/douyin-user-action',
  },

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

  // ========== 任务历史配置 ==========
  // 本地保存的最大任务记录数（超出后 FIFO 淘汰最旧的）
  MAX_TASK_RECORDS: 50,
}

/**
 * 根据平台获取对应的 n8n Webhook URL 配置
 * @param {'xiaohongshu' | 'douyin'} platform
 * @returns {{ START_WORKFLOW_URL: string, STATUS_QUERY_URL: string, USER_ACTION_URL: string }}
 */
export function getUrlsForPlatform(platform) {
  if (platform === 'douyin') return config.DOUYIN
  return config.XIAOHONGSHU
}

export default config
