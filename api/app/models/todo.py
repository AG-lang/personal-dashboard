from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class TodoPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TodoBase(SQLModel):
    content: str = Field(min_length=1, max_length=500, description="任务内容")
    priority: TodoPriority = Field(default=TodoPriority.MEDIUM, description="优先级")
    is_completed: bool = Field(default=False, description="是否完成")

class Todo(TodoBase, table=True):
    __tablename__ = "todos"
    
    id: Optional[int] = Field(default=None, primary_key=True, description="主键ID")
    user_id: Optional[int] = Field(default=None, foreign_key="users.id", description="用户ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")

class TodoCreate(TodoBase):
    pass

class TodoUpdate(SQLModel):
    content: Optional[str] = Field(default=None, min_length=1, max_length=500, description="任务内容")
    priority: Optional[TodoPriority] = Field(default=None, description="优先级")
    is_completed: Optional[bool] = Field(default=None, description="是否完成")

class TodoResponse(TodoBase):
    id: int
    created_at: datetime
    updated_at: datetime