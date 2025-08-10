from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from app.database import get_session
from app.models.todo import Todo, TodoCreate, TodoUpdate, TodoResponse, TodoPriority

router = APIRouter()

@router.post("/", response_model=TodoResponse, summary="创建新的 Todo")
async def create_todo(
    todo: TodoCreate,
    session: Session = Depends(get_session)
) -> TodoResponse:
    """创建新的 Todo 项"""
    db_todo = Todo.model_validate(todo)
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    return TodoResponse.model_validate(db_todo)

@router.get("/", response_model=List[TodoResponse], summary="获取 Todo 列表")
async def get_todos(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    priority: Optional[TodoPriority] = Query(None, description="按优先级过滤"),
    is_completed: Optional[bool] = Query(None, description="按完成状态过滤"),
    search: Optional[str] = Query(None, description="搜索内容"),
    session: Session = Depends(get_session)
) -> List[TodoResponse]:
    """获取 Todo 列表，支持分页、过滤和搜索"""
    query = select(Todo)
    
    # 应用过滤条件
    if priority is not None:
        query = query.where(Todo.priority == priority)
    if is_completed is not None:
        query = query.where(Todo.is_completed == is_completed)
    if search is not None:
        query = query.where(Todo.content.contains(search))
    
    # 按创建时间倒序排列
    query = query.order_by(Todo.created_at.desc())
    
    # 应用分页
    query = query.offset(skip).limit(limit)
    
    todos = session.exec(query).all()
    return [TodoResponse.model_validate(todo) for todo in todos]

@router.get("/{todo_id}", response_model=TodoResponse, summary="获取单个 Todo")
async def get_todo(
    todo_id: int,
    session: Session = Depends(get_session)
) -> TodoResponse:
    """根据 ID 获取单个 Todo"""
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo 不存在")
    return TodoResponse.model_validate(todo)

@router.put("/{todo_id}", response_model=TodoResponse, summary="更新 Todo")
async def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    session: Session = Depends(get_session)
) -> TodoResponse:
    """更新 Todo 项"""
    db_todo = session.get(Todo, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo 不存在")
    
    # 更新字段
    todo_data = todo_update.model_dump(exclude_unset=True)
    for key, value in todo_data.items():
        setattr(db_todo, key, value)
    
    # 更新时间戳
    db_todo.updated_at = datetime.utcnow()
    
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    
    return TodoResponse.model_validate(db_todo)

@router.delete("/{todo_id}", summary="删除 Todo")
async def delete_todo(
    todo_id: int,
    session: Session = Depends(get_session)
) -> dict:
    """删除 Todo 项"""
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo 不存在")
    
    session.delete(todo)
    session.commit()
    
    return {"message": "Todo 已删除"}

@router.patch("/{todo_id}/toggle", response_model=TodoResponse, summary="切换 Todo 完成状态")
async def toggle_todo_completion(
    todo_id: int,
    session: Session = Depends(get_session)
) -> TodoResponse:
    """切换 Todo 的完成状态"""
    db_todo = session.get(Todo, todo_id)
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo 不存在")
    
    # 显式地更新状态，增加代码的防御性
    current_status = db_todo.is_completed
    db_todo.is_completed = not current_status
    db_todo.updated_at = datetime.utcnow()
    
    session.add(db_todo)
    session.commit()
    session.refresh(db_todo)
    
    return TodoResponse.model_validate(db_todo)