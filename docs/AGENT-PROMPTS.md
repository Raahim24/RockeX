# Agent Prompts and Rules

Everything the AI agents (Claude Code and Cursor) need to stay in their lane. Source: spec §10 and §12. Keep every prompt you run; they are the proof of heavy Cursor use.

---

## 1. `CLAUDE.md` (repo root, written by P2 in Phase 0)

```markdown
# Rocket Configurator: rules for AI sessions

Read docs/SPEC.md before every task. If code and spec disagree, the spec wins.

1. Work only on files you own (spec §5). If a change needs another person's file, stop and tell the human.
2. Never edit src/types/. If a type is missing, say so and stop. (Only exception: the contract v2 PR in spec §13, made by P2 with all four approving.)
3. Never add a dependency without asking the human first. The stack in spec §4 is fixed.
4. Never add a feature that is not in the current phase's task list for your person.
5. Never change a data value in a component. Real numbers live only in src/data/.
6. Never invent a real-world number. If a spec value is unknown, leave a TODO(source) and tell the human.
7. Never commit secrets. The xAI key is read from server environment variables only.
8. Keep functions pure and small, with explicit types. No `any`.
9. Before finishing a task run `npm run typecheck && npm run lint && npm test` and paste the result.
10. Prefer deleting scope over adding it. When in doubt, do less.

Code decides, Grok narrates: the verdict is computed in TypeScript, never by a model.
```

---

## 2. Per-person Cursor rules (`.cursor/rules/p1.mdc` ... `p4.mdc`)

Template (P2 fills in the owned paths and the current phase's tasks):

```text
You are working for <P1|P2|P3|P4> on the Rocket Configurator.
Read docs/SPEC.md before every task.
YOU MAY EDIT ONLY: <owned paths>.
YOU MAY READ everything. You may import only exported symbols and types.
Current phase: <Phase N>. Tasks allowed: <task list for this person and phase>.
If a request would touch any other path, refuse and explain which owner to ask.
No new dependencies. No features outside the task list.
After each change run: npm run typecheck && npm run lint && npm test.
```

### Owned paths to paste in

| Person | `YOU MAY EDIT ONLY` |
|---|---|
| **P1** | `src/components/scene/`, `src/components/parts/`, `src/components/flight/`, `src/app/page.tsx`, `src/app/layout.tsx`, global styles |
| **P2** | `src/types/` (Phase 0 and the v2 PR only), `src/lib/physics/`, `src/lib/sim/`, `src/store/`, `src/components/specs/`, `CLAUDE.md`, `.cursor/rules/`, `docs/SPEC.md` |
| **P3** | `src/lib/ai/`, `src/app/api/`, `src/components/grok/`, `public/fallback/` |
| **P4** | `src/data/`, `public/models/`, validation script, `README.md`, `docs/grok-bot/`, submission notes |

---

## 3. Prompt A: Phase 0 scaffold (P2 runs in Claude Code)

```text
Read docs/SPEC.md fully. You are executing PHASE 0 ONLY, task list for P2.
Do exactly this and nothing more:
1. Scaffold Next.js (App Router) with TypeScript and Tailwind.
2. Install: zustand, three, @react-three/fiber, @react-three/drei, zod, vitest.
3. Create the folder structure from section 5, with empty placeholder files.
4. Write src/types/index.ts exactly as in section 6.
5. Write src/store/buildStore.ts with the API from section 6, returning a
   hardcoded demo build for now. Verdict is derived, not stored.
6. Add scripts: typecheck, lint, test.
7. Write CLAUDE.md from the ten rules in section 10.
Do not implement physics, UI, API routes, or data. Do not add any other
dependency. When done, run typecheck, lint and test, and report the output.
```

## 4. Prompt B: per-task prompt (everyone, every task)

One task per prompt, not a whole feature. Commit after every working prompt.

```text
Read docs/SPEC.md. I am <P1|P2|P3|P4>. Current phase: <N>.
Task (verbatim from the phase table): <paste the row>.
You may edit only: <owned paths>. Do not touch any other file.
Use the types from section 6 and the formulas from section 7 as written.
Definition of done: <paste the Done when cell>.
No new dependencies, no extra features. If something blocks you, stop and
tell me what is missing and which owner can provide it.
When finished, run npm run typecheck && npm run lint && npm test and show the
output.
```

Every Prompt B carries four things: the exact task, the paths it may touch, the relevant spec section pasted in (types, formulas, or endpoint shape), and the definition of done with the proving command.

## 5. Prompt C: PR review (P2 runs on every PR before merging)

```text
Read docs/SPEC.md. Review this diff against it. Report only:
1. Any file edited outside the author's owned paths (section 5).
2. Any change to src/types/ or any new dependency.
3. Any real-world number hardcoded outside src/data/.
4. Any feature outside the author's current phase tasks.
5. Type, lint or test failures.
Say APPROVE or REJECT with the exact reasons.
```

---

## 6. Role-specific kickoff prompts (ready to paste, Phase 1)

Each is Prompt B pre-filled with the Phase 1 row. Send one at a time.

### P1: scene
```text
Read docs/SPEC.md. I am P1. Current phase: 1.
Task: Procedural parts: engine cluster layouts for 1, 3 and 9 engines, tank
cylinder sized from data, interstage, fairing, payload. Stack positions come
from summed heights. Orbit camera, lighting, launch pad.
You may edit only: src/components/scene/, src/components/parts/.
Do not touch any other file. Read the store via useBuild() only.
Definition of done: the demo build shows a full rocket you can rotate, and
editing the store updates the scene.
No new dependencies, no extra features. Run typecheck, lint, test and show output.
```

### P2: physics
```text
Read docs/SPEC.md. I am P2. Current phase: 1.
Task: deltav.ts, twr.ts, feasibility.ts, closest.ts, store actions, and the 7
unit tests from section 7.
You may edit only: src/lib/physics/, src/store/.
Use the formulas and rules table from section 7 exactly. Never subtract
losses in code. Do not weaken the TWR rule.
Definition of done: npm test is green, including the worked example within 50 m/s.
No new dependencies. Run typecheck, lint, test and show output.
```

### P3: AI routes
```text
Read docs/SPEC.md. I am P3. Current phase: 1.
Task: /api/advise and /api/render with fallbacks, grokClient.ts, prompts.ts,
schema validation. Mock GrokBar UI.
You may edit only: src/lib/ai/, src/app/api/, src/components/grok/, public/fallback/.
Follow src/lib/ai/NOTES.md for endpoints and models. Grok never does arithmetic;
the server validates with zod and drops unknown ids. 8 s timeout, rule-based fallback.
Definition of done: a curl with a sample AdviseRequest returns valid JSON, and
breaking the key still returns a fallback.
No new dependencies. Run typecheck, lint, test and show output.
```

### P4: data
```text
Read docs/SPEC.md. I am P4. Current phase: 1.
Task: Real data: 8 engines, tanks, payloads, 5 to 6 missions, 4 to 5 reference
rockets, SOURCES.md, and a validation script that type-checks every record and
fails if a source is missing.
You may edit only: src/data/, public/models/, the validation script.
Copy numbers from the source, never from memory. If a value is unknown, leave
TODO(source) and tell me. Seed values in the spec are approximate and must be overwritten.
Definition of done: validation script passes and every record has a source URL.
No new dependencies. Run typecheck, lint, test and show output.
```

---

## 7. Running the process

1. P2 runs **Prompt A** in Claude Code and pushes the result as Phase 0 straight to `main`.
2. Each person creates their rules file from the template and runs **Prompt B** for each row of their phase table, one row at a time.
3. At each gate P2 runs **Prompt C** on every open PR, then merges.
4. Blocked for more than 5 minutes: post one line in team chat (`P1 blocked: need Verdict.warnings filled`), then switch to the "if you finish early" list. Never fix a blocker by editing another person's file.

## 8. Grok API spike prompt (P3, first 20 minutes)

```text
Read docs/SPEC.md section 8. Write a throwaway script (not committed to src/)
that calls the current xAI API for chat, Voice and Imagine, and record in
src/lib/ai/NOTES.md the real answer to each of these, from the live docs and a
real call:
1. Exact endpoints, model names and auth header for chat, Voice, Imagine.
2. Can chat return strict JSON (JSON mode or schema)? If not, say so.
3. Does Imagine accept a reference image, or text only?
4. Latencies, rate limits and per-hour caps.
5. Voice audio format, and can the browser play it directly?
6. (Upgrades) Imagine video: generation time, clip length, screenshot input.
7. (Upgrades) Does chat support function calling? Does Voice handle speech input?
Do not guess. Mark anything unconfirmed as UNKNOWN.
```
