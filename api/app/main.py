from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import create_db_and_tables
from app.routers import todos, notes, pomodoro, flashcards, auth, tools, commands

# 加载环境变量
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时创建数据库表
    create_db_and_tables()
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
    # Vercel 生产环境域名与本地开发
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https:\/\/[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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