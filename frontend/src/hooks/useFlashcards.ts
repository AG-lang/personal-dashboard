import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flashcardsApi } from '../api/flashcards'
import { 
  FlashcardCreate, 
  FlashcardUpdate, 
  FlashcardsQueryParams,
  ReviewRecordCreate
} from '../lib/types'

// 查询键
const FLASHCARDS_QUERY_KEY = 'flashcards'
const DUE_FLASHCARDS_QUERY_KEY = 'dueFlashcards'
const FLASHCARD_STATS_QUERY_KEY = 'flashcardStats'
const CATEGORIES_QUERY_KEY = 'flashcardCategories'
const TAGS_QUERY_KEY = 'flashcardTags'

export function useFlashcards(params?: FlashcardsQueryParams) {
  return useQuery({
    queryKey: [FLASHCARDS_QUERY_KEY, params],
    queryFn: () => flashcardsApi.getFlashcards(params)
  })
}

export function useDueFlashcards(limit: number = 50) {
  return useQuery({
    queryKey: [DUE_FLASHCARDS_QUERY_KEY, limit],
    queryFn: () => flashcardsApi.getDueFlashcards(limit),
    refetchInterval: 60000, // 每分钟刷新一次
  })
}

export function useFlashcardStats() {
  return useQuery({
    queryKey: [FLASHCARD_STATS_QUERY_KEY],
    queryFn: () => flashcardsApi.getStats(),
    refetchInterval: 30000, // 每30秒刷新一次
  })
}

export function useFlashcardCategories() {
  return useQuery({
    queryKey: [CATEGORIES_QUERY_KEY],
    queryFn: () => flashcardsApi.getCategories(),
    staleTime: 300000, // 5分钟
  })
}

export function useFlashcardTags() {
  return useQuery({
    queryKey: [TAGS_QUERY_KEY],
    queryFn: () => flashcardsApi.getTags(),
    staleTime: 300000, // 5分钟
  })
}

export function useFlashcard(id: number) {
  return useQuery({
    queryKey: [FLASHCARDS_QUERY_KEY, id],
    queryFn: () => flashcardsApi.getFlashcard(id),
    enabled: !!id
  })
}

export function useFlashcardReviews(id: number) {
  return useQuery({
    queryKey: [FLASHCARDS_QUERY_KEY, id, 'reviews'],
    queryFn: () => flashcardsApi.getFlashcardReviews(id),
    enabled: !!id
  })
}

export function useStudyStats(dateStr: string) {
  return useQuery({
    queryKey: ['studyStats', dateStr],
    queryFn: () => flashcardsApi.getStudyStats(dateStr),
    enabled: !!dateStr
  })
}

export function useStudyStatsRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['studyStatsRange', startDate, endDate],
    queryFn: () => flashcardsApi.getStudyStatsRange(startDate, endDate),
    enabled: !!startDate && !!endDate
  })
}

// Mutations
export function useCreateFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FlashcardCreate) => flashcardsApi.createFlashcard(data),
    onSuccess: () => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [DUE_FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARD_STATS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] })
    }
  })
}

export function useUpdateFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FlashcardUpdate }) =>
      flashcardsApi.updateFlashcard(id, data),
    onSuccess: (_, variables) => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [DUE_FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARD_STATS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] })
    }
  })
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => flashcardsApi.deleteFlashcard(id),
    onSuccess: () => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [DUE_FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARD_STATS_QUERY_KEY] })
    }
  })
}

export function useReviewFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReviewRecordCreate }) =>
      flashcardsApi.reviewFlashcard(id, data),
    onSuccess: (_, variables) => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: [DUE_FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARD_STATS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY, variables.id, 'reviews'] })
      
      // 刷新今日统计
      const today = new Date().toISOString().split('T')[0]
      queryClient.invalidateQueries({ queryKey: ['studyStats', today] })
    }
  })
}

export function useBatchImportFlashcards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (flashcards: FlashcardCreate[]) => flashcardsApi.batchImport(flashcards),
    onSuccess: () => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: [FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [DUE_FLASHCARDS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [FLASHCARD_STATS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CATEGORIES_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] })
    }
  })
}