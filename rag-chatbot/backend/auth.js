// auth.js
// Two separate jobs live here:
// 1. Password hashing -- so we NEVER store a real password in the database.
// 2. Tokens -- so after login, the frontend can prove "I'm user #7" on
//    every future request, without sending the password again each time.

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Turns a plain password into a scrambled hash that's safe to store.
 * The same password always produces a DIFFERENT hash each time (bcrypt
 * adds random "salt"), which is why we can't just compare hashes directly
 * later -- we use comparePassword() instead.
 */
export async function hashPassword(plainPassword) {
  const saltRounds = 10; // how much computational work bcrypt does -- higher = slower but safer
  return bcrypt.hash(plainPassword, saltRounds);
}

/**
 * Checks a plain password against a stored hash. Returns true/false.
 */
export async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Creates a signed token containing the user's ID. The frontend stores
 * this and sends it back on every request (in the Authorization header)
 * so the server knows who's making the request.
 */
export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies a token is genuine (signed with our secret, not tampered with)
 * and not expired. Returns the decoded payload (e.g. { userId: 7 }), or
 * throws if the token is invalid.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}