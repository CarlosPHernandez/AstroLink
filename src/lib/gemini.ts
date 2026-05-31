import { GoogleGenAI } from '@google/genai';

let genaiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey });
  }
  return genaiClient;
}

/** Lazy Gemini client — avoids build-time failures when env is absent. */
export const ai: GoogleGenAI = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    const client = getGenAI();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Executes a Gemini API function with exponential backoff and jitter/retries.
 * Built according to the AstraLink security guardrails specification.
 * 
 * @param apiFn The function executing the Gemini API call
 * @param retries Number of retry attempts remaining (defaults to 5)
 * @param delay Delay duration in milliseconds (defaults to 1000ms)
 */
export async function callGeminiWithBackoff<T>(
  apiFn: () => Promise<T>,
  retries = 5,
  delay = 1000
): Promise<T> {
  try {
    return await apiFn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    console.warn(`Gemini API error. Retrying in ${delay}ms... (Retries left: ${retries})`, error);
    // Exponential wait with backoff
    await new Promise((resolve) => setTimeout(resolve, delay));
    return callGeminiWithBackoff(apiFn, retries - 1, delay * 2);
  }
}
