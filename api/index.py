from app.main import app

# Vercel 需要的处理器函数
def handler(request, context):
    return app