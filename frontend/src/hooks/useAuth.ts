import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import type { UserCreate, UserLogin } from '@/lib/types'

interface AuthState {
  user: any | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

// 全局认证状态
let authState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false
}

let listeners: (() => void)[] = []

const subscribe = (listener: () => void) => {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

const setAuthState = (newState: Partial<AuthState>) => {
  authState = { ...authState, ...newState }
  listeners.forEach(listener => listener())
}

// 初始化认证状态
const initializeAuth = () => {
  const token = localStorage.getItem('access_token')
  if (token) {
    setAuthState({ token, isAuthenticated: true })
  } else {
    setAuthState({ isLoading: false })
  }
}

export function useAuth() {
  const [, setForceUpdate] = useState({})
  const queryClient = useQueryClient()

  useEffect(() => {
    initializeAuth()
    return subscribe(() => {
      setForceUpdate({})
    })
  }, [])

  // 获取当前用户
  const { data: currentUser, isLoading: isUserLoading, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: authState.isAuthenticated && !!authState.token,
    retry: false
  })

  // 处理用户数据变化
  useEffect(() => {
    if (currentUser) {
      setAuthState({ user: currentUser, isLoading: false })
    }
  }, [currentUser])

  // 处理查询错误
  useEffect(() => {
    if (isError && authState.isAuthenticated) {
      logout()
    }
  }, [isError])

  // 注册
  const registerMutation = useMutation({
    mutationFn: authApi.register
  })

  // 登录
  const loginMutation = useMutation({
    mutationFn: authApi.login
  })

  const login = async (credentials: UserLogin) => {
    const data = await loginMutation.mutateAsync(credentials)
    localStorage.setItem('access_token', data.access_token)
    setAuthState({ 
      user: data.user, 
      token: data.access_token, 
      isAuthenticated: true,
      isLoading: false 
    })
    queryClient.invalidateQueries({ queryKey: ['currentUser'] })
  }

  const register = async (userData: UserCreate) => {
    const data = await registerMutation.mutateAsync(userData)
    localStorage.setItem('access_token', data.access_token)
    setAuthState({ 
      user: data.user, 
      token: data.access_token, 
      isAuthenticated: true,
      isLoading: false 
    })
    queryClient.invalidateQueries({ queryKey: ['currentUser'] })
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setAuthState({ 
      user: null, 
      token: null, 
      isAuthenticated: false,
      isLoading: false 
    })
    queryClient.clear()
  }

  return {
    user: authState.user,
    token: authState.token,
    isLoading: authState.isLoading || isUserLoading,
    isAuthenticated: authState.isAuthenticated,
    login,
    register,
    logout,
    loginLoading: loginMutation.isPending,
    registerLoading: registerMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error
  }
}