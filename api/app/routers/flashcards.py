from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_, or_, text
from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any
from functools import lru_cache

from ..database import get_session
from ..models.flashcard import (
    Flashcard, FlashcardCreate, FlashcardUpdate, FlashcardResponse,
    FlashcardDifficulty, FlashcardStatus, LeitnerBox,
    ReviewRecord, ReviewRecordCreate, ReviewRecordResponse,
    StudyStats, StudyStatsResponse
)
from ..services.spaced_repetition import SpacedRepetitionAlgorithm
from ..middleware.cache import cache_response, invalidate_cache_pattern

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.get("/", response_model=Dict[str, Any])
def get_flashcards(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    status: Optional[FlashcardStatus] = Query(None, description="按状态过滤"),
    category: Optional[str] = Query(None, description="按分类过滤"),
    tags: Optional[str] = Query(None, description="按标签过滤"),
    due_only: bool = Query(False, description="只显示到期需要复习的卡片"),
    search: Optional[str] = Query(None, description="搜索卡片内容"),
    session: Session = Depends(get_session)
):
    """获取记忆卡片列表（优化版本）"""
    
    # 构建基础查询
    query = select(Flashcard)
    conditions = []
    
    # 优化过滤条件构建
    if status:
        conditions.append(Flashcard.status == status)
    
    if category:
        conditions.append(Flashcard.category == category)
    
    if tags:
        # 使用全文搜索优化标签搜索
        conditions.append(Flashcard.tags.contains(tags))
    
    if due_only:
        now = datetime.now(timezone.utc)
        conditions.append(Flashcard.due_date <= now)
    
    if search:
        # 优化搜索查询，使用索引
        search_term = f"%{search}%"
        search_condition = or_(
            Flashcard.front.ilike(search_term),
            Flashcard.back.ilike(search_term)
        )
        conditions.append(search_condition)
    
    # 应用所有条件
    if conditions:
        query = query.where(and_(*conditions))
    
    # 计算总数（对于分页）
    count_query = select(func.count(Flashcard.id))
    if conditions:
        count_query = count_query.where(and_(*conditions))
    
    total_count = session.exec(count_query).one()
    
    # 执行主查询，优化排序
    query = query.order_by(
        Flashcard.due_date.asc(),
        Flashcard.status.asc(),
        Flashcard.created_at.desc()
    )
    query = query.offset(skip).limit(limit)
    
    flashcards = session.exec(query).all()
    
    return {
        "data": flashcards,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_more": total_count > skip + limit
    }


@router.get("/due", response_model=List[FlashcardResponse])
def get_due_flashcards(
    limit: int = Query(50, ge=1, le=200, description="返回的记录数"),
    session: Session = Depends(get_session)
):
    """获取今日到期的卡片（优化版本）"""
    now = datetime.now(timezone.utc)
    
    # 使用复合索引优化查询
    query = select(Flashcard).where(
        and_(
            Flashcard.due_date <= now,
            Flashcard.status.in_([
                FlashcardStatus.NEW,
                FlashcardStatus.LEARNING,
                FlashcardStatus.REVIEWING,
                FlashcardStatus.RELEARNING
            ])
        )
    ).order_by(
        Flashcard.due_date.asc(),
        Flashcard.leitner_box.desc()  # 高级盒子优先
    ).limit(limit)
    
    flashcards = session.exec(query).all()
    return flashcards


@router.get("/stats", response_model=dict)
@cache_response(ttl=120)  # 缓存2分钟
def get_flashcard_stats(session: Session = Depends(get_session)):
    """获取卡片统计信息（优化版本）"""
    
    # 使用单个查询获取大部分统计信息
    stats_query = text("""
        SELECT 
            COUNT(*) as total_cards,
            COUNT(CASE WHEN due_date <= :now THEN 1 END) as due_cards,
            COUNT(CASE WHEN status = 'new' THEN 1 END) as new_cards,
            COUNT(CASE WHEN status = 'learning' THEN 1 END) as learning_cards,
            COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing_cards,
            COUNT(CASE WHEN status = 'relearning' THEN 1 END) as relearning_cards,
            COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_cards,
            COUNT(CASE WHEN status = 'buried' THEN 1 END) as buried_cards,
            COUNT(CASE WHEN leitner_box = 'box_1' THEN 1 END) as box_1_count,
            COUNT(CASE WHEN leitner_box = 'box_2' THEN 1 END) as box_2_count,
            COUNT(CASE WHEN leitner_box = 'box_3' THEN 1 END) as box_3_count,
            COUNT(CASE WHEN leitner_box = 'box_4' THEN 1 END) as box_4_count,
            COUNT(CASE WHEN leitner_box = 'box_5' THEN 1 END) as box_5_count,
            COUNT(CASE WHEN leitner_box = 'box_6' THEN 1 END) as box_6_count,
            COUNT(CASE WHEN leitner_box = 'box_7' THEN 1 END) as box_7_count,
            AVG(CASE WHEN total_reviews > 0 THEN (correct_reviews * 100.0 / total_reviews) END) as avg_retention
        FROM flashcards
    """)
    
    result = session.exec(stats_query, {"now": datetime.now(timezone.utc)}).first()
    
    return {
        "total_cards": result.total_cards,
        "due_cards": result.due_cards,
        "status_distribution": {
            "new": result.new_cards,
            "learning": result.learning_cards,
            "reviewing": result.reviewing_cards,
            "relearning": result.relearning_cards,
            "suspended": result.suspended_cards,
            "buried": result.buried_cards,
        },
        "leitner_distribution": {
            "box_1": result.box_1_count,
            "box_2": result.box_2_count,
            "box_3": result.box_3_count,
            "box_4": result.box_4_count,
            "box_5": result.box_5_count,
            "box_6": result.box_6_count,
            "box_7": result.box_7_count,
        },
        "average_retention_rate": round(result.avg_retention or 0, 2),
        "review_distribution": SpacedRepetitionAlgorithm.get_review_distribution(result.total_cards)
    }


@router.get("/categories", response_model=Dict[str, List[str]])
@cache_response(ttl=600)  # 缓存10分钟
def get_categories(session: Session = Depends(get_session)):
    """获取所有分类（缓存优化）"""
    
    # 使用原生SQL优化查询
    categories_query = text("""
        SELECT DISTINCT category 
        FROM flashcards 
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category
    """)
    
    result = session.exec(categories_query).all()
    categories = [cat for cat in result if cat]
    
    return {"data": categories}


@router.get("/tags", response_model=Dict[str, List[str]])
@cache_response(ttl=600)  # 缓存10分钟  
def get_tags(session: Session = Depends(get_session)):
    """获取所有标签（优化版本）"""
    
    # 优化标签提取查询
    tags_query = text("""
        SELECT tags 
        FROM flashcards 
        WHERE tags IS NOT NULL AND tags != ''
    """)
    
    tags_result = session.exec(tags_query).all()
    
    all_tags = set()
    for tags_str in tags_result:
        if tags_str:
            tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()]
            all_tags.update(tags)
    
    return {"data": sorted(list(all_tags))}


@router.post("/", response_model=FlashcardResponse)
def create_flashcard(
    flashcard_data: FlashcardCreate,
    session: Session = Depends(get_session)
):
    """创建新的记忆卡片"""
    flashcard = Flashcard(**flashcard_data.model_dump())
    flashcard.created_at = datetime.now(timezone.utc)
    flashcard.updated_at = datetime.now(timezone.utc)
    
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    
    # 清理相关缓存
    invalidate_cache_pattern("stats")
    invalidate_cache_pattern("categories")
    invalidate_cache_pattern("tags")
    
    return flashcard


@router.get("/{flashcard_id}", response_model=FlashcardResponse)
def get_flashcard(flashcard_id: int, session: Session = Depends(get_session)):
    """获取指定的记忆卡片"""
    flashcard = session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="卡片未找到")
    return flashcard


@router.put("/{flashcard_id}", response_model=FlashcardResponse)
def update_flashcard(
    flashcard_id: int,
    flashcard_data: FlashcardUpdate,
    session: Session = Depends(get_session)
):
    """更新记忆卡片"""
    flashcard = session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="卡片未找到")
    
    update_data = flashcard_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(flashcard, field, value)
    
    flashcard.updated_at = datetime.now(timezone.utc)
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    
    # 清理相关缓存
    invalidate_cache_pattern("stats")
    invalidate_cache_pattern("categories") 
    invalidate_cache_pattern("tags")
    
    return flashcard


@router.delete("/{flashcard_id}")
def delete_flashcard(flashcard_id: int, session: Session = Depends(get_session)):
    """删除记忆卡片（优化版本）"""
    flashcard = session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="卡片未找到")
    
    # 使用批量删除优化相关记录删除
    session.exec(
        text("DELETE FROM review_records WHERE flashcard_id = :flashcard_id"),
        {"flashcard_id": flashcard_id}
    )
    
    session.delete(flashcard)
    session.commit()
    
    # 清理相关缓存
    invalidate_cache_pattern("stats")
    invalidate_cache_pattern("categories")
    invalidate_cache_pattern("tags")
    
    return {"message": "卡片已删除"}


@router.post("/{flashcard_id}/review", response_model=dict)
def review_flashcard(
    flashcard_id: int,
    review_data: ReviewRecordCreate,
    session: Session = Depends(get_session)
):
    """复习记忆卡片（优化版本）"""
    flashcard = session.get(Flashcard, flashcard_id)
    if not flashcard:
        raise HTTPException(status_code=404, detail="卡片未找到")
    
    # 保存复习前的状态
    old_ease_factor = flashcard.ease_factor
    old_interval = flashcard.interval
    old_repetitions = flashcard.repetitions
    old_leitner_box = flashcard.leitner_box
    
    # 使用间隔重复算法更新卡片
    updated_flashcard = SpacedRepetitionAlgorithm.update_flashcard_after_review(
        flashcard, review_data.difficulty, review_data.response_time
    )
    
    # 创建复习记录
    review_record = ReviewRecord(
        flashcard_id=flashcard_id,
        difficulty=review_data.difficulty,
        response_time=review_data.response_time,
        old_ease_factor=old_ease_factor,
        old_interval=old_interval,
        old_repetitions=old_repetitions,
        old_leitner_box=old_leitner_box,
        new_ease_factor=updated_flashcard.ease_factor,
        new_interval=updated_flashcard.interval,
        new_repetitions=updated_flashcard.repetitions,
        new_leitner_box=updated_flashcard.leitner_box,
        next_due_date=updated_flashcard.due_date
    )
    
    # 更新今日学习统计 - 使用 UPSERT 优化
    today_str = date.today().isoformat()
    
    # 使用原生SQL优化统计更新
    upsert_stats_query = text("""
        INSERT INTO study_stats (date, new_cards, reviewed_cards, correct_cards, created_at, updated_at)
        VALUES (:date, :new_cards, :reviewed_cards, :correct_cards, :now, :now)
        ON CONFLICT (date) DO UPDATE SET
            new_cards = study_stats.new_cards + :new_cards,
            reviewed_cards = study_stats.reviewed_cards + :reviewed_cards,
            correct_cards = study_stats.correct_cards + :correct_cards,
            updated_at = :now
    """)
    
    is_new_card = updated_flashcard.status == FlashcardStatus.NEW or old_repetitions == 0
    is_correct = review_data.difficulty != FlashcardDifficulty.AGAIN
    now = datetime.now(timezone.utc)
    
    session.exec(upsert_stats_query, {
        "date": today_str,
        "new_cards": 1 if is_new_card else 0,
        "reviewed_cards": 0 if is_new_card else 1,
        "correct_cards": 1 if is_correct else 0,
        "now": now
    })
    
    # 批量更新Leitner盒子统计
    update_leitner_stats_query = text("""
        UPDATE study_stats SET
            box_1_count = (SELECT COUNT(*) FROM flashcards WHERE leitner_box = 'box_1'),
            box_2_count = (SELECT COUNT(*) FROM flashcards WHERE leitner_box = 'box_2'),
            box_3_count = (SELECT COUNT(*) FROM flashcards WHERE leitner_box = 'box_3'),
            box_4_count = (SELECT COUNT(*) FROM flashcards WHERE leitner_box = 'box_4'),
            box_5_count = (SELECT COUNT(*) FROM flashcards WHERE leitner_box = 'box_5'),
            box_6_count = (SELECT COUNT(*) FROM flashcards WHERE leitner_box = 'box_6'),
            box_7_count = (SELECT COUNT(*) FROM flashcards WHERE leitner_box = 'box_7'),
            updated_at = :now
        WHERE date = :date
    """)
    
    session.exec(update_leitner_stats_query, {
        "date": today_str,
        "now": now
    })
    
    session.add(updated_flashcard)
    session.add(review_record)
    session.commit()
    session.refresh(updated_flashcard)
    session.refresh(review_record)
    
    return {
        "flashcard": updated_flashcard,
        "review_record": review_record,
        "next_due_date": updated_flashcard.due_date.isoformat(),
        "retention_rate": SpacedRepetitionAlgorithm.calculate_retention_rate(
            updated_flashcard.correct_reviews,
            updated_flashcard.total_reviews
        )
    }


@router.get("/{flashcard_id}/reviews", response_model=List[ReviewRecordResponse])
def get_flashcard_reviews(
    flashcard_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session)
):
    """获取卡片的复习历史（优化版本）"""
    # 验证卡片存在（优化：只检查ID存在）
    exists = session.exec(
        select(func.count(Flashcard.id)).where(Flashcard.id == flashcard_id)
    ).one()
    
    if not exists:
        raise HTTPException(status_code=404, detail="卡片未找到")
    
    # 使用索引优化的查询
    query = select(ReviewRecord).where(
        ReviewRecord.flashcard_id == flashcard_id
    ).order_by(
        ReviewRecord.reviewed_at.desc()
    ).offset(skip).limit(limit)
    
    reviews = session.exec(query).all()
    return reviews


@router.get("/study-stats/{date_str}", response_model=StudyStatsResponse)
def get_study_stats(date_str: str, session: Session = Depends(get_session)):
    """获取指定日期的学习统计"""
    stats = session.exec(
        select(StudyStats).where(StudyStats.date == date_str)
    ).first()
    
    if not stats:
        raise HTTPException(status_code=404, detail="该日期没有学习记录")
    
    return stats


@router.get("/study-stats/range/{start_date}/{end_date}", response_model=List[StudyStatsResponse])
def get_study_stats_range(
    start_date: str,
    end_date: str,
    session: Session = Depends(get_session)
):
    """获取日期范围内的学习统计（优化版本）"""
    query = select(StudyStats).where(
        and_(
            StudyStats.date >= start_date,
            StudyStats.date <= end_date
        )
    ).order_by(StudyStats.date.asc())
    
    stats_list = session.exec(query).all()
    return stats_list


@router.post("/batch-import", response_model=dict)
def batch_import_flashcards(
    flashcards_data: List[FlashcardCreate],
    session: Session = Depends(get_session)
):
    """批量导入记忆卡片（优化版本）"""
    if len(flashcards_data) > 1000:
        raise HTTPException(status_code=400, detail="单次导入数量不能超过1000张卡片")
    
    created_cards = []
    now = datetime.now(timezone.utc)
    
    # 批量创建卡片
    for card_data in flashcards_data:
        flashcard = Flashcard(**card_data.model_dump())
        flashcard.created_at = now
        flashcard.updated_at = now
        session.add(flashcard)
        created_cards.append(flashcard)
    
    # 批量提交
    session.commit()
    
    # 批量刷新
    for card in created_cards:
        session.refresh(card)
    
    return {
        "message": f"成功导入 {len(created_cards)} 张卡片",
        "imported_count": len(created_cards),
        "cards": created_cards[:10]  # 只返回前10张卡片预览
    }