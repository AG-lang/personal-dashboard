from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, List
from enum import Enum

class CommandCategory(str, Enum):
    """命令分类"""
    GIT = "git"             # Git命令
    DOCKER = "docker"       # Docker命令  
    LINUX = "linux"         # Linux系统命令
    WINDOWS = "windows"     # Windows系统命令
    NODEJS = "nodejs"       # Node.js/npm/pnpm命令
    PYTHON = "python"       # Python相关命令
    DATABASE = "database"   # 数据库命令
    NETWORK = "network"     # 网络命令
    CUSTOM = "custom"       # 自定义命令

class CommandBase(SQLModel):
    """命令基础模型"""
    name: str = Field(min_length=1, max_length=200, description="命令名称")
    command: str = Field(min_length=1, description="完整命令")
    description: str = Field(default="", description="命令描述")
    category: CommandCategory = Field(description="命令分类")
    tags: str = Field(default="", description="标签（逗号分隔）")
    usage_example: Optional[str] = Field(default=None, description="使用示例")
    notes: Optional[str] = Field(default=None, description="注意事项")
    is_dangerous: bool = Field(default=False, description="是否为危险命令")
    use_count: int = Field(default=0, description="使用次数")

class Command(CommandBase, table=True):
    """命令数据表模型"""
    __tablename__ = "commands"
    
    id: Optional[int] = Field(default=None, primary_key=True, description="主键ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")
    last_used_at: Optional[datetime] = Field(default=None, description="最后使用时间")

class CommandCreate(CommandBase):
    """创建命令请求模型"""
    pass

class CommandUpdate(SQLModel):
    """更新命令请求模型"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=200, description="命令名称")
    command: Optional[str] = Field(default=None, min_length=1, description="完整命令")
    description: Optional[str] = Field(default=None, description="命令描述")
    category: Optional[CommandCategory] = Field(default=None, description="命令分类")
    tags: Optional[str] = Field(default=None, description="标签（逗号分隔）")
    usage_example: Optional[str] = Field(default=None, description="使用示例")
    notes: Optional[str] = Field(default=None, description="注意事项")
    is_dangerous: Optional[bool] = Field(default=None, description="是否为危险命令")

class CommandResponse(CommandBase):
    """命令响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime
    last_used_at: Optional[datetime]
    
    @property
    def tag_list(self) -> List[str]:
        """将标签字符串转换为列表"""
        return [tag.strip() for tag in self.tags.split(",") if tag.strip()]

class CommandUseRequest(SQLModel):
    """命令使用记录请求模型"""
    command_id: int = Field(description="命令ID")

class CommandStats(SQLModel):
    """命令统计信息"""
    total_commands: int = Field(description="总命令数")
    total_categories: int = Field(description="分类数")
    most_used_command: Optional[CommandResponse] = Field(description="最常用命令")
    recent_commands: List[CommandResponse] = Field(description="最近使用的命令")
    category_stats: dict = Field(description="分类统计")