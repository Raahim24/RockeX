// Owner: P3. The only file that talks to xAI. Server-side only: reads XAI_API_KEY.
// Any failure (no key, timeout, non-2xx, bad shape) throws GrokError so routes can fall back.

const BASE_URL = "https://api.x.ai/v1";
export const ADVISOR_MODEL = "grok-4.20-non-reasoning";
export const IMAGE_MODEL = "grok-imagine-image-2.0";
const VOICE = "eve";
const TRANSCRIBE_MODEL = "grok-voice-transcribe-2.0";

export class GrokError extends Error {}

const apiKey = (): string => {
  const key = process.env.XAI_API_KEY;
  if (!key) {
    throw new GrokError("XAI_API_KEY is not set");
  }
  return key;
};

const post = async (path: string, body: unknown, timeoutMs: number): Promise<unknown> =>
  (await postRaw(path, body, timeoutMs)).json();

const postRaw = async (path: string, body: unknown, timeoutMs: number): Promise<Response> => {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof GrokError) {
      throw err;
    }
    const reason = err instanceof Error && err.name === "TimeoutError" ? `timeout after ${timeoutMs} ms` : String(err);
    throw new GrokError(`${path}: ${reason}`);
  }
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 200);
    throw new GrokError(`${path}: HTTP ${res.status} ${detail}`);
  }
  return res;
};

interface ResponsesOutput {
  output?: { type?: string; content?: { type?: string; text?: string }[] }[];
}

/** Calls the Responses API with a strict JSON schema and returns the parsed JSON (still unvalidated). */
export const grokJson = async (opts: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  timeoutMs: number;
  /** 0 (default) for repeatable output; higher for livelier wording. */
  temperature?: number;
}): Promise<unknown> => {
  const data = (await post(
    "/responses",
    {
      model: ADVISOR_MODEL,
      temperature: opts.temperature ?? 0,
      store: false,
      input: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      text: { format: { type: "json_schema", name: opts.schemaName, schema: opts.schema, strict: true } },
    },
    opts.timeoutMs,
  )) as ResponsesOutput;

  const text = data.output
    ?.find((item) => item.type === "message")
    ?.content?.find((c) => c.type === "output_text")?.text;
  if (!text) {
    throw new GrokError("/responses: no output_text in reply");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new GrokError("/responses: output_text is not JSON");
  }
};

interface ImageOutput {
  data?: { b64_json?: string | null; mime_type?: string }[];
}

/** Generates one image and returns it as a data URL (xAI's hosted URLs are temporary). */
export const grokImage = async (prompt: string, timeoutMs: number): Promise<string> => {
  const data = (await post(
    "/images/generations",
    { model: IMAGE_MODEL, prompt, n: 1, aspect_ratio: "16:9", resolution: "1k", response_format: "b64_json" },
    timeoutMs,
  )) as ImageOutput;

  const image = data.data?.[0];
  if (!image?.b64_json) {
    throw new GrokError("/images/generations: no image in reply");
  }
  return `data:${image.mime_type ?? "image/jpeg"};base64,${image.b64_json}`;
};

// Storyboard stills. Generation on the cheapest model ($0.02); edits (which keep our rocket from a reference
// still) only exist on 2.0 and bill input + output.
export const STORYBOARD_MODEL = process.env.XAI_STORYBOARD_MODEL || "grok-imagine-image";
export const EDIT_MODEL = "grok-imagine-image-2.0";

const imageFrom = (data: ImageOutput & { data?: { url?: string }[] }, path: string): string => {
  const image = data.data?.[0];
  if (image?.b64_json) return `data:${image.mime_type ?? "image/jpeg"};base64,${image.b64_json}`;
  if (image?.url) return image.url;
  throw new GrokError(`${path}: no image in reply`);
};

/** One 16:9 still from a prompt on the storyboard model. */
export const grokStill = async (prompt: string, timeoutMs: number): Promise<string> =>
  imageFrom(
    (await post(
      "/images/generations",
      { model: STORYBOARD_MODEL, prompt, n: 1, aspect_ratio: "16:9", response_format: "b64_json" },
      timeoutMs,
    )) as ImageOutput,
    "/images/generations",
  );

/** One still edited from a reference image (URL or data URL), so it keeps that exact rocket. */
export const grokStillEdit = async (prompt: string, image: string, timeoutMs: number): Promise<string> =>
  imageFrom(
    (await post(
      "/images/edits",
      { model: EDIT_MODEL, prompt, image: { url: image, type: "image_url" }, response_format: "b64_json" },
      timeoutMs,
    )) as ImageOutput,
    "/images/edits",
  );

/** Text to speech. Returns MP3 bytes (24 kHz, 128 kbps). */
export const grokSpeech = async (text: string, timeoutMs: number): Promise<ArrayBuffer> => {
  const res = await postRaw("/tts", { text, voice_id: VOICE, language: "en" }, timeoutMs);
  const audio = await res.arrayBuffer();
  if (audio.byteLength === 0) {
    throw new GrokError("/tts: empty audio");
  }
  return audio;
};

interface TranscriptOutput {
  text?: string;
}

/** Speech to text (grok-voice-transcribe-2.0). The container format is auto-detected. */
export const grokTranscribe = async (audio: Blob, filename: string, timeoutMs: number): Promise<string> => {
  const form = new FormData();
  form.append("model", TRANSCRIBE_MODEL);
  form.append("language", "en");
  form.append("file", audio, filename); // xAI: the file must be the last field
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/stt`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey()}` },
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof GrokError) {
      throw err;
    }
    throw new GrokError(`/stt: ${err instanceof Error && err.name === "TimeoutError" ? `timeout after ${timeoutMs} ms` : String(err)}`);
  }
  if (!res.ok) {
    throw new GrokError(`/stt: HTTP ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const text = ((await res.json()) as TranscriptOutput).text?.trim();
  if (!text) {
    throw new GrokError("/stt: empty transcript");
  }
  return text;
};

// Grok Imagine video. Pricing (docs.x.ai, 2026-10-18): 1.5-lite $0.02/s, base $0.05/s, 1.5 $0.08/s.
// Lite and 8 s by default (about $0.16 a clip); override with XAI_VIDEO_MODEL and XAI_VIDEO_SECONDS.
export const VIDEO_MODEL = process.env.XAI_VIDEO_MODEL || "grok-imagine-video-1.5-lite";
export const VIDEO_SECONDS = Math.min(15, Math.max(1, Number(process.env.XAI_VIDEO_SECONDS) || 8));

/** Starts an async video job and returns its request id. `image` (a URL or data URL) is the first frame. */
export const grokVideoStart = async (opts: { prompt: string; image?: string; timeoutMs: number }): Promise<string> => {
  const data = (await post(
    "/videos/generations",
    {
      model: VIDEO_MODEL,
      prompt: opts.prompt,
      duration: VIDEO_SECONDS,
      ...(opts.image ? { image: { url: opts.image } } : {}),
    },
    opts.timeoutMs,
  )) as { request_id?: string };
  if (!data.request_id) {
    throw new GrokError("/videos/generations: no request_id in reply");
  }
  return data.request_id;
};

export type VideoStatus = { status: "pending" } | { status: "done"; url: string } | { status: "failed"; reason: string };

/** One poll of a video job. xAI's terminal states are done, failed and expired; anything else is still running. */
export const grokVideoStatus = async (requestId: string, timeoutMs: number): Promise<VideoStatus> => {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/videos/${encodeURIComponent(requestId)}`, {
      headers: { Authorization: `Bearer ${apiKey()}` },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof GrokError) {
      throw err;
    }
    throw new GrokError(`/videos: ${err instanceof Error && err.name === "TimeoutError" ? `timeout after ${timeoutMs} ms` : String(err)}`);
  }
  if (!res.ok) {
    throw new GrokError(`/videos: HTTP ${res.status} ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const data = (await res.json()) as { status?: string; video?: { url?: string } };
  if (data.status === "done") {
    return data.video?.url ? { status: "done", url: data.video.url } : { status: "failed", reason: "done without a video url" };
  }
  if (data.status === "failed" || data.status === "expired") {
    return { status: "failed", reason: data.status };
  }
  return { status: "pending" };
};

export const REALTIME_MODEL = "grok-voice-latest";
export const REALTIME_VOICE = VOICE;

/** Short-lived token for a browser to open the live voice WebSocket; the real key never leaves the server. */
export const grokRealtimeToken = async (seconds: number, timeoutMs: number): Promise<{ value: string; expiresAt: number }> => {
  const data = (await post("/realtime/client_secrets", { expires_after: { seconds } }, timeoutMs)) as {
    value?: string;
    expires_at?: number;
  };
  if (!data.value) {
    throw new GrokError("/realtime/client_secrets: no token in reply");
  }
  return { value: data.value, expiresAt: data.expires_at ?? 0 };
};
