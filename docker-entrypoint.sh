#!/bin/sh
# =============================================
# 运行时环境变量注入
# 将环境变量注入到已构建的前端 JS 文件中
# =============================================

JS_FILES=$(find /usr/share/nginx/html/assets -name '*.js')

# =============================================
# 小红书接口（XHS_* 或兼容旧版 START_WORKFLOW_URL 等）
# =============================================

# 支持旧版单一变量（向后兼容）
if [ -n "$START_WORKFLOW_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/start-workflow|${START_WORKFLOW_URL}|g"
fi
if [ -n "$STATUS_QUERY_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/query-status|${STATUS_QUERY_URL}|g"
fi
if [ -n "$USER_ACTION_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/user-action|${USER_ACTION_URL}|g"
fi

# 支持新版小红书专属变量（XHS_* 优先级更高，可覆盖上面的值）
if [ -n "$XHS_START_WORKFLOW_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/start-workflow|${XHS_START_WORKFLOW_URL}|g"
fi
if [ -n "$XHS_STATUS_QUERY_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/query-status|${XHS_STATUS_QUERY_URL}|g"
fi
if [ -n "$XHS_USER_ACTION_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/user-action|${XHS_USER_ACTION_URL}|g"
fi
# 小红书：重新生成图片（新增）
if [ -n "$XHS_REGENERATE_IMAGE_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/xhs-regenerate-image|${XHS_REGENERATE_IMAGE_URL}|g"
fi

# =============================================
# 抖音接口（DOUYIN_*）
# =============================================
if [ -n "$DOUYIN_START_WORKFLOW_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/douyin-start-workflow|${DOUYIN_START_WORKFLOW_URL}|g"
fi
if [ -n "$DOUYIN_STATUS_QUERY_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/douyin-query-status|${DOUYIN_STATUS_QUERY_URL}|g"
fi
if [ -n "$DOUYIN_USER_ACTION_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/douyin-user-action|${DOUYIN_USER_ACTION_URL}|g"
fi
# 抖音：单帧审核（新增）
if [ -n "$DOUYIN_FRAME_ACTION_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/douyin-frame-action|${DOUYIN_FRAME_ACTION_URL}|g"
fi
# 抖音：触发视频生成（新增）
if [ -n "$DOUYIN_GENERATE_VIDEO_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/douyin-generate-video|${DOUYIN_GENERATE_VIDEO_URL}|g"
fi
# 抖音：重新生成视频（新增）
if [ -n "$DOUYIN_REGENERATE_VIDEO_URL" ]; then
  echo "$JS_FILES" | xargs sed -i \
    "s|https://your-n8n-domain.com/webhook/douyin-regenerate-video|${DOUYIN_REGENERATE_VIDEO_URL}|g"
fi

# =============================================
# 控制 Mock 模式
# =============================================
if [ "$MOCK_ENABLED" = "false" ]; then
  echo "$JS_FILES" | xargs sed -i \
    's|MOCK_ENABLED:!0|MOCK_ENABLED:!1|g'
  echo "$JS_FILES" | xargs sed -i \
    's|MOCK_ENABLED: true|MOCK_ENABLED: false|g'
fi

exec "$@"

