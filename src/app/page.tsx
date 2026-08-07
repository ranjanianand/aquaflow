'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Sends "/" to the dashboard.
 *
 * This was `redirect('/dashboard')` from next/navigation, which is evaluated
 * on the server. A static export has no server, so the root page threw
 * "Application error: a client-side exception has occurred" — with the real
 * cause only visible in the browser console.
 *
 * `replace` rather than `push` so the back button does not return here and
 * bounce the user forward again.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
