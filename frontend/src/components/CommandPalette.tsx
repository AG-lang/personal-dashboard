"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { useRouter } from "next/navigation"
import { Search, Plus, StickyNote, CheckSquare, BookMarked, Wrench, Home, Palette, Settings, Moon, Sun, LogOut, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { notesApi } from "@/api/notes"
import { todosApi } from "@/api/todos"
import { flashcardsApi } from "@/api/flashcards"
import { toolsApi } from "@/api/tools"
import type { Note, Todo, Flashcard, Tool } from "@/lib/types"

// UI shell for command palette
function CommandDialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
      // 添加 Escape 键关闭
      if (e.key === "Escape" && open) {
        e.preventDefault()
        onOpenChange(false)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="relative z-50 w-full max-w-xl rounded-xl border bg-white shadow-2xl overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function CommandInput(props: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center px-3 border-b bg-white">
      <Search className="mr-2 h-4 w-4 shrink-0 text-gray-500" />
      <CommandPrimitive.Input
        {...props}
        className={cn("flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50", props.className)}
        placeholder="搜索或输入命令…"
      />
    </div>
  )
}

function CommandList(props: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      {...props}
      className={cn("max-h-[60vh] overflow-y-auto p-1", props.className)}
    />
  )
}

function CommandEmpty(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("py-6 px-4 text-sm text-gray-500", props.className)}>
      无结果
    </div>
  )
}

function CommandGroup(props: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      {...props}
      className={cn("overflow-hidden p-1 text-gray-700", props.className)}
    />
  )
}

function CommandItem(props: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      {...props}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none aria-selected:bg-gray-100 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        props.className
      )}
    />
  )
}

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const [noteResults, setNoteResults] = React.useState<Note[]>([])
  const [todoResults, setTodoResults] = React.useState<Todo[]>([])
  const [cardResults, setCardResults] = React.useState<Flashcard[]>([])
  const [toolResults, setToolResults] = React.useState<Tool[]>([])
  const [loading, setLoading] = React.useState(false)

  // 重置选中索引当打开面板时
  React.useEffect(() => {
    if (open) {
      setSelectedIndex(0)
      setQuery("")
    }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const delay = setTimeout(async () => {
      const q = query.trim()
      if (!q) {
        setNoteResults([])
        setTodoResults([])
        setCardResults([])
        setToolResults([])
        return
      }
      setLoading(true)
      try {
        const [notes, todos, cards, tools] = await Promise.all([
          notesApi.getNotes({ search: q, limit: 5 }).catch(() => []),
          todosApi.getTodos({ search: q, limit: 5 }).catch(() => []),
          flashcardsApi.getFlashcards({ search: q, limit: 5 }).then(r => r.data).catch(() => []),
          toolsApi.getTools({ search: q, limit: 5 }).catch(() => []),
        ])
        setNoteResults(notes || [])
        setTodoResults(todos || [])
        setCardResults(cards || [])
        setToolResults(tools || [])
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(delay)
  }, [open, query])

  // Quick create handlers
  const handleCreateNote = React.useCallback(async () => {
    const title = query.trim() || "快速笔记"
    const note = await notesApi.createNote({ title, content: "", tags: "" })
    router.push(`/notes`)
    setOpen(false)
    return note
  }, [query, router])

  const handleCreateTodo = React.useCallback(async () => {
    const content = query.trim() || "新任务"
    await todosApi.createTodo({ content })
    router.push(`/todos`)
    setOpen(false)
  }, [query, router])

  const handleCreateFlashcard = React.useCallback(async () => {
    const front = query.trim() || "正面"
    await flashcardsApi.createFlashcard({ front, back: "" })
    router.push(`/flashcards`)
    setOpen(false)
  }, [query, router])

  const handleCreateTool = React.useCallback(async () => {
    const title = query.trim() || "新工具"
    await toolsApi.createTool({ title, type: "prompt" })
    router.push(`/tools`)
    setOpen(false)
  }, [query, router])

  // 系统操作
  const handleLogout = React.useCallback(() => {
    // 这里需要从父级获取 logout 函数，暂时用 location 跳转
    window.location.href = '/login'
    setOpen(false)
  }, [])

  const toggleTheme = React.useCallback(() => {
    // 主题切换逻辑（待实现）
    console.log('切换主题')
    setOpen(false)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandPrimitive label="全局命令面板" className="w-full">
        <CommandInput value={query} onValueChange={setQuery} />
        <CommandList>
          {loading && (
            <div className="px-4 py-2 text-xs text-gray-500">正在搜索…</div>
          )}
          <CommandEmpty />

          <CommandGroup heading="导航">
            <CommandItem onSelect={() => { router.push("/"); setOpen(false) }}>
              <Home className="mr-2 h-4 w-4" /> 首页
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/todos"); setOpen(false) }}>
              <CheckSquare className="mr-2 h-4 w-4" /> 任务
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/notes"); setOpen(false) }}>
              <StickyNote className="mr-2 h-4 w-4" /> 笔记
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/flashcards"); setOpen(false) }}>
              <BookMarked className="mr-2 h-4 w-4" /> 记忆卡片
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/tools"); setOpen(false) }}>
              <Wrench className="mr-2 h-4 w-4" /> 工具
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/palette"); setOpen(false) }}>
              <Palette className="mr-2 h-4 w-4" /> 配色生成
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/pomodoro"); setOpen(false) }}>
              <Timer className="mr-2 h-4 w-4" /> 番茄钟
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="系统">
            <CommandItem onSelect={toggleTheme}>
              <Moon className="mr-2 h-4 w-4" /> 切换主题
            </CommandItem>
            <CommandItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> 退出登录
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="快速创建">
            <CommandItem onSelect={handleCreateTodo}>
              <Plus className="mr-2 h-4 w-4" /> 新建任务（Enter）
            </CommandItem>
            <CommandItem onSelect={handleCreateNote}>
              <Plus className="mr-2 h-4 w-4" /> 新建笔记
            </CommandItem>
            <CommandItem onSelect={handleCreateFlashcard}>
              <Plus className="mr-2 h-4 w-4" /> 新建记忆卡
            </CommandItem>
            <CommandItem onSelect={handleCreateTool}>
              <Plus className="mr-2 h-4 w-4" /> 新建工具
            </CommandItem>
          </CommandGroup>

          {noteResults.length > 0 && (
            <CommandGroup heading="笔记">
              {noteResults.map((n) => (
                <CommandItem key={n.id} onSelect={() => { router.push(`/notes`); setOpen(false) }}>
                  <StickyNote className="mr-2 h-4 w-4" /> {n.title || "未命名笔记"}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {todoResults.length > 0 && (
            <CommandGroup heading="任务">
              {todoResults.map((t) => (
                <CommandItem key={t.id} onSelect={() => { router.push(`/todos`); setOpen(false) }}>
                  <CheckSquare className="mr-2 h-4 w-4" /> {t.content}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {cardResults.length > 0 && (
            <CommandGroup heading="记忆卡片">
              {cardResults.map((c) => (
                <CommandItem key={c.id} onSelect={() => { router.push(`/flashcards`); setOpen(false) }}>
                  <BookMarked className="mr-2 h-4 w-4" /> {c.front}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {toolResults.length > 0 && (
            <CommandGroup heading="工具">
              {toolResults.map((tool) => (
                <CommandItem key={tool.id} onSelect={() => { router.push(`/tools`); setOpen(false) }}>
                  <Wrench className="mr-2 h-4 w-4" /> {tool.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandPrimitive>
      <div className="absolute right-3 top-3 text-xs text-gray-400 flex items-center space-x-1">
        <kbd className="px-1.5 py-0.5 text-xs border rounded bg-gray-50">⌘K</kbd>
        <span>或</span>
        <kbd className="px-1.5 py-0.5 text-xs border rounded bg-gray-50">Ctrl+K</kbd>
      </div>
    </CommandDialog>
  )
}
