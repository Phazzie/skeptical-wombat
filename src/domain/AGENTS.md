# src/domain/AGENTS.md

Instructions for agents modifying the domain layer.

## Purpose

This folder owns product rules: project state, entities, value objects, and port interfaces. It should be the cleanest room in the house.

## Hard rules

- Do not import Next.js, React, Stack Auth, Neon, OpenAI, Gemini, browser APIs, or environment variables.
- Do not add provider-specific behavior here.
- Do not add UI copy or HTTP response shaping here.
- Keep domain errors meaningful and testable.
- Prefer explicit methods on entities over mutating public arrays from outside.
- If restoring persisted data, guard against old or malformed shapes.

## Testing

- Add tests for state transitions.
- Add tests for invalid transitions.
- Add tests for entity invariants.
- Add tests for value-object bounds.
- Add tests when changing port contracts.
