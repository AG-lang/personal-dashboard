from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, List

class NoteBase(SQLModel):
    title: str = Field(min_length=1, max_length=200, description="笔记标题")
    content: str = Field(min_length=1, description="笔记内容")
    tags: str = Field(default="", description="标签（逗号分隔）")
    is_reflection: bool = Field(default=False, description="是否为反思笔记")

class Note(NoteBase, table=True):
    __tablename__ = "notes"
    
    id: Optional[int] = Field(default=None, primary_key=True, description="主键ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")

class NoteCreate(NoteBase):
    pass

class NoteUpdate(SQLModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200, description="笔记标题")
    content: Optional[str] = Field(default=None, min_length=1, description="笔记内容")
    tags: Optional[str] = Field(default=None, description="标签（逗号分隔）")
    is_reflection: Optional[bool] = Field(default=None, description="是否为反思笔记")

class NoteResponse(NoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    @property
    def tag_list(self) -> List[str]:
        """将标签字符串转换为列表"""
        return [tag.strip() for tag in self.tags.split(",") if tag.strip()]