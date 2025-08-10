@echo off
echo 启动个人仪表盘开发环境...
echo.

echo 1. 启动前端开发服务器...
cd frontend
start "前端服务器" pnpm dev

echo 2. 启动后端开发服务器...
cd ../api
timeout /t 3 /nobreak > nul
if not exist ".venv" (
    echo 首次运行，正在创建 uv 虚拟环境并安装依赖...
    uv venv
    call .venv\Scripts\activate
    uv pip install -r requirements.txt
) else (
    call .venv\Scripts\activate
)
start "后端服务器" cmd /c ".venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo.
echo 开发服务器启动完成！
echo 前端: http://localhost:3000
echo 后端: http://localhost:8000
echo.
pause