import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PaletteGenerator } from '@/components/PaletteGenerator'

export const dynamic = 'force-dynamic'

export default function PalettePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">配色方案生成器</h1>
              <p className="text-gray-600">上传图片或使用示例图，自动提取主色调和和谐色板。</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                返回首页
              </Button>
            </Link>
          </div>
        </div>
        <PaletteGenerator />
      </div>
    </div>
  )
}
