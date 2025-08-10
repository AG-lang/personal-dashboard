from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, or_
from typing import List, Optional
from datetime import datetime

from app.database import get_session
from app.models.tool import Tool, ToolCreate, ToolUpdate, ToolResponse, ToolType

router = APIRouter()

@router.post("/", response_model=ToolResponse, summary="创建新工具")
async def create_tool(
    tool: ToolCreate,
    session: Session = Depends(get_session)
) -> ToolResponse:
    """创建新工具"""
    db_tool = Tool.model_validate(tool)
    session.add(db_tool)
    session.commit()
    session.refresh(db_tool)
    return ToolResponse.model_validate(db_tool)

@router.get("/", response_model=List[ToolResponse], summary="获取工具列表")
async def get_tools(
    skip: int = Query(0, ge=0, description="跳过的记录数"),
    limit: int = Query(100, ge=1, le=1000, description="返回的记录数"),
    search: Optional[str] = Query(None, description="搜索关键词（标题或描述）"),
    tags: Optional[str] = Query(None, description="标签过滤（逗号分隔）"),
    tool_type: Optional[ToolType] = Query(None, description="工具类型过滤"),
    session: Session = Depends(get_session)
) -> List[ToolResponse]:
    """获取工具列表，支持搜索和过滤"""
    query = select(Tool)
    
    # 搜索功能
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Tool.title.ilike(search_term),
                Tool.description.ilike(search_term),
                Tool.system_prompt.ilike(search_term)
            )
        )
    
    # 标签过滤
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        for tag in tag_list:
            query = query.where(Tool.tags.ilike(f"%{tag}%"))
    
    # 工具类型过滤
    if tool_type is not None:
        query = query.where(Tool.type == tool_type)
    
    # 按更新时间倒序排列
    query = query.order_by(Tool.updated_at.desc())
    
    # 应用分页
    query = query.offset(skip).limit(limit)
    
    tools = session.exec(query).all()
    return [ToolResponse.model_validate(tool) for tool in tools]

@router.get("/{tool_id}", response_model=ToolResponse, summary="获取单个工具")
async def get_tool(
    tool_id: int,
    session: Session = Depends(get_session)
) -> ToolResponse:
    """根据ID获取单个工具"""
    tool = session.get(Tool, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    return ToolResponse.model_validate(tool)

@router.put("/{tool_id}", response_model=ToolResponse, summary="更新工具")
async def update_tool(
    tool_id: int,
    tool_update: ToolUpdate,
    session: Session = Depends(get_session)
) -> ToolResponse:
    """更新工具"""
    db_tool = session.get(Tool, tool_id)
    if not db_tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    
    # 更新字段
    tool_data = tool_update.model_dump(exclude_unset=True)
    for key, value in tool_data.items():
        setattr(db_tool, key, value)
    
    # 更新时间戳
    db_tool.updated_at = datetime.utcnow()
    
    session.add(db_tool)
    session.commit()
    session.refresh(db_tool)
    
    return ToolResponse.model_validate(db_tool)

@router.delete("/{tool_id}", summary="删除工具")
async def delete_tool(
    tool_id: int,
    session: Session = Depends(get_session)
) -> dict:
    """删除工具"""
    tool = session.get(Tool, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="工具不存在")
    
    session.delete(tool)
    session.commit()
    
    return {"message": "工具已删除"}

@router.get("/tags/", response_model=List[str], summary="获取所有标签")
async def get_all_tags(
    session: Session = Depends(get_session)
) -> List[str]:
    """获取所有已使用的标签"""
    tools = session.exec(select(Tool.tags)).all()
    tags = set()
    
    for tool_tags in tools:
        if tool_tags:
            for tag in tool_tags.split(","):
                tag = tag.strip()
                if tag:
                    tags.add(tag)
    
    return sorted(list(tags))

@router.get("/types/", response_model=List[str], summary="获取所有工具类型")
async def get_tool_types() -> List[str]:
    """获取所有可用的工具类型"""
    return [tool_type.value for tool_type in ToolType]