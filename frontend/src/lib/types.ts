export type TodoPriority = 'high' | 'medium' | 'low'

export interface Todo {
  id: number
  content: string
  priority: TodoPriority
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface TodoCreate {
  content: string
  priority?: TodoPriority
  is_completed?: boolean
}

export interface TodoUpdate {
  content?: string
  priority?: TodoPriority
  is_completed?: boolean
}

export interface TodosQueryParams {
  skip?: number
  limit?: number
  priority?: TodoPriority
  is_completed?: boolean
  search?: string
}

// 笔记相关类型
export interface Note {
  id: number
  title: string
  content: string
  tags: string
  is_reflection: boolean
  created_at: string
  updated_at: string
}

export interface NoteCreate {
  title: string
  content: string
  tags?: string
  is_reflection?: boolean
}

export interface NoteUpdate {
  title?: string
  content?: string
  tags?: string
  is_reflection?: boolean
}

export interface NotesQueryParams {
  skip?: number
  limit?: number
  search?: string
  tags?: string
  is_reflection?: boolean
}

// 番茄钟相关类型
export type PomodoroStatus = 'work' | 'short_break' | 'long_break' | 'paused' | 'completed'

export interface PomodoroSession {
  id: number
  todo_id?: number
  duration_minutes: number
  status: PomodoroStatus
  actual_work_time: number
  break_time: number
  completed_cycles: number
  notes: string
  started_at: string
  updated_at: string
  completed_at?: string
}

export interface PomodoroSessionCreate {
  todo_id?: number
  duration_minutes?: number
  status?: PomodoroStatus
  actual_work_time?: number
  break_time?: number
  completed_cycles?: number
  notes?: string
}

export interface PomodoroSessionUpdate {
  todo_id?: number
  duration_minutes?: number
  status?: PomodoroStatus
  actual_work_time?: number
  break_time?: number
  completed_cycles?: number
  notes?: string
  completed_at?: string
}

export interface FocusStats {
  id: number
  date: string
  total_work_time: number
  total_break_time: number
  completed_pomodoros: number
  total_sessions: number
  created_at: string
  updated_at: string
}

export interface PomodoroQueryParams {
  skip?: number
  limit?: number
  date?: string
  todo_id?: number
}

// 用户认证相关类型
export interface User {
  id: number
  username: string
  created_at: string
}

export interface UserCreate {
  username: string
  password: string
}

export interface UserLogin {
  username: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

// 记忆卡片相关类型
export type FlashcardDifficulty = 'again' | 'hard' | 'good' | 'easy'
export type FlashcardStatus = 'new' | 'learning' | 'reviewing' | 'relearning' | 'suspended' | 'buried'
export type LeitnerBox = 'box_1' | 'box_2' | 'box_3' | 'box_4' | 'box_5' | 'box_6' | 'box_7'

export interface Flashcard {
  id: number
  front: string
  back: string
  tags?: string
  category?: string
  ease_factor: number
  interval: number
  repetitions: number
  status: FlashcardStatus
  leitner_box: LeitnerBox
  due_date: string
  last_review?: string
  total_reviews: number
  correct_reviews: number
  streak: number
  max_streak: number
  created_at: string
  updated_at: string
}

export interface FlashcardCreate {
  front: string
  back: string
  tags?: string
  category?: string
  ease_factor?: number
  interval?: number
  repetitions?: number
  status?: FlashcardStatus
  leitner_box?: LeitnerBox
  due_date?: string
  last_review?: string
  total_reviews?: number
  correct_reviews?: number
  streak?: number
  max_streak?: number
}

export interface FlashcardUpdate {
  front?: string
  back?: string
  tags?: string
  category?: string
  ease_factor?: number
  interval?: number
  repetitions?: number
  status?: FlashcardStatus
  leitner_box?: LeitnerBox
  due_date?: string
}

export interface FlashcardsQueryParams {
  skip?: number
  limit?: number
  status?: FlashcardStatus
  category?: string
  tags?: string
  due_only?: boolean
  search?: string
}

export interface ReviewRecord {
  id: number
  flashcard_id: number
  difficulty: FlashcardDifficulty
  response_time: number
  old_ease_factor: number
  old_interval: number
  old_repetitions: number
  old_leitner_box: LeitnerBox
  new_ease_factor: number
  new_interval: number
  new_repetitions: number
  new_leitner_box: LeitnerBox
  reviewed_at: string
  next_due_date: string
}

export interface ReviewRecordCreate {
  flashcard_id: number
  difficulty: FlashcardDifficulty
  response_time: number
}

export interface StudyStats {
  id: number
  date: string
  new_cards: number
  reviewed_cards: number
  correct_cards: number
  study_time: number
  average_response_time: number
  box_1_count: number
  box_2_count: number
  box_3_count: number
  box_4_count: number
  box_5_count: number
  box_6_count: number
  box_7_count: number
  created_at: string
  updated_at: string
}

export interface FlashcardStats {
  total_cards: number
  due_cards: number
  status_distribution: Record<FlashcardStatus, number>
  leitner_distribution: Record<LeitnerBox, number>
  average_retention_rate: number
  review_distribution: {
    max_new_cards: number
    max_review_cards: number
    recommended_study_time: number
  }
}

export interface ReviewResult {
  flashcard: Flashcard
  review_record: ReviewRecord
  next_due_date: string
  retention_rate: number
}

// 工具相关类型
export type ToolType = 'prompt' | 'api'

export interface Tool {
  id: number
  title: string
  type: ToolType
  tags: string
  description: string
  system_prompt?: string
  api_key?: string
  api_endpoint?: string
  created_at: string
  updated_at: string
}

export interface ToolCreate {
  title: string
  type: ToolType
  tags?: string
  description?: string
  system_prompt?: string
  api_key?: string
  api_endpoint?: string
}

export interface ToolUpdate {
  title?: string
  type?: ToolType
  tags?: string
  description?: string
  system_prompt?: string
  api_key?: string
  api_endpoint?: string
}

export interface ToolsQueryParams {
  skip?: number
  limit?: number
  search?: string
  tags?: string
  tool_type?: ToolType
}

// 命令记忆库相关类型
export type CommandCategory = 'git' | 'docker' | 'linux' | 'windows' | 'nodejs' | 'python' | 'database' | 'network' | 'custom'

export interface Command {
  id: number
  name: string
  command: string
  description: string
  category: CommandCategory
  tags: string
  usage_example?: string
  notes?: string
  is_dangerous: boolean
  use_count: number
  created_at: string
  updated_at: string
  last_used_at?: string
}

export interface CommandCreate {
  name: string
  command: string
  description?: string
  category: CommandCategory
  tags?: string
  usage_example?: string
  notes?: string
  is_dangerous?: boolean
}

export interface CommandUpdate {
  name?: string
  command?: string
  description?: string
  category?: CommandCategory
  tags?: string
  usage_example?: string
  notes?: string
  is_dangerous?: boolean
}

export interface CommandsQueryParams {
  skip?: number
  limit?: number
  search?: string
  category?: CommandCategory
  tags?: string
  is_dangerous?: boolean
  sort_by?: string
  sort_desc?: boolean
}

export interface CommandStats {
  total_commands: number
  total_categories: number
  most_used_command?: Command
  recent_commands: Command[]
  category_stats: Record<string, number>
}