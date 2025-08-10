# 容器化部署入口文件
from app.main import app

# 直接导出 FastAPI 应用供 uvicorn 使用
# uvicorn main:app --host 0.0.0.0 --port 8000