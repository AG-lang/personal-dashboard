import { apiClient } from '../lib/axios'
import {
  Flashcard,
  FlashcardCreate,
  FlashcardUpdate,
  FlashcardsQueryParams,
  ReviewRecordCreate,
  ReviewResult,
  StudyStats,
  FlashcardStats,
  ReviewRecord
} from '../lib/types'

export const flashcardsApi = {
  // 获取记忆卡片列表
  getFlashcards: (params?: FlashcardsQueryParams) =>
    apiClient.get<Flashcard[]>('/flashcards', { params }),

  // 获取到期的卡片
  getDueFlashcards: (limit: number = 50) =>
    apiClient.get<Flashcard[]>('/flashcards/due', { params: { limit } }),

  // 获取卡片统计信息
  getStats: () =>
    apiClient.get<FlashcardStats>('/flashcards/stats'),

  // 获取所有分类
  getCategories: () =>
    apiClient.get<string[]>('/flashcards/categories'),

  // 获取所有标签
  getTags: () =>
    apiClient.get<string[]>('/flashcards/tags'),

  // 创建记忆卡片
  createFlashcard: (data: FlashcardCreate) =>
    apiClient.post<Flashcard>('/flashcards/', data),

  // 获取指定卡片
  getFlashcard: (id: number) =>
    apiClient.get<Flashcard>(`/flashcards/${id}`),

  // 更新记忆卡片
  updateFlashcard: (id: number, data: FlashcardUpdate) =>
    apiClient.put<Flashcard>(`/flashcards/${id}`, data),

  // 删除记忆卡片
  deleteFlashcard: (id: number) =>
    apiClient.delete(`/flashcards/${id}`),

  // 复习记忆卡片
  reviewFlashcard: (id: number, data: ReviewRecordCreate) =>
    apiClient.post<ReviewResult>(`/flashcards/${id}/review`, data),

  // 获取卡片复习历史
  getFlashcardReviews: (id: number, skip: number = 0, limit: number = 50) =>
    apiClient.get<ReviewRecord[]>(`/flashcards/${id}/reviews`, { 
      params: { skip, limit } 
    }),

  // 获取指定日期的学习统计
  getStudyStats: (dateStr: string) =>
    apiClient.get<StudyStats>(`/flashcards/study-stats/${dateStr}`),

  // 获取日期范围内的学习统计
  getStudyStatsRange: (startDate: string, endDate: string) =>
    apiClient.get<StudyStats[]>(`/flashcards/study-stats/range/${startDate}/${endDate}`),

  // 批量导入记忆卡片
  batchImport: (flashcards: FlashcardCreate[]) =>
    apiClient.post<{ message: string; cards: Flashcard[] }>('/flashcards/batch-import', flashcards)
}