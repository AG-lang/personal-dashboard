import { apiClient } from '@/lib/axios'
import type { 
  Command, 
  CommandCreate, 
  CommandUpdate, 
  CommandsQueryParams,
  CommandStats,
  CommandCategory 
} from '@/lib/types'

export const commandsApi = {
  // 获取命令列表
  getCommands: async (params?: CommandsQueryParams): Promise<Command[]> => {
    const response = await apiClient.get('/commands/', { params })
    return response.data
  },

  // 获取单个命令
  getCommand: async (id: number): Promise<Command> => {
    const response = await apiClient.get(`/commands/${id}`)
    return response.data
  },

  // 创建命令
  createCommand: async (command: CommandCreate): Promise<Command> => {
    const response = await apiClient.post('/commands/', command)
    return response.data
  },

  // 更新命令
  updateCommand: async (id: number, command: CommandUpdate): Promise<Command> => {
    const response = await apiClient.put(`/commands/${id}`, command)
    return response.data
  },

  // 删除命令
  deleteCommand: async (id: number): Promise<void> => {
    await apiClient.delete(`/commands/${id}`)
  },

  // 记录命令使用
  useCommand: async (id: number): Promise<{ message: string; use_count: number }> => {
    const response = await apiClient.post(`/commands/${id}/use`)
    return response.data
  },

  // 获取统计信息
  getStats: async (): Promise<CommandStats> => {
    const response = await apiClient.get('/commands/stats/overview')
    return response.data
  },

  // 获取所有分类
  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/commands/categories/')
    return response.data
  },

  // 获取所有标签
  getTags: async (): Promise<string[]> => {
    const response = await apiClient.get('/commands/tags/')
    return response.data
  },

  // 获取常用命令
  getFrequentCommands: async (limit = 20): Promise<Command[]> => {
    const response = await apiClient.get('/commands/frequent/', { params: { limit } })
    return response.data
  },

  // 获取最近使用的命令
  getRecentCommands: async (limit = 20): Promise<Command[]> => {
    const response = await apiClient.get('/commands/recent/', { params: { limit } })
    return response.data
  }
}