import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set.');
}

// Initialize the Google Gen AI client
export const ai = new GoogleGenAI({
  apiKey: apiKey || '',
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
