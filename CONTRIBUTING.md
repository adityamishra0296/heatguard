# Contributing to HeatGuard

Thanks for helping improve HeatGuard. This guide covers the workflow and the
standards CI enforces. The authoritative engineering rules live in
[`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md) — read it before starting non-trivial work.

## Getting set up

Follow the **Setup — web app** steps in the [README](./README.md). Use the
pinned Node version (`nvm use`), then confirm a clean baseline:

```bash
npm run lint && npm run test && npm run build
```

## Development workflow

1. **Branch** off the default branch with a descriptive name
   (`feat/alert-simulator`, `fix/status-contrast`).
2. **Plan before coding.** For any multi-file change, note the files you will
   add or modify first. Prefer small, focused diffs.
3. **Keep it typed.** Strict TypeScript, no `any`; types flow from the Prisma
   schema through the server layer to the UI.
4. **Put domain logic in pure functions.** All heat-index / risk / vulnerability
   math belongs in `src/lib/**` with no side effects or framework coupling.
5. **Test what you build.** Add or update Vitest coverage for any logic; add an
   API integration test for new endpoints; extend the Playwright smoke test for
   new top-level pages.
6. **Never leave the build broken.** Every commit should lint, type-check, test,
   and build cleanly.

## Standards CI expects

| Check                    | Command                             | Requirement                                                                 |
| ------------------------ | ----------------------------------- | --------------------------------------------------------------------------- |
| Lint & format            | `npm run lint`                      | ESLint (Next.js + Prettier) passes. Run `npm run format` before committing. |
| Unit + integration tests | `npm run test`                      | All Vitest suites pass.                                                     |
| Production build         | `npm run build`                     | Compiles with no type errors.                                               |
| E2E + accessibility      | `npm run build && npm run test:e2e` | Smoke flow passes; **no `serious`/`critical` axe violations**.              |

### Accessibility & responsiveness

- Target **WCAG AA**: semantic markup, keyboard operability, visible focus,
  labelled controls, and sufficient contrast (never colour alone).
- Do not de-emphasise text with wholesale `opacity` on a coloured surface — it
  can drop contrast below AA. Use an appropriate ink token instead.
- Layouts must work down to **360px** wide.

### Commits & pull requests

- Write meaningful, scoped commit messages describing intent.
- In the PR description, summarise the change, note key trade-offs, and confirm
  `lint` / `test` / `build` / `test:e2e` all pass locally.
- Update documentation (`README.md`, `PROJECT_GUIDE.md`, or `ml-service/README.md`)
  when behaviour, setup, or configuration changes.

## Reporting issues

Open an issue with reproduction steps, expected vs. actual behaviour, and
environment details (OS, Node version). For accessibility problems, include the
page, the element, and the assistive technology or tool used.

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
