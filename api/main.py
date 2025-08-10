from app.main import app
from mangum import Mangum

# 使用 Mangum 适配器将 FastAPI 转换为 Serverless 函数
# 禁用 lifespan 以避免在 serverless 环境中的问题
handler = Mangum(app, lifespan="off")