'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Flashcard, FlashcardStatus, LeitnerBox, FlashcardDifficulty } from '../lib/types'
import { useDeleteFlashcard } from '../hooks/useFlashcards'

interface FlashcardItemProps {
  flashcard: Flashcard
  onEdit?: () => void
  onReview?: (difficulty: FlashcardDifficulty, responseTime: number) => void
  showActions?: boolean
  reviewMode?: boolean
}

const FlashcardItem = memo(function FlashcardItem({ 
  flashcard, 
  onEdit, 
  onReview, 
  showActions = true, 
  reviewMode = false 
}: FlashcardItemProps) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  
  const deleteFlashcard = useDeleteFlashcard()

  // 使用useMemo缓存状态映射
  const statusInfo = useMemo(() => {
    const statusMap = {
      new: { text: '新卡片', color: 'bg-blue-100 text-blue-800' },
      learning: { text: '学习中', color: 'bg-yellow-100 text-yellow-800' },
      reviewing: { text: '复习中', color: 'bg-green-100 text-green-800' },
      relearning: { text: '重新学习', color: 'bg-orange-100 text-orange-800' },
      suspended: { text: '已暂停', color: 'bg-gray-100 text-gray-800' },
      buried: { text: '已搁置', color: 'bg-red-100 text-red-800' },
    }
    return statusMap[flashcard.status] || { text: flashcard.status, color: 'bg-gray-100 text-gray-800' }
  }, [flashcard.status])

  const leitnerBoxInfo = useMemo(() => {
    const colors = {
      box_1: 'bg-red-500',
      box_2: 'bg-orange-500', 
      box_3: 'bg-yellow-500',
      box_4: 'bg-green-500',
      box_5: 'bg-cyan-500',
      box_6: 'bg-blue-500',
      box_7: 'bg-purple-500',
    }
    const boxNumber = parseInt(flashcard.leitner_box.split('_')[1])
    return {
      color: colors[flashcard.leitner_box] || 'bg-gray-500',
      number: boxNumber
    }
  }, [flashcard.leitner_box])

  const formattedDueDate = useMemo(() => {
    const date = new Date(flashcard.due_date)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `已过期 ${Math.abs(diffDays)} 天`
    } else if (diffDays === 0) {
      return '今天到期'
    } else if (diffDays === 1) {
      return '明天到期'
    } else {
      return `${diffDays} 天后到期`
    }
  }, [flashcard.due_date])

  const correctRate = useMemo(() => {
    return flashcard.total_reviews > 0 
      ? Math.round((flashcard.correct_reviews / flashcard.total_reviews) * 100)
      : 0
  }, [flashcard.total_reviews, flashcard.correct_reviews])

  const formattedTags = useMemo(() => {
    return flashcard.tags ? flashcard.tags.split(',').map(tag => tag.trim()) : []
  }, [flashcard.tags])

  const handleDelete = useCallback(async () => {
    if (!confirm('确定要删除这张卡片吗？此操作不可撤销。')) {
      return
    }

    try {
      await deleteFlashcard.mutateAsync(flashcard.id)
    } catch (error) {
      console.error('删除卡片失败:', error)
      alert('删除失败，请重试')
    }
  }, [deleteFlashcard, flashcard.id])

  const handleShowAnswer = useCallback(() => {
    setShowAnswer(true)
    setStartTime(Date.now())
  }, [])

  const handleReviewAnswer = useCallback((difficulty: FlashcardDifficulty) => {
    if (!startTime || !onReview) return
    
    const responseTime = Date.now() - startTime
    onReview(difficulty, responseTime)
    setShowAnswer(false)
    setStartTime(null)
  }, [startTime, onReview])

  const getDifficultyButton = useCallback((difficulty: FlashcardDifficulty, label: string, color: string) => {
    return (
      <Button
        key={difficulty}
        size="sm"
        className={`${color} text-white hover:opacity-80`}
        onClick={() => handleReviewAnswer(difficulty)}
      >
        {label}
      </Button>
    )
  }, [handleReviewAnswer])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap gap-2">
            <Badge className={statusInfo.color}>
              {statusInfo.text}
            </Badge>
            <Badge className="bg-white border border-gray-300">
              <div 
                className={`w-3 h-3 rounded mr-1 ${leitnerBoxInfo.color}`}
              ></div>
              盒子 {leitnerBoxInfo.number}
            </Badge>
            {flashcard.category && (
              <Badge variant="outline">
                {flashcard.category}
              </Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {formattedDueDate}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* 卡片正面 */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-2">问题</h4>
            <p className="text-gray-900 whitespace-pre-wrap">{flashcard.front}</p>
          </div>

          {/* 卡片背面 */}
          {(!reviewMode || showAnswer) && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">答案</h4>
              <p className="text-gray-900 whitespace-pre-wrap">{flashcard.back}</p>
            </div>
          )}

          {/* 复习模式下的显示答案按钮 */}
          {reviewMode && !showAnswer && (
            <div className="text-center">
              <Button onClick={handleShowAnswer} className="bg-blue-500 hover:bg-blue-600">
                显示答案
              </Button>
            </div>
          )}

          {/* 复习难度评价按钮 */}
          {reviewMode && showAnswer && onReview && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 text-center">
                评价难度（影响下次复习时间）:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getDifficultyButton('again', '重新学习', 'bg-red-500')}
                {getDifficultyButton('hard', '困难', 'bg-orange-500')}
                {getDifficultyButton('good', '良好', 'bg-green-500')}
                {getDifficultyButton('easy', '简单', 'bg-blue-500')}
              </div>
            </div>
          )}

          {/* 统计信息 */}
          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
            <div className="flex space-x-4">
              <span>复习 {flashcard.total_reviews} 次</span>
              <span>正确率 {correctRate}%</span>
              <span>连胜 {flashcard.streak} 次</span>
            </div>
            <div>
              间隔 {flashcard.interval} 天 | 难度 {flashcard.ease_factor.toFixed(1)}
            </div>
          </div>

          {/* 标签 */}
          {formattedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formattedTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                disabled={deleteFlashcard.isPending}
              >
                编辑
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteFlashcard.isPending}
              >
                {deleteFlashcard.isPending ? '删除中...' : '删除'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

export default FlashcardItem