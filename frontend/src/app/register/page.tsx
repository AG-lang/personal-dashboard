'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const router = useRouter()
  const { register, registerLoading, registerError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (password !== confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setPasswordError('密码长度至少为6位')
      return
    }

    try {
      await register({ username, password })
      router.push('/')
    } catch (error) {
      console.error('注册失败:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建新账户
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或者{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              已有账户登录
            </Link>
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>用户注册</CardTitle>
            <CardDescription>
              创建您的个人仪表盘账户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  用户名
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名（至少3位）"
                  minLength={3}
                  maxLength={50}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  密码
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                />
              </div>
              
              {(passwordError || registerError) && (
                <div className="text-red-500 text-sm">
                  {passwordError || (registerError?.message || '注册失败')}
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={registerLoading}
              >
                {registerLoading ? '注册中...' : '注册'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}