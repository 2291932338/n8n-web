/**
 * 表单字段 Schema 配置
 * 使用配置驱动方式管理表单，方便后续修改字段。
 * 每个字段包含：
 * - name: 字段标识，也是提交到 n8n 的 key
 * - label: 显示名称
 * - type: 字段类型 (text | textarea | select | number | file)
 * - placeholder: 占位提示
 * - required: 是否必填
 * - options: select 类型字段的选项
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
    type: 'text',
    placeholder: '例如：种草分享、真实测评、攻略指南',
    required: true,
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
    type: 'text',
    placeholder: '例如：品牌种草、产品推广、分享记录',
    required: false,
  },
  {
    name: '字数范围',
    label: '字数范围',
    type: 'text',
    placeholder: '例如：300-500字、500-800字',
    required: false,
    defaultValue: '300-500字',
  },
  {
    name: '图片张数',
    label: '图片张数',
    type: 'text',
    placeholder: '例如：3、6、9',
    required: false,
    defaultValue: '3',
  },
  {
    name: '图片风格',
    label: '图片风格',
    type: 'text',
    placeholder: '例如：清新自然、高级质感、复古文艺',
    required: false,
  },
  {
    name: '标题风格',
    label: '标题风格',
    type: 'text',
    placeholder: '例如：疑问式、数字式、痛点式',
    required: false,
  },
  {
    name: '标签/关键词',
    label: '标签/关键词',
    type: 'text',
    placeholder: '用逗号分隔，例如：护肤, 好物分享, 测评',
    required: false,
  },
  {
    name: '参考图片',
    label: '参考图片',
    type: 'file',
    required: false,
    accept: 'image/png,image/jpeg,image/webp',
    maxFiles: 3,
    helperText: '可上传 1-3 张参考图，系统会先上传并转换成可供 AI 读取的 URL。',
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
    type: 'text',
    placeholder: '请输入：批量生成素材包 或 逐帧审核模式',
    required: true,
    defaultValue: '批量生成素材包',
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
    type: 'text',
    placeholder: '例如：15秒、30秒、60秒、3分钟',
    required: true,
  },
  {
    name: '脚本风格',
    label: '脚本风格',
    type: 'text',
    placeholder: '例如：轻松搞笑、专业讲解、情感故事',
    required: true,
  },
  {
    name: '视频类型',
    label: '视频类型',
    type: 'text',
    placeholder: '例如：口播、混剪、剧情、实拍、动画',
    required: true,
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
    type: 'text',
    placeholder: '例如：明亮清新、电影感、复古滤镜',
    required: false,
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
    type: 'text',
    placeholder: '例如：轻快活泼、电子音乐、纯音乐',
    required: false,
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
    name: '参考图片',
    label: '参考图片',
    type: 'file',
    required: false,
    accept: 'image/png,image/jpeg,image/webp',
    maxFiles: 3,
    helperText: '可上传 1-3 张参考图，系统会先上传并转换成可供 AI 生图使用的 URL。',
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
