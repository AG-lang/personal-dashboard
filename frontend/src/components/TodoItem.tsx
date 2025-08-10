'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LegacySelect as Select } from './ui/legacy-select'
import { Checkbox } from '@/components/ui/checkbox'
import { useUpdateTodo, useDeleteTodo, useToggleTodo } from '@/hooks/useTodos'
import type { Todo, TodoPriority } from '@/lib/types'

interface TodoItemProps {
  todo: Todo
}

const priorityColors = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-yellow-200 bg-yellow-50',
  low: 'border-green-200 bg-green-50',
}

const priorityTextColors = {
  high: 'text-red-700',
  medium: 'text-yellow-700',
  low: 'text-green-700',
}

const priorityLabels = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(todo.content)
  const [editPriority, setEditPriority] = useState(todo.priority)

  const updateTodo = useUpdateTodo()
  const deleteTodo = useDeleteTodo()
  const toggleTodo = useToggleTodo()

  const handleSave = () => {
    if (editContent.trim()) {
      updateTodo.mutate({
        id: todo.id,
        todo: {
          content: editContent.trim(),
          priority: editPriority,
        },
      })
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditContent(todo.content)
    setEditPriority(todo.priority)
    setIsEditing(false)
  }

  const handleToggle = () => {
    toggleTodo.mutate(todo.id)
  }

  const handleDelete = () => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTodo.mutate(todo.id)
    }
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${priorityColors[todo.priority]} ${todo.is_completed ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={todo.is_completed}
            onChange={handleToggle}
            className="mt-1"
            disabled={toggleTodo.isPending}
          />

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave()
                    if (e.key === 'Escape') handleCancel()
                  }}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TodoPriority)}
                  >
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </Select>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={!editContent.trim() || updateTodo.isPending}
                  >
                    保存
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className={`text-sm font-medium ${todo.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  {todo.content}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityTextColors[todo.priority]} bg-white border`}>
                    {priorityLabels[todo.priority]}
                  </span>
                  <div className="flex items-center gap-1">
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
                      disabled={deleteTodo.isPending}
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      删除
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(todo.created_at).toLocaleString('zh-CN')}
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}