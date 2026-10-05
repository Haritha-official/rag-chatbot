// scripts/indexDocs.js
// Run with: npm run index-docs
//
// This is a ONE-TIME (or "whenever docs change") script -- it does NOT run
// as part of your live server. It reads files from the docs/ folder, chunks
// them, embeds each chunk, and saves everything into the "chunks" table.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chunkText } from "../chunker.js";
import { embedText } from "../embeddings.js";
import { pool } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsFolder = path.join(__dirname, "..", "docs");

async function indexAllDocs() {
  const files = fs.readdirSync(docsFolder).filter((f) => f.endsWith(".md") || f.endsWith(".txt"));

  if (files.length === 0) {
    console.log("No .md or .txt files found in docs/. Add some and re-run.");
    return;
  }

  console.log(`Found ${files.length} file(s) to index.`);

  // Clear old data first, so re-running this script doesn't create duplicates.
  await pool.query("DELETE FROM chunks");
  console.log("Cleared old chunks from the table.");

  for (const file of files) {
    const filePath = path.join(docsFolder, file);
    const text = fs.readFileSync(filePath, "utf-8");

    const pieces = chunkText(text, 300, 50);
    console.log(`\n${file}: split into ${pieces.length} chunk(s)`);

    for (let i = 0; i < pieces.length; i++) {
      const chunk = pieces[i];

      // Turn this chunk's text into a vector.
      const vector = await embedText(chunk);

      // Postgres/pgvector expects the vector formatted like: [0.1,0.2,0.3,...]
      const vectorString = `[${vector.join(",")}]`;

      await pool.query(
        "INSERT INTO chunks (document_name, content, embedding) VALUES ($1, $2, $3)",
        [file, chunk, vectorString]
      );

      console.log(`  chunk ${i + 1}/${pieces.length} embedded and saved`);
    }
  }

  console.log("\nDone indexing all documents.");
  await pool.end();
}

indexAllDocs().catch((err) => {
  console.error("Indexing failed:", err);
  process.exit(1);
});