import { spawn } from 'child_process'

interface GitResult {
  success: boolean
  output: string
  error?: string
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<GitResult> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd, shell: true })

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() })
      } else {
        resolve({ success: false, output: stdout.trim(), error: stderr.trim() })
      }
    })

    proc.on('error', (err) => {
      resolve({ success: false, output: '', error: err.message })
    })
  })
}

async function getDefaultBranch(workingDir: string): Promise<string> {
  const result = await runCommand(
    'git',
    ['symbolic-ref', 'refs/remotes/origin/HEAD', '--short'],
    workingDir
  )

  if (result.success) {
    return result.output.replace('origin/', '')
  }

  const mainCheck = await runCommand('git', ['rev-parse', '--verify', 'main'], workingDir)
  return mainCheck.success ? 'main' : 'master'
}

async function stashChanges(workingDir: string): Promise<GitResult> {
  return runCommand('git', ['stash', '--include-untracked'], workingDir)
}

export async function checkoutDefaultBranch(workingDir: string): Promise<GitResult> {
  const defaultBranch = await getDefaultBranch(workingDir)
  console.log(`[Git] Checking out default branch: ${defaultBranch}`)
  await stashChanges(workingDir)
  return runCommand('git', ['checkout', defaultBranch], workingDir)
}

export async function pullLatest(workingDir: string): Promise<GitResult> {
  return runCommand('git', ['pull'], workingDir)
}

async function deleteBranch(branchName: string, workingDir: string): Promise<GitResult> {
  return runCommand('git', ['branch', '-D', branchName], workingDir)
}

export async function createBranch(branchName: string, workingDir: string): Promise<GitResult> {
  await deleteBranch(branchName, workingDir)
  return runCommand('git', ['checkout', '-b', branchName], workingDir)
}

export async function stageAll(workingDir: string): Promise<GitResult> {
  return runCommand('git', ['add', '-A'], workingDir)
}

export async function commit(message: string, workingDir: string): Promise<GitResult> {
  // Quote the message to handle spaces properly with shell: true
  return runCommand('git', ['commit', '-m', `"${message}"`], workingDir)
}

export async function getCommitHash(workingDir: string): Promise<GitResult> {
  return runCommand('git', ['rev-parse', 'HEAD'], workingDir)
}

export async function push(branchName: string, workingDir: string): Promise<GitResult> {
  return runCommand('git', ['push', '-u', 'origin', branchName], workingDir)
}

export async function createPullRequest(title: string, body: string, workingDir: string): Promise<GitResult> {
  return runCommand('gh', ['pr', 'create', '--title', `"${title}"`, '--body', `"${body}"`], workingDir)
}

export async function checkForChanges(workingDir: string): Promise<boolean> {
  const result = await runCommand('git', ['status', '--porcelain'], workingDir)
  return result.success && result.output.length > 0
}

export interface GitWorkflowResult {
  success: boolean
  branchName?: string
  commitHash?: string
  prUrl?: string
  error?: string
}

export async function executeGitWorkflow(
  taskId: string,
  _taskTitle: string,
  workingDir: string
): Promise<GitWorkflowResult> {
  const branchName = `task/${taskId}`

  const checkoutResult = await checkoutDefaultBranch(workingDir)
  if (!checkoutResult.success) {
    return { success: false, error: `Failed to checkout default branch: ${checkoutResult.error}` }
  }

  const pullResult = await pullLatest(workingDir)
  if (!pullResult.success) {
    console.log('Pull warning:', pullResult.error)
  }

  const branchResult = await createBranch(branchName, workingDir)
  if (!branchResult.success) {
    return { success: false, error: `Failed to create branch: ${branchResult.error}` }
  }

  return { success: true, branchName }
}

export async function finalizeGitWorkflow(
  taskId: string,
  taskTitle: string,
  branchName: string,
  workingDir: string
): Promise<GitWorkflowResult> {
  const hasChanges = await checkForChanges(workingDir)
  if (!hasChanges) {
    return { success: false, branchName, error: 'No changes were made by the agent' }
  }

  const stageResult = await stageAll(workingDir)
  if (!stageResult.success) {
    return { success: false, branchName, error: `Failed to stage changes: ${stageResult.error}` }
  }

  const commitMessage = `Task: ${taskTitle}`
  const commitResult = await commit(commitMessage, workingDir)
  if (!commitResult.success) {
    return { success: false, branchName, error: `Failed to commit: ${commitResult.error}` }
  }

  const hashResult = await getCommitHash(workingDir)
  const commitHash = hashResult.success ? hashResult.output : undefined

  const pushResult = await push(branchName, workingDir)
  if (!pushResult.success) {
    console.log('Push warning:', pushResult.error)
    return { success: true, branchName, commitHash, error: 'Changes committed locally but push failed' }
  }

  const prBody = `Automated PR for task ${taskId}\n\nTask: ${taskTitle}`
  const prResult = await createPullRequest(taskTitle, prBody, workingDir)

  let prUrl: string | undefined
  if (prResult.success) {
    const urlMatch = prResult.output.match(/https:\/\/github\.com\/[^\s]+/)
    prUrl = urlMatch ? urlMatch[0] : undefined
  } else {
    console.log('PR creation warning:', prResult.error)
  }

  return { success: true, branchName, commitHash, prUrl }
}
