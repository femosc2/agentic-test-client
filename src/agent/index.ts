// Load environment variables FIRST before any other imports
import { config as dotenvConfig } from 'dotenv'
const dotenvResult = dotenvConfig()

if (dotenvResult.error) {
  console.error('Error loading .env file:', dotenvResult.error.message)
} else {
  console.log('.env file loaded successfully')
}

console.log('Firebase Project ID:', process.env.VITE_FIREBASE_PROJECT_ID || '(not set)')

import { loadConfig } from './config'
import { startPolling, stopPolling } from '../services/agentService'

if (!process.env.VITE_FIREBASE_PROJECT_ID) {
  console.error('Error: Firebase configuration is missing.')
  console.error('Please ensure your .env file contains the required VITE_FIREBASE_* variables.')
  process.exit(1)
}

async function main() {
  console.log('='.repeat(60))
  console.log('Agentic Task Agent')
  console.log('='.repeat(60))

  const config = loadConfig()

  console.log('\nConfiguration:')
  console.log(`  Poll Interval: ${config.pollInterval}ms`)
  console.log(`  Working Directory: ${config.workingDir}`)
  console.log('')

  const shutdown = () => {
    console.log('\nShutting down...')
    stopPolling()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  startPolling(config)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
