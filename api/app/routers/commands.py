from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_, func
from typing import List, Optional
from datetime import datetime

from app.database import get_session
from app.models.command import (
    Command, CommandCreate, CommandUpdate, CommandResponse, CommandCategory,
    CommandUseRequest, CommandStats
)

router = APIRouter()

@router.post("/", response_model=CommandResponse, summary="创建新命令")
async def create_command(
    command: CommandCreate,
    session: Session = Depends(get_session)
) -> CommandResponse:
    """创建新命令"""
    db_command = Command.model_validate(command)
    session.add(db_command)
    session.commit()
    session.refresh(db_command)
    return CommandResponse.model_validate(db_command)

@router.get("/", response_model=List[CommandResponse], summary="获取命令列表")
async def get_commands(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    search: Optional[str] = Query(None, description="搜索关键词（名称、命令或描述）"),
    category: Optional[CommandCategory] = Query(None, description="分类过滤"),
    tags: Optional[str] = Query(None, description="标签过滤（逗号分隔）"),
    is_dangerous: Optional[bool] = Query(None, description="是否为危险命令"),
    sort_by: str = Query("updated_at", description="排序字段（updated_at、use_count、name）"),
    sort_desc: bool = Query(True, description="是否降序排列"),
    session: Session = Depends(get_session)
) -> List[CommandResponse]:
    """获取命令列表，支持搜索和过滤"""
    query = select(Command)
    
    # 搜索功能
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Command.name.ilike(search_term),
                Command.command.ilike(search_term),
                Command.description.ilike(search_term)
            )
        )
    
    # 分类过滤
    if category is not None:
        query = query.where(Command.category == category)
    
    # 标签过滤
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        for tag in tag_list:
            query = query.where(Command.tags.ilike(f"%{tag}%"))
    
    # 危险命令过滤
    if is_dangerous is not None:
        query = query.where(Command.is_dangerous == is_dangerous)
    
    # 排序
    sort_column = getattr(Command, sort_by, Command.updated_at)
    if sort_desc:
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column)
    
    # 应用分页
    query = query.offset(skip).limit(limit)
    
    commands = session.exec(query).all()
    return [CommandResponse.model_validate(command) for command in commands]

@router.get("/{command_id}", response_model=CommandResponse, summary="获取单个命令")
async def get_command(
    command_id: int,
    session: Session = Depends(get_session)
) -> CommandResponse:
    """根据ID获取单个命令"""
    command = session.get(Command, command_id)
    if not command:
        raise HTTPException(status_code=404, detail="命令不存在")
    return CommandResponse.model_validate(command)

@router.put("/{command_id}", response_model=CommandResponse, summary="更新命令")
async def update_command(
    command_id: int,
    command_update: CommandUpdate,
    session: Session = Depends(get_session)
) -> CommandResponse:
    """更新命令"""
    db_command = session.get(Command, command_id)
    if not db_command:
        raise HTTPException(status_code=404, detail="命令不存在")
    
    # 更新字段
    command_data = command_update.model_dump(exclude_unset=True)
    for key, value in command_data.items():
        setattr(db_command, key, value)
    
    # 更新时间戳
    db_command.updated_at = datetime.utcnow()
    
    session.add(db_command)
    session.commit()
    session.refresh(db_command)
    
    return CommandResponse.model_validate(db_command)

@router.delete("/{command_id}", summary="删除命令")
async def delete_command(
    command_id: int,
    session: Session = Depends(get_session)
) -> dict:
    """删除命令"""
    command = session.get(Command, command_id)
    if not command:
        raise HTTPException(status_code=404, detail="命令不存在")
    
    session.delete(command)
    session.commit()
    
    return {"message": "命令已删除"}

@router.post("/{command_id}/use", summary="记录命令使用")
async def use_command(
    command_id: int,
    session: Session = Depends(get_session)
) -> dict:
    """记录命令使用，增加使用次数并更新最后使用时间"""
    command = session.get(Command, command_id)
    if not command:
        raise HTTPException(status_code=404, detail="命令不存在")
    
    command.use_count += 1
    command.last_used_at = datetime.utcnow()
    
    session.add(command)
    session.commit()
    
    return {"message": "使用记录已更新", "use_count": command.use_count}

@router.get("/stats/overview", response_model=CommandStats, summary="获取命令统计")
async def get_command_stats(
    session: Session = Depends(get_session)
) -> CommandStats:
    """获取命令统计信息"""
    
    # 总命令数
    total_commands = session.exec(select(func.count(Command.id))).first() or 0
    
    # 分类统计
    category_stats = {}
    for category in CommandCategory:
        count = session.exec(
            select(func.count(Command.id)).where(Command.category == category)
        ).first() or 0
        if count > 0:
            category_stats[category.value] = count
    
    total_categories = len(category_stats)
    
    # 最常用命令
    most_used_command = None
    most_used_result = session.exec(
        select(Command).where(Command.use_count > 0).order_by(Command.use_count.desc()).limit(1)
    ).first()
    if most_used_result:
        most_used_command = CommandResponse.model_validate(most_used_result)
    
    # 最近使用的命令（前10个）
    recent_commands_result = session.exec(
        select(Command)
        .where(Command.last_used_at.is_not(None))
        .order_by(Command.last_used_at.desc())
        .limit(10)
    ).all()
    recent_commands = [CommandResponse.model_validate(cmd) for cmd in recent_commands_result]
    
    return CommandStats(
        total_commands=total_commands,
        total_categories=total_categories,
        most_used_command=most_used_command,
        recent_commands=recent_commands,
        category_stats=category_stats
    )

@router.get("/categories/", response_model=List[str], summary="获取所有分类")
async def get_command_categories() -> List[str]:
    """获取所有可用的命令分类"""
    return [category.value for category in CommandCategory]

@router.get("/tags/", response_model=List[str], summary="获取所有标签")
async def get_all_tags(
    session: Session = Depends(get_session)
) -> List[str]:
    """获取所有已使用的标签"""
    commands = session.exec(select(Command.tags)).all()
    tags = set()
    
    for command_tags in commands:
        if command_tags:
            for tag in command_tags.split(","):
                tag = tag.strip()
                if tag:
                    tags.add(tag)
    
    return sorted(list(tags))

@router.get("/frequent/", response_model=List[CommandResponse], summary="获取常用命令")
async def get_frequent_commands(
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    session: Session = Depends(get_session)
) -> List[CommandResponse]:
    """获取使用频率最高的命令"""
    commands = session.exec(
        select(Command)
        .where(Command.use_count > 0)
        .order_by(Command.use_count.desc())
        .limit(limit)
    ).all()
    
    return [CommandResponse.model_validate(command) for command in commands]

@router.get("/recent/", response_model=List[CommandResponse], summary="获取最近使用的命令")
async def get_recent_commands(
    limit: int = Query(20, ge=1, le=100, description="返回的记录数"),
    session: Session = Depends(get_session)
) -> List[CommandResponse]:
    """获取最近使用的命令"""
    commands = session.exec(
        select(Command)
        .where(Command.last_used_at.is_not(None))
        .order_by(Command.last_used_at.desc())
        .limit(limit)
    ).all()
    
    return [CommandResponse.model_validate(command) for command in commands]