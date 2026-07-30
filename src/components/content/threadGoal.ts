import type { ThreadGoalStatus } from '../../api/codexGateway'

export type GoalCommand =
  | { kind: 'show' }
  | { kind: 'edit' }
  | { kind: 'set', objective: string }
  | { kind: 'pause' }
  | { kind: 'resume' }
  | { kind: 'clear' }

export function parseGoalCommand(value: string): GoalCommand | null {
  const trimmed = value.trim()
  if (!/^\/goal(?:\s|$)/iu.test(trimmed)) return null

  const argument = trimmed.slice('/goal'.length).trim()
  if (!argument) return { kind: 'show' }

  const [action = '', ...rest] = argument.split(/\s+/u)
  const normalizedAction = action.toLowerCase()
  const remainder = rest.join(' ').trim()

  if (normalizedAction === 'pause' && !remainder) return { kind: 'pause' }
  if (normalizedAction === 'resume' && !remainder) return { kind: 'resume' }
  if (normalizedAction === 'clear' && !remainder) return { kind: 'clear' }
  if (normalizedAction === 'edit') {
    return remainder ? { kind: 'set', objective: remainder } : { kind: 'edit' }
  }
  return { kind: 'set', objective: argument }
}

export function goalStatusLabel(status: ThreadGoalStatus): string {
  switch (status) {
    case 'active': return 'Active'
    case 'paused': return 'Paused'
    case 'blocked': return 'Blocked'
    case 'usageLimited': return 'Usage limited'
    case 'budgetLimited': return 'Budget limited'
    case 'complete': return 'Complete'
  }
}

export function formatGoalTokenUsage(tokensUsed: number, tokenBudget: number | null): string {
  const formatter = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 })
  const used = formatter.format(Math.max(0, tokensUsed))
  return tokenBudget === null ? `${used} tokens` : `${used} / ${formatter.format(Math.max(0, tokenBudget))} tokens`
}

export function formatGoalElapsedTime(timeUsedSeconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(timeUsedSeconds))
  if (totalSeconds < 60) return `${totalSeconds}s`
  const totalMinutes = Math.floor(totalSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes}m`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}
