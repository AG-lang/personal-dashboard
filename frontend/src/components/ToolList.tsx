'use client'

import { useState, useMemo } from 'react'
import { useTools, useToolTags } from '@/hooks/useTools'
import { Search, Filter, Wrench, Code, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ToolItem } from '@/components/ToolItem'
import { ToolForm } from '@/components/ToolForm'
import type { Tool, ToolType, ToolsQueryParams } from '@/lib/types'

export function ToolList() {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<ToolType | 'all'>('all')
  const [selectedTag, setSelectedTag] = useState('all-tags')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)

  // 获取工具列表
  const queryParams = useMemo(() => {
    const params: ToolsQueryParams = {}
    if (search) params.search = search
    if (selectedType !== 'all') params.tool_type = selectedType as ToolType
    return params
  }, [search, selectedType])

  const { data: tools = [], isLoading, error } = useTools(queryParams)

  // 获取标签列表
  const { data: allTags = [] } = useToolTags()

  // 过滤工具
  const filteredTools = tools.filter(tool => {
    if (selectedTag && selectedTag !== 'all-tags' && !tool.tags.includes(selectedTag)) {
      return false
    }
    return true
  })

  // 按类型分组工具
  const promptTools = filteredTools.filter(tool => tool.type === 'prompt')
  const apiTools = filteredTools.filter(tool => tool.type === 'api')

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
  }

  const handleEditSuccess = () => {
    setEditingTool(null)
  }

  if (isLoading) {
    return <div className="flex justify-center py-8">加载中...</div>
  }

  if (error) {
    return <div className="text-red-600 text-center py-8">加载失败，请重试</div>
  }

  return (
    <div className="space-y-6">
      {/* 搜索和过滤区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            搜索和筛选
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索工具标题或描述..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={selectedType} onValueChange={(value: ToolType | 'all') => setSelectedType(value)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="工具类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="prompt">提示词工具</SelectItem>
                <SelectItem value="api">API工具</SelectItem>
              </SelectContent>
            </Select>

            {allTags.length > 0 && (
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="选择标签" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-tags">全部标签</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              创建工具
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">{tools.length}</span>
              </div>
              <span className="text-sm font-medium">全部工具</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">提示词工具</span>
              <Badge variant="secondary">{promptTools.length}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">API工具</span>
              <Badge variant="secondary">{apiTools.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工具列表 */}
      {filteredTools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {tools.length === 0 ? '还没有创建任何工具' : '没有找到符合条件的工具'}
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4" />
              创建第一个工具
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 提示词工具 */}
          {promptTools.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">提示词工具</h2>
                <Badge variant="secondary">{promptTools.length}</Badge>
              </div>
              <div className="grid gap-4">
                {promptTools.map((tool) => (
                  <ToolItem
                    key={tool.id}
                    tool={tool}
                    onEdit={setEditingTool}
                  />
                ))}
              </div>
            </div>
          )}

          {/* API工具 */}
          {apiTools.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold">API工具</h2>
                <Badge variant="secondary">{apiTools.length}</Badge>
              </div>
              <div className="grid gap-4">
                {apiTools.map((tool) => (
                  <ToolItem
                    key={tool.id}
                    tool={tool}
                    onEdit={setEditingTool}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 创建工具对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建新工具</DialogTitle>
            <DialogDescription>
              填写下面的表单来创建一个新的工具
            </DialogDescription>
          </DialogHeader>
          <ToolForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>

      {/* 编辑工具对话框 */}
      <Dialog open={!!editingTool} onOpenChange={(open) => !open && setEditingTool(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑工具</DialogTitle>
            <DialogDescription>
              修改工具的信息并保存更改
            </DialogDescription>
          </DialogHeader>
          {editingTool && (
            <ToolForm tool={editingTool} onSuccess={handleEditSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}