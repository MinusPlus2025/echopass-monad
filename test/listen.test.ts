import { describe, expect, it } from 'vitest'

import { recognizeCodeFromPeaks } from '../src/audio/listen.js'

const peaks: Record<string, number[]> = {
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
}

describe('microphone DTMF recognition pipeline', () => {
  it('requires stable frames and silence between six ordered digits', () => {
    const frames = Object.values(peaks).flatMap((digitPeaks) => [
      digitPeaks,
      digitPeaks,
      digitPeaks,
      [],
    ])
    expect(recognizeCodeFromPeaks(frames, 2)).toBe('123456')
  })

  it('does not duplicate a held tone and rejects incomplete input', () => {
    expect(() =>
      recognizeCodeFromPeaks([
        peaks['1'],
        peaks['1'],
        peaks['1'],
        peaks['1'],
        [],
      ]),
    ).toThrow('No complete six-digit code detected')
  })
})
