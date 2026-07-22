'use client';

import { Suspense } from 'react';
import { AppShell } from 'hudsonkit/app-shell';
import { catalogApp } from '@/catalog';

/**
 * `/` aliases the treatments collection (same shell as `/treatments`).
 * Canonical list URL from nav is `/treatments`; resources live at
 * `/treatments/:id` and `/assets/:id`.
 */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <AppShell app={catalogApp} assistant={false} defaultTheme="dark" managedTheme={false} />
    </Suspense>
  );
}
