'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommandForm } from '@/components/CommandForm'
import { CommandList } from '@/components/CommandList'
import { CommandStats } from '@/components/CommandStats'
import { Plus, Terminal, BarChart3, List } from 'lucide-react'
import { useCreateCommand, useUpdateCommand, useDeleteCommand, useUseCommand } from '@/hooks/useCommands'
import type { Command, CommandCreate, CommandUpdate } from '@/lib/types'
import { toast } from 'sonner'

export default function CommandsPage() {
  const [activeTab, setActiveTab] = useState('list')
  const [editingCommand, setEditingCommand] = useState<Command | null>(null)
  const [showForm, setShowForm] = useState(false)

  const createCommandMutation = useCreateCommand()
  const updateCommandMutation = useUpdateCommand()
  const deleteCommandMutation = useDeleteCommand()
  const useCommandMutation = useUseCommand()

  const handleCreateCommand = async (data: CommandCreate | CommandUpdate) => {
    try {
      await createCommandMutation.mutateAsync(data as CommandCreate)
      toast.success('命令保存成功')
      setShowForm(false)
    } catch (error) {
      toast.error('保存失败，请重试')
      console.error('创建命令失败:', error)
    }
  }

  const handleUpdateCommand = async (data: CommandCreate | CommandUpdate) => {
    if (!editingCommand) return
    
    try {
      await updateCommandMutation.mutateAsync({
        id: editingCommand.id,
        command: data as CommandUpdate
      })
      toast.success('命令更新成功')
      setEditingCommand(null)
    } catch (error) {
      toast.error('更新失败，请重试')
      console.error('更新命令失败:', error)
    }
  }

  const handleDeleteCommand = async (id: number) => {
    try {
      await deleteCommandMutation.mutateAsync(id)
      toast.success('命令已删除')
    } catch (error) {
      toast.error('删除失败，请重试')
      console.error('删除命令失败:', error)
    }
  }

  const handleUseCommand = async (id: number) => {
    try {
      await useCommandMutation.mutateAsync(id)
      toast.success('已记录使用')
    } catch (error) {
      toast.error('记录使用失败')
      console.error('记录使用失败:', error)
    }
  }

  const handleEdit = (command: Command) => {
    setEditingCommand(command)
    setActiveTab('form')
  }

  const handleCancelEdit = () => {
    setEditingCommand(null)
    if (!showForm) {
      setActiveTab('list')
    }
  }

  const handleAddNew = () => {
    setEditingCommand(null)
    setShowForm(true)
    setActiveTab('form')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Terminal className="h-8 w-8" />
              命令记忆库
            </h1>
            <p className="text-muted-foreground mt-2">
              保存和管理常用的命令，提高开发效率
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline">
                返回首页
              </Button>
            </Link>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加命令
            </Button>
          </div>
        </div>

        {/* 选项卡导航 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              命令列表
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              统计分析
            </TabsTrigger>
            <TabsTrigger value="form" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {editingCommand ? '编辑命令' : '添加命令'}
            </TabsTrigger>
          </TabsList>

          {/* 命令列表 */}
          <TabsContent value="list" className="space-y-6">
            <CommandList
              onEdit={handleEdit}
              onDelete={handleDeleteCommand}
              onUse={handleUseCommand}
            />
          </TabsContent>

          {/* 统计分析 */}
          <TabsContent value="stats" className="space-y-6">
            <CommandStats onUseCommand={handleUseCommand} />
          </TabsContent>

          {/* 添加/编辑表单 */}
          <TabsContent value="form" className="space-y-6">
            <CommandForm
              onSubmit={editingCommand ? handleUpdateCommand : handleCreateCommand}
              onCancel={handleCancelEdit}
              initialData={editingCommand || undefined}
              isEditing={!!editingCommand}
              isLoading={createCommandMutation.isPending || updateCommandMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}