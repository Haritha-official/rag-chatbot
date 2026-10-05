// routes/documents.js
// Three routes, all requiring login:
// POST   /documents/upload  -- upload a file, chunk it, embed it, save it
// GET    /documents          -- list the logged-in user's documents
// DELETE /documents/:id      -- delete a document (and its chunks, via CASCADE)

import express from "express";
import multer from "multer";
import { pool } from "../db.js";
import { chunkText } from "../chunker.js";
import { embedText } from "../embeddings.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// multer handles reading the uploaded file out of the HTTP request.
// "memoryStorage" keeps it in memory as a Buffer instead of saving it to
// disk -- fine for small text files like READMEs.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max, plenty for text docs
});

router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded. Send it under the field name 'file'." });
  }

  const fileName = req.file.originalname;
  const text = req.file.buffer.toString("utf-8"); // turn the raw bytes into a string

  if (!text.trim()) {
    return res.status(400).json({ error: "That file appears to be empty." });
  }

  try {
    // 1. Create the "documents" row first, so we have an ID to tag chunks with.
    const docResult = await pool.query(
      "INSERT INTO documents (user_id, file_name) VALUES ($1, $2) RETURNING id",
      [req.userId, fileName]
    );
    const documentId = docResult.rows[0].id;

    // 2. Chunk the file's text.
    const pieces = chunkText(text, 300, 50);

    // 3. Embed and save each chunk, tagged with both the user and the document.
    for (const chunk of pieces) {
      const vector = await embedText(chunk);
      const vectorString = `[${vector.join(",")}]`;

      await pool.query(
        `INSERT INTO chunks (user_id, document_id, content, embedding)
         VALUES ($1, $2, $3, $4)`,
        [req.userId, documentId, chunk, vectorString]
      );
    }

    res.status(201).json({
      message: `Indexed "${fileName}" into ${pieces.length} chunk(s).`,
      document: { id: documentId, file_name: fileName, chunkCount: pieces.length },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Something went wrong indexing that file." });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT d.id, d.file_name, d.uploaded_at, COUNT(c.id) AS chunk_count
       FROM documents d
       LEFT JOIN chunks c ON c.document_id = d.id
       WHERE d.user_id = $1
       GROUP BY d.id
       ORDER BY d.uploaded_at DESC`,
      [req.userId]
    );
    res.json({ documents: rows });
  } catch (err) {
    console.error("List documents error:", err);
    res.status(500).json({ error: "Couldn't load your documents." });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const documentId = req.params.id;

  try {
    // The "AND user_id = $2" here is important -- it makes sure a user
    // can only ever delete their OWN documents, even if they guessed
    // someone else's document ID.
    const result = await pool.query(
      "DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id",
      [documentId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found." });
    }

    // Its chunks are deleted automatically by the ON DELETE CASCADE
    // we set up in schema.sql -- nothing extra needed here.
    res.json({ message: "Document deleted." });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ error: "Something went wrong deleting that document." });
  }
});

export default router;