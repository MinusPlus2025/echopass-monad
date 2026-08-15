import { describe, expect, it } from 'vitest'
import {
  detectDigit,
  frequenciesForDigit,
  playCode,
} from '../src/audio/tone'

describe('audible code transport', () => {
  it('maps each decimal digit to its standard DTMF pair', () => {
    expect(frequenciesForDigit('0')).toEqual([941, 1336])
    expect(frequenciesForDigit('1')).toEqual([697, 1209])
    expect(frequenciesForDigit('2')).toEqual([697, 1336])
    expect(frequenciesForDigit('3')).toEqual([697, 1477])
    expect(frequenciesForDigit('4')).toEqual([770, 1209])
    expect(frequenciesForDigit('5')).toEqual([770, 1336])
    expect(frequenciesForDigit('6')).toEqual([770, 1477])
    expect(frequenciesForDigit('7')).toEqual([852, 1209])
    expect(frequenciesForDigit('8')).toEqual([852, 1336])
    expect(frequenciesForDigit('9')).toEqual([852, 1477])
  })

  it('detects a digit when both peaks are within 25 hertz', () => {
    expect(detectDigit([772, 1334])).toBe('5')
  })

  it('returns null when the peaks do not form a DTMF pair', () => {
    expect(detectDigit([772, 1362])).toBeNull()
  })

  it('rejects a non-decimal digit', () => {
    expect(() => frequenciesForDigit('x')).toThrow('Unsupported digit')
  })

  it('schedules each code digit as a sequential pair of oscillators', async () => {
    const events: string[] = []
    const context = {
      currentTime: 10,
      destination: {},
      createOscillator() {
        const oscillator = {
          frequency: { value: 0 },
          type: '',
          connect() {
            events.push(`connect:${oscillator.frequency.value}`)
          },
          start(when: number) {
            events.push(`start:${oscillator.frequency.value}:${when}`)
          },
          stop(when: number) {
            events.push(`stop:${oscillator.frequency.value}:${when}`)
          },
        }
        return oscillator
      },
    } as unknown as AudioContext

    await playCode('120000', context)

    expect(events.slice(0, 12)).toEqual([
      'connect:697',
      'connect:1209',
      'start:697:10',
      'start:1209:10',
      'stop:697:10.2',
      'stop:1209:10.2',
      'connect:697',
      'connect:1336',
      'start:697:10.25',
      'start:1336:10.25',
      'stop:697:10.45',
      'stop:1336:10.45',
    ])
    expect(events).toHaveLength(36)
    expect(events.slice(-6)).toEqual([
      'connect:941',
      'connect:1336',
      'start:941:11.25',
      'start:1336:11.25',
      'stop:941:11.45',
      'stop:1336:11.45',
    ])
  })

  it('rejects a code that is not six decimal digits', async () => {
    await expect(playCode('123', {} as AudioContext)).rejects.toThrow(
      'Code must be six decimal digits',
    )
  })
})
