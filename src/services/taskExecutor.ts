import { spawn } from 'child_process'
import type { Task } from '../types/task'

export interface ExecutionResult {
  success: boolean
  output: string
  error?: string
}

export async function executeTask(
  task: Task,
  workingDir: string
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    let prompt = task.title
    if (task.description) {
      prompt += `\n\nAdditional instructions: ${task.description}`
    }

    console.log(`\n[TaskExecutor] Starting task: ${task.title}`)
    console.log(`[TaskExecutor] Working directory: ${workingDir}`)
    console.log(`[TaskExecutor] Prompt: ${prompt}\n`)

    // On Windows, use cmd /c to run claude
    const isWindows = process.platform === 'win32'
    console.log(`[TaskExecutor] Platform: ${process.platform}`)

    const args = ['-p', '--dangerously-skip-permissions', prompt]
    console.log(`[TaskExecutor] Running: claude ${args.slice(0, 2).join(' ')} "<prompt>"`)

    const claude = spawn('claude', args, {
      cwd: workingDir,
      shell: true,
      env: {
        ...process.env,
        CI: 'true',
      },
    })

    let stdout = ''
    let stderr = ''

    claude.stdout.on('data', (data) => {
      const text = data.toString()
      stdout += text
      process.stdout.write(text)
    })

    claude.stderr.on('data', (data) => {
      const text = data.toString()
      stderr += text
      process.stderr.write(text)
    })

    claude.on('close', (code) => {
      console.log(`\n[TaskExecutor] Claude Code exited with code: ${code}`)

      if (code === 0) {
        resolve({ success: true, output: stdout })
      } else {
        resolve({
          success: false,
          output: stdout,
          error: stderr || `Process exited with code ${code}`,
        })
      }
    })

    claude.on('error', (err) => {
      console.error(`[TaskExecutor] Failed to start Claude Code:`, err)
      resolve({
        success: false,
        output: '',
        error: `Failed to start Claude Code: ${err.message}`,
      })
    })
  })
}
