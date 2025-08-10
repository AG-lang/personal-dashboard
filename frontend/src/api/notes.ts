import { apiClient } from '@/lib/axios'
import type { Note, NoteCreate, NoteUpdate, NotesQueryParams } from '@/lib/types'

export const notesApi = {
  // 获取所有笔记
  getNotes: async (params?: NotesQueryParams): Promise<Note[]> => {
    const response = await apiClient.get('/notes/', { params })
    return response.data
  },

  // 根据 ID 获取单个笔记
  getNote: async (id: number): Promise<Note> => {
    const response = await apiClient.get(`/notes/${id}`)
    return response.data
  },

  // 创建新笔记
  createNote: async (note: NoteCreate): Promise<Note> => {
    const response = await apiClient.post('/notes/', note)
    return response.data
  },

  // 更新笔记
  updateNote: async (id: number, note: NoteUpdate): Promise<Note> => {
    const response = await apiClient.put(`/notes/${id}`, note)
    return response.data
  },

  // 删除笔记
  deleteNote: async (id: number): Promise<void> => {
    await apiClient.delete(`/notes/${id}`)
  },

  // 获取所有标签
  getTags: async (): Promise<string[]> => {
    const response = await apiClient.get('/notes/tags/')
    return response.data
  },
}