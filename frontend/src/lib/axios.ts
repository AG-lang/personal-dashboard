import axios from 'axios'

// 在生产环境（Vercel）默认走相对路径 /api，
// 本地开发通过 .env.local 的 NEXT_PUBLIC_API_URL 指向 http://localhost:8000
const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 清除本地token并重定向到登录页
      localStorage.removeItem('access_token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)