import { describe, expect, it } from 'vitest'
import { acceptedCodes, deriveCode, timeSlot } from '../src/domain/code'

describe('rotating event codes', () => {
  it('derives six-digit codes for the current and previous time window', async () => {
    expect(timeSlot(60_000)).toBe(2)
    expect(await deriveCode('demo', 'secret', 2)).toMatch(/^\d{6}$/)
    expect(await acceptedCodes('demo', 'secret', 60_000)).toEqual([
      await deriveCode('demo', 'secret', 2),
      await deriveCode('demo', 'secret', 1),
    ])
  })
})
