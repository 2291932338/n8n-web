export function buildWorkflowStartResponse(taskId, result = {}) {
  return {
    ...result,
    taskId,
    success: result?.success ?? true,
  }
}
