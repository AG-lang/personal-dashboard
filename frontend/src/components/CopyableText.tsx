'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CopyableTextProps {
  text: string
  children: React.ReactNode
  className?: string
  showIcon?: boolean
  truncate?: boolean
  maxLength?: number
}

export function CopyableText({ 
  text, 
  children,
  className,
  showIcon = true,
  truncate = false,
  maxLength = 50
}: CopyableTextProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const displayText = truncate && text.length > maxLength 
    ? `${text.substring(0, maxLength)}...` 
    : text

  return (
    <div
      className={cn(
        'group inline-flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors',
        className
      )}
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`点击复制: ${text}`}
    >
      <span className="select-text">
        {children || displayText}
      </span>
      
      {showIcon && (isHovered || isCopied) && (
        <span className={cn(
          'inline-flex transition-colors duration-200',
          isCopied ? 'text-green-600' : 'text-gray-400'
        )}>
          {isCopied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </span>
      )}
    </div>
  )
}