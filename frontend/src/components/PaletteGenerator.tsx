'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { rgbToHex, rgbToHsl, hslToRgb, getBestTextColor, type RGB } from '@/lib/color'

type PaletteColor = {
  rgb: RGB
  hex: string
  count: number
}

type ExtractionOptions = {
  paletteSize: number
  maxDimension: number
  sampleStep: number
}

const DEFAULT_OPTIONS: ExtractionOptions = {
  paletteSize: 6,
  maxDimension: 160,
  sampleStep: 2,
}

function getDistanceSquared(a: RGB, b: RGB): number {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

function kMeansQuantize(pixels: RGB[], k: number, maxIterations = 12): PaletteColor[] {
  if (pixels.length === 0 || k <= 0) return []

  // 初始化质心
  const centroids: RGB[] = []
  const usedIndices = new Set<number>()
  while (centroids.length < k && usedIndices.size < pixels.length) {
    const idx = Math.floor(Math.random() * pixels.length)
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx)
      centroids.push({ ...pixels[idx] })
    }
  }

  let assignments = new Array<number>(pixels.length).fill(0)

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false

    // 分配像素到最近质心
    for (let i = 0; i < pixels.length; i++) {
      let bestIdx = 0
      let bestDist = Number.POSITIVE_INFINITY
      for (let c = 0; c < centroids.length; c++) {
        const dist = getDistanceSquared(pixels[i], centroids[c])
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = c
        }
      }
      if (assignments[i] !== bestIdx) {
        assignments[i] = bestIdx
        changed = true
      }
    }

    // 如果没有变化，提前停止
    if (!changed) break

    // 重新计算质心
    const sum: Array<{ r: number; g: number; b: number; count: number }> = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }))
    for (let i = 0; i < pixels.length; i++) {
      const group = assignments[i]
      const p = pixels[i]
      sum[group].r += p.r
      sum[group].g += p.g
      sum[group].b += p.b
      sum[group].count += 1
    }

    for (let c = 0; c < centroids.length; c++) {
      if (sum[c].count > 0) {
        centroids[c] = {
          r: sum[c].r / sum[c].count,
          g: sum[c].g / sum[c].count,
          b: sum[c].b / sum[c].count,
        }
      }
    }
  }

  // 聚合结果并排序（按出现频次）
  const counts = new Array<number>(centroids.length).fill(0)
  for (let i = 0; i < assignments.length; i++) {
    counts[assignments[i]]++
  }

  const palette: PaletteColor[] = centroids.map((c, idx) => ({ rgb: c, hex: rgbToHex(c), count: counts[idx] }))
  return palette
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
}

function drawImageToCanvas(img: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
  const { naturalWidth: w, naturalHeight: h } = img
  const scale = Math.min(1, maxDimension / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(w * scale))
  canvas.height = Math.max(1, Math.floor(h * scale))
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas
}

function samplePixels(canvas: HTMLCanvasElement, step: number): RGB[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data
  const pixels: RGB[] = []
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]
      if (a >= 200) {
        pixels.push({ r, g, b })
      }
    }
  }
  return pixels
}

export function PaletteGenerator() {
  const [imageSrc, setImageSrc] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [options, setOptions] = useState<ExtractionOptions>(DEFAULT_OPTIONS)
  const [palette, setPalette] = useState<PaletteColor[]>([])
  const [format, setFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex')

  const imgRef = useRef<HTMLImageElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setImageSrc(url)
    setError('')
  }

  const handleUseSample = () => {
    setImageSrc('/palette-sample.png')
    setError('')
  }

  const extract = async () => {
    if (!imgRef.current) return
    setIsLoading(true)
    try {
      const canvas = drawImageToCanvas(imgRef.current, options.maxDimension)
      const pixels = samplePixels(canvas, options.sampleStep)
      const rawPalette = kMeansQuantize(pixels, options.paletteSize)

      // 去重（相近颜色合并）
      const merged: PaletteColor[] = []
      const threshold = 20 * 20 // 欧式距离平方阈值
      for (const col of rawPalette) {
        const existing = merged.find((m) => getDistanceSquared(m.rgb, col.rgb) < threshold)
        if (existing) {
          existing.count += col.count
        } else {
          merged.push({ ...col })
        }
      }
      merged.sort((a, b) => b.count - a.count)
      setPalette(merged.slice(0, options.paletteSize))
    } catch (err) {
      setError('提取失败，请尝试其他图片')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageLoad = () => {
    extract()
  }

  const paletteAsHexList = useMemo(() => palette.map((p) => p.hex).join(', '), [palette])
  const paletteAsRgbList = useMemo(() => palette.map((p) => `rgb(${Math.round(p.rgb.r)}, ${Math.round(p.rgb.g)}, ${Math.round(p.rgb.b)})`).join(', '), [palette])
  const paletteAsHslList = useMemo(() => palette.map((p) => {
    const h = rgbToHsl(p.rgb)
    return `hsl(${h.h} ${h.s}% ${h.l}%)`
  }).join(', '), [palette])

  const copyHexList = async () => {
    if (!palette.length) return
    try {
      await navigator.clipboard.writeText(paletteAsHexList)
    } catch {
      // ignore
    }
  }

  const copyByFormat = async () => {
    if (!palette.length) return
    const text = format === 'hex' ? paletteAsHexList : format === 'rgb' ? paletteAsRgbList : paletteAsHslList
    try { await navigator.clipboard.writeText(text) } catch {}
  }

  const download = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportTxt = () => {
    const text = format === 'hex' ? paletteAsHexList : format === 'rgb' ? paletteAsRgbList : paletteAsHslList
    download('palette.txt', text, 'text/plain;charset=utf-8')
  }

  const exportJson = () => {
    const data = palette.map((p) => {
      const h = rgbToHsl(p.rgb)
      return {
        hex: p.hex,
        rgb: { r: Math.round(p.rgb.r), g: Math.round(p.rgb.g), b: Math.round(p.rgb.b) },
        hsl: { h: h.h, s: h.s, l: h.l },
        count: p.count,
      }
    })
    download('palette.json', JSON.stringify(data, null, 2), 'application/json')
  }

  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const generateRandomPalette = () => {
    const size = options.paletteSize
    const colors: PaletteColor[] = []
    for (let i = 0; i < size; i++) {
      // 使用 HSL 随机，更容易得到分布良好的颜色
      const h = Math.round((360 / size) * i + randomInt(-10, 10) + Math.random() * 15) % 360
      const s = randomInt(60, 90)
      const l = randomInt(35, 65)
      const rgb = hslToRgb({ h, s, l })
      colors.push({ rgb, hex: rgbToHex(rgb), count: 1 })
    }
    setPalette(colors)
    setImageSrc('')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>配色方案生成器</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" onChange={handleFileChange} />
                <Button variant="outline" onClick={handleUseSample}>使用示例图</Button>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-40">
                  <Select value={String(options.paletteSize)} onValueChange={(v) => setOptions((o) => ({ ...o, paletteSize: parseInt(v) }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="颜色数量" />
                    </SelectTrigger>
                    <SelectContent>
                      {[3,4,5,6,7,8,9,10].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} 色</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={extract} disabled={!imageSrc || isLoading}>
                  {isLoading ? '提取中...' : '重新提取'}
                </Button>

                {palette.length > 0 && (
                  <Button variant="secondary" onClick={copyHexList}>复制 HEX 列表</Button>
                )}

                <div className="w-40">
                  <Select value={format} onValueChange={(v) => setFormat(v as 'hex'|'rgb'|'hsl')}>
                    <SelectTrigger>
                      <SelectValue placeholder="输出格式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hex">HEX</SelectItem>
                      <SelectItem value="rgb">RGB</SelectItem>
                      <SelectItem value="hsl">HSL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button variant="outline" onClick={copyByFormat}>复制列表</Button>
                <Button variant="outline" onClick={exportTxt}>导出TXT</Button>
                <Button variant="outline" onClick={exportJson}>导出JSON</Button>
                <Button onClick={generateRandomPalette}>随机生成</Button>
              </div>

              <div className="border rounded-md bg-white overflow-hidden">
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="预览图片"
                    crossOrigin="anonymous"
                    onLoad={handleImageLoad}
                    className="max-h-80 object-contain w-full bg-gray-50"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50">
                    请选择或加载一张图片
                  </div>
                )}
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}
            </div>

            <div className="md:w-80 space-y-3">
              <div className="text-sm text-gray-600">提取结果</div>
              {palette.length === 0 ? (
                <div className="h-64 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                  暂无颜色
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {palette.map((p, idx) => {
                    const textColor = getBestTextColor(p.rgb)
                    const hsl = rgbToHsl(p.rgb)
                    return (
                      <div key={idx} className="rounded-md border overflow-hidden">
                        <div className="h-16 flex items-center justify-center" style={{ backgroundColor: p.hex, color: textColor }}>
                          <span className="font-medium">
                            {format === 'hex' && p.hex}
                            {format === 'rgb' && `rgb(${Math.round(p.rgb.r)}, ${Math.round(p.rgb.g)}, ${Math.round(p.rgb.b)})`}
                            {format === 'hsl' && `${hsl.h}, ${hsl.s}%, ${hsl.l}%`}
                          </span>
                        </div>
                        <div className="p-2 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">RGB</span>
                            <span>{Math.round(p.rgb.r)}, {Math.round(p.rgb.g)}, {Math.round(p.rgb.b)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">HSL</span>
                            <span>{hsl.h}, {hsl.s}%, {hsl.l}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">像素</span>
                            <Badge variant="secondary">{p.count}</Badge>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" variant="outline" onClick={async () => {
                              const value = format === 'hex' ? p.hex : format === 'rgb' ? `rgb(${Math.round(p.rgb.r)}, ${Math.round(p.rgb.g)}, ${Math.round(p.rgb.b)})` : `${hsl.h}, ${hsl.s}%, ${hsl.l}%`
                              try { await navigator.clipboard.writeText(value) } catch {}
                            }}>复制</Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
