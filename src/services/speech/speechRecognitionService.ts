// Live Speech Recognition Service for Live Captions

export interface LiveCaptionEvent {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

export type CaptionListener = (event: LiveCaptionEvent) => void;

class SpeechRecognitionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private listeners: Set<CaptionListener> = new Set();
  private lang: string = 'en-US';

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        const captionText = finalText || interimText;
        if (captionText) {
          this.notify({
            text: captionText,
            isFinal: !!finalText,
            timestamp: Date.now()
          });
        }
      };

      this.recognition.onerror = (err: any) => {
        console.warn('SpeechRecognition error:', err);
      };

      this.recognition.onend = () => {
        // Automatically restart if still listening
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {}
        }
      };
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  start(): boolean {
    if (!this.recognition) return false;
    try {
      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Failed to start speech recognition', e);
      return false;
    }
  }

  stop(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  subscribe(listener: CaptionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(event: LiveCaptionEvent) {
    this.listeners.forEach(fn => fn(event));
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const liveCaptionService = new SpeechRecognitionService();
