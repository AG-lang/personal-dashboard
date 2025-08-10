from datetime import datetime, timedelta, timezone
from typing import Tuple
import math

from ..models.flashcard import (
    Flashcard, FlashcardDifficulty, FlashcardStatus, LeitnerBox
)


class SpacedRepetitionAlgorithm:
    """间隔重复算法服务类，支持艾宾浩斯曲线和Leitner盒子系统"""
    
    # Leitner盒子对应的间隔天数
    LEITNER_INTERVALS = {
        LeitnerBox.BOX_1: 1,     # 每天
        LeitnerBox.BOX_2: 2,     # 每2天
        LeitnerBox.BOX_3: 4,     # 每4天
        LeitnerBox.BOX_4: 7,     # 每周
        LeitnerBox.BOX_5: 14,    # 每2周
        LeitnerBox.BOX_6: 30,    # 每月
        LeitnerBox.BOX_7: 90,    # 每3个月
    }
    
    # 难度对应的系数调整
    DIFFICULTY_MULTIPLIERS = {
        FlashcardDifficulty.AGAIN: -0.8,   # 大幅降低难易度
        FlashcardDifficulty.HARD: -0.15,   # 稍微降低难易度
        FlashcardDifficulty.GOOD: 0.0,     # 保持难易度
        FlashcardDifficulty.EASY: 0.15,    # 增加难易度
    }
    
    @staticmethod
    def calculate_ebbinghaus_schedule(
        ease_factor: float,
        interval: int,
        repetitions: int,
        difficulty: FlashcardDifficulty
    ) -> Tuple[float, int, int]:
        """
        基于艾宾浩斯遗忘曲线计算下次复习间隔
        
        Args:
            ease_factor: 当前难易度系数
            interval: 当前间隔天数
            repetitions: 重复次数
            difficulty: 用户评价的难度
            
        Returns:
            Tuple[新的难易度系数, 新的间隔天数, 新的重复次数]
        """
        new_ease_factor = ease_factor
        new_interval = interval
        new_repetitions = repetitions
        
        # 根据难度调整难易度系数
        multiplier = SpacedRepetitionAlgorithm.DIFFICULTY_MULTIPLIERS[difficulty]
        new_ease_factor = max(1.3, ease_factor + multiplier)
        
        if difficulty == FlashcardDifficulty.AGAIN:
            # 答错了，重新开始
            new_repetitions = 0
            new_interval = 1
        else:
            new_repetitions += 1
            
            if new_repetitions == 1:
                new_interval = 1
            elif new_repetitions == 2:
                new_interval = 6
            else:
                # 使用SM-2算法的间隔计算
                new_interval = math.ceil(interval * new_ease_factor)
                
                # 根据难度微调间隔
                if difficulty == FlashcardDifficulty.HARD:
                    new_interval = max(1, math.ceil(new_interval * 0.8))
                elif difficulty == FlashcardDifficulty.EASY:
                    new_interval = math.ceil(new_interval * 1.3)
        
        # 确保间隔不会过长
        new_interval = min(new_interval, 365)  # 最长一年
        
        return new_ease_factor, new_interval, new_repetitions
    
    @staticmethod
    def calculate_leitner_box(
        current_box: LeitnerBox,
        difficulty: FlashcardDifficulty,
        repetitions: int
    ) -> LeitnerBox:
        """
        基于Leitner系统计算卡片应该放在哪个盒子
        
        Args:
            current_box: 当前盒子
            difficulty: 用户评价的难度
            repetitions: 重复次数
            
        Returns:
            新的盒子等级
        """
        boxes = list(LeitnerBox)
        current_index = boxes.index(current_box)
        
        if difficulty == FlashcardDifficulty.AGAIN:
            # 答错了，回到第一个盒子
            return LeitnerBox.BOX_1
        elif difficulty == FlashcardDifficulty.HARD:
            # 困难，保持当前盒子或下降一级
            if current_index > 0 and repetitions < 3:
                return boxes[current_index - 1]
            return current_box
        elif difficulty == FlashcardDifficulty.GOOD:
            # 良好，上升一级（如果不是最高级）
            if current_index < len(boxes) - 1:
                return boxes[current_index + 1]
            return current_box
        else:  # EASY
            # 简单，上升两级（如果可能）
            new_index = min(current_index + 2, len(boxes) - 1)
            return boxes[new_index]
    
    @staticmethod
    def get_leitner_interval(box: LeitnerBox) -> int:
        """获取Leitner盒子对应的复习间隔"""
        return SpacedRepetitionAlgorithm.LEITNER_INTERVALS[box]
    
    @staticmethod
    def calculate_next_due_date(
        interval: int,
        base_date: datetime = None
    ) -> datetime:
        """
        计算下次复习时间
        
        Args:
            interval: 间隔天数
            base_date: 基准时间，默认为当前时间
            
        Returns:
            下次复习的时间
        """
        if base_date is None:
            base_date = datetime.now(timezone.utc)
        
        return base_date + timedelta(days=interval)
    
    @staticmethod
    def update_flashcard_after_review(
        flashcard: Flashcard,
        difficulty: FlashcardDifficulty,
        response_time: int
    ) -> Flashcard:
        """
        复习后更新卡片状态
        
        Args:
            flashcard: 要更新的卡片
            difficulty: 用户评价的难度
            response_time: 响应时间（毫秒）
            
        Returns:
            更新后的卡片
        """
        # 使用艾宾浩斯算法计算新的间隔
        new_ease_factor, new_interval, new_repetitions = (
            SpacedRepetitionAlgorithm.calculate_ebbinghaus_schedule(
                flashcard.ease_factor,
                flashcard.interval,
                flashcard.repetitions,
                difficulty
            )
        )
        
        # 使用Leitner系统计算新的盒子
        new_box = SpacedRepetitionAlgorithm.calculate_leitner_box(
            flashcard.leitner_box,
            difficulty,
            flashcard.repetitions
        )
        
        # 计算下次复习时间（取两种算法的较大值）
        ebbinghaus_due = SpacedRepetitionAlgorithm.calculate_next_due_date(new_interval)
        leitner_interval = SpacedRepetitionAlgorithm.get_leitner_interval(new_box)
        leitner_due = SpacedRepetitionAlgorithm.calculate_next_due_date(leitner_interval)
        
        # 使用较长的间隔，确保不会过于频繁
        next_due = max(ebbinghaus_due, leitner_due)
        
        # 更新卡片状态
        flashcard.ease_factor = new_ease_factor
        flashcard.interval = max(new_interval, leitner_interval)
        flashcard.repetitions = new_repetitions
        flashcard.leitner_box = new_box
        flashcard.due_date = next_due
        flashcard.last_review = datetime.now(timezone.utc)
        flashcard.updated_at = datetime.now(timezone.utc)
        
        # 更新统计信息
        flashcard.total_reviews += 1
        if difficulty != FlashcardDifficulty.AGAIN:
            flashcard.correct_reviews += 1
            flashcard.streak += 1
            flashcard.max_streak = max(flashcard.max_streak, flashcard.streak)
        else:
            flashcard.streak = 0
        
        # 更新状态
        if flashcard.status == FlashcardStatus.NEW:
            flashcard.status = FlashcardStatus.LEARNING
        elif difficulty == FlashcardDifficulty.AGAIN and flashcard.status == FlashcardStatus.REVIEWING:
            flashcard.status = FlashcardStatus.RELEARNING
        elif flashcard.status == FlashcardStatus.LEARNING and new_repetitions >= 2:
            flashcard.status = FlashcardStatus.REVIEWING
        elif flashcard.status == FlashcardStatus.RELEARNING and new_repetitions >= 1:
            flashcard.status = FlashcardStatus.REVIEWING
        
        return flashcard
    
    @staticmethod
    def get_review_distribution(total_cards: int, max_new: int = 20, max_review: int = 100) -> dict:
        """
        获取今日复习分布建议
        
        Args:
            total_cards: 总卡片数量
            max_new: 最大新卡片数量
            max_review: 最大复习卡片数量
            
        Returns:
            复习分布字典
        """
        return {
            "max_new_cards": min(max_new, max(1, total_cards // 10)),
            "max_review_cards": max_review,
            "recommended_study_time": min(60, max(10, total_cards // 5))  # 分钟
        }
    
    @staticmethod
    def calculate_retention_rate(correct_reviews: int, total_reviews: int) -> float:
        """计算记忆保持率"""
        if total_reviews == 0:
            return 0.0
        return round((correct_reviews / total_reviews) * 100, 2)
    
    @staticmethod
    def get_difficulty_color(difficulty: FlashcardDifficulty) -> str:
        """获取难度对应的颜色"""
        color_map = {
            FlashcardDifficulty.AGAIN: "#ef4444",   # 红色
            FlashcardDifficulty.HARD: "#f97316",    # 橙色
            FlashcardDifficulty.GOOD: "#22c55e",    # 绿色
            FlashcardDifficulty.EASY: "#3b82f6",    # 蓝色
        }
        return color_map.get(difficulty, "#6b7280")
    
    @staticmethod
    def get_box_color(box: LeitnerBox) -> str:
        """获取Leitner盒子对应的颜色"""
        colors = [
            "#ef4444",  # BOX_1 - 红色
            "#f97316",  # BOX_2 - 橙色
            "#eab308",  # BOX_3 - 黄色
            "#22c55e",  # BOX_4 - 绿色
            "#06b6d4",  # BOX_5 - 青色
            "#3b82f6",  # BOX_6 - 蓝色
            "#8b5cf6",  # BOX_7 - 紫色
        ]
        boxes = list(LeitnerBox)
        index = boxes.index(box)
        return colors[index] if index < len(colors) else "#6b7280"