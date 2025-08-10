'use client'

import Link from 'next/link'
import { CreateTodoForm } from '@/components/CreateTodoForm'
import { TodoList } from '@/components/TodoList'
import { Button } from '@/components/ui/button'
import AuthGuard from '@/components/AuthGuard'

export default function TodosPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* 页面头部 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">任务管理</h1>
                <p className="text-gray-600 mt-1">管理你的待办事项，提升工作效率</p>
              </div>
              <Link href="/">
                <Button variant="outline">
                  返回首页
                </Button>
              </Link>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：创建表单 */}
            <div className="lg:col-span-1">
              <CreateTodoForm />
            </div>

            {/* 右侧：任务列表 */}
            <div className="lg:col-span-2">
              <TodoList />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}