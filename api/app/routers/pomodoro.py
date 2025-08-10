from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, and_
from typing import List, Optional
from datetime import datetime, date

from ..database import get_session as get_db_session
from ..models.pomodoro import (
    PomodoroSession, PomodoroSessionCreate, PomodoroSessionUpdate, PomodoroSessionResponse,
    FocusStats, FocusStatsResponse, PomodoroStatus
)

router = APIRouter(tags=["Pomodoro"])

@router.post("/sessions/", response_model=PomodoroSessionResponse)
def create_session(
    session_data: PomodoroSessionCreate,
    db: Session = Depends(get_db_session)
):
    """创建新的番茄钟会话"""
    session = PomodoroSession.model_validate(session_data.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/", response_model=List[PomodoroSessionResponse])
def get_sessions(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    date_filter: Optional[str] = Query(None, description="按日期过滤 (YYYY-MM-DD)"),
    todo_id: Optional[int] = Query(None, description="按任务ID过滤"),
    db: Session = Depends(get_db_session)
):
    """获取番茄钟会话列表"""
    query = select(PomodoroSession)
    
    # 按日期过滤
    if date_filter:
        try:
            filter_date = datetime.fromisoformat(date_filter).date()
            query = query.where(func.date(PomodoroSession.started_at) == filter_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="日期格式错误，请使用 YYYY-MM-DD")
    
    # 按任务ID过滤
    if todo_id is not None:
        query = query.where(PomodoroSession.todo_id == todo_id)
    
    query = query.offset(skip).limit(limit).order_by(PomodoroSession.started_at.desc())
    sessions = db.exec(query).all()
    return sessions

# 先定义具体路径的路由
@router.get("/sessions/active/")
def get_active_session(db: Session = Depends(get_db_session)):
    """获取当前活跃的番茄钟会话"""
    active_statuses = [PomodoroStatus.WORK, PomodoroStatus.SHORT_BREAK, PomodoroStatus.LONG_BREAK, PomodoroStatus.PAUSED]
    query = select(PomodoroSession).where(
        PomodoroSession.status.in_(active_statuses)
    ).order_by(PomodoroSession.started_at.desc())
    
    session = db.exec(query).first()
    return session

# 然后定义参数化路径的路由
@router.get("/sessions/{session_id}", response_model=PomodoroSessionResponse)
def get_pomodoro_session(session_id: int, db: Session = Depends(get_db_session)):
    """获取单个番茄钟会话"""
    session = db.get(PomodoroSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
    return session

@router.put("/sessions/{session_id}", response_model=PomodoroSessionResponse)
def update_session(
    session_id: int,
    session_update: PomodoroSessionUpdate,
    db: Session = Depends(get_db_session)
):
    """更新番茄钟会话"""
    session = db.get(PomodoroSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
    
    # 更新字段
    update_data = session_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(session, key, value)
    
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    
    # 如果会话完成，更新统计数据
    if session.status == PomodoroStatus.COMPLETED and session.completed_at:
        update_focus_stats(db, session)
    
    return session

@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db_session)):
    """删除番茄钟会话"""
    session = db.get(PomodoroSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
    
    db.delete(session)
    db.commit()
    return {"message": "会话已删除"}

@router.post("/sessions/{session_id}/pause")
def pause_session(session_id: int, db: Session = Depends(get_db_session)):
    """暂停番茄钟会话"""
    session = db.get(PomodoroSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
    
    if session.status not in [PomodoroStatus.WORK, PomodoroStatus.SHORT_BREAK, PomodoroStatus.LONG_BREAK]:
        raise HTTPException(status_code=400, detail="只能暂停进行中的会话")
    
    session.status = PomodoroStatus.PAUSED
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

@router.post("/sessions/{session_id}/resume")
def resume_session(session_id: int, db: Session = Depends(get_db_session)):
    """恢复番茄钟会话"""
    session = db.get(PomodoroSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="会话未找到")
    
    if session.status != PomodoroStatus.PAUSED:
        raise HTTPException(status_code=400, detail="只能恢复已暂停的会话")
    
    # 恢复到之前的状态，这里简化为工作状态
    session.status = PomodoroStatus.WORK
    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session

# 先定义具体路径的统计路由
@router.get("/stats/today/")
def get_today_stats(db: Session = Depends(get_db_session)):
    """获取今日专注统计"""
    today = date.today().isoformat()
    query = select(FocusStats).where(FocusStats.date == today)
    stats = db.exec(query).first()
    
    if not stats:
        # 如果今天还没有统计数据，创建一个空的
        stats = FocusStats(date=today)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    
    return stats

@router.get("/stats/")
def get_focus_stats(
    days: int = Query(7, ge=1, le=365, description="获取最近几天的统计数据"),
    db: Session = Depends(get_db_session)
):
    """获取专注时长统计"""
    end_date = date.today()
    start_date = date.fromordinal(end_date.toordinal() - days + 1)
    
    query = select(FocusStats).where(
        and_(
            FocusStats.date >= start_date.isoformat(),
            FocusStats.date <= end_date.isoformat()
        )
    ).order_by(FocusStats.date.desc())
    
    stats = db.exec(query).all()
    return stats

def update_focus_stats(db: Session, session: PomodoroSession):
    """更新专注时长统计"""
    session_date = session.started_at.date().isoformat()
    
    # 查找或创建当天的统计记录
    stats = db.exec(select(FocusStats).where(FocusStats.date == session_date)).first()
    
    if not stats:
        stats = FocusStats(
            date=session_date,
            total_work_time=session.actual_work_time,
            total_break_time=session.break_time,
            completed_pomodoros=session.completed_cycles,
            total_sessions=1
        )
        db.add(stats)
    else:
        stats.total_work_time += session.actual_work_time
        stats.total_break_time += session.break_time
        stats.completed_pomodoros += session.completed_cycles
        stats.total_sessions += 1
        stats.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(stats)