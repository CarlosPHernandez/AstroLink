import 'server-only';

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assertLlmRateLimit, isLlmRateLimitError, LlmRateLimitError } from '@/lib/llm-rate-limit';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export { isLlmRateLimitError, LlmRateLimitError };

export type LlmJsonSchema = {
  type: 'OBJECT' | 'STRING' | 'NUMBER' | 'ARRAY' | 'BOOLEAN';
  properties?: Record<string, LlmJsonSchema>;
  items?: LlmJsonSchema;
  required?: string[];
  enum?: string[];
};

export type StructuredJsonRequest = {
  model: string;
  systemInstruction: string;
  prompt: string;
  schema: LlmJsonSchema;
  files?: { mimeType: string; data: Buffer }[];
  /** User or actor id for per-account LLM limits (e.g. mentee UUID). */
  rateLimitKey?: string;
};

export type LlmProvider = 'openai' | 'gemini';

export function getLlmProvider(): LlmProvider {
  const explicit = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (explicit === 'openai' || explicit === 'gemini') {
    return explicit;
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return 'openai';
  }
  return 'gemini';
}

export const llmFlashModel =
  getLlmProvider() === 'openai'
    ? process.env.OPENAI_FLASH_MODEL?.trim() || 'gpt-4o-mini'
    : process.env.GEMINI_FLASH_MODEL?.trim() || 'gemini-2.0-flash';

export const llmProModel =
  getLlmProvider() === 'openai'
    ? process.env.OPENAI_PRO_MODEL?.trim() || 'gpt-4o'
    : process.env.GEMINI_PRO_MODEL?.trim() || 'gemini-2.0-flash';

export function isE2eStubLlmEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.E2E_STUB_LLM === 'true';
}

function loadE2eStub<T>(filename: string): T {
  const stubPath = path.join(process.cwd(), 'e2e/fixtures', filename);
  return JSON.parse(readFileSync(stubPath, 'utf8')) as T;
}

function loadE2eBriefingStub<T>(): T {
  return loadE2eStub<T>('briefing-stub.json');
}

function loadE2eRecapStub<T>(): T {
  return loadE2eStub<T>('recap-stub.json');
}

function isPostSessionRecapSchema(schema: LlmJsonSchema): boolean {
  return schema.required?.includes('session_summary') ?? false;
}

let openaiClient: OpenAI | null = null;
let genaiClient: GoogleGenAI | null = null;

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Set OPENAI_API_KEY in .env.local');
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('Set GEMINI_API_KEY (or GOOGLE_GENERATIVE_AI_API_KEY) in .env.local');
  }
  return apiKey.trim();
}

function getGenAI(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey });
  }
  return genaiClient;
}

function geminiSchemaToJsonSchema(schema: LlmJsonSchema): Record<string, unknown> {
  const mapType = (type: LlmJsonSchema['type']) => {
    switch (type) {
      case 'OBJECT':
        return 'object';
      case 'STRING':
        return 'string';
      case 'NUMBER':
        return 'number';
      case 'ARRAY':
        return 'array';
      case 'BOOLEAN':
        return 'boolean';
      default:
        return 'string';
    }
  };

  const result: Record<string, unknown> = { type: mapType(schema.type) };

  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [
        key,
        geminiSchemaToJsonSchema(value),
      ]),
    );
  }
  if (schema.items) {
    result.items = geminiSchemaToJsonSchema(schema.items);
  }
  if (schema.required) {
    result.required = schema.required;
  }
  if (schema.enum) {
    result.enum = schema.enum;
  }
  if (schema.type === 'OBJECT') {
    result.additionalProperties = false;
  }

  return result;
}

async function generateStructuredJsonOpenAI<T>(req: StructuredJsonRequest): Promise<T> {
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

  for (const file of req.files ?? []) {
    userContent.push({
      type: 'file',
      file: {
        filename: file.mimeType === 'application/pdf' ? 'document.pdf' : 'upload',
        file_data: `data:${file.mimeType};base64,${file.data.toString('base64')}`,
      },
    });
  }

  userContent.push({ type: 'text', text: req.prompt });

  const response = await getOpenAI().chat.completions.create({
    model: req.model,
    messages: [
      { role: 'system', content: req.systemInstruction },
      { role: 'user', content: userContent },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'structured_output',
        strict: true,
        schema: geminiSchemaToJsonSchema(req.schema),
      },
    },
  });

  const text = response.choices[0]?.message?.content;
  if (!text) {
    throw new Error('OpenAI returned an empty structured response');
  }

  return JSON.parse(text) as T;
}

async function generateStructuredJsonGemini<T>(req: StructuredJsonRequest): Promise<T> {
  const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

  for (const file of req.files ?? []) {
    contents.push({
      inlineData: {
        data: file.data.toString('base64'),
        mimeType: file.mimeType,
      },
    });
  }
  contents.push(req.prompt);

  const response = await getGenAI().models.generateContent({
    model: req.model,
    contents,
    config: {
      systemInstruction: req.systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: req.schema,
    },
  });

  return JSON.parse(response.text || '{}') as T;
}

export type PlainTextRequest = {
  model: string;
  systemInstruction: string;
  prompt: string;
  rateLimitKey?: string;
  /** Live caption segments use higher per-booking limits (see llm-rate-limit). */
  rateLimitScope?: 'default' | 'caption';
};

function localizePlainTextStub(prompt: string, systemInstruction: string): string {
  const haystack = `${systemInstruction}\n${prompt}`;
  const localeMatch =
    haystack.match(/\bto ([a-z]{2}(?:-[A-Z]{2})?)\b/i) ??
    haystack.match(/only the ([a-z]{2}(?:-[A-Z]{2})?) translation/i);
  const locale = localeMatch?.[1] ?? 'stub';
  const line = prompt.split('\n').pop()?.trim() ?? prompt.trim();
  return `[${locale}] ${line}`;
}

async function generatePlainTextOpenAI(req: PlainTextRequest): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: req.model,
    messages: [
      { role: 'system', content: req.systemInstruction },
      { role: 'user', content: req.prompt },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('OpenAI returned an empty text response');
  }
  return text;
}

async function generatePlainTextGemini(req: PlainTextRequest): Promise<string> {
  const response = await getGenAI().models.generateContent({
    model: req.model,
    contents: req.prompt,
    config: {
      systemInstruction: req.systemInstruction,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('Gemini returned an empty text response');
  }
  return text;
}

/** Plain-text LLM completion for APX-06 live segment translation. */
export async function generatePlainText(req: PlainTextRequest): Promise<string> {
  if (isE2eStubLlmEnabled()) {
    return localizePlainTextStub(req.prompt, req.systemInstruction);
  }

  assertLlmRateLimit(req.rateLimitKey, { scope: req.rateLimitScope ?? 'default' });

  if (getLlmProvider() === 'openai') {
    return generatePlainTextOpenAI(req);
  }
  return generatePlainTextGemini(req);
}

export async function generateStructuredJson<T>(req: StructuredJsonRequest): Promise<T> {
  if (isE2eStubLlmEnabled()) {
    if (isPostSessionRecapSchema(req.schema)) {
      return loadE2eRecapStub<T>();
    }
    return loadE2eBriefingStub<T>();
  }

  assertLlmRateLimit(req.rateLimitKey);

  if (getLlmProvider() === 'openai') {
    return generateStructuredJsonOpenAI<T>(req);
  }
  return generateStructuredJsonGemini<T>(req);
}

function formatLlmError(error: unknown): string {
  if (isLlmRateLimitError(error)) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('PERMISSION_DENIED') || message.includes('denied access')) {
    return `${message} — Gemini project blocked. Set OPENAI_API_KEY and LLM_PROVIDER=openai, or create a key at https://aistudio.google.com/apikey`;
  }
  if (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('429')
  ) {
    return `${message} — LLM quota/rate limit hit. Retry later or switch provider via LLM_PROVIDER.`;
  }
  return message;
}

function isRetryableLlmError(error: unknown): boolean {
  if (isLlmRateLimitError(error)) {
    return false;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('UNAVAILABLE') ||
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('503') ||
    message.includes('502')
  );
}

/** Executes an LLM call with exponential backoff for transient failures. */
export async function callLlmWithBackoff<T>(
  apiFn: () => Promise<T>,
  retries = 5,
  delay = 1000,
): Promise<T> {
  try {
    return await apiFn();
  } catch (error) {
    if (retries === 0 || !isRetryableLlmError(error)) {
      if (isLlmRateLimitError(error)) {
        throw error;
      }
      throw new Error(formatLlmError(error));
    }
    console.warn(`LLM error. Retrying in ${delay}ms... (Retries left: ${retries})`, error);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return callLlmWithBackoff(apiFn, retries - 1, delay * 2);
  }
}
