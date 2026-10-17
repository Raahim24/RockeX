#!/usr/bin/env bash
# Phase 0 API spike. Measures real latency for advise / voice / render calls.
# Usage (from repo root):  bash src/lib/ai/spike.sh [runs]
# Reads XAI_API_KEY from the environment or .env.local. Outputs go to /tmp/xai-spike.
set -euo pipefail

RUNS="${1:-3}"
OUT=/tmp/xai-spike
mkdir -p "$OUT"

if [ -z "${XAI_API_KEY:-}" ] && [ -f .env.local ]; then
  XAI_API_KEY="$(grep -E '^XAI_API_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d '"')"
fi
if [ -z "${XAI_API_KEY:-}" ]; then
  echo "XAI_API_KEY not set (env or .env.local)" >&2
  exit 1
fi

BASE=https://api.x.ai/v1
AUTH="Authorization: Bearer $XAI_API_KEY"

call() { # name url body outfile
  curl -sS -o "$4" -w "$1  http=%{http_code}  total=%{time_total}s  ttfb=%{time_starttransfer}s\n" \
    -X POST "$2" -H "$AUTH" -H "Content-Type: application/json" -d "$3"
}

ADVISE_BODY='{
  __MODEL__,
  "temperature": 0,
  "input": [
    {"role": "system", "content": "You are a rocket engineer. Reply in JSON. At most 2 sentences. At most one suggestion, using only the listed part ids."},
    {"role": "user", "content": "Mission: moon-transfer, needs 12500 m/s. Build has 11600 m/s, margin -900 m/s, liftoff TWR 1.4. Stage 1 upper stage uses merlin-1d-vac on a kerolox tank. Valid engine ids: merlin-1d, merlin-1d-vac, rl10. Valid tank ids: f9-s1, f9-s2, centaur."}
  ],
  "text": {"format": {"type": "json_schema", "name": "advise", "strict": true, "schema": {
    "type": "object",
    "required": ["message", "suggestion"],
    "properties": {
      "message": {"type": "string", "maxLength": 300},
      "suggestion": {"anyOf": [
        {"type": "null"},
        {"type": "object", "required": ["type", "stageIndex", "engineId"], "properties": {"type": {"const": "swap_engine"}, "stageIndex": {"type": "integer", "minimum": 0}, "engineId": {"type": "string"}}},
        {"type": "object", "required": ["type", "stageIndex", "engineCount"], "properties": {"type": {"const": "set_engine_count"}, "stageIndex": {"type": "integer", "minimum": 0}, "engineCount": {"type": "integer", "minimum": 1, "maximum": 9}}},
        {"type": "object", "required": ["type", "stageIndex", "tankId"], "properties": {"type": {"const": "swap_tank"}, "stageIndex": {"type": "integer", "minimum": 0}, "tankId": {"type": "string"}}},
        {"type": "object", "required": ["type", "engineId", "tankId"], "properties": {"type": {"const": "add_stage"}, "engineId": {"type": "string"}, "tankId": {"type": "string"}}}
      ]}
    }
  }}}
}'

VOICE_BODY='{"text": "You are 900 meters per second short. Swap the upper stage to an RL10 on a hydrolox tank.", "voice_id": "eve", "language": "en"}'

RENDER_BODY='{
  "model": "grok-imagine-image-2.0",
  "prompt": "Photorealistic product shot of a two-stage rocket on a launch pad at dusk. First stage: 9 Merlin 1D engines under a 3.7 m kerolox tank. Second stage: one RL10 engine under a hydrolox tank. White body with black accent stripe. Payload fairing on top.",
  "aspect_ratio": "16:9",
  "resolution": "1k",
  "response_format": "b64_json",
  "n": 1
}'

ADVISE_FAST="$(printf '%s' "$ADVISE_BODY" | sed 's/__MODEL__/"model": "grok-4.20-non-reasoning"/')"
ADVISE_47="$(printf '%s' "$ADVISE_BODY" | sed 's/__MODEL__/"model": "grok-4.7", "reasoning": {"effort": "low"}/')"

for i in $(seq 1 "$RUNS"); do
  echo "--- run $i ---"
  call "advise (grok-4.20-non-reasoning)" "$BASE/responses" "$ADVISE_FAST" "$OUT/advise-$i.json"
  call "advise (grok-4.7 low)          " "$BASE/responses" "$ADVISE_47" "$OUT/advise47-$i.json"
  call "voice  (/tts eve mp3)          " "$BASE/tts" "$VOICE_BODY" "$OUT/voice-$i.mp3"
  call "render (imagine-image-2.0 1k)  " "$BASE/images/generations" "$RENDER_BODY" "$OUT/render-$i.json"
done

echo
echo "Advise outputs (check JSON text in output[].content[].text):"
for f in "$OUT"/advise-*.json; do grep -o '"text":"[^"]*' "$f" | head -1 | cut -c9- ; done
echo
echo "Voice file type: $(file -b "$OUT/voice-1.mp3")"
echo "Files in $OUT"
