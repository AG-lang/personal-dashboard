'use client'

import Link from 'next/link'
import PomodoroTimer from '@/components/PomodoroTimer'
import PomodoroStats from '@/components/PomodoroStats'
import { Button } from '@/components/ui/button'
import AuthGuard from '@/components/AuthGuard'

export default function PomodoroPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
        <div className="container mx-auto px-4 py-8">
          {/* 页面头部 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">番茄钟专注模式</h1>
                <p className="text-gray-600 mt-1">
                  使用番茄工作法提升专注力，25分钟专注 + 5分钟休息
                </p>
              </div>
              <Link href="/">
                <Button variant="outline">返回首页</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 番茄钟计时器 - 占据2列 */}
            <div className="lg:col-span-2">
              <PomodoroTimer />
            </div>

            {/* 统计信息 - 占据1列 */}
            <div>
              <PomodoroStats />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}