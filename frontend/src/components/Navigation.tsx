'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Command, Search } from 'lucide-react'

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const triggerCommandPalette = () => {
    // 触发全局快捷键事件
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    })
    document.dispatchEvent(event)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              个人仪表盘
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/todos" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                任务管理
              </Link>
              <Link href="/notes" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                笔记
              </Link>
              <Link href="/pomodoro" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                番茄钟
              </Link>
              <Link href="/flashcards" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                记忆卡片
              </Link>
              <Link href="/tools" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                工具管理
              </Link>
              <Link href="/commands" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                命令库
              </Link>
              <Link href="/palette" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                配色生成
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 命令面板入口 */}
            <Button
              onClick={triggerCommandPalette}
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              title="打开命令面板"
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">
                <kbd className="px-1 py-0.5 text-xs border rounded bg-gray-100">⌘</kbd>
                <kbd className="px-1 py-0.5 text-xs border rounded bg-gray-100 ml-1">K</kbd>
              </span>
            </Button>
            
            <span className="text-sm text-gray-600">
              欢迎, {user?.username}
            </span>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
            >
              退出登录
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}