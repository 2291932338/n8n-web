export const PLATFORM_GROUPS = {
  article: {
    key: 'article',
    label: '图文',
    description: '图文内容创作与配图',
    defaultPlatform: 'xiaohongshu',
    platforms: ['xiaohongshu', 'zhihu', 'wechat'],
  },
  video: {
    key: 'video',
    label: '视频',
    description: '短视频脚本、分镜与成片',
    defaultPlatform: 'douyin',
    platforms: ['douyin', 'kuaishou', 'bilibili'],
  },
}

export const PLATFORM_META = {
  xiaohongshu: {
    key: 'xiaohongshu',
    label: '小红书',
    group: 'article',
  },
  zhihu: {
    key: 'zhihu',
    label: '知乎',
    group: 'article',
  },
  wechat: {
    key: 'wechat',
    label: '公众号',
    group: 'article',
  },
  douyin: {
    key: 'douyin',
    label: '抖音',
    group: 'video',
  },
  kuaishou: {
    key: 'kuaishou',
    label: '快手',
    group: 'video',
  },
  bilibili: {
    key: 'bilibili',
    label: 'B站',
    group: 'video',
  },
}

export const ARTICLE_PLATFORMS = PLATFORM_GROUPS.article.platforms
export const VIDEO_PLATFORMS = PLATFORM_GROUPS.video.platforms
export const ALL_PLATFORMS = [...ARTICLE_PLATFORMS, ...VIDEO_PLATFORMS]

export function getPlatformMeta(platform) {
  return PLATFORM_META[platform] || PLATFORM_META.xiaohongshu
}

export function getPlatformLabel(platform) {
  return getPlatformMeta(platform).label
}

export function getPlatformGroup(platform) {
  return getPlatformMeta(platform).group
}

export function isVideoPlatform(platform) {
  return getPlatformGroup(platform) === 'video'
}

export function isArticlePlatform(platform) {
  return getPlatformGroup(platform) === 'article'
}

export function getDefaultPlatformForGroup(group) {
  return PLATFORM_GROUPS[group]?.defaultPlatform || PLATFORM_GROUPS.article.defaultPlatform
}
