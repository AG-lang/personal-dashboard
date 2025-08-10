import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/lib/providers'
import dynamic from 'next/dynamic'
import CommandPalette from '@/components/CommandPalette'
import { Toaster } from 'sonner'

// 懒加载导航组件
const Navigation = dynamic(() => import('@/components/Navigation'), {
  ssr: false,
  loading: () => <div className="h-16 bg-white shadow-sm border-b animate-pulse" />
})

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: '个人仪表盘',
  description: '功能完整的个人仪表盘应用',
  keywords: '个人仪表盘,任务管理,笔记,番茄钟,记忆卡片',
  authors: [{ name: '个人仪表盘' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className} suppressHydrationWarning={true}>
        <QueryProvider>
          {/* 全局命令面板：Cmd/Ctrl+K 召唤 */}
          <CommandPalette />
          <Navigation />
          <main className="min-h-screen bg-gray-50 pb-16 md:pb-0">
            {children}
          </main>
          {/* 移动端底部导航 */}
          <MobileBottomNav />
          {/* Toast 通知 */}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  )
}

// 动态引入移动端底部导航，避免 SSR 警告
const MobileBottomNav = dynamic(() => import('@/components/BottomNav'), { ssr: false })