'use client'

import Link from 'next/link'
import { Palette as PaletteIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              欢迎回来, {user?.username}!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              继续你的高效工作之旅
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 max-w-8xl mx-auto">
              <Link 
                href="/todos" 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-3xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  任务管理
                </h3>
                <p className="text-gray-600">
                  创建、管理和跟踪你的待办事项
                </p>
              </Link>
              
              <Link 
                href="/notes" 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-3xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  笔记反思
                </h3>
                <p className="text-gray-600">
                  记录想法、反思成长、积累智慧
                </p>
              </Link>
              
              <Link 
                href="/pomodoro" 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-3xl mb-4">🍅</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  番茄钟专注
                </h3>
                <p className="text-gray-600">
                  计时、白噪音、任务联动、专注记录
                </p>
              </Link>

              <Link 
                href="/flashcards" 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-3xl mb-4">🧠</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  间隔重复记忆
                </h3>
                <p className="text-gray-600">
                  基于艾宾浩斯曲线的科学记忆方法
                </p>
              </Link>

              <Link 
                href="/tools" 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-3xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  工具管理
                </h3>
                <p className="text-gray-600">
                  管理提示词和API工具，一键复制使用
                </p>
              </Link>

              <Link 
                href="/commands" 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="text-3xl mb-4">⌨️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  命令记忆库
                </h3>
                <p className="text-gray-600">
                  保存常用命令，快速查找和复制
                </p>
              </Link>

              <Link 
                href="/palette" 
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="mb-4 flex justify-center"><PaletteIcon className="w-8 h-8" /></div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  配色生成
                </h3>
                <p className="text-gray-600">
                  提取/随机生成色板，支持复制导出
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            个人仪表盘
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            管理你的任务、跟踪进度、提升效率
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                登录
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline">
                注册
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-6 max-w-8xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>📋 任务管理</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                创建、管理和跟踪你的待办事项，支持优先级管理
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle>📝 笔记反思</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                记录想法、反思成长、积累智慧，支持标签分类
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <CardTitle>🍅 番茄钟专注</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                计时、白噪音、任务联动、专注记录，提升工作效率
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>🧠 间隔重复记忆</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                基于艾宾浩斯遗忘曲线的科学记忆方法，智能复习调度
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>🔧 工具管理</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                管理提示词和API工具，一键复制使用，提升工作效率
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>⌨️ 命令记忆库</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                保存常用命令，快速查找和复制，提升开发效率
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle>配色生成</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                从图片提取或随机生成色板，支持 HEX/RGB/HSL 复制导出
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}