from app.main import app
import os

# 设置为生产环境
os.environ.setdefault("ENVIRONMENT", "production")

# Vercel Serverless 函数处理器
def handler(request, context):
    """Vercel 函数处理器"""
    return app

# 也导出 app 实例供备用
__all__ = ["app", "handler"]