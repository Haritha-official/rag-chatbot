# Haritha's Index

A full-stack RAG (Retrieval-Augmented Generation) chatbot that answers questions
grounded in your own uploaded documents — built from scratch to understand how
embeddings, vector search, and LLM-powered applications actually work under the
hood, not just how to call an API.

## What it does

- Sign up / log in with a real account (hashed passwords, JWT auth)
- Upload your own documents (`.md` / `.txt`)
- Ask questions and get answers generated **only** from the content of your
  uploaded documents — not the model's general knowledge
- See exactly which document(s) and how closely each one matched your
  question, via a confidence score
- Full chat history, organized into separate conversations, saved per account
- Delete documents whenever you want — their indexed data is removed too

## How it works (the actual architecture)

1. **Chunking** — uploaded documents are split into overlapping ~300-word
   pieces (plain text processing, no AI involved).
2. **Embedding** — each chunk is converted into a 768-number vector using
   Google's `gemini-embedding-001` model, representing its meaning.
3. **Storage** — vectors are stored in PostgreSQL using the `pgvector`
   extension, tagged by user and source document.
4. **Retrieval** — when a question comes in, it's embedded the same way, and
   `pgvector` finds the most similar chunks using cosine distance
   (`embedding <=> $1::vector`).
5. **Generation** — the retrieved chunks are stitched into a prompt and sent
   to `gemini-3.8-flash`, which generates an answer grounded only in that
   context — with automatic retry on transient API overload errors.

## Tech stack

**Backend:** Node.js, Express, PostgreSQL (Supabase), pgvector, JWT auth,
bcrypt password hashing, Multer for file uploads, Google Gemini API
(`@google/genai`)

**Frontend:** React (Vite), plain CSS with a custom design token system — no
UI framework

## Project structure

```
rag-chatbot/
├── backend/
│   ├── index.js              # Express server, route wiring
│   ├── db.js                  # PostgreSQL connection pool
│   ├── auth.js                 # password hashing + JWT helpers
│   ├── chunker.js               # splits text into overlapping chunks
│   ├── embeddings.js             # calls Gemini to embed text
│   ├── generate.js                # calls Gemini to generate answers (w/ retry)
│   ├── schema.sql                  # database schema (5 tables)
│   ├── routes/
│   │   ├── auth.js                  # signup / login
│   │   ├── documents.js              # upload / list / delete documents
│   │   └── conversations.js           # chat history
│   └── middleware/
│       └── requireAuth.js              # protects routes with JWT verification
│
└── frontend/
    └── src/
        ├── api.js                     # typed API client, auto-attaches auth token
        ├── context/AuthContext.jsx     # app-wide login state
        ├── pages/                      # Login, Signup, Chat
        └── components/                 # Sidebar, TopBar, ChatThread, SourcePanel
```

## Database schema

Five tables, all linked by foreign keys with `ON DELETE CASCADE` so deleting
a user or document cleanly removes everything that depends on it:

- `users` — accounts, with hashed passwords
- `documents` — one row per uploaded file
- `chunks` — the actual indexed content + vectors, tagged by user and document
- `conversations` — one row per chat thread
- `messages` — every question and answer, with sources stored as JSON

## Running it locally

**Backend:**
```bash
cd backend
cp .env.example .env   # then fill in DATABASE_URL, GEMINI_API_KEY, JWT_SECRET
npm install
npm run dev             # http://localhost:5000
```

**Frontend** (in a separate terminal):
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

You'll need:
- A free [Supabase](https://supabase.com) project with the `vector` extension
  enabled (run `schema.sql` in its SQL Editor)
- A free [Gemini API key](https://aistudio.google.com/apikey)

## Why this project

Most "I used AI" portfolio projects are a thin wrapper around a chat API.
This one is different: it's the actual engineering layer companies need to
put AI to work on their own private data — chunking, embeddings, vector
search, and grounded generation, built and debugged from first principles
rather than copy-pasted from a tutorial.
