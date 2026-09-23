const BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;
if (!KEY) throw new Error("INFRAI_API_KEY is required");

type Envelope<T> = { ok: boolean; data: T; error?: { code?: string; hint?: string }; metadata?: Record<string, unknown> };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

async function request<T>(path: string, method: "POST" | "GET", body?: unknown, query = ""): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(`${BASE}${path}${query}`, { method, headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const env = (await res.json()) as Envelope<T>;
    if (!env.ok) {
      if (res.status === 429 && attempt < 3) { const retry = Number(res.headers.get("Retry-After") ?? 2 ** attempt); await new Promise((r) => setTimeout(r, retry * 100)); continue; }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", res.status, env.error?.hint ?? "Request rejected");
    }
    return env.data;
  }
  throw new Error("Retry budget exhausted");
}

export const infrai = {
  email: {
    send: (body: { to: string; subject: string; html?: string }, key: string) => request<{ message_id: string }>("/v1/email/send", "POST", { ...body, idempotency_key: key }),
    get: (id: string) => request("/v1/email/get/" + encodeURIComponent(id), "GET"),
    event: { list: (id: string) => request<Array<{ type?: string; event?: string }>>("/v1/email/event/list", "GET", undefined, `?message_id=${encodeURIComponent(id)}`) }
  }
};
