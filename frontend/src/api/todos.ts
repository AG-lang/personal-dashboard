import { apiClient } from '@/lib/axios'
import type { Todo, TodoCreate, TodoUpdate, TodosQueryParams } from '@/lib/types'

export const todosApi = {
  // 获取所有 todos
  getTodos: async (params?: TodosQueryParams): Promise<Todo[]> => {
    const response = await apiClient.get('/todos', { params })
    return response.data
  },

  // 根据 ID 获取单个 todo
  getTodo: async (id: number): Promise<Todo> => {
    const response = await apiClient.get(`/todos/${id}`)
    return response.data
  },

  // 创建新的 todo
  createTodo: async (todo: TodoCreate): Promise<Todo> => {
    const response = await apiClient.post('/todos/', todo)
    return response.data
  },

  // 更新 todo
  updateTodo: async (id: number, todo: TodoUpdate): Promise<Todo> => {
    const response = await apiClient.put(`/todos/${id}`, todo)
    return response.data
  },

  // 删除 todo
  deleteTodo: async (id: number): Promise<void> => {
    await apiClient.delete(`/todos/${id}`)
  },

  // 切换完成状态
  toggleTodo: async (id: number): Promise<Todo> => {
    const response = await apiClient.patch(`/todos/${id}/toggle`)
    return response.data
  },
}