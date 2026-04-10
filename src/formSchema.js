/**
 * 表单字段 Schema 配置
 * 使用配置驱动方式管理表单，方便后续修改字段
 *
 * 每个字段包含：
 * - name: 字段标识（也是提交到 n8n 的 key）
 * - label: 显示名称
 * - type: 字段类型 (text | textarea | select | number)
 * - placeholder: 占位提示
 * - required: 是否必填
 * - options: select 类型的选项列表
 * - defaultValue: 默认值
 * - min/max: number 类型的范围
 */

export const xiaohongshuSchema = [
  {
    name: '主题/产品',
    label: '主题/产品',
    type: 'text',
    placeholder: '例如：夏季防晒霜、咖啡店探店、穿搭分享',
    required: true,
  },
  {
    name: '目标人群',
    label: '目标人群',
    type: 'text',
    placeholder: '例如：25-35岁都市女性、学生党、宝妈',
    required: true,
  },
  {
    name: '文案风格',
    label: '文案风格',
    type: 'select',
    placeholder: '选择文案风格',
    required: true,
    options: [
      '种草分享',
      '干货教程',
      '真实测评',
      '情感共鸣',
      '对比评测',
      '开箱体验',
      '日常分享',
      '攻略指南',
    ],
  },
  {
    name: '核心卖点',
    label: '核心卖点',
    type: 'textarea',
    placeholder: '列出产品/内容的核心亮点，每行一条',
    required: true,
  },
  {
    name: '发布目的',
    label: '发布目的',
    type: 'select',
    placeholder: '选择发布目的',
    required: false,
    options: [
      '品牌种草',
      '产品推广',
      '涨粉引流',
      '分享记录',
      '知识科普',
      '活动宣传',
    ],
  },
  {
    name: '字数范围',
    label: '字数范围',
    type: 'select',
    placeholder: '选择字数范围',
    required: false,
    defaultValue: '300-500字',
    options: ['100-200字', '200-300字', '300-500字', '500-800字', '800字以上'],
  },
  {
    name: '图片张数',
    label: '图片张数',
    type: 'select',
    placeholder: '选择图片张数',
    required: false,
    defaultValue: '3',
    options: ['1', '2', '3', '4', '6', '9'],
  },
  {
    name: '图片风格',
    label: '图片风格',
    type: 'select',
    placeholder: '选择图片风格',
    required: false,
    options: [
      '清新自然',
      '高级质感',
      '可爱少女',
      '简约大气',
      '复古文艺',
      '科技感',
      'INS风',
      '日系',
    ],
  },
  {
    name: '标题风格',
    label: '标题风格',
    type: 'select',
    placeholder: '选择标题风格',
    required: false,
    options: [
      '疑问式',
      '数字式',
      '感叹式',
      '对比式',
      '悬念式',
      '痛点式',
    ],
  },
  {
    name: '标签/关键词',
    label: '标签/关键词',
    type: 'text',
    placeholder: '用逗号分隔，例如：护肤, 好物分享, 测评',
    required: false,
  },
  {
    name: '补充说明',
    label: '补充说明',
    type: 'textarea',
    placeholder: '其他需要 AI 注意的事项...',
    required: false,
  },
]

export const douyinSchema = [
  {
    name: '工作流模式',
    label: '工作流模式',
    type: 'select',
    placeholder: '选择工作流模式',
    required: true,
    defaultValue: '批量生成素材包',
    options: [
      '批量生成素材包',
      '逐帧审核模式',
    ],
  },
  {
    name: '主题/产品',
    label: '主题/产品',
    type: 'text',
    placeholder: '例如：智能手表、美食探店、健身教程',
    required: true,
  },
  {
    name: '目标人群',
    label: '目标人群',
    type: 'text',
    placeholder: '例如：18-30岁年轻人、科技爱好者、健身人群',
    required: true,
  },
  {
    name: '视频时长',
    label: '视频时长',
    type: 'select',
    placeholder: '选择视频时长',
    required: true,
    options: ['15秒', '30秒', '60秒', '3分钟', '5分钟'],
  },
  {
    name: '脚本风格',
    label: '脚本风格',
    type: 'select',
    placeholder: '选择脚本风格',
    required: true,
    options: [
      '轻松搞笑',
      '专业讲解',
      '情感故事',
      '快节奏种草',
      '沉浸式体验',
      '对比测评',
      '街头采访',
    ],
  },
  {
    name: '视频类型',
    label: '视频类型',
    type: 'select',
    placeholder: '选择视频类型',
    required: true,
    options: ['口播', '混剪', '剧情', '实拍', '动画'],
  },
  {
    name: '视频比例',
    label: '视频比例',
    type: 'select',
    placeholder: '选择视频比例',
    required: false,
    defaultValue: '9:16竖屏',
    options: ['9:16竖屏', '16:9横屏', '1:1方形'],
  },
  {
    name: '分镜数量',
    label: '分镜数量',
    type: 'select',
    placeholder: '选择分镜数量',
    required: false,
    defaultValue: '4-6个',
    options: ['3-4个', '4-6个', '6-8个', '8个以上'],
  },
  {
    name: '核心卖点',
    label: '核心卖点',
    type: 'textarea',
    placeholder: '列出产品/内容的核心亮点，每行一条',
    required: true,
  },
  {
    name: '画面风格',
    label: '画面风格',
    type: 'select',
    placeholder: '选择画面风格',
    required: false,
    options: [
      '明亮清新',
      '暗调质感',
      '电影感',
      '日系温暖',
      '赛博朋克',
      '极简白',
      '复古滤镜',
    ],
  },
  {
    name: '配音风格',
    label: '配音风格',
    type: 'select',
    placeholder: '选择配音风格',
    required: false,
    options: [
      '男声专业',
      '女声温柔',
      '男声磁性',
      '女声活力',
      'AI合成',
      '不需要配音',
    ],
  },
  {
    name: '字幕样式',
    label: '字幕样式',
    type: 'select',
    placeholder: '选择字幕样式',
    required: false,
    defaultValue: 'SRT字幕文件',
    options: ['SRT字幕文件', 'ASS样式字幕', '不需要字幕'],
  },
  {
    name: 'BGM 风格',
    label: 'BGM 风格',
    type: 'select',
    placeholder: '选择 BGM 风格',
    required: false,
    options: [
      '轻快活泼',
      '热血激昂',
      '治愈温馨',
      '电子音乐',
      '古风国潮',
      '流行说唱',
      '纯音乐',
    ],
  },
  {
    name: 'CTA/行动引导',
    label: 'CTA / 行动引导',
    type: 'text',
    placeholder: '例如：点击小黄车下单、关注获取教程、评论区留言',
    required: false,
  },
  {
    name: '参考视频/灵感',
    label: '参考视频/灵感',
    type: 'textarea',
    placeholder: '填写参考视频链接或创意灵感描述（选填）',
    required: false,
  },
  {
    name: '补充说明',
    label: '补充说明',
    type: 'textarea',
    placeholder: '其他需要 AI 注意的事项...',
    required: false,
  },
]

/**
 * 获取指定平台的 schema
 */
export function getSchemaByPlatform(platform) {
  return platform === 'xiaohongshu' ? xiaohongshuSchema : douyinSchema
}
