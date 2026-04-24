import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildActionPersistence,
  mergeResultMetadata,
  mergeResultPreview,
  normalizeStatus,
  terminalResult,
} from './workflowTaskResult.js'

test('normalizeStatus treats douyin_batch_completed as completed', () => {
  assert.equal(normalizeStatus({ stepName: 'douyin_batch_completed' }), 'COMPLETED')
})

test('terminalResult returns stored terminal task artifacts', () => {
  const response = terminalResult({
    status: 'COMPLETED',
    taskId: 'task-1',
    resultPreview: { text: 'final copy' },
    metadata: {
      downloadUrl: 'https://example.com/video.mp4',
      fileList: ['video.mp4'],
      storyboardDocument: { title: 'storyboard' },
      generationProgress: { current: 3, total: 3 },
      stepName: 'douyin_batch_completed',
      statusMessage: 'done',
    },
  })

  assert.deepEqual(response, {
    success: true,
    status: 'completed',
    message: 'done',
    taskId: 'task-1',
    preview: { text: 'final copy' },
    downloadUrl: 'https://example.com/video.mp4',
    fileList: ['video.mp4'],
    storyboardDocument: { title: 'storyboard' },
    generationProgress: { current: 3, total: 3 },
    stepName: 'douyin_batch_completed',
    statusMessage: 'done',
  })
})

test('buildActionPersistence stores submitted text in preview and metadata', () => {
  const persistence = buildActionPersistence({
    action: 'confirm',
    existingPreview: { images: ['cover.png'] },
    existingMetadata: { previewHistory: [{ text: 'older' }], stepName: 'xhs_image_review' },
    previousText: 'draft text',
    confirmedText: 'confirmed text',
    upstreamResult: { status: 'processing', message: 'accepted' },
  })

  assert.deepEqual(persistence, {
    resultPreview: {
      images: ['cover.png'],
      previousText: 'draft text',
      confirmedText: 'confirmed text',
      text: 'confirmed text',
    },
    metadata: {
      previewHistory: [{ text: 'older' }],
      stepName: 'xhs_image_review',
      previousText: 'draft text',
      confirmedText: 'confirmed text',
      lastSubmittedText: 'confirmed text',
      statusMessage: 'accepted',
      lastUserActionResult: { status: 'processing', message: 'accepted' },
    },
  })
})

test('buildActionPersistence ignores non-text action payloads as preview text', () => {
  const persistence = buildActionPersistence({
    action: 'approve_image',
    existingPreview: { text: 'real draft' },
    existingMetadata: {},
    previousText: '0',
    upstreamResult: { status: 'processing', message: 'accepted' },
  })

  assert.equal(persistence.resultPreview, undefined)
  assert.equal(persistence.metadata.previousText, undefined)
  assert.equal(persistence.metadata.statusMessage, 'accepted')
})

test('mergeResultMetadata preserves submitted text while applying n8n artifacts', () => {
  const metadata = mergeResultMetadata(
    { previousText: 'draft text', confirmedText: 'confirmed text' },
    {
      preview: { text: 'rendered' },
      downloadUrl: 'https://example.com/final.zip',
      fileList: ['final.zip'],
      storyboardDocument: { pages: 2 },
      generationProgress: { current: 2, total: 2 },
      stepName: 'douyin_batch_completed',
      message: 'complete',
    },
  )

  assert.equal(metadata.previousText, 'draft text')
  assert.equal(metadata.confirmedText, 'confirmed text')
  assert.equal(metadata.downloadUrl, 'https://example.com/final.zip')
  assert.deepEqual(metadata.fileList, ['final.zip'])
  assert.deepEqual(metadata.storyboardDocument, { pages: 2 })
  assert.deepEqual(metadata.generationProgress, { current: 2, total: 2 })
  assert.equal(metadata.stepName, 'douyin_batch_completed')
  assert.equal(metadata.statusMessage, 'complete')
})

test('mergeResultPreview keeps confirmed text over stale n8n previews', () => {
  const preview = mergeResultPreview(
    null,
    { confirmedText: 'manual final' },
    { text: 'stale draft', images: ['image.png'] },
  )

  assert.deepEqual(preview, { text: 'manual final', images: ['image.png'] })
})

test('mergeResultMetadata keeps confirmed storyboard over stale n8n storyboard', () => {
  const metadata = mergeResultMetadata(
    {
      confirmedText: '{"scenes":[{"title":"manual"}]}',
      storyboardDocument: { scenes: [{ title: 'manual' }] },
      fileList: ['final.zip'],
    },
    {
      storyboardDocument: { scenes: [{ title: 'stale' }] },
      fileList: [],
      stepName: 'douyin_media_generating',
    },
  )

  assert.deepEqual(metadata.storyboardDocument, { scenes: [{ title: 'manual' }] })
  assert.deepEqual(metadata.fileList, ['final.zip'])
})
