'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateNote, useUpdateNote } from '@/hooks/useNotes'
import type { Note, NoteCreate, NoteUpdate } from '@/lib/types'

interface NoteFormProps {
  note?: Note
  onSuccess?: () => void
  onCancel?: () => void
}

export function NoteForm({ note, onSuccess, onCancel }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [tags, setTags] = useState(note?.tags || '')
  const [isReflection, setIsReflection] = useState(note?.is_reflection || false)

  const createNote = useCreateNote()
  const updateNote = useUpdateNote()

  const isEditing = !!note
  const isLoading = createNote.isPending || updateNote.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      return
    }

    try {
      if (isEditing) {
        const updateData: NoteUpdate = {
          title: title.trim(),
          content: content.trim(),
          tags: tags.trim(),
          is_reflection: isReflection,
        }
        await updateNote.mutateAsync({ id: note.id, note: updateData })
      } else {
        const createData: NoteCreate = {
          title: title.trim(),
          content: content.trim(),
          tags: tags.trim(),
          is_reflection: isReflection,
        }
        await createNote.mutateAsync(createData)
      }

      // 清空表单（仅在创建时）
      if (!isEditing) {
        setTitle('')
        setContent('')
        setTags('')
        setIsReflection(false)
      }

      onSuccess?.()
    } catch (error) {
      console.error('保存笔记失败:', error)
    }
  }

  const handleCancel = () => {
    if (isEditing) {
      // 恢复原始值
      setTitle(note.title)
      setContent(note.content)
      setTags(note.tags)
      setIsReflection(note.is_reflection)
    } else {
      // 清空表单
      setTitle('')
      setContent('')
      setTags('')
      setIsReflection(false)
    }
    onCancel?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '编辑笔记' : '创建新笔记'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              标题
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入笔记标题..."
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              内容
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的想法..."
              rows={8}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-1">
              标签 <span className="text-muted-foreground text-xs">（用逗号分隔）</span>
            </label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如: 工作, 学习, 反思"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_reflection"
              checked={isReflection}
              onChange={(e) => setIsReflection(e.target.checked)}
              disabled={isLoading}
            />
            <label 
              htmlFor="is_reflection" 
              className="text-sm font-medium cursor-pointer"
            >
              这是一篇反思笔记
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={!title.trim() || !content.trim() || isLoading}
            >
              {isLoading 
                ? (isEditing ? '保存中...' : '创建中...') 
                : (isEditing ? '保存更改' : '创建笔记')
              }
            </Button>
            {(isEditing || onCancel) && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                取消
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}