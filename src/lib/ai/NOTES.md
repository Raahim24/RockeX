# xAI API spike (Phase 0, P3)

Source: docs.x.ai, read 2026-10-17. Measured numbers come from `bash src/lib/ai/spike.sh` (fill the **Measured** column; until then the route timeouts below are the plan).

## Answers

| Question | Answer |
|---|---|
| Base URL | `https://api.x.ai/v1` (OpenAI-compatible) |
| Auth | Header `Authorization: Bearer $XAI_API_KEY`. Same key for chat, Imagine and Voice. Server-side only. |
| Advisor model | `grok-4.20-non-reasoning` (alias of `grok-4.20-0309-non-reasoning`). No reasoning, fast, structured outputs supported. `grok-4.7` is stronger but **reasoning cannot be disabled** (min `effort: "low"`), which risks the 8 s timeout. |
| Advisor endpoint | `POST /v1/responses` (Chat Completions `/v1/chat/completions` still works but is marked deprecated). |
| Strict JSON? | **Yes.** `text.format = { type: "json_schema", name, schema, strict: true }` on Responses (`response_format` on Chat Completions). Output is guaranteed to match supported schema features. `anyOf` (our `Suggestion` union), `const`, `null`, `integer` min/max, `maxLength` are all supported. `additionalProperties` defaults to `false`. Still run Zod + id check: the schema can't know which part ids are valid. |
| Imagine endpoint | `POST /v1/images/generations`, model `grok-imagine-image-2.0` ($0.04/image). Params: `prompt`, `n` (≤10), `aspect_ratio` (`16:9`, `3:2`, `auto`...), `resolution` (`1k` default, `2k`), `quality` (`low`/`medium`/`auto`), `response_format` (`url` default, `b64_json`). |
| Imagine reference image? | **Yes**, via a different endpoint: `POST /v1/images/edits` takes up to 5 source images (`image: { url, type: "image_url" }`, public URL or `data:image/png;base64,...`). |
| Imagine output | JPEG. `url` responses are **temporary** (`imgen.x.ai/...xai-tmp-...`), so use `b64_json` and return a `data:image/jpeg;base64,...` string as `RenderResponse.imageUrl`. Keep `resolution: "1k"` so the body stays well under Vercel's 4.5 MB response limit. |
| Voice (TTS) endpoint | `POST /v1/tts`, body `{ text, voice_id: "eve", language: "en", output_format? }`. Response body is raw audio bytes. |
| Voice audio format | Default **MP3, 24 kHz, 128 kbps** (`audio/mpeg`). Other codecs: `wav`, `pcm`, `mulaw`, `alaw`. Our route forwards the bytes with `Content-Type: audio/mpeg`; browser plays with `new Audio(URL.createObjectURL(blob))`. $15 / 1M chars. |
| Speech input (U4) | `POST /v1/stt` multipart (`model=grok-voice-transcribe-2.0`, `file`), returns `{ text }`. Realtime speech-to-speech is a WebSocket (`wss://api.x.ai/v1/realtime`), out of scope. |
| Function calling (U4) | Supported on both advisor candidates; tool args are always strict against the tool's JSON Schema. |
| Video (U2) | `POST /v1/videos/generations` (`grok-imagine-video-1.5`), **async**: returns `request_id`, poll `GET /v1/videos/{id}` until `status: "done"`. Up to 15 s clips, optional start image. $0.08/s. Too slow for a live demo path; pre-recorded clips are the default. |

## Rate limits (Tier 0, default)

| Model | Limit |
|---|---|
| `grok-4.20-non-reasoning` | 37 RPS, 10M TPM |
| `grok-4.7` | 150 RPS, 50M TPM |
| `grok-imagine-image-2.0` | 6 RPS |
| TTS | 50 RPS, 100 concurrent |

Exceeding returns HTTP 429. Four people testing will not hit these; no retry loop needed, the fallback covers it.

Out of credits or over the spending limit returns HTTP **403** in ~0.15 s with body `{ "code": "permission-denied", "error": "..." }` on every endpoint (seen in the spike, 2026-10-17). Every route must treat any non-2xx as "use the fallback".

## Latency and timeouts

| Call | Route timeout | Measured (fill in) |
|---|---|---|
| Advise, `grok-4.20-non-reasoning` | 8 s (spec) | |
| Advise, `grok-4.7` effort low (comparison only) | n/a | |
| Voice, ~100 chars | 8 s | |
| Render, 1k, `b64_json` | 30 s | |

Render needs `export const maxDuration = 60` on `/api/render` so Vercel doesn't kill it first.

## Decisions (Gate 0)

1. **Advisor:** `grok-4.20-non-reasoning`, Responses API, strict JSON schema mirroring `AdviseResponse`, `temperature: 0` for repeatable suggestions. Switch to `grok-4.7` only if measured latency fits in 8 s and quality is clearly better.
2. **Render prompt uses part names + livery only** (`/v1/images/generations`). Imagine *does* accept a reference image, but `RenderRequest` has no image field and the contract is frozen; a canvas screenshot also needs `preserveDrawingBuffer` in P1's scene. Reference-image render via `/v1/images/edits` is a contract v2 candidate, not Phase 1 work.
3. **Voice:** MP3 default format, voice `eve`, text capped at 2 sentences by the advisor.

## Keys

- Env var name: `XAI_API_KEY`.
- Local: put `XAI_API_KEY=...` in `.env.local` at repo root. `.gitignore` already ignores `.env*`.
- Vercel: Project → Settings → Environment Variables → `XAI_API_KEY` for Production, Preview and Development, then redeploy.
- Never read it in client components or prefix it with `NEXT_PUBLIC_`.
