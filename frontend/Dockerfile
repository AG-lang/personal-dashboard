# Frontend Dockerfile - Next.js 应用
FROM node:18-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm

# 构建阶段
FROM base AS builder

WORKDIR /app

# 复制包配置文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile=false

# 复制源代码
COPY . .

# 构建应用
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# 生产阶段
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制 public 文件夹
COPY --from=builder /app/public ./public

# 创建并设置 .next 目录权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]