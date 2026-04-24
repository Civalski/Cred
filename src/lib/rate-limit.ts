import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  if (!globalForRateLimit.rateLimitStore) {
    globalForRateLimit.rateLimitStore = new Map();
  }
  return globalForRateLimit.rateLimitStore;
}

/** Primeiro IP de `x-forwarded-for`, ou cabeçalhos comuns de proxy. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  for (const name of ["cf-connecting-ip", "x-real-ip"]) {
    const v = request.headers.get(name)?.trim();
    if (v) return v;
  }
  return "unknown";
}

/**
 * Janela fixa: no máximo `max` requisições por `windowMs` por chave.
 * Em serverless com várias instâncias cada uma tem o próprio contador.
 */
export function takeRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const map = getStore();
  const now = Date.now();
  if (map.size > 5000) {
    for (const [k, bucket] of map) {
      if (bucket.resetAt <= now) map.delete(k);
    }
  }
  const bucket = map.get(key);
  if (!bucket || now >= bucket.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true };
}

export const RATE_AUTH_LOGIN = {
  max: 20,
  windowMs: 15 * 60 * 1000,
} as const;

export const RATE_USER_REGISTER = {
  max: 10,
  windowMs: 60 * 60 * 1000,
} as const;

export function rateLimitedResponse(retryAfterSec: number) {
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde e tente novamente." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}
