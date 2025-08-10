from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_
from typing import List, Optional
from datetime import datetime

from app.database import get_session
from app.models.note import Note, NoteCreate, NoteUpdate, NoteResponse

router = APIRouter()

@router.post("/", response_model=NoteResponse, summary="创建新笔记")
async def create_note(
    note: NoteCreate,
    session: Session = Depends(get_session)
) -> NoteResponse:
    """创建新笔记"""
    db_note = Note.model_validate(note)
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    return NoteResponse.model_validate(db_note)

@router.get("/", response_model=List[NoteResponse], summary="获取笔记列表")
async def get_notes(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    search: Optional[str] = Query(None, description="搜索关键词（标题或内容）"),
    tags: Optional[str] = Query(None, description="标签过滤（逗号分隔）"),
    is_reflection: Optional[bool] = Query(None, description="是否只显示反思笔记"),
    session: Session = Depends(get_session)
) -> List[NoteResponse]:
    """获取笔记列表，支持搜索和过滤"""
    query = select(Note)
    
    # 搜索功能
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Note.title.ilike(search_term),
                Note.content.ilike(search_term)
            )
        )
    
    # 标签过滤
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        for tag in tag_list:
            query = query.where(Note.tags.ilike(f"%{tag}%"))
    
    # 反思笔记过滤
    if is_reflection is not None:
        query = query.where(Note.is_reflection == is_reflection)
    
    # 按更新时间倒序排列
    query = query.order_by(Note.updated_at.desc())
    
    # 应用分页
    query = query.offset(skip).limit(limit)
    
    notes = session.exec(query).all()
    return [NoteResponse.model_validate(note) for note in notes]

@router.get("/{note_id}", response_model=NoteResponse, summary="获取单个笔记")
async def get_note(
    note_id: int,
    session: Session = Depends(get_session)
) -> NoteResponse:
    """根据ID获取单个笔记"""
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    return NoteResponse.model_validate(note)

@router.put("/{note_id}", response_model=NoteResponse, summary="更新笔记")
async def update_note(
    note_id: int,
    note_update: NoteUpdate,
    session: Session = Depends(get_session)
) -> NoteResponse:
    """更新笔记"""
    db_note = session.get(Note, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    
    # 更新字段
    note_data = note_update.model_dump(exclude_unset=True)
    for key, value in note_data.items():
        setattr(db_note, key, value)
    
    # 更新时间戳
    db_note.updated_at = datetime.utcnow()
    
    session.add(db_note)
    session.commit()
    session.refresh(db_note)
    
    return NoteResponse.model_validate(db_note)

@router.delete("/{note_id}", summary="删除笔记")
async def delete_note(
    note_id: int,
    session: Session = Depends(get_session)
) -> dict:
    """删除笔记"""
    note = session.get(Note, note_id)
    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")
    
    session.delete(note)
    session.commit()
    
    return {"message": "笔记已删除"}

@router.get("/tags/", response_model=List[str], summary="获取所有标签")
async def get_all_tags(
    session: Session = Depends(get_session)
) -> List[str]:
    """获取所有已使用的标签"""
    notes = session.exec(select(Note.tags)).all()
    tags = set()
    
    for note_tags in notes:
        if note_tags:
            for tag in note_tags.split(","):
                tag = tag.strip()
                if tag:
                    tags.add(tag)
    
    return sorted(list(tags))