// Owner: P3. The only file that talks to xAI. Server-side only: reads XAI_API_KEY.
// Any failure (no key, timeout, non-2xx, bad shape) throws GrokError so routes can fall back.

const BASE_URL = "https://api.x.ai/v1";
export const ADVISOR_MODEL = "grok-4.20-non-reasoning";
export const IMAGE_MODEL = "grok-imagine-image-2.0";
const VOICE = "eve";

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
}): Promise<unknown> => {
  const data = (await post(
    "/responses",
    {
      model: ADVISOR_MODEL,
      temperature: 0,
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

/** Text to speech. Returns MP3 bytes (24 kHz, 128 kbps). */
export const grokSpeech = async (text: string, timeoutMs: number): Promise<ArrayBuffer> => {
  const res = await postRaw("/tts", { text, voice_id: VOICE, language: "en" }, timeoutMs);
  const audio = await res.arrayBuffer();
  if (audio.byteLength === 0) {
    throw new GrokError("/tts: empty audio");
  }
  return audio;
};
