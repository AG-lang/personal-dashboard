'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LegacySelect as Select } from './ui/legacy-select'
import { TodoItem } from './TodoItem'
import { useTodos } from '@/hooks/useTodos'
import type { TodoPriority, TodosQueryParams } from '@/lib/types'

const priorityLabels = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

export function TodoList() {
  const [priorityFilter, setPriorityFilter] = useState<TodoPriority | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const queryParams = useMemo(() => {
    const params: TodosQueryParams = {}
    if (priorityFilter !== 'all') {
      params.priority = priorityFilter
    }
    if (statusFilter !== 'all') {
      params.is_completed = statusFilter === 'completed'
    }
    return params
  }, [priorityFilter, statusFilter])

  const {
    data: todos = [],
    isLoading,
    error,
    refetch,
  } = useTodos(queryParams)

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

  // 按优先级分组
  const groupedTodos = {
    high: todos.filter((todo) => todo.priority === 'high'),
    medium: todos.filter((todo) => todo.priority === 'medium'),
    low: todos.filter((todo) => todo.priority === 'low'),
  }

  const renderTodoGroup = (priority: TodoPriority, groupTodos: typeof todos) => {
    if (groupTodos.length === 0) return null

    return (
      <div key={priority} className="space-y-3">
        <h3 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
          {priorityLabels[priority]}
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
            {groupTodos.length}
          </span>
        </h3>
        <div className="space-y-2">
          {groupTodos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          任务列表
          <div className="flex items-center gap-2 text-sm font-normal">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-24"
            >
              <option value="all">全部</option>
              <option value="pending">待完成</option>
              <option value="completed">已完成</option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-24"
            >
              <option value="all">全部优先级</option>
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {todos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {priorityFilter !== 'all' || statusFilter !== 'all' 
              ? '没有符合条件的任务' 
              : '还没有任务，创建一个开始吧！'
            }
          </div>
        ) : priorityFilter === 'all' ? (
          // 按优先级分组显示
          <>
            {renderTodoGroup('high', groupedTodos.high)}
            {renderTodoGroup('medium', groupedTodos.medium)}
            {renderTodoGroup('low', groupedTodos.low)}
          </>
        ) : (
          // 过滤后的列表显示
          <div className="space-y-2">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}