import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '@/api/notes'
import type { Note, NoteCreate, NoteUpdate, NotesQueryParams } from '@/lib/types'

const QUERY_KEYS = {
  notes: 'notes',
  note: (id: number) => ['note', id],
  tags: 'note-tags',
}

// 获取笔记列表
export function useNotes(params?: NotesQueryParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.notes, params],
    queryFn: () => notesApi.getNotes(params),
  })
}

// 获取单个笔记
export function useNote(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.note(id),
    queryFn: () => notesApi.getNote(id),
    enabled: !!id,
  })
}

// 获取所有标签
export function useTags() {
  return useQuery({
    queryKey: [QUERY_KEYS.tags],
    queryFn: () => notesApi.getTags(),
  })
}

// 创建笔记
export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (note: NoteCreate) => notesApi.createNote(note),
    onSuccess: () => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.notes] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
    },
    onMutate: async (newNote) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.notes] })

      // 获取当前数据的快照
      const previousNotes = queryClient.getQueryData([QUERY_KEYS.notes])

      // 乐观更新
      const optimisticNote: Note = {
        id: Date.now(), // 临时 ID
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags || '',
        is_reflection: newNote.is_reflection || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData([QUERY_KEYS.notes], (old: Note[] = []) => [
        optimisticNote,
        ...old,
      ])

      return { previousNotes }
    },
    onError: (err, newNote, context) => {
      // 回滚
      if (context?.previousNotes) {
        queryClient.setQueryData([QUERY_KEYS.notes], context.previousNotes)
      }
    },
  })
}

// 更新笔记
export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: NoteUpdate }) =>
      notesApi.updateNote(id, note),
    onSuccess: (updatedNote) => {
      // 更新列表缓存
      queryClient.setQueryData([QUERY_KEYS.notes], (old: Note[] = []) =>
        old.map((note) => (note.id === updatedNote.id ? updatedNote : note))
      )
      // 更新单个笔记缓存
      queryClient.setQueryData(QUERY_KEYS.note(updatedNote.id), updatedNote)
      // 可能需要更新标签缓存
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
    },
    onMutate: async ({ id, note }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.notes] })
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.note(id) })

      const previousNotes = queryClient.getQueryData([QUERY_KEYS.notes])
      const previousNote = queryClient.getQueryData(QUERY_KEYS.note(id))

      // 乐观更新
      queryClient.setQueryData([QUERY_KEYS.notes], (old: Note[] = []) =>
        old.map((oldNote) =>
          oldNote.id === id
            ? { ...oldNote, ...note, updated_at: new Date().toISOString() }
            : oldNote
        )
      )

      return { previousNotes, previousNote }
    },
    onError: (err, { id }, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([QUERY_KEYS.notes], context.previousNotes)
      }
      if (context?.previousNote) {
        queryClient.setQueryData(QUERY_KEYS.note(id), context.previousNote)
      }
    },
  })
}

// 删除笔记
export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notesApi.deleteNote(id),
    onSuccess: (_, deletedId) => {
      // 从缓存中移除
      queryClient.setQueryData([QUERY_KEYS.notes], (old: Note[] = []) =>
        old.filter((note) => note.id !== deletedId)
      )
      queryClient.removeQueries({ queryKey: QUERY_KEYS.note(deletedId) })
      // 可能需要更新标签缓存
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.tags] })
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.notes] })

      const previousNotes = queryClient.getQueryData([QUERY_KEYS.notes])

      // 乐观更新
      queryClient.setQueryData([QUERY_KEYS.notes], (old: Note[] = []) =>
        old.filter((note) => note.id !== deletedId)
      )

      return { previousNotes }
    },
    onError: (err, deletedId, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData([QUERY_KEYS.notes], context.previousNotes)
      }
    },
  })
}