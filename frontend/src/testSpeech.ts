import { vi } from "vitest";

export function fakeVoice(
  name = "Microsoft David - English (United States)",
  lang = "en-US",
  localService = true,
  isDefault = false,
): SpeechSynthesisVoice {
  return { name, lang, localService, default: isDefault, voiceURI: name };
}
export function installSpeech(initial = [fakeVoice()]) {
  let voices = initial;
  const spoken: SpeechSynthesisUtterance[] = [];
  class FakeUtterance {
    voice: SpeechSynthesisVoice | null = null;
    lang = "";
    rate = 1;
    onstart: SpeechSynthesisUtterance["onstart"] = null;
    onend: SpeechSynthesisUtterance["onend"] = null;
    onerror: SpeechSynthesisUtterance["onerror"] = null;
    constructor(public text: string) {}
  }
  const synth = Object.assign(new EventTarget(), {
    getVoices: vi.fn(() => voices),
    speak: vi.fn((speech: SpeechSynthesisUtterance) => {
      spoken.push(speech);
      speech.onstart?.call(speech, {} as SpeechSynthesisEvent);
    }),
    cancel: vi.fn(),
  });
  vi.stubGlobal("SpeechSynthesisUtterance", FakeUtterance);
  vi.stubGlobal("speechSynthesis", synth);
  return {
    synth,
    spoken,
    setVoices(next: SpeechSynthesisVoice[]) {
      voices = next;
      synth.dispatchEvent(new Event("voiceschanged"));
    },
  };
}
