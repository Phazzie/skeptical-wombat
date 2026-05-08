# 🐨 SkepticalWombat

**The AI writing coach that won't let you hide from your own story.**

Dump your draft. The Wombat reads it, finds the gaps you skipped, calls out the contradictions, and helps you build something real. No coddling. No judgment. Just the story you actually have.

---

## Features

- **Brain Dump** — Voice dictation (AI-transcribed via Gemini) or keyboard. Momentum Mode blocks backspace so you finish thoughts instead of editing them into silence.
- **Wombat Reads** — Gap detection + contradiction spotting powered by Grok 4.3. Controversial content? That's fine. The Wombat is fascinated, not judgmental.
- **Structure It** — Drag-and-drop chapter/beat editor. Or ask the Wombat to auto-structure your dump.
- **Talk It Through** — Persistent chat that remembers your project context.
- **Zero moral judgment** — Write about anything.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router | RSC, API routes, middleware |
| Auth | Stack Auth (`@stackframe/stack`) | Neon's auth partner, fast setup |
| Database | Neon Postgres (serverless) | Scales to zero, edge-ready |
| AI (text) | xAI Grok 4.3 | Best reasoning, no moral guardrails |
| AI (audio) | Gemini 2.0 Flash | Grok voice API is real-time WebSocket only; Gemini handles batch transcription |
| Architecture | Hexagonal (Ports & Adapters) | All AI adapters are swappable |
| Tests | Vitest + @vitest/coverage-v8 | 80% coverage threshold enforced |

---

## Local Setup

### Prerequisites
- Node.js 20+
- A Neon account (free tier works)
- A Stack Auth project
- xAI API key
- Google Gemini API key

### 1. Clone & install

```bash
git clone <your-repo-url>
cd skepticalwombat
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `XAI_API_KEY` | [console.x.ai](https://console.x.ai) |
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `DATABASE_URL` | Neon console → your project → Connection string (pooled) |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | [app.stack-auth.com](https://app.stack-auth.com) → your project → API Keys |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | Same place |
| `STACK_SECRET_SERVER_KEY` | Same place |
| `APP_URL` | `http://localhost:3000` for local dev |

### 3. Set up Stack Auth

1. Create a new project at [app.stack-auth.com](https://app.stack-auth.com)
2. Set the **Redirect URL** to `http://localhost:3000/handler/callback` in your Stack project settings
3. Copy the three API keys into `.env.local`

### 4. Set up Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **pooled connection string** into `DATABASE_URL` in `.env.local`
3. The app runs SQL migrations on first startup (via `NeonDatabaseAdapter`)

> **Local dev without Neon:** Leave `DATABASE_URL` empty and the app falls back to an in-memory store. Data won't persist between restarts.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Public landing page (/)
│   ├── app/page.tsx          # Protected app UI (/app)
│   ├── sign-in/              # Stack Auth sign-in
│   ├── sign-up/              # Stack Auth sign-up
│   └── api/                  # API routes (auth-protected)
│       ├── analyze/          # POST — gap + contradiction detection
│       ├── chat/             # POST — Wombat chat
│       ├── project/[id]/     # GET + PUT — project state
│       ├── recommend/        # POST — structure recommendation
│       └── transcribe/       # POST — audio → text
├── domain/                   # Domain layer (zero framework deps)
│   ├── entities/             # Project, Gap, Contradiction, ValueObjects
│   ├── ports/                # Inbound + outbound port interfaces
│   └── services/             # SkepticEngine (orchestration)
└── infrastructure/
    ├── adapters/             # GrokInsightAdapter, GeminiTranscriptionAdapter, NeonDatabaseAdapter
    ├── di/                   # Dependency injection container
    └── utils/                # Shared utilities (handleApiError)
```

### Key design decisions

- **`projectId === userId`** — One project per user for MVP. Enforced in every API route (prevents IDOR attacks). Easily extended to multi-project later by adding a projects table.
- **Hexagonal architecture** — Domain layer has zero deps on Next.js, OpenAI SDK, or Neon. All AI + DB calls go through port interfaces. Swap Grok for any OpenAI-compatible model by changing one env var.
- **Backend-only API keys** — All AI credentials live in server-side env vars. They never touch the browser.

---

## Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (80% threshold enforced)
```

Tests cover:
- All domain entities (`Project`, `FrictionError`, `SkepticismScore`, `TranscriptId`)
- `SkepticEngine` service (all three use cases + edge cases)
- `InMemoryDatabaseAdapter`
- `handleApiError` utility

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/skepticalwombat)

1. Connect your GitHub repo in Vercel
2. Set all environment variables from `.env.example` in your Vercel project settings
3. For `APP_URL`, use your Vercel deployment URL
4. Update Stack Auth's redirect URL to `https://your-domain.vercel.app/handler/callback`

Function timeouts are configured in `vercel.json` (300s for `/api/analyze`, 120s for others).

---

## Roadmap

- [ ] Multi-project support (multiple books/screenplays per user)
- [ ] Gap resolution workflow (mark gaps as addressed, track progress)
- [ ] Export to Markdown / PDF
- [ ] Collaborative mode (multiple authors on one project)
- [ ] Readability + pacing analysis

---

## License

MIT — write freely.
