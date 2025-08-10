import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { commandsApi } from '@/api/commands'
import type { Command, CommandCreate, CommandUpdate, CommandsQueryParams, CommandStats } from '@/lib/types'

const QUERY_KEYS = {
  commands: 'commands',
  command: (id: number) => ['command', id],
  stats: 'command-stats',
  categories: 'command-categories',
  tags: 'command-tags',
  frequent: 'frequent-commands',
  recent: 'recent-commands',
}

// 获取命令列表
export function useCommands(params?: CommandsQueryParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.commands, params],
    queryFn: () => commandsApi.getCommands(params),
  })
}

// 获取单个命令
export function useCommand(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.command(id),
    queryFn: () => commandsApi.getCommand(id),
    enabled: !!id,
  })
}

// 获取统计信息
export function useCommandStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: () => commandsApi.getStats(),
  })
}

// 获取所有分类
export function useCommandCategories() {
  return useQuery({
    queryKey: [QUERY_KEYS.categories],
    queryFn: () => commandsApi.getCategories(),
  })
}

// 获取所有标签
export function useCommandTags() {
  return useQuery({
    queryKey: [QUERY_KEYS.tags],
    queryFn: () => commandsApi.getTags(),
  })
}

// 获取常用命令
export function useFrequentCommands(limit = 20) {
  return useQuery({
    queryKey: [QUERY_KEYS.frequent, limit],
    queryFn: () => commandsApi.getFrequentCommands(limit),
  })
}

// 获取最近使用的命令
export function useRecentCommands(limit = 20) {
  return useQuery({
    queryKey: [QUERY_KEYS.recent, limit],
    queryFn: () => commandsApi.getRecentCommands(limit),
  })
}

// 创建命令
export function useCreateCommand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (command: CommandCreate) => commandsApi.createCommand(command),
    onSuccess: () => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.commands] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] })
    },
    onMutate: async (newCommand) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.commands] })

      // 获取当前数据的快照
      const previousCommands = queryClient.getQueryData([QUERY_KEYS.commands])

      // 乐观更新
      const optimisticCommand: Command = {
        id: Date.now(), // 临时 ID
        name: newCommand.name,
        command: newCommand.command,
        description: newCommand.description || '',
        category: newCommand.category,
        tags: newCommand.tags || '',
        usage_example: newCommand.usage_example || '',
        notes: newCommand.notes || '',
        is_dangerous: newCommand.is_dangerous || false,
        use_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData([QUERY_KEYS.commands], (old: Command[] = []) => [
        optimisticCommand,
        ...old,
      ])

      return { previousCommands }
    },
    onError: (err, newCommand, context) => {
      // 回滚
      if (context?.previousCommands) {
        queryClient.setQueryData([QUERY_KEYS.commands], context.previousCommands)
      }
    },
  })
}

// 更新命令
export function useUpdateCommand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, command }: { id: number; command: CommandUpdate }) =>
      commandsApi.updateCommand(id, command),
    onSuccess: (updatedCommand) => {
      // 更新列表缓存
      queryClient.setQueryData([QUERY_KEYS.commands], (old: Command[] = []) =>
        old.map((command) => (command.id === updatedCommand.id ? updatedCommand : command))
      )
      // 更新单个命令缓存
      queryClient.setQueryData(QUERY_KEYS.command(updatedCommand.id), updatedCommand)
      // 可能需要更新标签缓存
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] })
    },
    onMutate: async ({ id, command }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.commands] })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.command(id) })

      const previousCommands = queryClient.getQueryData([QUERY_KEYS.commands])
      const previousCommand = queryClient.getQueryData(QUERY_KEYS.command(id))

      // 乐观更新
      queryClient.setQueryData([QUERY_KEYS.commands], (old: Command[] = []) =>
        old.map((oldCommand) =>
          oldCommand.id === id
            ? { ...oldCommand, ...command, updated_at: new Date().toISOString() }
            : oldCommand
        )
      )

      return { previousCommands, previousCommand }
    },
    onError: (err, { id }, context) => {
      if (context?.previousCommands) {
        queryClient.setQueryData([QUERY_KEYS.commands], context.previousCommands)
      }
      if (context?.previousCommand) {
        queryClient.setQueryData(QUERY_KEYS.command(id), context.previousCommand)
      }
    },
  })
}

// 删除命令
export function useDeleteCommand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => commandsApi.deleteCommand(id),
    onSuccess: (_, deletedId) => {
      // 从缓存中移除
      queryClient.setQueryData([QUERY_KEYS.commands], (old: Command[] = []) =>
        old.filter((command) => command.id !== deletedId)
      )
      queryClient.removeQueries({ queryKey: QUERY_KEYS.command(deletedId) })
      // 可能需要更新标签缓存
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] })
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.commands] })

      const previousCommands = queryClient.getQueryData([QUERY_KEYS.commands])

      // 乐观更新
      queryClient.setQueryData([QUERY_KEYS.commands], (old: Command[] = []) =>
        old.filter((command) => command.id !== deletedId)
      )

      return { previousCommands }
    },
    onError: (err, deletedId, context) => {
      if (context?.previousCommands) {
        queryClient.setQueryData([QUERY_KEYS.commands], context.previousCommands)
      }
    },
  })
}

// 使用命令
export function useUseCommand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => commandsApi.useCommand(id),
    onSuccess: (result, id) => {
      // 更新命令的使用次数和最后使用时间
      queryClient.setQueryData([QUERY_KEYS.commands], (old: Command[] = []) =>
        old.map((command) =>
          command.id === id
            ? {
                ...command,
                use_count: result.use_count,
                last_used_at: new Date().toISOString(),
              }
            : command
        )
      )
      
      // 更新单个命令缓存
      queryClient.setQueryData(QUERY_KEYS.command(id), (old: Command | undefined) =>
        old
          ? {
              ...old,
              use_count: result.use_count,
              last_used_at: new Date().toISOString(),
            }
          : undefined
      )

      // 刷新统计数据和常用命令
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.stats] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.frequent] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.recent] })
    },
  })
}