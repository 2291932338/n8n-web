# =============================================
# 阶段 1: 构建
# =============================================
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# 复制源码并构建
COPY . .
RUN npm run build

# =============================================
# 阶段 2: 生产镜像
# =============================================
FROM nginx:alpine

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制运行时配置注入脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
