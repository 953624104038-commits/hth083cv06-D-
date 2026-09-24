/**
 * Browser-side Text-to-Speech (TTS) Utility with Multilingual Support (HTH-CV-09)
 * Supports: Tamil (ta), Hindi (hi), Telugu (te), Kannada (kn), Malayalam (ml), and English (en).
 */

const LANG_VOICE_MAP: Record<string, string[]> = {
  ta: ['ta-IN', 'ta'],
  hi: ['hi-IN', 'hi'],
  te: ['te-IN', 'te'],
  kn: ['kn-IN', 'kn'],
  ml: ['ml-IN', 'ml'],
  en: ['en-IN', 'en-US', 'en-GB', 'en']
};

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public speak(text: string, force: boolean = false) {
    this.speakInLanguage(text, 'en', force);
  }

  public speakInLanguage(text: string, langCode: string = 'en', force: boolean = false) {
    if (this.isMuted && !force) return;
    if (!this.synth || !text.trim()) return;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetCodes = LANG_VOICE_MAP[langCode] || ['en-IN', 'en'];

    if (this.synth) {
      const voices = this.synth.getVoices();
      let matchedVoice: SpeechSynthesisVoice | null = null;

      for (const code of targetCodes) {
        matchedVoice = voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(code.toLowerCase())) || null;
        if (matchedVoice) break;
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = targetCodes[0];
      }
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    this.synth.speak(utterance);
  }
}

export const speechService = new SpeechService();
export const speakText = (text: string) => speechService.speak(text, true);
export const speakInLanguage = (text: string, lang: string) => speechService.speakInLanguage(text, lang, true);
