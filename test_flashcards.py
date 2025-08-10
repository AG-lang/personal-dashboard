#!/usr/bin/env python3
"""
测试记忆卡片系统的脚本
这个脚本会创建一些示例卡片来测试系统功能
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'api'))

from datetime import datetime, timezone
from app.database import get_session, create_db_and_tables
from app.models.flashcard import (
    Flashcard, FlashcardCreate, FlashcardStatus, LeitnerBox,
    ReviewRecord, StudyStats
)
from app.services.spaced_repetition import SpacedRepetitionAlgorithm

def create_sample_flashcards():
    """创建示例记忆卡片"""
    print("创建数据库表...")
    create_db_and_tables()
    
    print("创建示例记忆卡片...")
    
    sample_cards = [
        {
            "front": "什么是艾宾浩斯遗忘曲线？",
            "back": "艾宾浩斯遗忘曲线描述了人类遗忘的规律：刚学会的知识如果不复习，20分钟后遗忘42%，1小时后遗忘56%，1天后遗忘74%，1周后遗忘77%，1个月后遗忘79%。",
            "category": "心理学",
            "tags": "学习,记忆,心理学"
        },
        {
            "front": "Leitner系统的基本原理是什么？",
            "back": "Leitner系统将记忆卡片分放在不同的盒子中，每个盒子有不同的复习间隔。答对的卡片移到下一个盒子（间隔更长），答错的卡片返回第一个盒子（频繁复习）。",
            "category": "学习方法",
            "tags": "学习,间隔重复,Leitner"
        },
        {
            "front": "Python中的装饰器是什么？",
            "back": "装饰器是一个函数，它接收另一个函数作为参数，并且返回一个新的函数。装饰器允许在不修改原函数代码的情况下，为函数添加新的功能。使用@符号来应用装饰器。",
            "category": "编程",
            "tags": "Python,编程,装饰器"
        },
        {
            "front": "什么是深度学习中的反向传播？",
            "back": "反向传播是训练神经网络的核心算法。它通过链式法则计算损失函数对每个权重的梯度，然后使用这些梯度来更新网络参数，从而最小化损失函数。",
            "category": "人工智能",
            "tags": "深度学习,神经网络,算法"
        },
        {
            "front": "Vue.js中的响应式原理是什么？",
            "back": "Vue.js使用ES6的Proxy（Vue 3）或Object.defineProperty（Vue 2）来劫持数据的读写操作。当数据变化时，会触发依赖收集和派发更新，从而实现视图的自动更新。",
            "category": "前端开发",
            "tags": "Vue.js,响应式,前端"
        }
    ]
    
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        created_cards = []
        for card_data in sample_cards:
            flashcard = Flashcard(**card_data)
            session.add(flashcard)
            created_cards.append(flashcard)
        
        session.commit()
        
        for card in created_cards:
            session.refresh(card)
        
        print(f"成功创建了 {len(created_cards)} 张记忆卡片")
        
        # 显示创建的卡片
        for card in created_cards:
            print(f"\n卡片ID: {card.id}")
            print(f"分类: {card.category}")
            print(f"正面: {card.front}")
            print(f"背面: {card.back[:100]}...")
            print(f"状态: {card.status.value}")
            print(f"Leitner盒子: {card.leitner_box.value}")
            print(f"下次复习: {card.due_date}")
            
        return created_cards
        
    except Exception as e:
        session.rollback()
        print(f"创建卡片时出错: {e}")
        return []
    finally:
        session.close()

def test_review_process():
    """测试复习流程"""
    print("\n测试复习流程...")
    
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        # 获取第一张卡片进行测试
        from sqlmodel import select
        flashcard = session.exec(select(Flashcard)).first()
        
        if not flashcard:
            print("没有找到卡片进行测试")
            return
            
        print(f"\n复习卡片: {flashcard.front}")
        
        # 模拟复习过程
        from app.models.flashcard import FlashcardDifficulty
        
        # 保存原始状态
        original_state = {
            'ease_factor': flashcard.ease_factor,
            'interval': flashcard.interval,
            'repetitions': flashcard.repetitions,
            'leitner_box': flashcard.leitner_box
        }
        
        print(f"原始状态: 难度系数={original_state['ease_factor']}, 间隔={original_state['interval']}天, 重复次数={original_state['repetitions']}, 盒子={original_state['leitner_box'].value}")
        
        # 模拟答对（良好）
        updated_flashcard = SpacedRepetitionAlgorithm.update_flashcard_after_review(
            flashcard, FlashcardDifficulty.GOOD, 3000  # 3秒响应时间
        )
        
        print(f"更新后状态: 难度系数={updated_flashcard.ease_factor}, 间隔={updated_flashcard.interval}天, 重复次数={updated_flashcard.repetitions}, 盒子={updated_flashcard.leitner_box.value}")
        print(f"下次复习时间: {updated_flashcard.due_date}")
        
        # 保存到数据库
        session.add(updated_flashcard)
        session.commit()
        
        print("复习记录已保存")
        
    except Exception as e:
        session.rollback()
        print(f"测试复习时出错: {e}")
    finally:
        session.close()

def show_stats():
    """显示统计信息"""
    print("\n系统统计信息:")
    
    session_gen = get_session()
    session = next(session_gen)
    
    try:
        from sqlmodel import select, func
        
        # 总卡片数
        total_cards = session.exec(select(func.count(Flashcard.id))).one()
        print(f"总卡片数: {total_cards}")
        
        # 按状态统计
        print("\n按状态统计:")
        for status in FlashcardStatus:
            count = session.exec(
                select(func.count(Flashcard.id)).where(Flashcard.status == status)
            ).one()
            if count > 0:
                print(f"  {status.value}: {count}")
        
        # 按盒子统计
        print("\n按Leitner盒子统计:")
        for box in LeitnerBox:
            count = session.exec(
                select(func.count(Flashcard.id)).where(Flashcard.leitner_box == box)
            ).one()
            if count > 0:
                print(f"  {box.value}: {count}")
        
        # 到期卡片
        now = datetime.now(timezone.utc)
        due_cards = session.exec(
            select(func.count(Flashcard.id)).where(Flashcard.due_date <= now)
        ).one()
        print(f"\n到期需要复习的卡片: {due_cards}")
        
    except Exception as e:
        print(f"获取统计信息时出错: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    print("记忆卡片系统测试")
    print("=" * 50)
    
    # 创建示例卡片
    cards = create_sample_flashcards()
    
    if cards:
        # 测试复习流程
        test_review_process()
        
        # 显示统计信息
        show_stats()
    
    print("\n测试完成！")