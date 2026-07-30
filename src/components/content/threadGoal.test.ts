import { describe, expect, it } from 'vitest'
import {
  formatGoalElapsedTime,
  formatGoalTokenUsage,
  goalStatusLabel,
  parseGoalCommand,
} from './threadGoal'

describe('goal commands', () => {
  it('recognizes goal actions without intercepting unrelated text', () => {
    expect(parseGoalCommand('normal message')).toBeNull()
    expect(parseGoalCommand('/goal')).toEqual({ kind: 'show' })
    expect(parseGoalCommand('/goal pause')).toEqual({ kind: 'pause' })
    expect(parseGoalCommand('/goal resume')).toEqual({ kind: 'resume' })
    expect(parseGoalCommand('/goal clear')).toEqual({ kind: 'clear' })
    expect(parseGoalCommand('/goal edit')).toEqual({ kind: 'edit' })
  })

  it('treats goal text and inline edits as objectives', () => {
    expect(parseGoalCommand('/goal Finish the migration')).toEqual({
      kind: 'set',
      objective: 'Finish the migration',
    })
    expect(parseGoalCommand('/goal edit Keep tests green')).toEqual({
      kind: 'set',
      objective: 'Keep tests green',
    })
    expect(parseGoalCommand('/goal pause after tests')).toEqual({
      kind: 'set',
      objective: 'pause after tests',
    })
  })

  it('formats goal status and usage for a compact progress row', () => {
    expect(goalStatusLabel('budgetLimited')).toBe('Budget limited')
    expect(formatGoalTokenUsage(12_400, 40_000)).toMatch(/12\.4K \/ 40K tokens/iu)
    expect(formatGoalElapsedTime(65)).toBe('1m')
    expect(formatGoalElapsedTime(7_260)).toBe('2h 1m')
  })
})
