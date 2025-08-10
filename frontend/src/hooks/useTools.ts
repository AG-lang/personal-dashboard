import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi } from '@/api/tools'
import type { Tool, ToolCreate, ToolUpdate, ToolsQueryParams, ToolType } from '@/lib/types'

const QUERY_KEYS = {
  tools: 'tools',
  tool: (id: number) => ['tool', id],
  tags: 'tool-tags',
  types: 'tool-types',
}

// 获取工具列表
export function useTools(params?: ToolsQueryParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.tools, params],
    queryFn: () => toolsApi.getTools(params),
  })
}

// 获取单个工具
export function useTool(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.tool(id),
    queryFn: () => toolsApi.getTool(id),
    enabled: !!id,
  })
}

// 获取所有标签
export function useToolTags() {
  return useQuery({
    queryKey: [QUERY_KEYS.tags],
    queryFn: () => toolsApi.getTags(),
  })
}

// 获取所有工具类型
export function useToolTypes() {
  return useQuery({
    queryKey: [QUERY_KEYS.types],
    queryFn: () => toolsApi.getToolTypes(),
  })
}

// 创建工具
export function useCreateTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tool: ToolCreate) => toolsApi.createTool(tool),
    onSuccess: () => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tools] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
    },
    onMutate: async (newTool) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.tools] })

      // 获取当前数据的快照
      const previousTools = queryClient.getQueryData([QUERY_KEYS.tools])

      // 乐观更新
      const optimisticTool: Tool = {
        id: Date.now(), // 临时 ID
        title: newTool.title,
        type: newTool.type,
        tags: newTool.tags || '',
        description: newTool.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(newTool.system_prompt && { system_prompt: newTool.system_prompt }),
        ...(newTool.api_key && { api_key: newTool.api_key }),
        ...(newTool.api_endpoint && { api_endpoint: newTool.api_endpoint }),
      }

      queryClient.setQueryData([QUERY_KEYS.tools], (old: Tool[] = []) => [
        optimisticTool,
        ...old,
      ])

      return { previousTools }
    },
    onError: (err, newTool, context) => {
      // 回滚
      if (context?.previousTools) {
        queryClient.setQueryData([QUERY_KEYS.tools], context.previousTools)
      }
    },
  })
}

// 更新工具
export function useUpdateTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, tool }: { id: number; tool: ToolUpdate }) =>
      toolsApi.updateTool(id, tool),
    onSuccess: (updatedTool) => {
      // 更新列表缓存
      queryClient.setQueryData([QUERY_KEYS.tools], (old: Tool[] = []) =>
        old.map((tool) => (tool.id === updatedTool.id ? updatedTool : tool))
      )
      // 更新单个工具缓存
      queryClient.setQueryData(QUERY_KEYS.tool(updatedTool.id), updatedTool)
      // 可能需要更新标签缓存
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
    },
    onMutate: async ({ id, tool }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.tools] })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.tool(id) })

      const previousTools = queryClient.getQueryData([QUERY_KEYS.tools])
      const previousTool = queryClient.getQueryData(QUERY_KEYS.tool(id))

      // 乐观更新
      queryClient.setQueryData([QUERY_KEYS.tools], (old: Tool[] = []) =>
        old.map((oldTool) =>
          oldTool.id === id
            ? { ...oldTool, ...tool, updated_at: new Date().toISOString() }
            : oldTool
        )
      )

      return { previousTools, previousTool }
    },
    onError: (err, { id }, context) => {
      if (context?.previousTools) {
        queryClient.setQueryData([QUERY_KEYS.tools], context.previousTools)
      }
      if (context?.previousTool) {
        queryClient.setQueryData(QUERY_KEYS.tool(id), context.previousTool)
      }
    },
  })
}

// 删除工具
export function useDeleteTool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => toolsApi.deleteTool(id),
    onSuccess: (_, deletedId) => {
      // 从缓存中移除
      queryClient.setQueryData([QUERY_KEYS.tools], (old: Tool[] = []) =>
        old.filter((tool) => tool.id !== deletedId)
      )
      queryClient.removeQueries({ queryKey: QUERY_KEYS.tool(deletedId) })
      // 可能需要更新标签缓存
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.tools] })

      const previousTools = queryClient.getQueryData([QUERY_KEYS.tools])

      // 乐观更新
      queryClient.setQueryData([QUERY_KEYS.tools], (old: Tool[] = []) =>
        old.filter((tool) => tool.id !== deletedId)
      )

      return { previousTools }
    },
    onError: (err, deletedId, context) => {
      if (context?.previousTools) {
        queryClient.setQueryData([QUERY_KEYS.tools], context.previousTools)
      }
    },
  })
}