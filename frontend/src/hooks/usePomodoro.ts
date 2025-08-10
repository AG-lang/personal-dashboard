import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pomodoroApi } from '@/api/pomodoro'
import { 
  PomodoroSession, 
  PomodoroSessionCreate, 
  PomodoroSessionUpdate,
  FocusStats,
  PomodoroQueryParams 
} from '@/lib/types'

// 查询键
export const pomodoroKeys = {
  all: ['pomodoro'] as const,
  sessions: () => [...pomodoroKeys.all, 'sessions'] as const,
  sessionList: (params?: PomodoroQueryParams) => [...pomodoroKeys.sessions(), { params }] as const,
  session: (id: number) => [...pomodoroKeys.sessions(), id] as const,
  activeSession: () => [...pomodoroKeys.all, 'active'] as const,
  stats: () => [...pomodoroKeys.all, 'stats'] as const,
  todayStats: () => [...pomodoroKeys.stats(), 'today'] as const
}

// 获取番茄钟会话列表
export function usePomodoroSessions(params?: PomodoroQueryParams) {
  return useQuery({
    queryKey: pomodoroKeys.sessionList(params),
    queryFn: () => pomodoroApi.getSessions(params),
  })
}

// 获取单个番茄钟会话
export function usePomodoroSession(sessionId: number) {
  return useQuery({
    queryKey: pomodoroKeys.session(sessionId),
    queryFn: () => pomodoroApi.getSession(sessionId),
    enabled: sessionId > 0
  })
}

// 获取活跃的番茄钟会话
export function useActivePomodoroSession() {
  return useQuery({
    queryKey: pomodoroKeys.activeSession(),
    queryFn: () => pomodoroApi.getActiveSession(),
    refetchInterval: 5000, // 每5秒刷新一次
  })
}

// 创建番茄钟会话
export function useCreatePomodoroSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: PomodoroSessionCreate) => pomodoroApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.sessions() })
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.activeSession() })
    },
  })
}

// 更新番茄钟会话
export function useUpdatePomodoroSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: number; data: PomodoroSessionUpdate }) =>
      pomodoroApi.updateSession(sessionId, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(pomodoroKeys.session(updatedSession.id), updatedSession)
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.sessions() })
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.activeSession() })
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.stats() })
    },
  })
}

// 删除番茄钟会话
export function useDeletePomodoroSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sessionId: number) => pomodoroApi.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.removeQueries({ queryKey: pomodoroKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.sessions() })
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.activeSession() })
    },
  })
}

// 暂停番茄钟会话
export function usePausePomodoroSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sessionId: number) => pomodoroApi.pauseSession(sessionId),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(pomodoroKeys.session(updatedSession.id), updatedSession)
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.activeSession() })
    },
  })
}

// 恢复番茄钟会话
export function useResumePomodoroSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sessionId: number) => pomodoroApi.resumeSession(sessionId),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(pomodoroKeys.session(updatedSession.id), updatedSession)
      queryClient.invalidateQueries({ queryKey: pomodoroKeys.activeSession() })
    },
  })
}

// 获取专注时长统计
export function useFocusStats(days = 7) {
  return useQuery({
    queryKey: [...pomodoroKeys.stats(), { days }],
    queryFn: () => pomodoroApi.getFocusStats(days),
  })
}

// 获取今日统计
export function useTodayFocusStats() {
  return useQuery({
    queryKey: pomodoroKeys.todayStats(),
    queryFn: () => pomodoroApi.getTodayStats(),
  })
}