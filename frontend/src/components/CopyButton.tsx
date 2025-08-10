'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  showText?: boolean
  disabled?: boolean
}

export function CopyButton({ 
  text, 
  className,
  size = 'sm',
  variant = 'ghost',
  showText = false,
  disabled = false
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    if (disabled || !text) return
    
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  return (
    <Button
      onClick={handleCopy}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        'transition-all duration-200',
        isCopied && 'text-green-600',
        className
      )}
      title={isCopied ? '已复制!' : '点击复制'}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {showText && (
        <span className="ml-1">
          {isCopied ? '已复制' : '复制'}
        </span>
      )}
    </Button>
  )
}