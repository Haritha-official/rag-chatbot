import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { embedText } from "./embeddings.js";
import { generateAnswer } from "./generate.js";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import conversationRoutes from "./routes/conversations.js";
import { requireAuth } from "./middleware/requireAuth.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Public routes -- no login needed to reach these.
app.use("/auth", authRoutes);

// Every route inside these two already requires login internally.
app.use("/documents", documentRoutes);
app.use("/conversations", conversationRoutes);

// Sanity check route -- visit http://localhost:5000/health in your browser
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// The real RAG endpoint: embed the question, retrieve THIS USER'S similar
// chunks, build a grounded prompt, generate an answer, and save both the
// question and answer into the conversation's message history.
app.post("/ask", requireAuth, async (req, res) => {
  const { question, conversationId } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Missing 'question' in request body" });
  }

  try {
    // If the frontend didn't pass a conversationId (e.g. this is the very
    // first message of a brand new chat), create one now.
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const newConvo = await pool.query(
        "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id",
        [req.userId, question.slice(0, 50)] // use the first question as a default title
      );
      activeConversationId = newConvo.rows[0].id;
    }

    // Save the user's question to the message history right away.
    await pool.query(
      "INSERT INTO messages (conversation_id, role, content) VALUES ($1, 'user', $2)",
      [activeConversationId, question]
    );

    // 1. Embed the question.
    const questionVector = await embedText(question);
    const vectorString = `[${questionVector.join(",")}]`;

    // 2. Search ONLY this user's chunks (WHERE c.user_id = $2 is what
    //    makes this multi-tenant-safe), joined with documents to get the
    //    actual file name back. We also select the raw cosine distance so
    //    we can turn it into a human-readable confidence score.
    const { rows } = await pool.query(
      `SELECT c.content, d.file_name, (c.embedding <=> $1::vector) AS distance
       FROM chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE c.user_id = $2
       ORDER BY c.embedding <=> $1::vector
       LIMIT 5`,
      [vectorString, req.userId]
    );

    let answer;
    let sources = [];

    if (rows.length === 0) {
      answer = "You haven't uploaded any documents yet -- upload one first, then ask again.";
    } else {
      const context = rows.map((r) => r.content).join("\n\n---\n\n");

      const prompt = `You are a helpful assistant answering questions using ONLY the context below.
If the answer isn't in the context, say you don't know -- don't guess.

Context:
${context}

Question: ${question}

Answer:`;

      answer = await generateAnswer(prompt);

      // Cosine distance is roughly 0 (identical) to 2 (opposite). Turning
      // it into a 0-100% "match score" is just for a friendlier UI --
      // the raw distance is what actually drove retrieval.
      sources = rows.map((r) => ({
        document_name: r.file_name,
        score: Math.round((1 - r.distance) * 100),
      }));

      // De-duplicate sources by document name, keeping the best score.
      const bestByDoc = {};
      for (const s of sources) {
        if (!bestByDoc[s.document_name] || s.score > bestByDoc[s.document_name]) {
          bestByDoc[s.document_name] = s.score;
        }
      }
      sources = Object.entries(bestByDoc).map(([document_name, score]) => ({ document_name, score }));
    }

    // Save the assistant's answer too, including sources as JSON.
    await pool.query(
      "INSERT INTO messages (conversation_id, role, content, sources) VALUES ($1, 'assistant', $2, $3)",
      [activeConversationId, answer, JSON.stringify(sources)]
    );

    res.json({ answer, sources, conversationId: activeConversationId });
  } catch (err) {
    console.error("Error in /ask:", err);
    res.status(500).json({ error: "Something went wrong answering that question." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});