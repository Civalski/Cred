"use client";

import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
};

export function TurnstileField({ siteKey, onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    onToken(null);

    const mount = () => {
      if (cancelled || !containerRef.current) return;
      const { turnstile } = window;
      if (!turnstile) return;
      if (widgetIdRef.current) {
        try {
          turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
      const id = turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
      widgetIdRef.current = id;
    };

    const run = () => {
      if (cancelled) return;
      if (window.turnstile) {
        mount();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`,
      );
      if (existing) {
        const onLoad = () => {
          if (!cancelled) mount();
        };
        existing.addEventListener("load", onLoad, { once: true });
        if (window.turnstile) onLoad();
        return;
      }
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.addEventListener("load", () => {
        if (!cancelled) mount();
      });
      document.head.appendChild(s);
    };

    run();

    return () => {
      cancelled = true;
      onToken(null);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null;
    };
  }, [siteKey, onToken]);

  return <div ref={containerRef} className="home-turnstile" />;
}
