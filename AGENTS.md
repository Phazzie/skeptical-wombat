# AGENTS.md

Repo-wide instructions for AI coding agents working in SkepticalWombat.

## Product identity

SkepticalWombat is a Next.js writing-coach app. Users dump messy draft material; the Wombat finds gaps, contradictions, missing pressure, skipped scenes, and structural weakness without moralizing.

The app has real user content, real auth, real persistence, and real AI spend. Treat guardrails as product infrastructure, not decorative tape.

## Stack

- Next.js App Router
- TypeScript
- Stack Auth
- Neon Postgres
- xAI/Grok for text insight
- Gemini or OpenAI transcription adapters for audio
- Vitest
- Hexagonal-ish architecture: domain, ports, adapters, DI

## Branching

- Do not commit directly to `main` unless the user explicitly asks.
- Prefer intent-named branches, for example `hardening/rate-limit-chat`.
- Open PRs into the user’s active branch, not always `main`.
- Keep PRs focused. One problem, one patch bundle.
- Include commands run and any failures in the PR body.

## Required checks

Before claiming the repo is healthy, run or explicitly explain why you did not run:

```bash
npm ci
npm run lint
npm test
npm run build
```

## Global rules

- Never commit real secrets, `.env.local`, uploaded audio, transcripts, or private user content.
- Do not loosen auth, validation, rate limits, or ownership checks for convenience.
- Do not silently turn AI/provider failure into an empty successful result.
- Keep model names centralized in config.
- Keep README, `.env.example`, comments, and code aligned when changing provider/model behavior.
- Prefer small, reviewable changes over a heroic refactor bonfire.

## Nested instructions

Read the nearest `AGENTS.md` in the folder you are modifying. More specific folder instructions override this file.