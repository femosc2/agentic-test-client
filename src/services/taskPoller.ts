import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { getDb } from '../config/firebase'
import type { Task, TaskResult } from '../types/task'

const TASKS_COLLECTION = 'tasks'

export async function claimPendingTask(): Promise<Task | null> {
  const db = getDb()
  const tasksRef = collection(db, TASKS_COLLECTION)

  console.log('[TaskPoller] Querying tasks collection...')

  const q = query(
    tasksRef,
    where('status', '==', 'pending'),
    limit(1)
  )

  let snapshot
  try {
    snapshot = await getDocs(q)
    console.log(`[TaskPoller] Query returned ${snapshot.size} documents`)
  } catch (error) {
    console.error('[TaskPoller] Query failed:', error)
    return null
  }

  if (snapshot.empty) {
    return null
  }

  const taskDoc = snapshot.docs[0]
  const taskRef = doc(db, TASKS_COLLECTION, taskDoc.id)

  const claimedTask = await runTransaction(db, async (transaction) => {
    const freshDoc = await transaction.get(taskRef)

    if (!freshDoc.exists()) {
      return null
    }

    const data = freshDoc.data()
    if (data.status !== 'pending') {
      return null
    }

    transaction.update(taskRef, {
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    })

    return {
      id: freshDoc.id,
      ...data,
    } as Task
  })

  return claimedTask
}

export async function updateTaskStatus(
  taskId: string,
  status: 'completed' | 'failed',
  result?: TaskResult
): Promise<void> {
  const db = getDb()
  const taskRef = doc(db, TASKS_COLLECTION, taskId)

  await updateDoc(taskRef, {
    status,
    updatedAt: serverTimestamp(),
    ...(result && { result }),
  })
}
