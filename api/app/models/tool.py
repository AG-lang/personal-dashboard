from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class ToolType(str, Enum):
    PROMPT = "prompt"  # 提示词工具
    API = "api"        # API工具

class ToolBase(SQLModel):
    title: str = Field(min_length=1, max_length=200, description="工具标题")
    type: ToolType = Field(description="工具类型")
    tags: str = Field(default="", description="标签（逗号分隔）")
    description: str = Field(default="", description="工具描述")
    
    # 提示词工具字段
    system_prompt: Optional[str] = Field(default=None, description="系统提示词")
    
    # API工具字段
    api_key: Optional[str] = Field(default=None, description="API密钥")
    api_endpoint: Optional[str] = Field(default=None, description="API端点")

class Tool(ToolBase, table=True):
    __tablename__ = "tools"
    
    id: Optional[int] = Field(default=None, primary_key=True, description="主键ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")

class ToolCreate(ToolBase):
    pass

class ToolUpdate(SQLModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200, description="工具标题")
    type: Optional[ToolType] = Field(default=None, description="工具类型")
    tags: Optional[str] = Field(default=None, description="标签（逗号分隔）")
    description: Optional[str] = Field(default=None, description="工具描述")
    system_prompt: Optional[str] = Field(default=None, description="系统提示词")
    api_key: Optional[str] = Field(default=None, description="API密钥")
    api_endpoint: Optional[str] = Field(default=None, description="API端点")

class ToolResponse(ToolBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    @property
    def tag_list(self) -> List[str]:
        """将标签字符串转换为列表"""
        return [tag.strip() for tag in self.tags.split(",") if tag.strip()]