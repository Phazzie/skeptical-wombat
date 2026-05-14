# src/infrastructure/AGENTS.md

Instructions for agents modifying infrastructure code.

## Purpose

This folder owns adapter implementations, provider SDK details, DI wiring, config, schemas, utilities, persistence, rate limits, and other outside-world contact points.

## Hard rules

- Keep provider-specific code behind ports/adapters.
- Do not leak API keys or provider credentials to client code.
- Centralize model names and provider defaults in config.
- Validate AI/provider responses before passing them to domain code.
- Do not silently convert provider failure into successful empty results.
- All AI-backed operations need bounded inputs, useful errors, and rate/cost controls.
- Avoid full transcript, chat, or audio logging.
- Prefer schema validation at boundaries.

## Database rules

- Validate before saving rich JSONB project data.
- Be careful with read-modify-save flows that can overwrite chat history or chapters.
- If changing persistence shape, consider old saved data and schema versioning.

## Testing

- Mock provider SDKs. Do not call real AI APIs in tests.
- Test malformed provider responses.
- Test missing env/default config behavior.
- Test rate-limit allow, deny, and reset behavior where practical.
