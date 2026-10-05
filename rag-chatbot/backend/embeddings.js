// embeddings.js
// One job: take a string of text, send it to Google's embedding model,
// and return the vector (array of numbers) it produces.
//
// NOTE: Google deprecated the old "text-embedding-004" model and the old
// "@google/generative-ai" package. This uses the current replacement:
// model "gemini-embedding-001" via the "@google/genai" package.

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Converts a piece of text into a 768-number vector representing its meaning.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function embedText(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    // gemini-embedding-001 outputs 3072 numbers by default -- we ask it to
    // shrink that to 768 so it matches the VECTOR(768) column in schema.sql.
    config: { outputDimensionality: 768 },
  });

  return result.embeddings[0].values;
}