@AGENTS.md

# Rocket Configurator: rules for AI sessions

Read docs/SPEC.md (and docs/ARCHITECTURE.md, docs/ROADMAP.md) before every task. If code and spec disagree, the spec wins.

1. Work only on files you own (see ownership in docs/ARCHITECTURE.md). If a change needs another person's file, stop and tell the human.
2. Never edit src/types/. If a type is missing, say so and stop. (Only exception: the contract v2 PR, made by P2 with all four approving.)
3. Never add a dependency without asking the human first. The stack is fixed.
4. Never add a feature that is not in the current phase's task list for your person.
5. Never change a data value in a component. Real numbers live only in src/data/.
6. Never invent a real-world number. If a value is unknown, leave TODO(source) and tell the human.
7. Never commit secrets. The xAI key is read from server environment variables only.
8. Keep functions pure and small, with explicit types. No `any`.
9. Before finishing a task run `npm run typecheck && npm run lint && npm test` and paste the result.
10. Prefer deleting scope over adding it. When in doubt, do less.

Code decides, Grok narrates: the verdict is computed in TypeScript, never by a model.
