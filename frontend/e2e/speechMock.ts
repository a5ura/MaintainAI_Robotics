import type { Page } from "@playwright/test";
export type MockVoice = {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
};
export const david: MockVoice = {
  name: "Microsoft David - English (United States)",
  lang: "en-US",
  localService: true,
  default: false,
  voiceURI: "David",
};
export const remote: MockVoice = {
  ...david,
  name: "Remote default",
  localService: false,
  default: true,
  voiceURI: "remote",
};
declare global {
  interface Window {
    __gdSpeech: {
      spoken: { text: string; voice: MockVoice | null }[];
      active: SpeechSynthesisUtterance | null;
      cancellations: number;
      voices: MockVoice[];
      setVoices: (voices: MockVoice[]) => void;
      fail: (error: string) => void;
      hide: (hidden: boolean) => void;
    };
  }
}
export async function speechMock(page: Page, voices = [remote, david]) {
  await page.addInitScript(
    ({ voices }) => {
      class MockUtterance {
        voice: MockVoice | null = null;
        lang = "";
        rate = 1;
        onstart: ((event: unknown) => void) | null = null;
        onend: ((event: unknown) => void) | null = null;
        onerror: ((event: unknown) => void) | null = null;
        constructor(public text: string) {}
      }
      const events = new EventTarget();
      let hidden = false;
      const state: Window["__gdSpeech"] = {
        spoken: [],
        active: null,
        cancellations: 0,
        voices,
        setVoices(next) {
          state.voices = next;
          events.dispatchEvent(new Event("voiceschanged"));
        },
        fail(error) {
          const speech = state.active;
          speech?.onerror?.call(speech, { error } as SpeechSynthesisErrorEvent);
        },
        hide(value) {
          hidden = value;
          document.dispatchEvent(new Event("visibilitychange"));
        },
      };
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => hidden,
      });
      Object.assign(events, {
        getVoices: () => state.voices,
        speak: (speech: SpeechSynthesisUtterance) => {
          state.active = speech;
          state.spoken.push({
            text: speech.text,
            voice: speech.voice as MockVoice,
          });
          speech.onstart?.call(speech, {} as SpeechSynthesisEvent);
        },
        cancel: () => {
          state.cancellations++;
          state.active = null;
        },
      });
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: events,
      });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        value: MockUtterance,
      });
      window.__gdSpeech = state;
    },
    { voices },
  );
}
