export {}

declare global {
  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  interface SpeechRecognitionResult {
    readonly [index: number]: SpeechRecognitionAlternative
    readonly length: number
    readonly isFinal: boolean
  }

  interface SpeechRecognitionResultList {
    readonly [index: number]: SpeechRecognitionResult
    readonly length: number
  }

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    interimResults: boolean
    maxAlternatives: number
    continuous: boolean
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: Event) => void) | null
    onend: (() => void) | null
    start(): void
    stop(): void
    abort(): void
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition
  }

  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}