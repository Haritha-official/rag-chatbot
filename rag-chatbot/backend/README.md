# RAG Chatbot -- Backend Skeleton

## What each file does

| File | Purpose |
|---|---|
| `package.json` | Lists dependencies (Express, pg, Gemini SDK) and npm scripts |
| `.env.example` | Template for secrets -- copy to `.env` and fill in real values |
| `db.js` | One shared PostgreSQL connection pool, used by every other file |
| `schema.sql` | Enables pgvector and creates the `chunks` table |
| `index.js` | The Express server itself -- routes live here |

## How to run this on your machine

```bash
cd backend
cp .env.example .env       # then fill in DATABASE_URL and GEMINI_API_KEY
npm install
node db.js                 # sanity check: should print "Connected to Postgres..."
```

Then run `schema.sql` in your Supabase SQL Editor (or `psql`) to create the table.

Finally:
```bash
npm run dev
```

Visit `http://localhost:5000/health` -- you should see `{"status":"ok"}`.

Test the placeholder route:
```bash
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'
```

## Where you are in the build plan

This skeleton covers **Step 1 (project setup)** and **Step 3 (pgvector table)**.
Next up: **Step 4 (chunking function)** and **Step 5 (indexing script)** -- that's
where `scripts/indexDocs.js` will go, reading your docs, chunking them, calling
Gemini's embedding API, and inserting rows into `chunks`.

## Frontend

For the React frontend, run this in the project root (not inside `backend/`):
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm run dev
```
This gives you the same Vite + React setup you likely used for your other
projects. We'll wire it up to call `/ask` once the backend logic is real.
