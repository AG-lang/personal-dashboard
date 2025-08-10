'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useFlashcardStats } from '../hooks/useFlashcards'
import { FlashcardStatus, LeitnerBox } from '../lib/types'

export default function FlashcardStats() {
  const { data: stats, isLoading, error } = useFlashcardStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">加载统计数据中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats?.data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            无法加载统计数据
          </div>
        </CardContent>
      </Card>
    )
  }

  const data = stats.data

  const getStatusText = (status: string) => {
    const statusMap = {
      new: '新卡片',
      learning: '学习中',
      reviewing: '复习中',
      relearning: '重新学习',
      suspended: '已暂停',
      buried: '已搁置',
    }
    return statusMap[status as keyof typeof statusMap] || status
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      learning: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-green-100 text-green-800',
      relearning: 'bg-orange-100 text-orange-800',
      suspended: 'bg-gray-100 text-gray-800',
      buried: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getLeitnerBoxColor = (box: string) => {
    const colors = {
      box_1: 'bg-red-500',
      box_2: 'bg-orange-500',
      box_3: 'bg-yellow-500',
      box_4: 'bg-green-500',
      box_5: 'bg-cyan-500',
      box_6: 'bg-blue-500',
      box_7: 'bg-purple-500',
    }
    return colors[box as keyof typeof colors] || 'bg-gray-500'
  }

  const getBoxNumber = (box: string) => {
    return parseInt(box.split('_')[1])
  }

  const getRetentionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 80) return 'text-yellow-600'
    if (rate >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* 总览统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">总卡片数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_cards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">到期卡片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.due_cards}</div>
            <div className="text-xs text-gray-500 mt-1">
              需要复习
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">平均记忆保持率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRetentionColor(data.average_retention_rate)}`}>
              {data.average_retention_rate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">建议学习时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.review_distribution.recommended_study_time}
            </div>
            <div className="text-xs text-gray-500 mt-1">分钟</div>
          </CardContent>
        </Card>
      </div>

      {/* 状态分布 */}
      <Card>
        <CardHeader>
          <CardTitle>卡片状态分布</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(data.status_distribution).map(([status, count]) => (
              <div key={status} className="text-center">
                <Badge className={`${getStatusColor(status)} w-full justify-center mb-2`}>
                  {getStatusText(status)}
                </Badge>
                <div className="text-lg font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leitner盒子分布 */}
      <Card>
        <CardHeader>
          <CardTitle>Leitner盒子分布</CardTitle>
          <p className="text-sm text-gray-600">
            盒子等级越高，复习间隔越长，表示记忆越牢固
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {Object.entries(data.leitner_distribution).map(([box, count]) => (
              <div key={box} className="text-center">
                <div className="mb-2">
                  <div 
                    className={`w-12 h-12 rounded-lg mx-auto flex items-center justify-center text-white font-bold ${getLeitnerBoxColor(box)}`}
                  >
                    {getBoxNumber(box)}
                  </div>
                </div>
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs text-gray-500">
                  盒子{getBoxNumber(box)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>盒子1: 每天复习</div>
              <div>盒子2: 每2天复习</div>
              <div>盒子3: 每4天复习</div>
              <div>盒子4: 每周复习</div>
              <div>盒子5: 每2周复习</div>
              <div>盒子6: 每月复习</div>
              <div>盒子7: 每3个月复习</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 复习建议 */}
      <Card>
        <CardHeader>
          <CardTitle>今日复习建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {data.review_distribution.max_new_cards}
              </div>
              <div className="text-sm text-gray-600">最大新卡片数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {data.review_distribution.max_review_cards}
              </div>
              <div className="text-sm text-gray-600">最大复习卡片数</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.review_distribution.recommended_study_time}
              </div>
              <div className="text-sm text-gray-600">建议学习时长(分钟)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}