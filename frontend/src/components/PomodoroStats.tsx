'use client'

import { Card } from '@/components/ui/card'
import { useFocusStats, useTodayFocusStats } from '@/hooks/usePomodoro'

export default function PomodoroStats() {
  const { data: weekStats = [] } = useFocusStats(7)
  const { data: todayStats } = useTodayFocusStats()

  // 格式化时间显示（秒转换为小时分钟）
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  // 计算本周总计
  const weekTotal = weekStats.reduce((acc, day) => ({
    work_time: acc.work_time + day.total_work_time,
    break_time: acc.break_time + day.total_break_time,
    pomodoros: acc.pomodoros + day.completed_pomodoros,
    sessions: acc.sessions + day.total_sessions
  }), { work_time: 0, break_time: 0, pomodoros: 0, sessions: 0 })

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">专注统计</h3>
      
      <div className="space-y-6">
        {/* 今日统计 */}
        {todayStats && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-3">今日数据</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-blue-600">专注时长</div>
                <div className="font-semibold">{formatTime(todayStats.total_work_time)}</div>
              </div>
              <div>
                <div className="text-blue-600">完成番茄钟</div>
                <div className="font-semibold">{todayStats.completed_pomodoros}个</div>
              </div>
              <div>
                <div className="text-blue-600">休息时长</div>
                <div className="font-semibold">{formatTime(todayStats.total_break_time)}</div>
              </div>
              <div>
                <div className="text-blue-600">总会话数</div>
                <div className="font-semibold">{todayStats.total_sessions}次</div>
              </div>
            </div>
          </div>
        )}

        {/* 本周统计 */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-3">本周总计</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-green-600">专注时长</div>
              <div className="font-semibold">{formatTime(weekTotal.work_time)}</div>
            </div>
            <div>
              <div className="text-green-600">完成番茄钟</div>
              <div className="font-semibold">{weekTotal.pomodoros}个</div>
            </div>
            <div>
              <div className="text-green-600">休息时长</div>
              <div className="font-semibold">{formatTime(weekTotal.break_time)}</div>
            </div>
            <div>
              <div className="text-green-600">总会话数</div>
              <div className="font-semibold">{weekTotal.sessions}次</div>
            </div>
          </div>
        </div>

        {/* 每日详情 */}
        {weekStats.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">最近7天详情</h4>
            <div className="space-y-2 text-sm">
              {weekStats.map((stat, index) => (
                <div key={`${stat.date}-${index}`} className="flex justify-between items-center py-2 border-b">
                  <div className="font-medium">
                    {new Date(stat.date).toLocaleDateString('zh-CN', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex space-x-4 text-gray-600">
                    <span>{formatTime(stat.total_work_time)}</span>
                    <span>{stat.completed_pomodoros}🍅</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 专注效率指标 */}
        {todayStats && todayStats.total_sessions > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-3">效率指标</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-600">平均会话时长</span>
                <span className="font-semibold">
                  {formatTime(Math.floor(todayStats.total_work_time / todayStats.total_sessions))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-600">完成率</span>
                <span className="font-semibold">
                  {Math.round((todayStats.completed_pomodoros / todayStats.total_sessions) * 100)}%
                </span>
              </div>
              {todayStats.total_work_time > 0 && todayStats.total_break_time > 0 && (
                <div className="flex justify-between">
                  <span className="text-purple-600">工作休息比</span>
                  <span className="font-semibold">
                    {Math.round(todayStats.total_work_time / todayStats.total_break_time * 10) / 10}:1
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}