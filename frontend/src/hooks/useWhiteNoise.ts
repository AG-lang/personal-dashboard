import { useState, useRef, useCallback } from 'react'

interface WhiteNoiseTrack {
  id: string
  name: string
  url: string
  icon: string
}

// 内置白噪音选项
export const WHITE_NOISE_TRACKS: WhiteNoiseTrack[] = [
  {
    id: 'none',
    name: '无',
    url: '',
    icon: '🔇'
  },
  {
    id: 'rain',
    name: '雨声',
    url: '/sounds/rain.mp3',
    icon: '🌧️'
  },
  {
    id: 'forest',
    name: '森林',
    url: '/sounds/forest.mp3',
    icon: '🌲'
  },
  {
    id: 'ocean',
    name: '海浪',
    url: '/sounds/ocean.mp3',
    icon: '🌊'
  },
  {
    id: 'cafe',
    name: '咖啡厅',
    url: '/sounds/cafe.mp3',
    icon: '☕'
  },
  {
    id: 'chimes',
    name: '风铃',
    url: '/sounds/mixkit-wind-chimes-2014.wav',
    icon: '🎐'
  }
]

// Web Audio API 白噪音生成器
const generateWhiteNoise = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const bufferSize = 2 * audioContext.sampleRate
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    const whiteNoise = audioContext.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    whiteNoise.loop = true
    
    const gainNode = audioContext.createGain()
    whiteNoise.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    return { source: whiteNoise, gain: gainNode, context: audioContext }
  } catch (error) {
    console.error('生成白噪音失败:', error)
    return null
  }
}

export function useWhiteNoise() {
  const [currentTrack, setCurrentTrack] = useState<WhiteNoiseTrack>(WHITE_NOISE_TRACKS[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 播放指定音轨
  const playTrack = useCallback(async (track: WhiteNoiseTrack) => {
    try {
      // 停止当前播放
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      setCurrentTrack(track)

      if (track.id === 'none' || !track.url) {
        setIsPlaying(false)
        return
      }

      // 创建新的音频对象
      const audio = new Audio(track.url)
      audio.volume = volume
      audio.loop = true

      audioRef.current = audio

      // 播放音频
      await audio.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('播放白噪音失败:', error)
      setIsPlaying(false)
    }
  }, [volume])

  // 停止播放
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // 切换播放/暂停
  const toggle = useCallback(async () => {
    if (isPlaying) {
      stop()
    } else {
      await playTrack(currentTrack)
    }
  }, [isPlaying, currentTrack, playTrack, stop])

  // 调整音量
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
  }, [])

  // 选择音轨
  const selectTrack = useCallback(async (trackId: string) => {
    const track = WHITE_NOISE_TRACKS.find(t => t.id === trackId)
    if (track) {
      await playTrack(track)
    }
  }, [playTrack])

  return {
    currentTrack,
    isPlaying,
    volume,
    tracks: WHITE_NOISE_TRACKS,
    playTrack,
    stop,
    toggle,
    changeVolume,
    selectTrack
  }
}