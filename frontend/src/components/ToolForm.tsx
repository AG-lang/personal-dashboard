'use client'

import { useState } from 'react'
import { useCreateTool, useUpdateTool } from '@/hooks/useTools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Tool, ToolCreate, ToolUpdate, ToolType } from '@/lib/types'

interface ToolFormProps {
  tool?: Tool
  onSuccess?: () => void
}

export function ToolForm({ tool, onSuccess }: ToolFormProps) {
  const [toolType, setToolType] = useState<ToolType>(tool?.type || 'prompt')
  const [formData, setFormData] = useState({
    title: tool?.title || '',
    type: tool?.type || 'prompt' as ToolType,
    tags: tool?.tags || '',
    description: tool?.description || '',
    system_prompt: tool?.system_prompt || '',
    api_key: tool?.api_key || '',
    api_endpoint: tool?.api_endpoint || '',
  })

  const createMutation = useCreateTool()
  
  const updateMutation = useUpdateTool()

  // 成功后的回调处理
  const handleCreateSuccess = () => {
    resetForm()
    onSuccess?.()
  }
  
  const handleUpdateSuccess = () => {
    onSuccess?.()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'prompt' as ToolType,
      tags: '',
      description: '',
      system_prompt: '',
      api_key: '',
      api_endpoint: '',
    })
    setToolType('prompt')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) return

    if (tool) {
      updateMutation.mutate({ id: tool.id, tool: formData }, {
        onSuccess: handleUpdateSuccess
      })
    } else {
      createMutation.mutate(formData, {
        onSuccess: handleCreateSuccess
      })
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleTypeChange = (value: ToolType) => {
    setToolType(value)
    setFormData(prev => ({ ...prev, type: value }))
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tool ? '编辑工具' : '创建新工具'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">工具标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="输入工具标题"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="type">工具类型 *</Label>
            <Select value={toolType} onValueChange={handleTypeChange} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="选择工具类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prompt">提示词工具</SelectItem>
                <SelectItem value="api">API工具</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tags">标签</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={handleInputChange('tags')}
              placeholder="用逗号分隔多个标签"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="输入工具描述"
              disabled={isPending}
              rows={3}
            />
          </div>

          {toolType === 'prompt' && (
            <div>
              <Label htmlFor="system_prompt">系统提示词</Label>
              <Textarea
                id="system_prompt"
                value={formData.system_prompt}
                onChange={handleInputChange('system_prompt')}
                placeholder="输入系统提示词内容"
                disabled={isPending}
                rows={6}
              />
            </div>
          )}

          {toolType === 'api' && (
            <>
              <div>
                <Label htmlFor="api_endpoint">API端点</Label>
                <Input
                  id="api_endpoint"
                  value={formData.api_endpoint}
                  onChange={handleInputChange('api_endpoint')}
                  placeholder="https://api.example.com"
                  disabled={isPending}
                />
              </div>
              <div>
                <Label htmlFor="api_key">API密钥</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={formData.api_key}
                  onChange={handleInputChange('api_key')}
                  placeholder="输入API密钥"
                  disabled={isPending}
                />
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? '保存中...' : tool ? '更新工具' : '创建工具'}
            </Button>
            {!tool && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
                重置
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}