'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ToolList } from '@/components/ToolList'

export default function ToolsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">工具管理</h1>
              <p className="text-gray-600">
                管理您的提示词工具和API工具，支持一键复制和便捷的分类管理
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">
                返回首页
              </Button>
            </Link>
          </div>
        </div>

        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <ToolList />
        </Suspense>
      </div>
    </div>
  )
}