'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDeleteNote } from '@/hooks/useNotes'
import { NoteForm } from './NoteForm'
import type { Note } from '@/lib/types'

interface NoteItemProps {
  note: Note
}

export function NoteItem({ note }: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const deleteNote = useDeleteNote()

  const handleDelete = () => {
    if (confirm('确定要删除这篇笔记吗？')) {
      deleteNote.mutate(note.id)
    }
  }

  const handleEditSuccess = () => {
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  // 解析标签
  const tagList = note.tags
    ? note.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    : []

  if (isEditing) {
    return (
      <NoteForm
        note={note}
        onSuccess={handleEditSuccess}
        onCancel={handleEditCancel}
      />
    )
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      note.is_reflection ? 'border-blue-200 bg-blue-50' : 'bg-white'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight">
              {note.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {note.is_reflection && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  💭 反思
                </span>
              )}
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tagList.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 px-2 text-xs"
            >
              编辑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
            >
              删除
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {note.content}
        </div>
        
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-muted-foreground">
          <span>创建于 {new Date(note.created_at).toLocaleString('zh-CN')}</span>
          {note.updated_at !== note.created_at && (
            <span>更新于 {new Date(note.updated_at).toLocaleString('zh-CN')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}