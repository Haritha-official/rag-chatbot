// middleware/requireAuth.js
// This is Express "middleware" -- a function that runs BEFORE a route's
// main logic. Its job: check that the request has a valid login token,
// and if so, attach the user's ID to `req` so the route can use it.
//
// Usage on a route: app.post("/ask", requireAuth, (req, res) => { ... })
// Inside that route, req.userId is now available.

import { verifyToken } from "../auth.js";

export function requireAuth(req, res, next) {
  // The frontend sends the token like: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in." });
  }

  const token = authHeader.split(" ")[1]; // "Bearer abc123" -> "abc123"

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId; // now every route after this knows who's asking
    next(); // continue on to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired login. Please log in again." });
  }
}