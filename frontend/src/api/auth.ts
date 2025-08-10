import { apiClient } from '@/lib/axios'
import type { UserCreate, UserLogin, AuthResponse } from '@/lib/types'

export const authApi = {
  // 用户注册
  register: async (userData: UserCreate): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  // 用户登录
  login: async (credentials: UserLogin): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('未登录')
    }
    
    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  }
}