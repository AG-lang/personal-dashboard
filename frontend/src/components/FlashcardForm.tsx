'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useCreateFlashcard, useFlashcardCategories } from '../hooks/useFlashcards'
import { FlashcardStatus, LeitnerBox } from '../lib/types'

interface FlashcardFormProps {
  onSuccess?: () => void
}

export default function FlashcardForm({ onSuccess }: FlashcardFormProps) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [tags, setTags] = useState('')
  const [category, setCategory] = useState('')
  const [newCategory, setNewCategory] = useState('')

  const createFlashcard = useCreateFlashcard()
  const { data: categories } = useFlashcardCategories()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!front.trim() || !back.trim()) {
      alert('请填写卡片正面和背面内容')
      return
    }

    try {
      const trimmedTags = tags.trim()
      const finalCategory = newCategory.trim() || category
      
      await createFlashcard.mutateAsync({
        front: front.trim(),
        back: back.trim(),
        ...(trimmedTags && { tags: trimmedTags }),
        ...(finalCategory && { category: finalCategory }),
      })

      // 清空表单
      setFront('')
      setBack('')
      setTags('')
      setCategory('')
      setNewCategory('')
      
      onSuccess?.()
    } catch (error) {
      console.error('创建卡片失败:', error)
      alert('创建卡片失败，请重试')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      again: 'bg-red-500',
      hard: 'bg-orange-500',
      good: 'bg-green-500',
      easy: 'bg-blue-500'
    }
    return colors[difficulty as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建记忆卡片</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="front" className="block text-sm font-medium text-gray-700 mb-1">
              卡片正面 *
            </label>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="输入问题或需要记忆的内容..."
              required
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="back" className="block text-sm font-medium text-gray-700 mb-1">
              卡片背面 *
            </label>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="输入答案或解释..."
              required
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              {categories && categories.data && categories.data.length > 0 ? (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.data.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="输入新分类..."
                />
              )}
              
              {categories && categories.data && categories.data.length > 0 && (
                <Input
                  className="mt-2"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="或输入新分类..."
                />
              )}
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用逗号分隔多个标签..."
              />
            </div>
          </div>

          {/* 难度评价说明 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">复习时难度评价说明：</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${getDifficultyColor('again')}`}></div>
                <span>重新学习 (0-1分)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${getDifficultyColor('hard')}`}></div>
                <span>困难 (2-3分)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${getDifficultyColor('good')}`}></div>
                <span>良好 (4-5分)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${getDifficultyColor('easy')}`}></div>
                <span>简单 (6分)</span>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={createFlashcard.isPending}
            className="w-full"
          >
            {createFlashcard.isPending ? '创建中...' : '创建卡片'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}