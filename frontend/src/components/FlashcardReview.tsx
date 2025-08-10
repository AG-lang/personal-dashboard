'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import FlashcardItem from './FlashcardItem'
import { useDueFlashcards, useReviewFlashcard } from '../hooks/useFlashcards'
import { FlashcardDifficulty } from '../lib/types'

export default function FlashcardReview() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({
    reviewed: 0,
    correct: 0,
    startTime: Date.now()
  })
  const [isComplete, setIsComplete] = useState(false)

  const { data: dueFlashcards, isLoading, error, refetch } = useDueFlashcards(50)
  const reviewMutation = useReviewFlashcard()

  const flashcards = dueFlashcards?.data || []

  useEffect(() => {
    if (flashcards.length === 0 && !isLoading) {
      setIsComplete(true)
    }
  }, [flashcards.length, isLoading])

  const handleReview = async (difficulty: FlashcardDifficulty, responseTime: number) => {
    if (currentIndex >= flashcards.length) return

    const flashcard = flashcards[currentIndex]

    try {
      await reviewMutation.mutateAsync({
        id: flashcard.id,
        data: {
          flashcard_id: flashcard.id,
          difficulty,
          response_time: responseTime
        }
      })

      // 更新会话统计
      setSessionStats(prev => ({
        ...prev,
        reviewed: prev.reviewed + 1,
        correct: prev.correct + (difficulty !== 'again' ? 1 : 0)
      }))

      // 移动到下一张卡片
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        setIsComplete(true)
      }
    } catch (error) {
      console.error('复习失败:', error)
      alert('复习失败，请重试')
    }
  }

  const restartReview = () => {
    setCurrentIndex(0)
    setIsComplete(false)
    setSessionStats({
      reviewed: 0,
      correct: 0,
      startTime: Date.now()
    })
    refetch()
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`
    } else {
      return `${seconds}秒`
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">加载复习卡片中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            加载失败: {error.message}
          </div>
          <div className="text-center mt-4">
            <Button onClick={() => refetch()}>重新加载</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isComplete || flashcards.length === 0) {
    const sessionTime = Date.now() - sessionStats.startTime
    const accuracy = sessionStats.reviewed > 0 ? (sessionStats.correct / sessionStats.reviewed * 100).toFixed(1) : '0'

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {flashcards.length === 0 ? '🎉 太好了！' : '✅ 复习完成！'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {flashcards.length === 0 ? (
            <div>
              <p className="text-gray-600 mb-4">目前没有需要复习的卡片</p>
              <p className="text-sm text-gray-500">继续保持！你可以创建新的卡片或等待现有卡片到期。</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sessionStats.reviewed}</div>
                  <div className="text-sm text-gray-600">已复习</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                  <div className="text-sm text-gray-600">正确率</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatTime(sessionTime)}
                  </div>
                  <div className="text-sm text-gray-600">用时</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button onClick={restartReview}>
              {flashcards.length === 0 ? '刷新检查' : '继续复习'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentFlashcard = flashcards[currentIndex]
  const progress = ((currentIndex) / flashcards.length) * 100

  return (
    <div className="space-y-4">
      {/* 进度条和统计 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              进度: {currentIndex} / {flashcards.length}
            </span>
            <span className="text-sm text-gray-600">
              正确率: {sessionStats.reviewed > 0 ? ((sessionStats.correct / sessionStats.reviewed) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>已复习: {sessionStats.reviewed}</span>
            <span>剩余: {flashcards.length - currentIndex}</span>
          </div>
        </CardContent>
      </Card>

      {/* 当前卡片 */}
      <div className="relative">
        <FlashcardItem
          flashcard={currentFlashcard}
          reviewMode={true}
          showActions={false}
          onReview={handleReview}
        />
        
        {reviewMutation.isPending && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">处理复习结果中...</div>
            </div>
          </div>
        )}
      </div>

      {/* 提示和快捷键说明 */}
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-gray-500 space-y-1">
            <div><strong>复习提示:</strong></div>
            <div>• <span className="text-red-500">重新学习</span>: 完全忘记或理解有误</div>
            <div>• <span className="text-orange-500">困难</span>: 答对了但很吃力</div>
            <div>• <span className="text-green-500">良好</span>: 答对了，正常难度</div>
            <div>• <span className="text-blue-500">简单</span>: 很容易就答对了</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}