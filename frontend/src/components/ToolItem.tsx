'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2, Tag, Clock, Wrench, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CopyButton } from '@/components/CopyButton'
import { CopyableText } from '@/components/CopyableText'
import { toolsApi } from '@/api/tools'
import type { Tool } from '@/lib/types'

interface ToolItemProps {
  tool: Tool
  onEdit: (tool: Tool) => void
}

export function ToolItem({ tool, onEdit }: ToolItemProps) {
  const queryClient = useQueryClient()
  const [showDetails, setShowDetails] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => toolsApi.deleteTool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate(tool.id)
  }

  const getTypeIcon = (type: string) => {
    return type === 'prompt' ? <Wrench className="h-4 w-4" /> : <Code className="h-4 w-4" />
  }

  const getTypeLabel = (type: string) => {
    return type === 'prompt' ? '提示词工具' : 'API工具'
  }

  const tagList = tool.tags ? tool.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getTypeIcon(tool.type)}
              <CopyableText 
                text={tool.title}
                className="font-semibold text-lg hover:text-blue-600"
              >
                {tool.title}
              </CopyableText>
              <Badge variant="outline" className="ml-auto">
                {getTypeLabel(tool.type)}
              </Badge>
            </div>
            
            {tool.description && (
              <p className="text-sm text-gray-600 mb-2">{tool.description}</p>
            )}

            {tagList.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <Tag className="h-3 w-3 text-gray-400" />
                {tagList.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {tool.type === 'prompt' && tool.system_prompt && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">系统提示词</label>
                <CopyButton text={tool.system_prompt} showText />
              </div>
              <div 
                className={`text-sm bg-gray-50 p-3 rounded border ${showDetails ? '' : 'line-clamp-3'} cursor-pointer`}
                onClick={() => setShowDetails(!showDetails)}
              >
                {tool.system_prompt}
              </div>
              {tool.system_prompt.length > 100 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs mt-1"
                >
                  {showDetails ? '收起' : '展开'}
                </Button>
              )}
            </div>
          )}

          {tool.type === 'api' && (
            <div className="space-y-2">
              {tool.api_endpoint && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">API端点</label>
                    <CopyButton text={tool.api_endpoint} showText />
                  </div>
                  <CopyableText 
                    text={tool.api_endpoint}
                    className="text-sm bg-gray-50 p-2 rounded border font-mono"
                    truncate
                    maxLength={60}
                  >
                    {tool.api_endpoint}
                  </CopyableText>
                </div>
              )}

              {tool.api_key && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">API密钥</label>
                    <CopyButton text={tool.api_key} showText />
                  </div>
                  <div className="text-sm bg-gray-50 p-2 rounded border font-mono">
                    {'*'.repeat(Math.min(tool.api_key.length, 20))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(tool.updated_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(tool)}
              >
                <Edit className="h-4 w-4" />
                编辑
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要删除工具 "{tool.title}" 吗？此操作无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      {deleteMutation.isPending ? '删除中...' : '确认删除'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}