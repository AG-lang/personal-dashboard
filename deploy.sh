#!/bin/bash

# 个人仪表盘 Docker 部署脚本
set -e

echo "🚀 开始部署个人仪表盘..."

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在，请从 docker.env.example 复制并配置"
    echo "cp docker.env.example .env"
    echo "然后编辑 .env 文件填入正确的数据库连接信息"
    exit 1
fi

echo "📦 构建 Docker 镜像..."

# 构建前端镜像
echo "构建前端镜像..."
docker build -t personal-dashboard-frontend ./frontend

# 构建后端镜像
echo "构建后端镜像..."
docker build -t personal-dashboard-api ./api

echo "🔧 启动服务..."

# 停止现有容器
docker-compose down

# 启动新容器
docker-compose up -d

echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查前端
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 前端服务运行正常 (http://localhost:3000)"
else
    echo "❌ 前端服务启动失败"
fi

# 检查后端
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ 后端服务运行正常 (http://localhost:8000)"
else
    echo "❌ 后端服务启动失败"
fi

echo "📋 查看运行状态:"
docker-compose ps

echo ""
echo "🎉 部署完成!"
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:8000"
echo "API 文档: http://localhost:8000/docs"
echo ""
echo "🛠️ 常用命令:"
echo "查看日志: docker-compose logs -f"
echo "重启服务: docker-compose restart"
echo "停止服务: docker-compose down"
echo "清理镜像: docker system prune -f"