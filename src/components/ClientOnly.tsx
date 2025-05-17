// components/ClientOnly.tsx  (one tiny component)
'use client';                 // if you’re on App Router, else remove

import { useEffect, useState } from 'react';

export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) return null;            // ← render nothing during hydration
  return <>{children}</>;
}
