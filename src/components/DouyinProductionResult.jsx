/**
 * 抖音素材包生成结果组件（批量模式）
 * 展示文件列表树、下载按钮、分镜文档摘要
 */

import { useState, useCallback } from 'react'

function DownloadButton({ url }) {
  const handleDownload = useCallback(() => {
    window.open(url, '_blank')
  }, [url])

  return (
    <button
      onClick={handleDownload}
      className="flex items-center justify-center gap-2 w-full rounded-xl bg-green-600 px-4 py-3
        text-sm font-semibold text-white transition-colors hover:bg-green-700"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      下载完整素材包
    </button>
  )
}

const FILE_ICONS = {
  image: { icon: '🖼', color: 'text-blue-500' },
  video: { icon: '🎬', color: 'text-purple-500' },
  audio: { icon: '🎙', color: 'text-orange-500' },
  subtitle: { icon: '📝', color: 'text-green-500' },
  document: { icon: '📄', color: 'text-gray-500' },
}

function getFileType(name) {
  if (!name) return 'document'
  const ext = name.split('.').pop().toLowerCase()
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext)) return 'audio'
  if (['srt', 'ass', 'vtt'].includes(ext)) return 'subtitle'
  return 'document'
}

function FileItem({ file }) {
  const type = file.type || getFileType(file.name)
  const { icon, color } = FILE_ICONS[type] || FILE_ICONS.document

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-base flex-shrink-0">{icon}</span>
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {file.name}
        </span>
        {file.size && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatSize(file.size)}
          </span>
        )}
      </div>
      {file.url && (
        <a
          href={file.url}
          download
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 ml-2 text-xs text-violet-500 hover:text-violet-700 dark:text-violet-400"
        >
          下载
        </a>
      )}
    </div>
  )
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function DouyinProductionResult({
  downloadUrl,
  fileList,
  storyboardDocument,
  preview,
}) {
  const [showStoryboard, setShowStoryboard] = useState(false)

  const files = fileList || []
  const totalFiles = files.length
  const storyboardText = preview?.text ??
    (typeof storyboardDocument === 'string' ? storyboardDocument : '')

  // 按类型分组
  const grouped = files.reduce((acc, file) => {
    const type = file.type || getFileType(file.name)
    if (!acc[type]) acc[type] = []
    acc[type].push(file)
    return acc
  }, {})

  const groupLabels = {
    document: '文档',
    image: '配图',
    video: '视频片段',
    audio: '配音',
    subtitle: '字幕',
  }

  return (
    <div className="space-y-4">
      {/* 完成提示 */}
      <div className="rounded-2xl border-2 border-green-200 bg-green-50/50 p-5 dark:border-green-800 dark:bg-green-900/10">
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
            素材包生成完成！
          </h3>
        </div>
        <p className="text-xs text-green-600 dark:text-green-500 mb-4">
          共生成 {totalFiles} 个文件，可直接下载后导入视频剪辑软件使用。
        </p>

        {/* 下载按钮 */}
        {downloadUrl && (
          <DownloadButton url={downloadUrl} />
        )}
      </div>

      {/* 文件列表 */}
      {totalFiles > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            文件列表 ({totalFiles})
          </h4>
          <div className="space-y-3">
            {Object.entries(grouped).map(([type, groupFiles]) => (
              <div key={type}>
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 px-3">
                  {groupLabels[type] || type} ({groupFiles.length})
                </p>
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {groupFiles.map((file, i) => (
                    <FileItem key={i} file={file} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 分镜文档摘要 */}
      {storyboardText && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => setShowStoryboard(!showStoryboard)}
            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50
              dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="18" rx="2" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="16" y2="11" />
                <line x1="8" y1="15" x2="12" y2="15" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">分镜文档</span>
            </div>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${showStoryboard ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showStoryboard && (
            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-h-80 overflow-y-auto">
                {storyboardText}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 使用提示 */}
      <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/10">
        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
          <strong>使用方法：</strong>下载素材包后解压，文件按分镜顺序命名（场景01_配图.png、场景01_配音.mp3 等），
          将文件按编号顺序拖入视频剪辑软件（如剪映、Premiere、Final Cut Pro）即可快速完成视频剪辑。
        </p>
      </div>
    </div>
  )
}
