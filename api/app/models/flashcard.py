from sqlmodel import SQLModel, Field, Index
from datetime import datetime, timezone
from typing import Optional
from enum import Enum


class FlashcardDifficulty(str, Enum):
    """记忆卡片难度等级"""
    AGAIN = "again"      # 重新学习 (0-1分) - 红色
    HARD = "hard"        # 困难 (2-3分) - 橙色
    GOOD = "good"        # 良好 (4-5分) - 绿色  
    EASY = "easy"        # 简单 (6分) - 蓝色


class FlashcardStatus(str, Enum):
    """记忆卡片状态"""
    NEW = "new"          # 新卡片
    LEARNING = "learning"  # 学习中
    REVIEWING = "reviewing"  # 复习中
    RELEARNING = "relearning"  # 重新学习
    SUSPENDED = "suspended"  # 暂停
    BURIED = "buried"     # 搁置


class LeitnerBox(str, Enum):
    """Leitner盒子等级"""
    BOX_1 = "box_1"  # 第1盒：每天复习
    BOX_2 = "box_2"  # 第2盒：每2天复习
    BOX_3 = "box_3"  # 第3盒：每4天复习
    BOX_4 = "box_4"  # 第4盒：每周复习
    BOX_5 = "box_5"  # 第5盒：每2周复习
    BOX_6 = "box_6"  # 第6盒：每月复习
    BOX_7 = "box_7"  # 第7盒：每3个月复习


class FlashcardBase(SQLModel):
    """记忆卡片基础模型"""
    front: str = Field(description="卡片正面内容", index=True)
    back: str = Field(description="卡片背面内容", index=True)
    tags: Optional[str] = Field(default=None, description="标签，用逗号分隔", index=True)
    category: Optional[str] = Field(default=None, description="分类", index=True)
    
    # 间隔重复算法相关字段
    ease_factor: float = Field(default=2.5, description="难易度系数（默认2.5）")
    interval: int = Field(default=1, description="复习间隔（天数）", index=True)
    repetitions: int = Field(default=0, description="复习次数")
    
    # 状态管理
    status: FlashcardStatus = Field(default=FlashcardStatus.NEW, description="卡片状态", index=True)
    leitner_box: LeitnerBox = Field(default=LeitnerBox.BOX_1, description="Leitner盒子等级", index=True)
    
    # 时间相关
    due_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), 
        description="下次复习时间",
        index=True
    )
    last_review: Optional[datetime] = Field(default=None, description="最后复习时间", index=True)
    
    # 统计信息
    total_reviews: int = Field(default=0, description="总复习次数", index=True)
    correct_reviews: int = Field(default=0, description="正确复习次数")
    streak: int = Field(default=0, description="连续正确次数")
    max_streak: int = Field(default=0, description="最大连续正确次数")


class Flashcard(FlashcardBase, table=True):
    """记忆卡片表模型"""
    __tablename__ = "flashcards"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)

    # 复合索引优化常用查询
    __table_args__ = (
        Index("idx_flashcard_due_status", "due_date", "status"),
        Index("idx_flashcard_category_status", "category", "status"), 
        Index("idx_flashcard_leitner_status", "leitner_box", "status"),
        Index("idx_flashcard_created_status", "created_at", "status"),
        Index("idx_flashcard_reviews_status", "total_reviews", "status"),
    )


class FlashcardCreate(FlashcardBase):
    """创建记忆卡片的请求模型"""
    pass


class FlashcardUpdate(SQLModel):
    """更新记忆卡片的请求模型"""
    front: Optional[str] = None
    back: Optional[str] = None
    tags: Optional[str] = None
    category: Optional[str] = None
    ease_factor: Optional[float] = None
    interval: Optional[int] = None
    repetitions: Optional[int] = None
    status: Optional[FlashcardStatus] = None
    leitner_box: Optional[LeitnerBox] = None
    due_date: Optional[datetime] = None


class FlashcardResponse(FlashcardBase):
    """记忆卡片响应模型"""
    id: int
    created_at: datetime
    updated_at: datetime


class ReviewRecord(SQLModel, table=True):
    """复习记录表"""
    __tablename__ = "review_records"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    flashcard_id: int = Field(foreign_key="flashcards.id", description="关联的卡片ID", index=True)
    
    # 复习结果
    difficulty: FlashcardDifficulty = Field(description="复习难度评价", index=True)
    response_time: int = Field(description="响应时间（毫秒）")
    
    # 算法状态（复习前）
    old_ease_factor: float = Field(description="复习前的难易度系数")
    old_interval: int = Field(description="复习前的间隔")
    old_repetitions: int = Field(description="复习前的重复次数")
    old_leitner_box: LeitnerBox = Field(description="复习前的Leitner盒子")
    
    # 算法状态（复习后）
    new_ease_factor: float = Field(description="复习后的难易度系数")
    new_interval: int = Field(description="复习后的间隔")
    new_repetitions: int = Field(description="复习后的重复次数")
    new_leitner_box: LeitnerBox = Field(description="复习后的Leitner盒子")
    
    # 时间信息
    reviewed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    next_due_date: datetime = Field(description="下次复习时间", index=True)

    # 复合索引优化查询
    __table_args__ = (
        Index("idx_review_flashcard_date", "flashcard_id", "reviewed_at"),
        Index("idx_review_difficulty_date", "difficulty", "reviewed_at"),
    )


class ReviewRecordCreate(SQLModel):
    """创建复习记录的请求模型"""
    flashcard_id: int
    difficulty: FlashcardDifficulty
    response_time: int


class ReviewRecordResponse(SQLModel):
    """复习记录响应模型"""
    id: int
    flashcard_id: int
    difficulty: FlashcardDifficulty
    response_time: int
    old_ease_factor: float
    old_interval: int
    old_repetitions: int
    old_leitner_box: LeitnerBox
    new_ease_factor: float
    new_interval: int
    new_repetitions: int
    new_leitner_box: LeitnerBox
    reviewed_at: datetime
    next_due_date: datetime


class StudyStats(SQLModel, table=True):
    """学习统计表"""
    __tablename__ = "study_stats"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    date: str = Field(description="统计日期 (YYYY-MM-DD)", index=True, unique=True)
    
    # 复习统计
    new_cards: int = Field(default=0, description="新卡片数量")
    reviewed_cards: int = Field(default=0, description="复习卡片数量")
    correct_cards: int = Field(default=0, description="答对卡片数量")
    
    # 时间统计
    study_time: int = Field(default=0, description="学习时间（分钟）")
    average_response_time: float = Field(default=0.0, description="平均响应时间（秒）")
    
    # Leitner盒子统计
    box_1_count: int = Field(default=0, description="盒子1的卡片数量")
    box_2_count: int = Field(default=0, description="盒子2的卡片数量")
    box_3_count: int = Field(default=0, description="盒子3的卡片数量")
    box_4_count: int = Field(default=0, description="盒子4的卡片数量")
    box_5_count: int = Field(default=0, description="盒子5的卡片数量")
    box_6_count: int = Field(default=0, description="盒子6的卡片数量")
    box_7_count: int = Field(default=0, description="盒子7的卡片数量")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True)


class StudyStatsResponse(SQLModel):
    """学习统计响应模型"""
    id: int
    date: str
    new_cards: int
    reviewed_cards: int
    correct_cards: int
    study_time: int
    average_response_time: float
    box_1_count: int
    box_2_count: int
    box_3_count: int
    box_4_count: int
    box_5_count: int
    box_6_count: int
    box_7_count: int
    created_at: datetime
    updated_at: datetime