import { describe, expect, it } from 'vitest'
import { normalizeMarkdownImageDestination } from './messageImage'

describe('normalizeMarkdownImageDestination', () => {
  it('unwraps a CommonMark angle-bracket destination', () => {
    expect(normalizeMarkdownImageDestination(' </tmp/goal screenshot.png> ')).toBe(
      '/tmp/goal screenshot.png',
    )
    expect(normalizeMarkdownImageDestination('<https://example.com/goal image.png>')).toBe(
      'https://example.com/goal image.png',
    )
  })

  it('preserves ordinary and malformed destinations', () => {
    expect(normalizeMarkdownImageDestination('/tmp/goal.png')).toBe('/tmp/goal.png')
    expect(normalizeMarkdownImageDestination('https://example.com/goal.png')).toBe(
      'https://example.com/goal.png',
    )
    expect(normalizeMarkdownImageDestination('</tmp/goal.png')).toBe('</tmp/goal.png')
    expect(normalizeMarkdownImageDestination('/tmp/goal.png>')).toBe('/tmp/goal.png>')
  })
})
