# src/components/AGENTS.md

Instructions for agents modifying React components.

## Purpose

This folder owns reusable UI components. Keep components focused, typed, and free of server/provider concerns.

## Rules

- Do not import server-only modules, database adapters, provider SDKs, or secrets.
- Keep props explicit and reasonably small.
- Prefer callbacks and typed props over components reaching into global app state.
- Extract reusable UI behavior into hooks when it makes the main app page smaller and clearer.
- Avoid duplicating API request/response shapes that already exist in shared schemas or domain types.
- Keep accessibility basics in mind: labels, button titles, disabled states, keyboard behavior, and readable focus states.
- Optimistic UI should show or surface save failures.

## Testing

- Prefer unit tests for extracted logic and hooks.
- For visual-only changes, document manual QA steps in the PR.
