import { apiClient } from '@/lib/axios'
import { 
  PomodoroSession, 
  PomodoroSessionCreate, 
  PomodoroSessionUpdate,
  FocusStats,
  PomodoroQueryParams 
} from '@/lib/types'

const POMODORO_BASE_URL = '/pomodoro'

export const pomodoroApi = {
  // 会话管理
  createSession: async (data: PomodoroSessionCreate): Promise<PomodoroSession> => {
    const response = await apiClient.post(`${POMODORO_BASE_URL}/sessions/`, data)
    return response.data
  },

  getSessions: async (params?: PomodoroQueryParams): Promise<PomodoroSession[]> => {
    const response = await apiClient.get(`${POMODORO_BASE_URL}/sessions/`, { params })
    return response.data
  },

  getSession: async (sessionId: number): Promise<PomodoroSession> => {
    const response = await apiClient.get(`${POMODORO_BASE_URL}/sessions/${sessionId}`)
    return response.data
  },

  updateSession: async (sessionId: number, data: PomodoroSessionUpdate): Promise<PomodoroSession> => {
    const response = await apiClient.put(`${POMODORO_BASE_URL}/sessions/${sessionId}`, data)
    return response.data
  },

  deleteSession: async (sessionId: number): Promise<void> => {
    await apiClient.delete(`${POMODORO_BASE_URL}/sessions/${sessionId}`)
  },

  // 活跃会话
  getActiveSession: async (): Promise<PomodoroSession | null> => {
    const response = await apiClient.get(`${POMODORO_BASE_URL}/sessions/active/`)
    return response.data
  },

  // 会话控制
  pauseSession: async (sessionId: number): Promise<PomodoroSession> => {
    const response = await apiClient.post(`${POMODORO_BASE_URL}/sessions/${sessionId}/pause`)
    return response.data
  },

  resumeSession: async (sessionId: number): Promise<PomodoroSession> => {
    const response = await apiClient.post(`${POMODORO_BASE_URL}/sessions/${sessionId}/resume`)
    return response.data
  },

  // 统计数据
  getFocusStats: async (days?: number): Promise<FocusStats[]> => {
    const response = await apiClient.get(`${POMODORO_BASE_URL}/stats/`, { params: { days } })
    return response.data
  },

  getTodayStats: async (): Promise<FocusStats> => {
    const response = await apiClient.get(`${POMODORO_BASE_URL}/stats/today/`)
    return response.data
  }
}