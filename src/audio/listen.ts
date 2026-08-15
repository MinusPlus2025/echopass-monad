import { detectDigit } from './tone.js'

const DTMF_FREQUENCIES = [697, 770, 852, 941, 1209, 1336, 1477]

class CodeAccumulator {
  private candidate: string | null = null
  private candidateFrames = 0
  private code = ''
  private readyForDigit = true

  constructor(
    private readonly stableFrames: number,
    private readonly onDigit?: (code: string) => void,
  ) {}

  push(peaks: number[]): string | null {
    const digit = detectDigit(peaks)
    if (!digit) {
      this.candidate = null
      this.candidateFrames = 0
      this.readyForDigit = true
      return null
    }
    if (!this.readyForDigit) return null

    if (digit !== this.candidate) {
      this.candidate = digit
      this.candidateFrames = 1
      return null
    }
    this.candidateFrames += 1
    if (this.candidateFrames < this.stableFrames) return null

    this.code += digit
    this.onDigit?.(this.code)
    this.readyForDigit = false
    return this.code.length === 6 ? this.code : null
  }
}

export function recognizeCodeFromPeaks(
  frames: number[][],
  stableFrames = 2,
): string {
  const accumulator = new CodeAccumulator(stableFrames)
  for (const frame of frames) {
    const code = accumulator.push(frame)
    if (code) return code
  }
  throw new Error('No complete six-digit code detected')
}

export interface ListenOptions {
  onDigit?(code: string): void
  onLevel?(level: number): void
}

export async function listenForCode(
  timeoutMs = 12_000,
  options: ListenOptions = {},
): Promise<string> {
  if (!navigator.mediaDevices?.getUserMedia || !globalThis.AudioContext) {
    throw new Error('Microphone recognition is unavailable')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const context = new AudioContext()
  const source = context.createMediaStreamSource(stream)
  const analyser = context.createAnalyser()
  analyser.fftSize = 4_096
  source.connect(analyser)
  const levels = new Float32Array(analyser.frequencyBinCount)
  const accumulator = new CodeAccumulator(3, options.onDigit)
  const startedAt = Date.now()

  try {
    while (Date.now() - startedAt < timeoutMs) {
      analyser.getFloatFrequencyData(levels)
      const strongest = Math.max(...levels)
      options.onLevel?.(Math.max(0, Math.min(1, (strongest + 90) / 55)))
      const peaks = DTMF_FREQUENCIES.filter((frequency) => {
        const bin = Math.round((frequency * analyser.fftSize) / context.sampleRate)
        return levels[bin] > -45
      })
      const code = accumulator.push(peaks)
      if (code) return code
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    throw new Error('Listening timed out')
  } finally {
    source.disconnect()
    for (const track of stream.getTracks()) track.stop()
    await context.close()
  }
}
