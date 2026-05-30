'use client';

import { Suspense } from 'react';
import { AppShell } from 'hudsonkit/app-shell';
import { frameDesignerApp } from '@/frame-designer';

export default function DesignerPage() {
  return (
    <Suspense fallback={null}>
      <AppShell
        app={frameDesignerApp}
        assistant
        defaultTheme="dark"
        managedTheme={false}
      />
    </Suspense>
  );
}
