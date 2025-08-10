from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class PomodoroStatus(str, Enum):
    WORK = "work"           # 工作时间
    SHORT_BREAK = "short_break"  # 短休息
    LONG_BREAK = "long_break"    # 长休息
    PAUSED = "paused"       # 暂停
    COMPLETED = "completed"  # 完成

class PomodoroSessionBase(SQLModel):
    todo_id: Optional[int] = Field(default=None, description="关联的任务ID")
    duration_minutes: int = Field(default=25, description="持续时间（分钟）")
    status: PomodoroStatus = Field(default=PomodoroStatus.WORK, description="当前状态")
    actual_work_time: int = Field(default=0, description="实际工作时间（秒）")
    break_time: int = Field(default=0, description="休息时间（秒）")
    completed_cycles: int = Field(default=0, description="已完成的番茄钟周期")
    notes: str = Field(default="", description="会话笔记")

class PomodoroSession(PomodoroSessionBase, table=True):
    __tablename__ = "pomodoro_sessions"
    
    id: Optional[int] = Field(default=None, primary_key=True, description="主键ID")
    started_at: datetime = Field(default_factory=datetime.utcnow, description="开始时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")
    completed_at: Optional[datetime] = Field(default=None, description="完成时间")

class PomodoroSessionCreate(PomodoroSessionBase):
    pass

class PomodoroSessionUpdate(SQLModel):
    todo_id: Optional[int] = Field(default=None, description="关联的任务ID")
    duration_minutes: Optional[int] = Field(default=None, description="持续时间（分钟）")
    status: Optional[PomodoroStatus] = Field(default=None, description="当前状态")
    actual_work_time: Optional[int] = Field(default=None, description="实际工作时间（秒）")
    break_time: Optional[int] = Field(default=None, description="休息时间（秒）")
    completed_cycles: Optional[int] = Field(default=None, description="已完成的番茄钟周期")
    notes: Optional[str] = Field(default=None, description="会话笔记")
    completed_at: Optional[datetime] = Field(default=None, description="完成时间")

class PomodoroSessionResponse(PomodoroSessionBase):
    id: int
    started_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

# 专注时长统计模型
class FocusStatsBase(SQLModel):
    date: str = Field(description="日期 (YYYY-MM-DD)")
    total_work_time: int = Field(default=0, description="总工作时间（秒）")
    total_break_time: int = Field(default=0, description="总休息时间（秒）")
    completed_pomodoros: int = Field(default=0, description="完成的番茄钟数量")
    total_sessions: int = Field(default=0, description="总会话数")

class FocusStats(FocusStatsBase, table=True):
    __tablename__ = "focus_stats"
    
    id: Optional[int] = Field(default=None, primary_key=True, description="主键ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="创建时间")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="更新时间")

class FocusStatsResponse(FocusStatsBase):
    id: int
    created_at: datetime
    updated_at: datetime