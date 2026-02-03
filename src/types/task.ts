import type { Timestamp } from 'firebase/firestore'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface TaskResult {
  branchName: string
  commitHash: string
  prUrl?: string
  error?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  createdAt: Timestamp
  updatedAt: Timestamp
  result?: TaskResult
}
