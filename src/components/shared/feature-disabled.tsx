'use client';

import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';

interface FeatureDisabledProps {
  /** What the screen would do, in the operator's words. */
  title: string;
  /** Why it cannot run today. Be specific — vagueness reads as a bug. */
  reason: string;
  /** What would have to be true for it to be switched on. */
  requirement: string;
}

/**
 * Shown in place of a screen whose capability the platform does not currently
 * have. Explains the gap rather than 404ing, so nobody assumes the page is
 * broken or that the feature quietly failed.
 */
export function FeatureDisabled({ title, reason, requirement }: FeatureDisabledProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8">
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>

        <h1 className="mb-2 text-xl font-semibold text-foreground">{title}</h1>

        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{reason}</p>

        <div className="mb-6 rounded-md border-l-2 border-primary bg-muted/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            To enable
          </p>
          <p className="mt-1 text-sm text-foreground">{requirement}</p>
        </div>

        <Link
          href="/dashboard-v2"
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
