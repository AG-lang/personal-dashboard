'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LegacySelect as Select } from './ui/legacy-select'
import { useTimer } from '@/hooks/useTimer'
import { useWhiteNoise } from '@/hooks/useWhiteNoise'
import { useTodos } from '@/hooks/useTodos'
import { 
  useCreatePomodoroSession, 
  useUpdatePomodoroSession,
  useActivePomodoroSession 
} from '@/hooks/usePomodoro'
import { PomodoroStatus, PomodoroSessionCreate } from '@/lib/types'

// 番茄钟阶段配置
const POMODORO_PHASES = {
  work: { duration: 25 * 60, label: '专注工作', nextPhase: 'short_break' as PomodoroStatus },
  short_break: { duration: 5 * 60, label: '短休息', nextPhase: 'work' as PomodoroStatus },
  long_break: { duration: 15 * 60, label: '长休息', nextPhase: 'work' as PomodoroStatus }
}

export default function PomodoroTimer() {
  const [currentPhase, setCurrentPhase] = useState<PomodoroStatus>('work')
  const [selectedTodoId, setSelectedTodoId] = useState<number | undefined>()
  const [cyclesCompleted, setCyclesCompleted] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [totalWorkTime, setTotalWorkTime] = useState(0)
  const [totalBreakTime, setTotalBreakTime] = useState(0)

  // Hooks
  const { data: todos = [] } = useTodos()
  const { data: activeSession } = useActivePomodoroSession()
  const createSession = useCreatePomodoroSession()
  const updateSession = useUpdatePomodoroSession()
  const whiteNoise = useWhiteNoise()

  // 计时器配置
  const currentPhaseDuration = POMODORO_PHASES[currentPhase as keyof typeof POMODORO_PHASES]?.duration || 25 * 60

  const timer = useTimer({
    initialTime: currentPhaseDuration,
    onComplete: handlePhaseComplete,
    onTick: handleTick
  })

  // 处理阶段完成
  function handlePhaseComplete() {
    if (currentPhase === 'work') {
      setCyclesCompleted(prev => prev + 1)
      // 每4个工作周期后进入长休息
      const nextPhase = (cyclesCompleted + 1) % 4 === 0 ? 'long_break' : 'short_break'
      setCurrentPhase(nextPhase as PomodoroStatus)
    } else {
      setCurrentPhase('work')
    }

    // 播放完成提示音
    playNotificationSound()
  }

  // 处理每秒更新
  function handleTick(timeLeft: number) {
    if (sessionStartTime) {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
      const phaseElapsed = currentPhaseDuration - timeLeft
      
      if (currentPhase === 'work') {
        setTotalWorkTime(elapsed)
      } else {
        setTotalBreakTime(elapsed)
      }
    }
  }

  // 开始番茄钟会话
  const startSession = async () => {
    if (!activeSession) {
      // 创建新会话
      const sessionData: PomodoroSessionCreate = {
        duration_minutes: Math.floor(currentPhaseDuration / 60),
        status: currentPhase,
        actual_work_time: 0,
        break_time: 0,
        completed_cycles: 0,
        notes: ''
      }
      
      if (selectedTodoId) {
        sessionData.todo_id = selectedTodoId
      }
      
      try {
        const newSession = await createSession.mutateAsync(sessionData)
        console.log('创建会话成功:', newSession)
      } catch (error) {
        console.error('创建番茄钟会话失败:', error)
        return
      }
    }

    setSessionStartTime(Date.now())
    timer.start()
  }

  // 暂停会话
  const pauseSession = async () => {
    timer.pause()
    
    if (activeSession) {
      try {
        await updateSession.mutateAsync({
          sessionId: activeSession.id,
          data: {
            status: 'paused',
            actual_work_time: totalWorkTime,
            break_time: totalBreakTime
          }
        })
      } catch (error) {
        console.error('暂停会话失败:', error)
      }
    }
  }

  // 结束会话
  const endSession = async () => {
    timer.reset()
    whiteNoise.stop()
    
    if (activeSession) {
      try {
        await updateSession.mutateAsync({
          sessionId: activeSession.id,
          data: {
            status: 'completed',
            actual_work_time: totalWorkTime,
            break_time: totalBreakTime,
            completed_cycles: cyclesCompleted,
            completed_at: new Date().toISOString()
          }
        })
      } catch (error) {
        console.error('结束会话失败:', error)
      }
    }

    // 重置状态
    setSessionStartTime(null)
    setTotalWorkTime(0)
    setTotalBreakTime(0)
    setCyclesCompleted(0)
    setCurrentPhase('work')
  }

  // 播放提示音
  const playNotificationSound = () => {
    try {
      // 创建提示音（简单的beep音）
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('播放提示音失败:', error)
    }
  }

  // 当阶段改变时重置计时器
  useEffect(() => {
    const newDuration = POMODORO_PHASES[currentPhase as keyof typeof POMODORO_PHASES]?.duration || 25 * 60
    timer.setTime(newDuration)
  }, [currentPhase])

  // 获取当前阶段的显示文本和颜色
  const getPhaseDisplay = () => {
    switch (currentPhase) {
      case 'work':
        return { text: '专注工作', color: 'text-red-600', bg: 'bg-red-50' }
      case 'short_break':
        return { text: '短休息', color: 'text-green-600', bg: 'bg-green-50' }
      case 'long_break':
        return { text: '长休息', color: 'text-blue-600', bg: 'bg-blue-50' }
      default:
        return { text: '专注工作', color: 'text-red-600', bg: 'bg-red-50' }
    }
  }

  const phaseDisplay = getPhaseDisplay()

  return (
    <Card className={`p-6 ${phaseDisplay.bg} border-2`}>
      <div className="space-y-6">
        {/* 标题和阶段 */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">番茄钟专注模式</h2>
          <div className={`text-lg font-semibold ${phaseDisplay.color}`}>
            {phaseDisplay.text}
          </div>
          <div className="text-sm text-gray-500">
            已完成 {cyclesCompleted} 个番茄钟
          </div>
        </div>

        {/* 计时器显示 */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold mb-4">
            {timer.formatTime}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                currentPhase === 'work' ? 'bg-red-500' : 
                currentPhase === 'short_break' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${timer.progress}%` }}
            />
          </div>
        </div>

        {/* 任务选择 */}
        {currentPhase === 'work' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium">选择关联任务（可选）</label>
            <select 
              value={selectedTodoId || ''}
              onChange={(e) => setSelectedTodoId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full p-2 border rounded-md"
              disabled={timer.isRunning}
            >
              <option value="">不选择任务</option>
              {todos.filter(todo => !todo.is_completed).map(todo => (
                <option key={todo.id} value={todo.id}>
                  {todo.content}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 白噪音控制 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">背景声音</label>
          <div className="flex items-center space-x-2">
            <select
              value={whiteNoise.currentTrack.id}
              onChange={(e) => whiteNoise.selectTrack(e.target.value)}
              className="flex-1 p-2 border rounded-md"
            >
              {whiteNoise.tracks.map(track => (
                <option key={track.id} value={track.id}>
                  {track.icon} {track.name}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={whiteNoise.toggle}
              disabled={whiteNoise.currentTrack.id === 'none'}
            >
              {whiteNoise.isPlaying ? '⏸️' : '▶️'}
            </Button>
          </div>
          {whiteNoise.currentTrack.id !== 'none' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">音量:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={whiteNoise.volume}
                onChange={(e) => whiteNoise.changeVolume(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm w-8">{Math.round(whiteNoise.volume * 100)}%</span>
            </div>
          )}
        </div>

        {/* 控制按钮 */}
        <div className="flex space-x-2">
          {!timer.isRunning ? (
            <Button 
              onClick={startSession}
              className="flex-1"
              disabled={createSession.isPending}
            >
              {sessionStartTime ? '继续' : '开始'}
            </Button>
          ) : (
            <Button 
              onClick={pauseSession}
              variant="outline"
              className="flex-1"
            >
              暂停
            </Button>
          )}
          
          <Button 
            onClick={endSession}
            variant="destructive"
            disabled={!sessionStartTime}
          >
            结束
          </Button>
        </div>

        {/* 会话信息 */}
        {sessionStartTime && (
          <div className="text-sm text-gray-600 space-y-1">
            <div>工作时长: {Math.floor(totalWorkTime / 60)}分{totalWorkTime % 60}秒</div>
            <div>休息时长: {Math.floor(totalBreakTime / 60)}分{totalBreakTime % 60}秒</div>
            {selectedTodoId && (
              <div>关联任务: {todos.find(t => t.id === selectedTodoId)?.content}</div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}