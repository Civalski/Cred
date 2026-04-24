/**
 * Cloudflare Turnstile: exige verificação só em produção no Vercel, com secret e site key definidos.
 */

function getTurnstileSecret(): string | undefined {
  return (
    process.env.CLOUDFLARE_TURNSTILE_API_KEY?.trim() ||
    process.env.TURNSTILE_SECRET_KEY?.trim() ||
    undefined
  );
}

function getTurnstileSiteKeyFromEnv(): string | undefined {
  return (
    process.env.TURNSTILE_SITE?.trim() ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    undefined
  );
}

/** Produção Vercel + par secret + site key. Sem isso, login/cadastro seguem sem Turnstile. */
export function isTurnstileEnforced(): boolean {
  if (process.env.VERCEL_ENV !== "production") {
    return false;
  }
  return Boolean(getTurnstileSecret() && getTurnstileSiteKeyFromEnv());
}

/** Site key para o widget (página server passa ao client). Só preenchido quando o Turnstile está ativo. */
export function getTurnstileSiteKeyForClient(): string | null {
  if (!isTurnstileEnforced()) {
    return null;
  }
  return getTurnstileSiteKeyFromEnv() ?? null;
}

type SiteverifyResult = { success: boolean; [key: string]: unknown };

export async function verifyTurnstileResponse(
  token: string | undefined,
  remoteip: string,
): Promise<boolean> {
  if (!isTurnstileEnforced()) {
    return true;
  }
  const secret = getTurnstileSecret();
  if (!secret) {
    return false;
  }
  if (!token || token.length < 1) {
    return false;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteip && remoteip !== "unknown") {
    body.set("remoteip", remoteip);
  }

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
  );

  const data = (await res.json().catch(() => ({}))) as SiteverifyResult;
  return data.success === true;
}
