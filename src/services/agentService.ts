import { claimPendingTask, updateTaskStatus } from './taskPoller'
import { executeTask } from './taskExecutor'
import { executeGitWorkflow, finalizeGitWorkflow } from './gitService'
import type { AgentConfig } from '../agent/config'

let isRunning = false
let pollTimeout: ReturnType<typeof setTimeout> | null = null

export async function processNextTask(config: AgentConfig): Promise<boolean> {
  console.log('\n[Agent] Checking for pending tasks...')

  const task = await claimPendingTask()

  if (!task) {
    console.log('[Agent] No pending tasks found')
    return false
  }

  console.log(`\n[Agent] Claimed task: ${task.id} - ${task.title}`)

  try {
    const gitSetup = await executeGitWorkflow(task.id, task.title, config.workingDir)

    if (!gitSetup.success) {
      console.error('[Agent] Git setup failed:', gitSetup.error)
      await updateTaskStatus(task.id, 'failed', {
        branchName: gitSetup.branchName || '',
        commitHash: '',
        error: gitSetup.error,
      })
      return true
    }

    console.log(`[Agent] Created branch: ${gitSetup.branchName}`)

    const result = await executeTask(task, config.workingDir)

    if (!result.success) {
      console.error('[Agent] Task execution failed:', result.error)
      await updateTaskStatus(task.id, 'failed', {
        branchName: gitSetup.branchName!,
        commitHash: '',
        error: result.error,
      })
      return true
    }

    console.log('[Agent] Task execution completed successfully')

    const gitResult = await finalizeGitWorkflow(
      task.id,
      task.title,
      gitSetup.branchName!,
      config.workingDir
    )

    if (gitResult.success) {
      console.log(`[Agent] Git workflow completed:`)
      console.log(`  - Branch: ${gitResult.branchName}`)
      console.log(`  - Commit: ${gitResult.commitHash}`)
      if (gitResult.prUrl) {
        console.log(`  - PR: ${gitResult.prUrl}`)
      }

      await updateTaskStatus(task.id, 'completed', {
        branchName: gitResult.branchName!,
        commitHash: gitResult.commitHash || '',
        prUrl: gitResult.prUrl,
      })
    } else {
      console.error('[Agent] Git finalization failed:', gitResult.error)
      await updateTaskStatus(task.id, 'failed', {
        branchName: gitResult.branchName || '',
        commitHash: gitResult.commitHash || '',
        error: gitResult.error,
      })
    }

    return true
  } catch (error) {
    console.error('[Agent] Unexpected error:', error)
    await updateTaskStatus(task.id, 'failed', {
      branchName: '',
      commitHash: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return true
  }
}

export function startPolling(config: AgentConfig): void {
  if (isRunning) {
    console.log('[Agent] Already running')
    return
  }

  isRunning = true
  console.log('[Agent] Starting polling service...')
  console.log(`[Agent] Poll interval: ${config.pollInterval}ms`)
  console.log(`[Agent] Working directory: ${config.workingDir}`)

  const poll = async () => {
    if (!isRunning) return

    try {
      const processed = await processNextTask(config)
      const delay = processed ? 1000 : config.pollInterval
      pollTimeout = setTimeout(poll, delay)
    } catch (error) {
      console.error('[Agent] Polling error:', error)
      pollTimeout = setTimeout(poll, config.pollInterval)
    }
  }

  poll()
}

export function stopPolling(): void {
  if (!isRunning) {
    console.log('[Agent] Not running')
    return
  }

  isRunning = false
  if (pollTimeout) {
    clearTimeout(pollTimeout)
    pollTimeout = null
  }
  console.log('[Agent] Stopped polling service')
}
