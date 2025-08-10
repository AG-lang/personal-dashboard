'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import AuthGuard from '@/components/AuthGuard'

// 懒加载组件
const FlashcardForm = dynamic(() => import('../../components/FlashcardForm'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
})

const FlashcardList = dynamic(() => import('../../components/FlashcardList'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
})

const FlashcardStats = dynamic(() => import('../../components/FlashcardStats'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
})

const FlashcardReview = dynamic(() => import('../../components/FlashcardReview'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
})

export default function FlashcardsPage() {
  const [editingFlashcard, setEditingFlashcard] = useState(null)

  const handleEditFlashcard = (flashcard: any) => {
    setEditingFlashcard(flashcard)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
        <div className="container mx-auto px-4 py-8">
          {/* 页面头部 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">间隔重复记忆</h1>
                <p className="text-gray-600 mt-1">基于艾宾浩斯遗忘曲线和Leitner盒子系统的科学记忆法</p>
              </div>
              <Link href="/">
                <Button variant="outline">
                  返回首页
                </Button>
              </Link>
            </div>
          </div>

          {/* 内容区域 */}
          <Tabs defaultValue="review" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="review">开始复习</TabsTrigger>
            <TabsTrigger value="stats">统计分析</TabsTrigger>
            <TabsTrigger value="manage">管理卡片</TabsTrigger>
            <TabsTrigger value="create">创建卡片</TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📚 开始复习</CardTitle>
                <p className="text-sm text-gray-600">
                  复习到期的记忆卡片，系统将根据你的表现自动调整下次复习时间
                </p>
              </CardHeader>
            </Card>
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
              <FlashcardReview />
            </Suspense>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 学习统计</CardTitle>
                <p className="text-sm text-gray-600">
                  查看你的学习进度和记忆效果分析
                </p>
              </CardHeader>
            </Card>
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
              <FlashcardStats />
            </Suspense>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🗂️ 管理卡片</CardTitle>
                <p className="text-sm text-gray-600">
                  浏览、搜索和管理你的所有记忆卡片
                </p>
              </CardHeader>
            </Card>
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
              <FlashcardList onEdit={handleEditFlashcard} />
            </Suspense>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>✏️ 创建新卡片</CardTitle>
                <p className="text-sm text-gray-600">
                  创建新的记忆卡片，支持分类和标签管理
                </p>
              </CardHeader>
            </Card>
            <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg" />}>
              <FlashcardForm />
            </Suspense>
          </TabsContent>
          </Tabs>

          {/* 编辑卡片的对话框 - 这里可以后续添加编辑功能 */}
          {editingFlashcard && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl mx-4">
                <CardHeader>
                  <CardTitle>编辑卡片</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-gray-500 py-8">
                    编辑功能正在开发中...
                  </p>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingFlashcard(null)}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      关闭
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}