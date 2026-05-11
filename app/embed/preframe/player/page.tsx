'use client';

import { Suspense, useEffect, useRef } from 'react';
import { AppShell } from 'hudsonkit/app-shell';
import { preframePlayerEmbedApp } from '@/catalog/embeds/PlayerEmbed';

const ALLOWED_ORIGINS = (() => {
  const list = new Set<string>();
  if (typeof window !== 'undefined') list.add(window.location.origin);
  const env = process.env.NEXT_PUBLIC_HUDSON_EMBED_ORIGINS ?? '';
  for (const origin of env.split(',').map(item => item.trim()).filter(Boolean)) {
    list.add(origin);
  }
  return list;
})();

function isAllowedOrigin(origin: string): boolean {
  if (typeof window !== 'undefined' && origin === window.location.origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (ALLOWED_ORIGINS.has('*')) return true;
  return false;
}

function applyTokens(vars: unknown) {
  if (!vars || typeof vars !== 'object') return;
  for (const [key, value] of Object.entries(vars as Record<string, unknown>)) {
    if (key.startsWith('--hud-') && typeof value === 'string') {
      document.documentElement.style.setProperty(key, value);
    }
  }
}

function HudsonEmbedHandshake() {
  const sentReady = useRef(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!isAllowedOrigin(event.origin)) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'hudson:embed-context' && data.context) {
        applyTokens(data.context.palette);
        applyTokens(data.context.fonts);
        document.documentElement.dataset.surface = String(data.context.surface ?? 'player');
      } else if (data.type === 'hudson:theme-sync') {
        applyTokens(data.vars);
      }
    }

    window.addEventListener('message', onMessage);
    if (window.parent !== window && !sentReady.current) {
      sentReady.current = true;
      window.parent.postMessage(
        {
          type: 'hudson:embed-ready',
          surfaceId: 'player',
          sizing: { mode: 'responsive', aspectRatio: '16/9', minHeight: 520 },
        },
        '*',
      );
    }

    return () => window.removeEventListener('message', onMessage);
  }, []);

  return null;
}

export default function PreframePlayerEmbedPage() {
  return (
    <>
      <HudsonEmbedHandshake />
      <Suspense fallback={null}>
        <AppShell
          app={preframePlayerEmbedApp}
          assistant={false}
          defaultTheme="dark"
          managedTheme={false}
        />
      </Suspense>
    </>
  );
}
