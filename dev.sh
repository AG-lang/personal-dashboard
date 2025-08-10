#!/bin/bash

echo "启动个人仪表盘开发环境..."
echo ""

echo "1. 启动前端开发服务器..."
cd frontend
pnpm dev &
FRONTEND_PID=$!

echo "2. 启动后端开发服务器..."
cd ../api

# 检查是否已安装依赖
if [ ! -d ".venv" ]; then
    echo "首次运行，正在创建 uv 虚拟环境并安装依赖..."
    uv venv
    source .venv/bin/activate
    uv pip install -r requirements.txt
else
    source .venv/bin/activate
fi

uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo ""
echo "开发服务器启动完成！"
echo "前端: http://localhost:3000"
echo "后端: http://localhost:8000"
echo ""
echo "按 Ctrl+C 停止所有服务器"

# 清理函数
cleanup() {
    echo ""
    echo "正在停止服务器..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

# 设置信号处理
trap cleanup SIGINT

# 等待
wait