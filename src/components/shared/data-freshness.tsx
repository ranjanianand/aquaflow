'use client';

/**
 * How old the data on screen actually is.
 *
 * The prototype showed a permanently green "SYSTEM ONLINE" pill. It was
 * hardcoded — it stayed green with no database, no ingest and no readings.
 * A status light that cannot go red is decoration, and on a monitoring screen
 * it is worse than nothing: it actively asserts something false.
 *
 * This reads the newest reading actually received and says how old it is.
 */
import { AlertTriangle, CircleOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Newest reading timestamp across the current view; null when none. */
  newest: Date | null;
  error?: Error | null;
  loading?: boolean;
  /** How often the plant publishes. Fresh means within 1.5 polls. */
  pollSeconds?: number;
}

function ago(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 90) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 90) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function DataFreshness({ newest, error, loading, pollSeconds = 3600 }: Props) {
  if (error) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-400">
        <CircleOff className="h-3 w-3" />
        NO CONNECTION
      </span>
    );
  }

  if (!newest || newest.getTime() === 0) {
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CircleOff className="h-3 w-3" />}
        {loading ? 'LOADING' : 'NO DATA'}
      </span>
    );
  }

  const age = Date.now() - newest.getTime();
  // Judged against how often this plant publishes, not a fixed number of
  // seconds. Hourly data is not stale at 5 minutes old.
  const fresh = age <= pollSeconds * 1500;
  const stale = age <= pollSeconds * 3000;

  return (
    <span
      className={cn(
        'flex items-center gap-1.5 text-[10px] font-mono',
        fresh ? 'text-emerald-400' : stale ? 'text-amber-400' : 'text-red-400',
      )}
      title={`Newest reading: ${newest.toISOString()}`}
    >
      {fresh ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 bg-emerald-500" />
        </span>
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      DATA {ago(age).toUpperCase()}
    </span>
  );
}
