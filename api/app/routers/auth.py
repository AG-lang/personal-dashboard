from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from datetime import timedelta

from app.database import get_session
from app.models.user import User, UserCreate, UserLogin, UserResponse
from app.auth.utils import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    verify_token
)

router = APIRouter()
security = HTTPBearer()

@router.get("/test")
async def test_auth_router():
    """测试认证路由是否工作"""
    return {"message": "认证路由工作正常", "router": "auth"}

@router.post("/register", response_model=UserResponse, summary="用户注册")
async def register(
    user_data: UserCreate,
    session: Session = Depends(get_session)
):
    """用户注册"""
    # 检查用户名是否已存在
    existing_user = session.exec(
        select(User).where(User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 创建新用户
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        password_hash=hashed_password
    )
    
    session.add(user)
    session.commit()
    session.refresh(user)
    
    return user

@router.post("/login", summary="用户登录")
async def login(
    user_data: UserLogin,
    session: Session = Depends(get_session)
):
    """用户登录"""
    # 查找用户
    user = session.exec(
        select(User).where(User.username == user_data.username)
    ).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(days=30)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
):
    """获取当前登录用户信息"""
    token = credentials.credentials
    payload = verify_token(token)
    username = payload.get("sub")
    
    user = session.exec(
        select(User).where(User.username == username)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    return user

# 获取当前用户的依赖项
async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> int:
    """获取当前用户ID"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id = payload.get("user_id")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的用户令牌"
        )
    
    return user_id