'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LegacySelect as Select } from './ui/legacy-select'
import { useCreateTodo } from '@/hooks/useTodos'
import type { TodoPriority } from '@/lib/types'

export function CreateTodoForm() {
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  
  const createTodo = useCreateTodo()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (content.trim()) {
      createTodo.mutate(
        {
          content: content.trim(),
          priority,
        },
        {
          onSuccess: () => {
            setContent('')
            setPriority('medium')
          },
        }
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>新建任务</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="输入任务内容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TodoPriority)}
              className="w-32"
            >
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </Select>
            
            <Button
              type="submit"
              disabled={!content.trim() || createTodo.isPending}
              className="ml-auto w-24 bg-blue-600 text-white hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-300 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800"
            >
              {createTodo.isPending ? '创建中...' : '创建任务'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}