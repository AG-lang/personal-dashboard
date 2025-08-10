import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todosApi } from '@/api/todos'
import type { Todo, TodoCreate, TodoUpdate, TodosQueryParams } from '@/lib/types'

const QUERY_KEYS = {
  todos: 'todos',
  todo: (id: number) => ['todo', id],
}

// 获取 todos 列表
export function useTodos(params?: TodosQueryParams) {
  return useQuery({
    queryKey: [QUERY_KEYS.todos, params],
    queryFn: () => todosApi.getTodos(params),
  })
}

// 获取单个 todo
export function useTodo(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.todo(id),
    queryFn: () => todosApi.getTodo(id),
    enabled: !!id,
  })
}

// 创建 todo
export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (todo: TodoCreate) => todosApi.createTodo(todo),
    onSuccess: () => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todos] })
    },
    onMutate: async (newTodo) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.todos] })

      // 获取当前数据的快照
      const previousTodos = queryClient.getQueryData([QUERY_KEYS.todos])

      // 乐观更新
      const optimisticTodo: Todo = {
        id: Date.now(), // 临时 ID
        content: newTodo.content,
        priority: newTodo.priority || 'medium',
        is_completed: newTodo.is_completed || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      queryClient.setQueryData([QUERY_KEYS.todos], (old: Todo[] = []) => [
        optimisticTodo,
        ...old,
      ])

      return { previousTodos }
    },
    onError: (err, newTodo, context) => {
      // 回滚
      if (context?.previousTodos) {
        queryClient.setQueryData([QUERY_KEYS.todos], context.previousTodos)
      }
    },
  })
}

// 更新 todo
export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, todo }: { id: number; todo: TodoUpdate }) =>
      todosApi.updateTodo(id, todo),
    onMutate: async ({ id, todo }) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.todos] })

      const previousTodosQueries = queryClient.getQueriesData<Todo[]>({ queryKey: [QUERY_KEYS.todos] })

      queryClient.setQueriesData<Todo[]>({ queryKey: [QUERY_KEYS.todos] }, (old) => 
        old ? old.map(t => t.id === id ? { ...t, ...todo } : t) : []
      )

      return { previousTodosQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousTodosQueries) {
        context.previousTodosQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todos] })
    },
  })
}

// 删除 todo
export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => todosApi.deleteTodo(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.todos] })

      const previousTodosQueries = queryClient.getQueriesData<Todo[]>({ queryKey: [QUERY_KEYS.todos] })

      queryClient.setQueriesData<Todo[]>({ queryKey: [QUERY_KEYS.todos] }, (old) => 
        old ? old.filter(t => t.id !== deletedId) : []
      )

      return { previousTodosQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousTodosQueries) {
        context.previousTodosQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todos] })
    },
  })
}

// 切换完成状态
export function useToggleTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => todosApi.toggleTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.todos] })

      const previousTodosQueries = queryClient.getQueriesData<Todo[]>({ queryKey: [QUERY_KEYS.todos] })

      queryClient.setQueriesData<Todo[]>({ queryKey: [QUERY_KEYS.todos] }, (old) => 
        old ? old.map(t => t.id === id ? { ...t, is_completed: !t.is_completed } : t) : []
      )

      return { previousTodosQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousTodosQueries) {
        context.previousTodosQueries.forEach(([key, data]) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.todos] })
      if (data) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo(data.id) })
      }
    },
  })
}