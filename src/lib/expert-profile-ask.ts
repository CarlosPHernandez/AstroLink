import 'server-only';

import { callLlmWithBackoff, generateStructuredJson, llmFlashModel } from '@/lib/llm';
import type { ListedExpert } from '@/lib/mentor-directory';

export type ExpertAskResponse = {
  answer: string;
};

export async function answerExpertQuestion(
  expert: ListedExpert,
  question: string,
  rateLimitKey?: string,
): Promise<ExpertAskResponse> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error('Please enter a question.');
  }
  if (trimmed.length > 500) {
    throw new Error('Question must be 500 characters or fewer.');
  }

  const expertContext = [
    `Name: ${expert.name}`,
    `Title: ${expert.role}`,
    `Employer: ${expert.employer}`,
    `Expertise: ${expert.expertise.join(', ')}`,
    `Bio: ${expert.bio}`,
    `Rate: $${expert.rate}/hr`,
  ].join('\n');

  return callLlmWithBackoff(() =>
    generateStructuredJson<ExpertAskResponse>({
      model: llmFlashModel,
      rateLimitKey,
      systemInstruction: `You help visitors learn about aerospace mentors on AstralLink before they book a session.
Use ONLY the verified expert profile below. If the question cannot be answered from this profile, say what is known and suggest booking a live session for specifics.
Be warm, concise (2–4 short paragraphs max), and reflect the expert's professional energy. Do not invent credentials, missions, or employers.`,
      prompt: `Expert profile:\n${expertContext}\n\nVisitor question: ${trimmed}`,
      schema: {
        type: 'OBJECT',
        properties: {
          answer: { type: 'STRING' },
        },
        required: ['answer'],
      },
    }),
  );
}
