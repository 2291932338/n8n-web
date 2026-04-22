import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWorkflowStartResponse } from './workflowStartResponse.js'

test('buildWorkflowStartResponse defaults success to true when n8n omits it', () => {
  const response = buildWorkflowStartResponse('task-1', { status: 'processing', message: 'ok' })

  assert.deepEqual(response, {
    taskId: 'task-1',
    status: 'processing',
    message: 'ok',
    success: true,
  })
})

test('buildWorkflowStartResponse preserves explicit failure from upstream', () => {
  const response = buildWorkflowStartResponse('task-2', { success: false, message: 'failed' })

  assert.deepEqual(response, {
    taskId: 'task-2',
    success: false,
    message: 'failed',
  })
})
