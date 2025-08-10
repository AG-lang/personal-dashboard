'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import type { CommandCreate, CommandUpdate, CommandCategory } from '@/lib/types'

interface CommandFormProps {
  onSubmit: (data: CommandCreate | CommandUpdate) => void
  onCancel?: () => void
  initialData?: Partial<CommandCreate>
  isEditing?: boolean
  isLoading?: boolean
}

const categoryOptions: { value: CommandCategory; label: string }[] = [
  { value: 'git', label: 'Git 版本控制' },
  { value: 'docker', label: 'Docker 容器' },
  { value: 'linux', label: 'Linux 系统' },
  { value: 'windows', label: 'Windows 系统' },
  { value: 'nodejs', label: 'Node.js/npm/pnpm' },
  { value: 'python', label: 'Python 开发' },
  { value: 'database', label: '数据库操作' },
  { value: 'network', label: '网络工具' },
  { value: 'custom', label: '自定义命令' },
]

export function CommandForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  isLoading = false
}: CommandFormProps) {
  const [formData, setFormData] = useState<CommandCreate>({
    name: initialData?.name || '',
    command: initialData?.command || '',
    description: initialData?.description || '',
    category: initialData?.category || 'custom',
    tags: initialData?.tags || '',
    usage_example: initialData?.usage_example || '',
    notes: initialData?.notes || '',
    is_dangerous: initialData?.is_dangerous || false,
  })

  const [showDangerousDialog, setShowDangerousDialog] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 如果标记为危险命令，显示确认对话框
    if (formData.is_dangerous && !isEditing) {
      setShowDangerousDialog(true)
      setPendingSubmit(true)
      return
    }

    onSubmit(formData)
  }

  const handleDangerousConfirm = () => {
    setShowDangerousDialog(false)
    setPendingSubmit(false)
    onSubmit(formData)
  }

  const handleDangerousCancel = () => {
    setShowDangerousDialog(false)
    setPendingSubmit(false)
    setFormData(prev => ({ ...prev, is_dangerous: false }))
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? '编辑命令' : '添加新命令'}</CardTitle>
          <CardDescription>
            {isEditing ? '修改命令信息' : '将常用命令保存到记忆库中，方便后续查找和使用'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 命令名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">命令名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：启动开发服务器"
                  required
                />
              </div>

              {/* 分类 */}
              <div className="space-y-2">
                <Label htmlFor="category">分类 *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: CommandCategory) => 
                    setFormData(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 完整命令 */}
            <div className="space-y-2">
              <Label htmlFor="command">完整命令 *</Label>
              <Textarea
                id="command"
                value={formData.command}
                onChange={(e) => setFormData(prev => ({ ...prev, command: e.target.value }))}
                placeholder="例如：pnpm dev"
                className="font-mono text-sm"
                rows={2}
                required
              />
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="命令的作用和用途"
                rows={2}
              />
            </div>

            {/* 标签 */}
            <div className="space-y-2">
              <Label htmlFor="tags">标签</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="用逗号分隔，例如：开发,前端,启动"
              />
            </div>

            {/* 使用示例 */}
            <div className="space-y-2">
              <Label htmlFor="usage_example">使用示例</Label>
              <Textarea
                id="usage_example"
                value={formData.usage_example}
                onChange={(e) => setFormData(prev => ({ ...prev, usage_example: e.target.value }))}
                placeholder="具体的使用场景和参数示例"
                rows={2}
                className="font-mono text-sm"
              />
            </div>

            {/* 注意事项 */}
            <div className="space-y-2">
              <Label htmlFor="notes">注意事项</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="使用时需要注意的事项"
                rows={2}
              />
            </div>

            {/* 危险命令标记 */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_dangerous"
                checked={formData.is_dangerous}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setFormData(prev => ({ ...prev, is_dangerous: e.target.checked }))
                }
              />
              <Label htmlFor="is_dangerous" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                危险命令 <span className="text-red-500">（可能会删除文件或影响系统）</span>
              </Label>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end space-x-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  取消
                </Button>
              )}
              <Button type="submit" disabled={isLoading || pendingSubmit}>
                {isLoading ? '保存中...' : (isEditing ? '更新命令' : '保存命令')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 危险命令确认对话框 */}
      <AlertDialog open={showDangerousDialog} onOpenChange={setShowDangerousDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">⚠️ 危险命令警告</AlertDialogTitle>
            <AlertDialogDescription>
              您将要保存一个被标记为"危险"的命令。此命令可能会：
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                <li>删除重要文件或目录</li>
                <li>修改系统配置</li>
                <li>影响系统稳定性</li>
                <li>造成不可恢复的数据丢失</li>
              </ul>
              <p className="mt-3 font-medium">
                请确保您完全理解此命令的作用，并且只在必要时使用。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDangerousCancel}>
              取消并去除危险标记
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDangerousConfirm} className="bg-red-600 hover:bg-red-700">
              确认保存危险命令
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}