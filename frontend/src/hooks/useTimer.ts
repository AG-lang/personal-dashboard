import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerProps {
  initialTime: number // 初始时间（秒）
  onComplete?: () => void // 倒计时结束回调
  onTick?: (timeLeft: number) => void // 每秒回调
}

export function useTimer({ initialTime, onComplete, onTick }: UseTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTickTime = useRef<number>(Date.now())

  // 开始计时
  const start = useCallback(() => {
    if (!isRunning && timeLeft > 0) {
      setIsRunning(true)
      lastTickTime.current = Date.now()
    }
  }, [isRunning, timeLeft])

  // 暂停计时
  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  // 重置计时器
  const reset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(initialTime)
  }, [initialTime])

  // 设置时间
  const setTime = useCallback((newTime: number) => {
    setTimeLeft(newTime)
    if (newTime === 0 && isRunning) {
      setIsRunning(false)
    }
  }, [isRunning])

  // 计时器效果
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - lastTickTime.current) / 1000)
        
        if (elapsed >= 1) {
          setTimeLeft(prev => {
            const newTime = Math.max(0, prev - elapsed)
            onTick?.(newTime)
            
            if (newTime === 0) {
              setIsRunning(false)
              onComplete?.()
            }
            
            return newTime
          })
          lastTickTime.current = now
        }
      }, 100) // 100ms间隔检查，提供更平滑的倒计时
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft, onComplete, onTick])

  // 格式化时间显示
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 获取时间百分比（用于进度条）
  const getProgress = useCallback(() => {
    if (initialTime === 0) return 0
    return ((initialTime - timeLeft) / initialTime) * 100
  }, [initialTime, timeLeft])

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    setTime,
    formatTime: formatTime(timeLeft),
    progress: getProgress(),
    isComplete: timeLeft === 0
  }
}