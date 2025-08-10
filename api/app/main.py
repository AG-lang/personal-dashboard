from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from dotenv import load_dotenv

from app.database import create_db_and_tables
from app.routers import todos, notes, pomodoro, flashcards, auth, tools, commands

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时创建数据库表
    logger.info("正在创建数据库表...")
    create_db_and_tables()
    logger.info("数据库表创建完成")
    yield

app = FastAPI(
    title="个人仪表盘 API",
    description="功能完整的个人仪表盘后端服务",
    version="1.0.0",
    lifespan=lifespan
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    # 支持本地开发和 Vercel 生产环境
    allow_origins=[
        "http://localhost:3000",  # 本地开发
        "https://*.vercel.app",    # Vercel 域名
    ],
    allow_origin_regex=r"https:\/\/.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 添加请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"收到请求: {request.method} {request.url}")
    logger.info(f"请求头: {dict(request.headers)}")
    
    response = await call_next(request)
    
    logger.info(f"响应状态码: {response.status_code}")
    return response

# 路由
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(todos.router, prefix="/todos", tags=["todos"])
app.include_router(notes.router, prefix="/notes", tags=["notes"])
app.include_router(pomodoro.router, prefix="/pomodoro", tags=["pomodoro"])
app.include_router(flashcards.router)
app.include_router(tools.router, prefix="/tools", tags=["tools"])
app.include_router(commands.router, prefix="/commands", tags=["commands"])

@app.get("/")
async def root():
    return {"message": "个人仪表盘 API 运行正常"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "personal-dashboard-api"}

@app.get("/debug/routes")
async def debug_routes():
    """调试：显示所有已注册的路由"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'methods') and hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods)
            })
    return {"routes": routes}