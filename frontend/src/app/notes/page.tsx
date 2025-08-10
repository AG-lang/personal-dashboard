'use client'

import Link from 'next/link'
import { NoteForm } from '@/components/NoteForm'
import { NoteList } from '@/components/NoteList'
import { Button } from '@/components/ui/button'
import AuthGuard from '@/components/AuthGuard'

export default function NotesPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          {/* 页面头部 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">笔记反思</h1>
                <p className="text-gray-600 mt-1">记录想法，反思成长，积累智慧</p>
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
              <NoteForm />
            </div>

            {/* 右侧：笔记列表 */}
            <div className="lg:col-span-2">
              <NoteList />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}