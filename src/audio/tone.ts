const DTMF: Record<string, [number, number]> = {
  '0': [941, 1336],
  '1': [697, 1209],
  '2': [697, 1336],
  '3': [697, 1477],
  '4': [770, 1209],
  '5': [770, 1336],
  '6': [770, 1477],
  '7': [852, 1209],
  '8': [852, 1336],
  '9': [852, 1477],
}

const PEAK_TOLERANCE_HZ = 25
const DIGIT_DURATION_SECONDS = 0.2
const DIGIT_GAP_SECONDS = 0.05

export function frequenciesForDigit(digit: string): [number, number] {
  const frequencies = DTMF[digit]
  if (!frequencies) {
    throw new Error(`Unsupported digit: ${digit}`)
  }

  return [...frequencies] as [number, number]
}

export function detectDigit(peaks: number[]): string | null {
  for (const [digit, [lowFrequency, highFrequency]] of Object.entries(DTMF)) {
    const hasLowPeak = peaks.some(
      (peak) => Math.abs(peak - lowFrequency) <= PEAK_TOLERANCE_HZ,
    )
    const hasHighPeak = peaks.some(
      (peak) => Math.abs(peak - highFrequency) <= PEAK_TOLERANCE_HZ,
    )

    if (hasLowPeak && hasHighPeak) {
      return digit
    }
  }

  return null
}

export async function playCode(
  code: string,
  context?: AudioContext,
): Promise<void> {
  if (!/^\d{6}$/.test(code)) {
    throw new Error('Code must be six decimal digits')
  }

  const audioContext =
    context ??
    (globalThis.AudioContext
      ? new globalThis.AudioContext()
      : (() => {
          throw new Error('AudioContext is unavailable')
        })())

  let startAt = audioContext.currentTime

  for (const digit of code) {
    const [lowFrequency, highFrequency] = frequenciesForDigit(digit)
    const lowOscillator = audioContext.createOscillator()
    const highOscillator = audioContext.createOscillator()
    const endAt = startAt + DIGIT_DURATION_SECONDS

    lowOscillator.type = 'sine'
    highOscillator.type = 'sine'
    lowOscillator.frequency.value = lowFrequency
    highOscillator.frequency.value = highFrequency
    lowOscillator.connect(audioContext.destination)
    highOscillator.connect(audioContext.destination)
    lowOscillator.start(startAt)
    highOscillator.start(startAt)
    lowOscillator.stop(endAt)
    highOscillator.stop(endAt)

    startAt = endAt + DIGIT_GAP_SECONDS
  }
}
