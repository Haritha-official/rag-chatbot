// routes/conversations.js
// POST   /conversations            -- start a new chat (sidebar "New chat" button)
// GET    /conversations             -- list the logged-in user's past chats
// GET    /conversations/:id/messages -- load one chat's full message history

import express from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "INSERT INTO conversations (user_id, title) VALUES ($1, $2) RETURNING id, title, created_at",
      [req.userId, "New chat"]
    );
    res.status(201).json({ conversation: result.rows[0] });
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Couldn't start a new chat." });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, created_at FROM conversations WHERE user_id = $1 ORDER BY created_at DESC",
      [req.userId]
    );
    res.json({ conversations: rows });
  } catch (err) {
    console.error("List conversations error:", err);
    res.status(500).json({ error: "Couldn't load your chat history." });
  }
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    // Confirm this conversation actually belongs to the logged-in user
    // before returning anything from it.
    const convo = await pool.query(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (convo.rows.length === 0) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const { rows } = await pool.query(
      "SELECT role, content, sources, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [req.params.id]
    );
    res.json({ messages: rows });
  } catch (err) {
    console.error("Load messages error:", err);
    res.status(500).json({ error: "Couldn't load that conversation." });
  }
});

export default router;