import { apiClient } from '@/lib/axios'
import type { Tool, ToolCreate, ToolUpdate, ToolsQueryParams, ToolType } from '@/lib/types'

export const toolsApi = {
  // 获取所有工具
  getTools: async (params?: ToolsQueryParams): Promise<Tool[]> => {
    const response = await apiClient.get('/tools/', { params })
    return response.data
  },

  // 根据 ID 获取单个工具
  getTool: async (id: number): Promise<Tool> => {
    const response = await apiClient.get(`/tools/${id}`)
    return response.data
  },

  // 创建新工具
  createTool: async (tool: ToolCreate): Promise<Tool> => {
    const response = await apiClient.post('/tools/', tool)
    return response.data
  },

  // 更新工具
  updateTool: async (id: number, tool: ToolUpdate): Promise<Tool> => {
    const response = await apiClient.put(`/tools/${id}`, tool)
    return response.data
  },

  // 删除工具
  deleteTool: async (id: number): Promise<void> => {
    await apiClient.delete(`/tools/${id}`)
  },

  // 获取所有标签
  getTags: async (): Promise<string[]> => {
    const response = await apiClient.get('/tools/tags/')
    return response.data
  },

  // 获取所有工具类型
  getToolTypes: async (): Promise<ToolType[]> => {
    const response = await apiClient.get('/tools/types/')
    return response.data
  },
}