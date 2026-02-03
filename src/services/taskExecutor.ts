import { spawn } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
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
    // Build prompt
    let prompt = task.title
    if (task.description) {
      prompt += `\n\nAdditional instructions: ${task.description}`
    }

    console.log(`\n[TaskExecutor] Starting task: ${task.title}`)
    console.log(`[TaskExecutor] Working directory: ${workingDir}`)
    console.log(`[TaskExecutor] Prompt: ${prompt}\n`)

    // Write prompt to a temp file to avoid shell escaping issues
    const tempFile = join(tmpdir(), `claude-prompt-${Date.now()}.txt`)
    writeFileSync(tempFile, prompt, 'utf-8')
    console.log(`[TaskExecutor] Wrote prompt to: ${tempFile}`)

    // Read prompt from file using shell redirection
    const command = process.platform === 'win32'
      ? `type "${tempFile}" | claude -p --dangerously-skip-permissions`
      : `cat "${tempFile}" | claude -p --dangerously-skip-permissions`

    console.log(`[TaskExecutor] Running command via stdin pipe...`)

    const claude = spawn(command, [], {
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
      // Clean up temp file
      try {
        unlinkSync(tempFile)
      } catch {
        // Ignore cleanup errors
      }

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
      // Clean up temp file
      try {
        unlinkSync(tempFile)
      } catch {
        // Ignore cleanup errors
      }

      console.error(`[TaskExecutor] Failed to start Claude Code:`, err)
      resolve({
        success: false,
        output: '',
        error: `Failed to start Claude Code: ${err.message}`,
      })
    })
  })
}
