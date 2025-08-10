'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/CopyButton'
import { Terminal, TrendingUp, Clock, Layers, AlertTriangle, Play } from 'lucide-react'
import { useCommandStats, useFrequentCommands, useRecentCommands } from '@/hooks/useCommands'
import type { Command } from '@/lib/types'

interface CommandStatsProps {
  onUseCommand?: (id: number) => void
}

const categoryLabels: Record<string, string> = {
  git: 'Git',
  docker: 'Docker',
  linux: 'Linux', 
  windows: 'Windows',
  nodejs: 'Node.js',
  python: 'Python',
  database: '数据库',
  network: '网络',
  custom: '自定义',
}

export function CommandStats({ onUseCommand }: CommandStatsProps) {
  const { data: stats, isLoading: statsLoading } = useCommandStats()
  const { data: frequentCommands, isLoading: frequentLoading } = useFrequentCommands(5)
  const { data: recentCommands, isLoading: recentLoading } = useRecentCommands(5)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderCommandItem = (command: Command, showUseButton = true) => (
    <div key={command.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {command.is_dangerous && (
            <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
          )}
          <span className="font-medium text-sm hover:text-primary cursor-pointer truncate">
            {command.name}
          </span>
          <CopyButton
            text={command.name}
            size="icon"
            className="h-4 w-4"
          />
        </div>
        <code className="text-xs text-muted-foreground font-mono truncate block">
          {command.command}
        </code>
        {command.use_count > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            使用 {command.use_count} 次
          </div>
        )}
      </div>
      {showUseButton && onUseCommand && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onUseCommand(command.id)}
          className="h-8 w-8 p-0 ml-2 flex-shrink-0"
        >
          <Play className="h-3 w-3" />
        </Button>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* 总览统计 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Terminal className="h-5 w-5" />
            总览
          </CardTitle>
          <CardDescription>命令库基本统计</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            </div>
          ) : stats ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">总命令数</span>
                <Badge variant="secondary">{stats.total_commands}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">分类数</span>
                <Badge variant="secondary">{stats.total_categories}</Badge>
              </div>
              {stats.most_used_command && (
                <div className="pt-2 border-t">
                  <div className="text-sm text-muted-foreground mb-2">最常用命令</div>
                  {renderCommandItem(stats.most_used_command, false)}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无统计数据</p>
          )}
        </CardContent>
      </Card>

      {/* 分类分布 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" />
            分类分布
          </CardTitle>
          <CardDescription>各分类的命令数量</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-8 animate-pulse" />
                </div>
              ))}
            </div>
          ) : stats?.category_stats ? (
            <div className="space-y-2">
              {Object.entries(stats.category_stats)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm">{categoryLabels[category] || category}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无分类数据</p>
          )}
        </CardContent>
      </Card>

      {/* 常用命令 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            常用命令
          </CardTitle>
          <CardDescription>使用频率最高的命令</CardDescription>
        </CardHeader>
        <CardContent>
          {frequentLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : frequentCommands && frequentCommands.length > 0 ? (
            <div className="space-y-3">
              {frequentCommands.map(command => renderCommandItem(command))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">还没有使用过任何命令</p>
          )}
        </CardContent>
      </Card>

      {/* 最近使用 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5" />
            最近使用
          </CardTitle>
          <CardDescription>最近使用的命令</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : recentCommands && recentCommands.length > 0 ? (
            <div className="space-y-3">
              {recentCommands.map(command => (
                <div key={command.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {command.is_dangerous && (
                        <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm hover:text-primary cursor-pointer truncate">
                        {command.name}
                      </span>
                      <CopyButton
                        text={command.name}
                        size="icon"
                        className="h-4 w-4"
                      />
                    </div>
                    <code className="text-xs text-muted-foreground font-mono truncate block">
                      {command.command}
                    </code>
                    {command.last_used_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(command.last_used_at)}
                      </div>
                    )}
                  </div>
                  {onUseCommand && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onUseCommand(command.id)}
                      className="h-8 w-8 p-0 ml-2 flex-shrink-0"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">还没有使用过任何命令</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}