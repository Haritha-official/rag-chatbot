// generate.js
// One job: send a prompt (question + retrieved context) to a Gemini chat
// model and return the generated answer text.
//
// Includes a simple retry with backoff, because free-tier AI APIs
// occasionally return 503 "currently overloaded" errors that usually
// succeed if you just wait a moment and try again.

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} prompt - the full prompt, including retrieved context
 * @param {number} maxRetries - how many times to retry on a 503
 * @returns {Promise<string>} the model's answer text
 */
export async function generateAnswer(prompt, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });
      return response.text;
    } catch (err) {
      lastError = err;

      // Only retry on "overloaded" (503) errors -- other errors (like a
      // bad API key, 401/403) won't fix themselves by waiting, so fail fast.
      const isOverloaded = err.status === 503;
      if (!isOverloaded || attempt === maxRetries) {
        throw err;
      }

      const waitMs = attempt * 2000; // 2s, then 4s, then 6s
      console.log(`  Gemini overloaded (attempt ${attempt}/${maxRetries}), retrying in ${waitMs / 1000}s...`);
      await sleep(waitMs);
    }
  }

  throw lastError;
}