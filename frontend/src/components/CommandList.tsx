'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CommandItem } from '@/components/CommandItem'
import { Search, Filter, X, Zap, Clock, TrendingUp } from 'lucide-react'
import { useCommands, useCommandTags, useCommandCategories } from '@/hooks/useCommands'
import type { Command, CommandCategory, CommandsQueryParams } from '@/lib/types'

interface CommandListProps {
  onEdit: (command: Command) => void
  onDelete: (id: number) => void
  onUse: (id: number) => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

const categoryLabels: Record<string, string> = {
  git: 'Git',
  docker: 'Docker', 
  linux: 'Linux',
  windows: 'Windows',
  nodejs: 'Node.js',
  python: 'Python',
  database: '数据库',
  network: '网络',
  custom: '自定义',
}

export function CommandList({ 
  onEdit, 
  onDelete, 
  onUse,
  searchQuery: externalSearchQuery,
  onSearchChange
}: CommandListProps) {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '')
  const [selectedCategory, setSelectedCategory] = useState<CommandCategory | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [dangerousFilter, setDangerousFilter] = useState<'all' | 'safe' | 'dangerous'>('all')
  const [sortBy, setSortBy] = useState<'updated_at' | 'use_count' | 'name'>('updated_at')
  const [showFilters, setShowFilters] = useState(false)

  // 构建查询参数
  const queryParams: CommandsQueryParams = useMemo(() => {
    const params: CommandsQueryParams = {
      sort_by: sortBy,
      sort_desc: true,
    }
    
    if (searchQuery) params.search = searchQuery
    if (selectedCategory !== 'all') params.category = selectedCategory
    if (selectedTag !== 'all') params.tags = selectedTag
    if (dangerousFilter === 'dangerous') params.is_dangerous = true
    else if (dangerousFilter === 'safe') params.is_dangerous = false
    
    return params
  }, [searchQuery, selectedCategory, selectedTag, dangerousFilter, sortBy])

  const { data: commands, isLoading } = useCommands(queryParams)
  const { data: categories } = useCommandCategories()
  const { data: tags } = useCommandTags()

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearchChange?.(value)
  }

  const clearFilters = () => {
    setSelectedCategory('all')
    setSelectedTag('all')
    setDangerousFilter('all')
    setSortBy('updated_at')
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedCategory !== 'all') count++
    if (selectedTag !== 'all') count++
    if (dangerousFilter !== 'all') count++
    if (sortBy !== 'updated_at') count++
    return count
  }, [selectedCategory, selectedTag, dangerousFilter, sortBy])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 搜索和过滤 */}
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索命令名称、命令内容或描述..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-4"
          />
        </div>

        {/* 过滤器切换 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            过滤器
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              清除过滤
            </Button>
          )}
        </div>

        {/* 过滤器面板 */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            {/* 分类过滤 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">分类</label>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as CommandCategory | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="所有分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分类</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category} value={category}>
                      {categoryLabels[category] || category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 标签过滤 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">标签</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger>
                  <SelectValue placeholder="所有标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有标签</SelectItem>
                  {tags?.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 危险性过滤 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">安全性</label>
              <Select value={dangerousFilter} onValueChange={(value) => setDangerousFilter(value as 'all' | 'safe' | 'dangerous')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="safe">安全命令</SelectItem>
                  <SelectItem value="dangerous">危险命令</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 排序方式 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">排序方式</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'updated_at' | 'use_count' | 'name')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      最近更新
                    </div>
                  </SelectItem>
                  <SelectItem value="use_count">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      使用频率
                    </div>
                  </SelectItem>
                  <SelectItem value="name">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      名称排序
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* 命令列表 */}
      {commands && commands.length > 0 ? (
        <div className="space-y-4">
          {commands.map((command) => (
            <CommandItem
              key={command.id}
              command={command}
              onEdit={onEdit}
              onDelete={onDelete}
              onUse={onUse}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-muted-foreground text-lg mb-2">
              {searchQuery || activeFiltersCount > 0 ? '没有找到符合条件的命令' : '还没有保存任何命令'}
            </div>
            <p className="text-sm text-muted-foreground">
              {searchQuery || activeFiltersCount > 0 
                ? '尝试调整搜索条件或清除过滤器' 
                : '添加第一个命令来开始构建您的命令记忆库'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  )
}