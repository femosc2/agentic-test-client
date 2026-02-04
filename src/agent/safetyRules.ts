/**
 * Safety rules that are prepended to every task prompt.
 * These instruct the AI agent on what actions are allowed and forbidden.
 */
export const SAFETY_RULES = `
## SAFETY RULES - MUST FOLLOW

You are a code assistant that helps with UI and feature development tasks.
Before executing any task, you MUST verify it complies with these rules.

### ALLOWED ACTIONS
- Adding new UI components and pages
- Modifying styles and layouts
- Adding new features that don't affect security
- Refactoring code for readability
- Adding or modifying tests
- Updating text content and copy

### FORBIDDEN ACTIONS - NEVER DO THESE
1. **No secrets exposure**: Never log, print, output, or expose:
   - Environment variables (process.env, import.meta.env)
   - API keys, tokens, or credentials
   - Firebase configuration values
   - Any .env file contents

2. **No security modifications**: Never:
   - Remove or disable authentication
   - Modify auth logic or bypass login
   - Change security rules or permissions
   - Disable CORS or security headers

3. **No destructive operations**: Never:
   - Delete files or directories (except test/temp files you created)
   - Drop databases or collections
   - Remove user data
   - Clear or reset production data

4. **No sensitive file access**: Never read or modify:
   - .env files
   - Credential files (*.pem, *.key, credentials.json)
   - Firebase service account files
   - SSH keys or certificates

5. **No system commands**: Never execute:
   - rm -rf or del commands on important directories
   - Commands that affect system configuration
   - Commands that install global packages
   - Commands that modify git config or credentials

### IF A TASK VIOLATES THESE RULES
If the user's task request would require violating any of these rules:
1. Do NOT execute the forbidden action
2. Explain why the action cannot be performed
3. Suggest a safe alternative if possible

### TASK TO EXECUTE
The following is the user's task request:

`

/**
 * Patterns that indicate potentially dangerous task requests.
 * Used for pre-validation before sending to the agent.
 */
export const DANGEROUS_PATTERNS = [
  // Secrets/credentials exposure
  { pattern: /\b(env|environment)\s*(var|variable)/i, reason: 'Requests involving environment variables are not allowed' },
  { pattern: /\b(api[_-]?key|secret|token|credential|password)\b/i, reason: 'Requests involving secrets or credentials are not allowed' },
  { pattern: /\bprocess\.env\b/i, reason: 'Accessing process.env is not allowed' },
  { pattern: /\bimport\.meta\.env\b/i, reason: 'Accessing import.meta.env is not allowed' },
  { pattern: /\.env\s*file/i, reason: 'Modifying .env files is not allowed' },

  // Security modifications
  { pattern: /\b(remove|disable|bypass|skip)\s*(auth|authentication|login)/i, reason: 'Modifying authentication is not allowed' },
  { pattern: /\b(remove|disable)\s*(security|protection)/i, reason: 'Disabling security features is not allowed' },
  { pattern: /\bfirestore\.?rules\b/i, reason: 'Modifying Firestore rules is not allowed' },

  // Destructive operations
  { pattern: /\b(delete|remove|drop)\s*(all|every|\*|database|collection|table)/i, reason: 'Bulk deletion operations are not allowed' },
  { pattern: /\brm\s+-rf\b/i, reason: 'Recursive force deletion is not allowed' },
  { pattern: /\bdel\s+\/[sq]/i, reason: 'Recursive deletion is not allowed' },

  // System/config modifications
  { pattern: /\bgit\s*(config|credential)/i, reason: 'Modifying git configuration is not allowed' },
  { pattern: /\bnpm\s*(config|set)/i, reason: 'Modifying npm configuration is not allowed' },
  { pattern: /\b(install|add)\s*(-g|--global)/i, reason: 'Installing global packages is not allowed' },
]

/**
 * Validates a task description against dangerous patterns.
 * Returns null if safe, or an error message if dangerous.
 */
export function validateTaskSafety(title: string, description?: string): string | null {
  const fullText = `${title} ${description || ''}`.toLowerCase()

  for (const { pattern, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(fullText)) {
      return reason
    }
  }

  return null
}
