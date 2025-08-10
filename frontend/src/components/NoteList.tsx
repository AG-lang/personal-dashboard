'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LegacySelect as Select } from './ui/legacy-select'
import { NoteItem } from './NoteItem'
import { useNotes, useTags } from '@/hooks/useNotes'
import type { NotesQueryParams } from '@/lib/types'

export function NoteList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [filterType, setFilterType] = useState<'all' | 'notes' | 'reflections'>('all')

  // 构建查询参数
  const queryParams: NotesQueryParams = {
    ...(searchTerm && { search: searchTerm }),
    ...(selectedTag !== 'all' && { tags: selectedTag }),
    ...(filterType === 'notes' && { is_reflection: false }),
    ...(filterType === 'reflections' && { is_reflection: true }),
  }

  const {
    data: notes = [],
    isLoading,
    error,
    refetch,
  } = useNotes(queryParams)

  const { data: tags = [] } = useTags()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 搜索会自动触发，因为 queryParams 会变化
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTag('all')
    setFilterType('all')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-600 mb-2">加载失败</div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  // 按类型分组
  const reflectionNotes = notes.filter(note => note.is_reflection)
  const regularNotes = notes.filter(note => !note.is_reflection)

  const hasFilters = searchTerm || selectedTag !== 'all' || filterType !== 'all'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>笔记列表</span>
          <div className="text-sm font-normal text-muted-foreground">
            共 {notes.length} 篇笔记
          </div>
        </CardTitle>
        
        {/* 搜索和过滤 */}
        <div className="space-y-3 pt-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="搜索笔记标题或内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="sm">
              搜索
            </Button>
          </form>
          
          <div className="flex gap-2 items-center">
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-32"
            >
              <option value="all">全部类型</option>
              <option value="notes">普通笔记</option>
              <option value="reflections">反思笔记</option>
            </Select>
            
            <Select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-32"
            >
              <option value="all">全部标签</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  #{tag}
                </option>
              ))}
            </Select>
            
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                清除筛选
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {notes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {hasFilters ? '没有找到符合条件的笔记' : '还没有笔记，创建第一篇吧！'}
          </div>
        ) : (
          <>
            {/* 反思笔记区域 */}
            {(filterType === 'all' || filterType === 'reflections') && reflectionNotes.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-blue-700 flex items-center gap-2">
                  💭 反思笔记
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                    {reflectionNotes.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {reflectionNotes.map((note) => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
            
            {/* 普通笔记区域 */}
            {(filterType === 'all' || filterType === 'notes') && regularNotes.length > 0 && (
              <div className="space-y-3">
                {reflectionNotes.length > 0 && (
                  <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                    📝 普通笔记
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                      {regularNotes.length}
                    </span>
                  </h3>
                )}
                <div className="space-y-3">
                  {regularNotes.map((note) => (
                    <NoteItem key={note.id} note={note} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}