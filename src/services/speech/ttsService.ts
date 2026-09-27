// Text to Speech (TTS) Service using Web Speech API with sentence queue & boundary events

export interface TTSVoiceOption {
  name: string;
  lang: string;
  voice: SpeechSynthesisVoice;
}

export type TTSBoundaryCallback = (charIndex: number, charLength: number, text: string) => void;

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private sentences: string[] = [];
  private currentSentenceIndex: number = 0;
  private currentOptions: {
    rate?: number;
    pitch?: number;
    voiceName?: string;
    onSentenceChange?: (index: number, text: string) => void;
    onBoundary?: TTSBoundaryCallback;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {};
  private keepAliveTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  isSupported(): boolean {
    return !!this.synth;
  }

  getVoices(): TTSVoiceOption[] {
    if (!this.synth) return [];
    const list = this.synth.getVoices();
    return list.map(v => ({
      name: v.name,
      lang: v.lang,
      voice: v
    }));
  }

  /**
   * Split a text block into natural sentence chunks
   */
  splitIntoSentences(text: string): string[] {
    if (!text) return [];
    // Normalize whitespace
    const clean = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    // Split on sentence-ending punctuation followed by space or end of string
    const raw = clean.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [clean];
    return raw
      .map(s => s.trim())
      .filter(s => s.length > 1 && /[a-zA-Z0-9]/.test(s));
  }

  /**
   * Extract clean, readable page text without navigation, scripts, or extension UI
   */
  extractCleanReadableText(): string {
    const overlay = document.getElementById('hyperlink-extension-overlay');
    
    // Check article or main container first
    const primary = document.querySelector('article, [role="main"], main');
    let sourceElement: HTMLElement = (primary as HTMLElement) || document.body;

    try {
      const clone = sourceElement.cloneNode(true) as HTMLElement;
      // Strip extension overlay and noise elements
      const stripSelectors = [
        '#hyperlink-extension-overlay',
        'header',
        'nav',
        'footer',
        'aside',
        'script',
        'style',
        'noscript',
        'iframe',
        '.sidebar',
        '.ad',
        '.comments',
        'form',
        'button'
      ];
      stripSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });

      const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
      if (text.length > 50) return text;
    } catch {}

    // Fallback
    return (document.body.innerText || '').slice(0, 8000);
  }

  /**
   * Speak a queue of sentences with full skip, pause, and sentence tracking
   */
  speakQueue(
    sentences: string[],
    startIndex: number = 0,
    options: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      onSentenceChange?: (index: number, text: string) => void;
      onBoundary?: TTSBoundaryCallback;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    if (!this.synth || sentences.length === 0) return;

    this.stop();
    this.sentences = sentences;
    this.currentSentenceIndex = Math.max(0, Math.min(startIndex, sentences.length - 1));
    this.currentOptions = options;
    this.isSpeaking = true;
    this.isPaused = false;

    this.startKeepAlive();
    this.speakCurrentSentence();
  }

  private speakCurrentSentence(): void {
    if (!this.synth || !this.isSpeaking || this.isPaused) return;

    if (this.currentSentenceIndex >= this.sentences.length) {
      this.stop();
      if (this.currentOptions.onEnd) this.currentOptions.onEnd();
      return;
    }

    const sentence = this.sentences[this.currentSentenceIndex];
    if (!sentence) {
      this.currentSentenceIndex++;
      this.speakCurrentSentence();
      return;
    }

    if (this.currentOptions.onSentenceChange) {
      this.currentOptions.onSentenceChange(this.currentSentenceIndex, sentence);
    }

    try {
      this.synth.cancel(); // Clear any hung previous utterance
    } catch {}

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = this.currentOptions.rate || 1.0;
    utterance.pitch = this.currentOptions.pitch || 1.0;

    if (this.currentOptions.voiceName) {
      const voices = this.synth.getVoices();
      const match = voices.find(v => v.name === this.currentOptions.voiceName);
      if (match) utterance.voice = match;
    }

    if (this.currentOptions.onBoundary) {
      utterance.onboundary = (event) => {
        if (this.currentOptions.onBoundary) {
          this.currentOptions.onBoundary(event.charIndex, event.charLength || 6, sentence);
        }
      };
    }

    utterance.onend = () => {
      if (this.isSpeaking && !this.isPaused) {
        this.currentSentenceIndex++;
        // Short pause between sentences for natural flow
        setTimeout(() => {
          this.speakCurrentSentence();
        }, 150);
      }
    };

    utterance.onerror = (e) => {
      // In Chromium, 'interrupted' or 'canceled' happens on stop/skip, which is expected
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return;
      }
      console.warn('[TTS] Sentence error:', e);
      if (this.isSpeaking && !this.isPaused) {
        this.currentSentenceIndex++;
        this.speakCurrentSentence();
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  jumpToSentence(index: number): void {
    if (index >= 0 && index < this.sentences.length) {
      this.currentSentenceIndex = index;
      if (this.isSpeaking && !this.isPaused) {
        this.speakCurrentSentence();
      }
    }
  }

  nextSentence(): void {
    if (this.currentSentenceIndex + 1 < this.sentences.length) {
      this.jumpToSentence(this.currentSentenceIndex + 1);
    }
  }

  previousSentence(): void {
    if (this.currentSentenceIndex > 0) {
      this.jumpToSentence(this.currentSentenceIndex - 1);
    }
  }

  setRate(newRate: number): void {
    this.currentOptions.rate = newRate;
    if (this.isSpeaking && !this.isPaused) {
      this.speakCurrentSentence();
    }
  }

  setVoice(voiceName: string): void {
    this.currentOptions.voiceName = voiceName;
    if (this.isSpeaking && !this.isPaused) {
      this.speakCurrentSentence();
    }
  }

  pause(): void {
    if (this.synth && this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  resume(): void {
    if (this.synth && this.isPaused) {
      this.isPaused = false;
      this.synth.resume();
      // If resume didn't work (famous Chrome bug), restart current sentence
      setTimeout(() => {
        if (this.synth && !this.synth.speaking && this.isSpeaking && !this.isPaused) {
          this.speakCurrentSentence();
        }
      }, 200);
    }
  }

  stop(): void {
    this.stopKeepAlive();
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    // Chrome SpeechSynthesis pauses after 15s without activity; ping it periodically
    this.keepAliveTimer = setInterval(() => {
      if (this.synth && this.isSpeaking && !this.isPaused) {
        this.synth.pause();
        this.synth.resume();
      }
    }, 10000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      currentSentenceIndex: this.currentSentenceIndex,
      totalSentences: this.sentences.length
    };
  }
}

export const ttsService = new TTSService();
