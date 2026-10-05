// chunker.js
// Plain JavaScript. No AI, no API calls -- just splits a big string
// of text into smaller overlapping pieces ("chunks").

/**
 * Splits text into overlapping chunks of roughly `chunkSize` words.
 *
 * @param {string} text - the full document text
 * @param {number} chunkSize - target words per chunk (default 300)
 * @param {number} overlap - words repeated between consecutive chunks (default 50)
 * @returns {string[]} array of chunk strings
 */
export function chunkText(text, chunkSize = 300, overlap = 50) {
  // 1. Break the whole document into individual words.
  //    .split(/\s+/) splits on any whitespace (spaces, tabs, newlines)
  //    .filter(Boolean) removes any empty strings caused by extra spaces
  const words = text.split(/\s+/).filter(Boolean);

  const chunks = [];
  let start = 0;

  // 2. Walk through the words array in windows of `chunkSize`,
  //    moving forward by (chunkSize - overlap) each time so that
  //    consecutive chunks share some words at the boundary.
  while (start < words.length) {
    const end = start + chunkSize;
    const chunkWords = words.slice(start, end); // grab this window of words
    chunks.push(chunkWords.join(" "));          // turn the words back into a sentence

    if (end >= words.length) break; // reached the end of the document

    start = end - overlap; // move forward, but re-include the last `overlap` words
  }

  return chunks;
}

// --- Quick manual test ---
// Run with: node chunker.js
if (process.argv[1] && process.argv[1].endsWith("chunker.js")) {
  const sample = "word ".repeat(1000); // fake 1000-word document
  const result = chunkText(sample, 300, 50);
  console.log(`Split into ${result.length} chunks.`);
  console.log(`Chunk 1 word count: ${result[0].split(" ").length}`);
  console.log(`Chunk 2 word count: ${result[1].split(" ").length}`);
}