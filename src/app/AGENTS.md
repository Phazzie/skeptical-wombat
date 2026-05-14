# src/app/AGENTS.md

Instructions for agents modifying Next.js app routes and pages.

## Purpose

This folder owns route handlers, pages, layouts, and Next.js app-router behavior.

## API route rules

- Keep route handlers thin: authenticate, validate, call the service/use case, return response.
- All protected routes must call Stack Auth server-side.
- For the current MVP, enforce `projectId === user.id` for project ownership.
- Validate request JSON with shared schemas where possible.
- Reject unknown fields unless there is a deliberate compatibility reason.
- Rate limit AI-backed routes: analyze, chat, recommend, and transcribe.
- Do not instantiate provider SDK adapters directly in route handlers when a port/container seam exists.
- Do not leak raw internal errors to users.

## Page/client rules

- Client components must not import server-only modules.
- Do not put API keys, secrets, provider SDKs, or database code in client components.
- Prefer extracting hooks/components over growing giant pages.
- Optimistic UI must have a rollback or visible failure state.

## Testing

- Add route tests for auth failures, forbidden ownership, validation failure, rate limits, and happy path.
- Add page/component tests only when practical; otherwise keep logic extracted and unit-testable.
