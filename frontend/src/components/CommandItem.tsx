'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { CopyButton } from '@/components/CopyButton'
import { Edit, Trash2, Play, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import type { Command } from '@/lib/types'

interface CommandItemProps {
  command: Command
  onEdit: (command: Command) => void
  onDelete: (id: number) => void
  onUse: (id: number) => void
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

const categoryColors: Record<string, string> = {
  git: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  docker: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  linux: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  windows: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  nodejs: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  python: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  database: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  network: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  custom: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
}

export function CommandItem({ command, onEdit, onDelete, onUse }: CommandItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleUse = () => {
    onUse(command.id)
  }

  const handleEdit = () => {
    onEdit(command)
  }

  const handleDelete = () => {
    onDelete(command.id)
    setShowDeleteDialog(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const tagList = command.tags
    ? command.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    : []

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      command.is_dangerous ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {command.is_dangerous && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <CopyButton
                text={command.name}
                className="font-medium hover:text-primary cursor-pointer"
              >
                {command.name}
              </CopyButton>
            </CardTitle>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                className={`text-xs ${categoryColors[command.category] || categoryColors.custom}`}
              >
                {categoryLabels[command.category] || '自定义'}
              </Badge>
              
              {command.use_count > 0 && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  使用 {command.use_count} 次
                </Badge>
              )}
              
              {command.is_dangerous && (
                <Badge variant="destructive" className="text-xs">
                  危险命令
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUse}
              className="h-8 px-2"
              title="使用命令"
            >
              <Play className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              className="h-8 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除命令 "{command.name}" 吗？此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* 命令内容 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">命令</h4>
            <CopyButton 
              text={command.command}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              复制
            </CopyButton>
          </div>
          <code className="block w-full p-3 bg-muted rounded-md text-sm font-mono overflow-x-auto">
            {command.command}
          </code>
        </div>

        {/* 描述 */}
        {command.description && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">描述</h4>
            <p className="text-sm text-foreground">{command.description}</p>
          </div>
        )}

        {/* 使用示例 */}
        {command.usage_example && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-muted-foreground">使用示例</h4>
              <CopyButton 
                text={command.usage_example}
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                复制
              </CopyButton>
            </div>
            <code className="block w-full p-3 bg-muted rounded-md text-sm font-mono overflow-x-auto">
              {command.usage_example}
            </code>
          </div>
        )}

        {/* 注意事项 */}
        {command.notes && (
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">注意事项</h4>
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
              {command.notes}
            </p>
          </div>
        )}

        {/* 标签 */}
        {tagList.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">标签</h4>
            <div className="flex flex-wrap gap-1">
              {tagList.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 时间信息 */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            创建于 {formatDate(command.created_at)}
          </span>
          {command.last_used_at && (
            <span>最后使用：{formatDate(command.last_used_at)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}