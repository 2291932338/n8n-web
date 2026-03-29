#!/bin/sh
# =============================================
# 运行时环境变量注入
# 将环境变量注入到已构建的前端 JS 文件中
# =============================================

# 替换 config.js 中的占位符 URL
# 如果设置了环境变量，则替换构建产物中的默认值
if [ -n "$N8N_BASE_URL" ]; then
  # 在所有 JS 文件中替换占位符
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    "s|https://your-n8n-domain.com/webhook/start-workflow|${N8N_BASE_URL}/webhook/start-workflow|g" {} \;
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    "s|https://your-n8n-domain.com/webhook/query-status|${N8N_BASE_URL}/webhook/query-status|g" {} \;
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    "s|https://your-n8n-domain.com/webhook/user-action|${N8N_BASE_URL}/webhook/user-action|g" {} \;
fi

# 如果设置了自定义的各个接口 URL，优先使用
if [ -n "$START_WORKFLOW_URL" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    "s|https://your-n8n-domain.com/webhook/start-workflow|${START_WORKFLOW_URL}|g" {} \;
fi

if [ -n "$STATUS_QUERY_URL" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    "s|https://your-n8n-domain.com/webhook/query-status|${STATUS_QUERY_URL}|g" {} \;
fi

if [ -n "$USER_ACTION_URL" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    "s|https://your-n8n-domain.com/webhook/user-action|${USER_ACTION_URL}|g" {} \;
fi

# 控制 Mock 模式
if [ "$MOCK_ENABLED" = "false" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    's|MOCK_ENABLED:!0|MOCK_ENABLED:!1|g' {} \;
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i \
    's|MOCK_ENABLED: true|MOCK_ENABLED: false|g' {} \;
fi

exec "$@"
