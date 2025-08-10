'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  CheckSquare,
  StickyNote,
  Timer,
  BookMarked,
  Wrench,
  Terminal,
  Palette as PaletteIcon,
} from 'lucide-react'

const items = [
  { href: '/', label: '首页', icon: Home },
  { href: '/todos', label: '任务', icon: CheckSquare },
  { href: '/notes', label: '笔记', icon: StickyNote },
  { href: '/pomodoro', label: '番茄钟', icon: Timer },
  { href: '/flashcards', label: '记忆卡', icon: BookMarked },
  { href: '/tools', label: '工具', icon: Wrench },
  { href: '/commands', label: '命令', icon: Terminal },
  { href: '/palette', label: '配色', icon: PaletteIcon },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-40">
      <ul className="flex overflow-x-auto no-scrollbar">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex-1 min-w-[80px]">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center py-2 text-xs ${active ? 'text-blue-600' : 'text-gray-600'}`}
              >
                <Icon className="h-5 w-5" />
                <span className="mt-0.5">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
