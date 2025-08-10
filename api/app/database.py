from sqlmodel import SQLModel, create_engine, Session
import os
from typing import Generator

# 导入所有模型以确保它们被注册到SQLModel.metadata中
from app.models import (
    User, Todo, Note, PomodoroSession, FocusStats, 
    Flashcard, ReviewRecord, StudyStats
)

# 获取数据库 URL，优先使用云端配置的数据库地址
# 依次优先级：POSTGRES_URL > POSTGRES_URL_NON_POOLING > 本地 SQLite  
DATABASE_URL = (
    os.getenv("POSTGRES_URL")
    or os.getenv("POSTGRES_URL_NON_POOLING")
    or "sqlite:///./personal_dashboard.db"
)

# 创建数据库引擎
# SQLite 需要特殊配置
# 是否输出 SQL（生产建议关闭）
SQL_ECHO = os.getenv("SQL_ECHO", "false").lower() == "true"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        echo=SQL_ECHO,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(DATABASE_URL, echo=SQL_ECHO)

def create_db_and_tables():
    """创建数据库表"""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """获取数据库会话"""
    with Session(engine) as session:
        yield session