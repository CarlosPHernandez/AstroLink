'use client';

import { useEffect, useState } from 'react';
import {
  formatChatWords,
  LANDING_CHAT_DEMO_PAUSE_MS,
  LANDING_CHAT_DEMO_STEP_MS,
  LANDING_CHAT_MESSAGE_GAP_MS,
  LANDING_CHAT_USER_REVEAL_MS,
  LANDING_CHAT_WORD_MS,
  splitChatWords,
} from '@/lib/landing/chat-display';

export type LandingHeroChatMessage = { role: 'user' | 'expert'; text: string };

export type LandingHeroChatLine = LandingHeroChatMessage & {
  displayText: string;
  isTyping: boolean;
};

type UseLandingHeroChatOptions = {
  messages: LandingHeroChatMessage[];
  loop: boolean;
  typeExpertReplies: boolean;
};

export function useLandingHeroChat({
  messages,
  loop,
  typeExpertReplies,
}: UseLandingHeroChatOptions) {
  const [lines, setLines] = useState<LandingHeroChatLine[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (messages.length === 0) {
      setLines([]);
      setIsComplete(false);
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setLines(
        messages.map((message) => ({
          ...message,
          displayText: message.text,
          isTyping: false,
        })),
      );
      setIsComplete(true);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let messageIndex = 0;

    const setPartialLine = (message: LandingHeroChatMessage, displayText: string, isTyping: boolean) => {
      setLines((current) => {
        const next = current.slice(0, messageIndex);
        next.push({ ...message, displayText, isTyping });
        return next;
      });
    };

    const revealFullLine = (message: LandingHeroChatMessage) => {
      setLines((current) => {
        const next = current.slice(0, messageIndex);
        next.push({ ...message, displayText: message.text, isTyping: false });
        return next;
      });
    };

    const runMessage = () => {
      if (cancelled) return;

      if (messageIndex >= messages.length) {
        if (loop) {
          messageIndex = 0;
          setLines([]);
          setIsComplete(false);
          timer = setTimeout(runMessage, LANDING_CHAT_DEMO_PAUSE_MS);
        } else {
          setIsComplete(true);
        }
        return;
      }

      const message = messages[messageIndex];
      const shouldTypeWords = typeExpertReplies && message.role === 'expert';
      const words = splitChatWords(message.text);

      if (!shouldTypeWords) {
        revealFullLine(message);
        messageIndex += 1;
        const delay =
          messageIndex === 1 && typeExpertReplies
            ? LANDING_CHAT_USER_REVEAL_MS
            : message.role === 'user' && typeExpertReplies
              ? LANDING_CHAT_USER_REVEAL_MS
              : LANDING_CHAT_DEMO_STEP_MS;
        timer = setTimeout(runMessage, delay);
        return;
      }

      let wordIndex = 0;
      setPartialLine(message, '', true);

      const typeWord = () => {
        if (cancelled) return;

        wordIndex += 1;
        const displayText = formatChatWords(words, wordIndex);
        const stillTyping = wordIndex < words.length;
        setPartialLine(message, displayText, stillTyping);

        if (stillTyping) {
          timer = setTimeout(typeWord, LANDING_CHAT_WORD_MS);
          return;
        }

        messageIndex += 1;
        timer = setTimeout(runMessage, LANDING_CHAT_MESSAGE_GAP_MS);
      };

      timer = setTimeout(typeWord, LANDING_CHAT_MESSAGE_GAP_MS);
    };

    setLines([]);
    setIsComplete(false);
    timer = setTimeout(runMessage, typeExpertReplies ? 200 : 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [messages, loop, typeExpertReplies]);

  return { lines, isComplete };
}