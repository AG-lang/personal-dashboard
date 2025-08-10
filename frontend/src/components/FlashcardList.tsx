'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import FlashcardItem from './FlashcardItem'
import { useFlashcards, useFlashcardCategories, useFlashcardTags } from '../hooks/useFlashcards'
import { FlashcardStatus, FlashcardsQueryParams } from '../lib/types'

interface FlashcardListProps {
  onEdit?: (flashcard: any) => void
}

const FlashcardList = memo(function FlashcardList({ onEdit }: FlashcardListProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<FlashcardStatus | 'all'>('all')
  const [category, setCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [dueOnly, setDueOnly] = useState(false)

  // 使用useMemo优化查询参数构建
  const queryParams: FlashcardsQueryParams = useMemo(() => {
    const params: FlashcardsQueryParams = {
      due_only: dueOnly,
      limit: 100
    }
    
    if (search) params.search = search
    if (status !== 'all') params.status = status as FlashcardStatus
    if (category !== 'all') params.category = category
    if (selectedTag !== 'all') params.tags = selectedTag
    
    return params
  }, [search, status, category, selectedTag, dueOnly])

  const { data: flashcards, isLoading, error } = useFlashcards(queryParams)
  const { data: categories } = useFlashcardCategories()
  const { data: tags } = useFlashcardTags()

  // 使用useMemo缓存状态映射
  const statusMap = useMemo(() => ({
    new: '新卡片',
    learning: '学习中',
    reviewing: '复习中',
    relearning: '重新学习',
    suspended: '已暂停',
    buried: '已搁置',
  }), [])

  const getStatusText = useCallback((status: FlashcardStatus) => {
    return statusMap[status] || status
  }, [statusMap])

  // 使用useMemo缓存过滤后的卡片列表
  const flashcardList = useMemo(() => flashcards?.data || [], [flashcards?.data])

  // 使用useCallback优化事件处理器
  const handleClearFilters = useCallback(() => {
    setSearch('')
    setStatus('all')
    setCategory('all')
    setSelectedTag('all')
    setDueOnly(false)
  }, [])

  const handleDueOnlyToggle = useCallback(() => {
    setDueOnly(!dueOnly)
  }, [dueOnly])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">加载中...</div>
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
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>记忆卡片列表</span>
          <span className="text-sm font-normal text-gray-500">
            共 {flashcardList.length} 张卡片
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 筛选和搜索 */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="搜索卡片内容..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={status} onValueChange={(value) => setStatus(value as FlashcardStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有状态</SelectItem>
                <SelectItem value="new">{getStatusText('new')}</SelectItem>
                <SelectItem value="learning">{getStatusText('learning')}</SelectItem>
                <SelectItem value="reviewing">{getStatusText('reviewing')}</SelectItem>
                <SelectItem value="relearning">{getStatusText('relearning')}</SelectItem>
                <SelectItem value="suspended">{getStatusText('suspended')}</SelectItem>
                <SelectItem value="buried">{getStatusText('buried')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分类</SelectItem>
                {categories?.data?.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有标签</SelectItem>
                {tags?.data?.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={dueOnly ? "default" : "outline"}
              onClick={handleDueOnlyToggle}
              size="sm"
            >
              {dueOnly ? "显示所有卡片" : "只显示到期卡片"}
            </Button>

            <Button
              variant="outline"
              onClick={handleClearFilters}
              size="sm"
            >
              清除筛选
            </Button>
          </div>
        </div>

        {/* 卡片列表 */}
        {flashcardList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {search || status !== 'all' || category !== 'all' || selectedTag !== 'all' || dueOnly
              ? '没有找到符合条件的卡片'
              : '还没有创建任何卡片'}
          </div>
        ) : (
          <div className="space-y-4">
            {flashcardList.map((flashcard) => (
              <FlashcardItem
                key={flashcard.id}
                flashcard={flashcard}
                onEdit={() => onEdit?.(flashcard)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default FlashcardList