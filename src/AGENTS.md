# src/AGENTS.md

Instructions for all source code under `src/`.

## Source boundaries

- Preserve the domain/application/infrastructure separation.
- Do not import server-only secrets into client components.
- Do not introduce framework/provider dependencies into `src/domain/**`.
- Prefer shared schemas and config over duplicated literals.
- Keep TypeScript strict-friendly. Avoid `any` unless there is a narrow interop reason and a comment explaining it.

## Error handling

- User-facing errors should be clear and safe.
- Internal failures should be logged server-side without leaking transcripts, chat histories, audio, or secrets.
- Do not swallow errors that change product meaning. Invalid AI JSON is not the same as “no issues found.”

## Testing

When changing behavior under `src/`, add or update nearby Vitest tests where practical.