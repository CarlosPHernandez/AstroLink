export function splitChatWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function formatChatWords(words: string[], visibleCount: number): string {
  if (visibleCount <= 0) {
    return '';
  }
  return words.slice(0, visibleCount).join(' ');
}

export const LANDING_CHAT_WORD_MS = 52;
export const LANDING_CHAT_MESSAGE_GAP_MS = 420;
export const LANDING_CHAT_USER_REVEAL_MS = 320;
export const LANDING_CHAT_DEMO_STEP_MS = 2400;
export const LANDING_CHAT_DEMO_PAUSE_MS = 3800;