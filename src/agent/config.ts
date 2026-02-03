import { resolve } from 'path'

export interface AgentConfig {
  pollInterval: number
  workingDir: string
}

export function loadConfig(): AgentConfig {
  const pollInterval = parseInt(process.env.AGENT_POLL_INTERVAL || '10000', 10)
  const workingDir = process.env.AGENT_WORKING_DIR || process.cwd()

  return {
    pollInterval,
    workingDir: resolve(workingDir),
  }
}
