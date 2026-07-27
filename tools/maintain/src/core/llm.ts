import OpenAI from 'openai';

let client: OpenAI | null = null;

export function getMaintainOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is required for LLM-powered analysis. Set it in the environment or .env.local at the repo root.',
    );
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

/**
 * JSON-mode completion for structured tool output.
 * Uses a cheap default model; override with MAINTAIN_MODEL.
 */
export async function completeJson<T>(args: {
  system: string;
  user: string;
  model?: string;
}): Promise<T> {
  const model =
    args.model ??
    process.env.MAINTAIN_MODEL?.trim() ??
    process.env.OPENAI_FLASH_MODEL?.trim() ??
    'gpt-4o-mini';

  const response = await getMaintainOpenAI().chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI returned empty JSON for maintain analysis');
  }
  return JSON.parse(text) as T;
}
