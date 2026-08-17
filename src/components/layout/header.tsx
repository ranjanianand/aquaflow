'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, HelpCircle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAlertsAsAppAlerts, usePlants, useAllSensors } from '@/lib/api/hooks';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/theme-toggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

/** Screens worth reaching by name. Kept here rather than derived from the
 *  sidebar because the sidebar groups by role, and someone typing "audit"
 *  wants the screen, not the section it happens to sit under. */
const SCREENS: { title: string; href: string }[] = [
  { title: 'Operator View', href: '/dashboard-v2' },
  { title: 'Alarms', href: '/alerts' },
  { title: 'Real-Time Monitoring', href: '/monitoring' },
  { title: 'Manual Entry', href: '/manual-entry' },
  { title: 'Data Pipeline', href: '/data-pipeline' },
  { title: 'Trends', href: '/trends' },
  { title: 'Energy', href: '/energy' },
  { title: 'Assets', href: '/assets' },
  { title: 'Maintenance', href: '/service-monitor' },
  { title: 'Reports', href: '/reports' },
  { title: 'Audit Log', href: '/audit-log' },
  { title: 'Knowledge Base', href: '/knowledge' },
  { title: 'Users', href: '/users' },
  { title: 'Settings', href: '/settings' },
];

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter();
  const { data: alerts } = useAlertsAsAppAlerts();
  const { data: plants } = usePlants();
  const { data: sensors } = useAllSensors();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeAlerts = alerts ?? [];

  // Plants, sensors and screens in one list. A plant has six or so sensors of
  // the same parameter, so a sensor result has to name its location to be
  // distinguishable — "pH" alone appears a dozen times.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const hits: { kind: string; label: string; hint: string; href: string }[] = [];

    for (const s of SCREENS) {
      if (s.title.toLowerCase().includes(q)) {
        hits.push({ kind: 'Screen', label: s.title, hint: '', href: s.href });
      }
    }
    for (const p of plants ?? []) {
      if (p.name.toLowerCase().includes(q)) {
        hits.push({ kind: 'Plant', label: p.name, hint: '',
                    href: `/monitoring?plant=${p.id}` });
      }
    }
    // A sensor knows its plant only by id, so the readable name comes from the
    // plant list rather than the reading.
    const plantName = new Map((plants ?? []).map((p) => [p.id, p.name]));
    for (const s of sensors ?? []) {
      const hay = `${s.name} ${s.type} ${s.location ?? ''}`.toLowerCase();
      if (hay.includes(q)) {
        hits.push({
          kind: 'Sensor',
          label: s.name,
          hint: [s.location, plantName.get(s.plantId)].filter(Boolean).join(' · '),
          href: `/monitoring?plant=${s.plantId}`,
        });
      }
    }
    // Capped: a two-letter query matches most of 250 sensors, and a list that
    // long is not a result, it is a wall.
    return hits.slice(0, 8);
  }, [query, plants, sensors]);

  function go(href: string) {
    setQuery('');
    setOpen(false);
    router.push(href);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search — plants, sensors and screens */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2
                               text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              // A click on a result fires after blur, so the list cannot close
              // immediately or the click lands on nothing.
              onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 150); }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setQuery(''); setOpen(false); }
                if (e.key === 'Enter' && results.length) go(results[0].href);
              }}
              placeholder="Search plants, sensors, screens..."
              className="h-8 w-[220px] pl-8 pr-7 text-xs bg-muted/40 border-0
                         focus-visible:ring-1 rounded-md"
            />
            {query && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setQuery(''); setOpen(false); }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5
                           flex items-center justify-center rounded hover:bg-muted"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}

            {open && query.trim().length >= 2 && (
              <div className="absolute right-0 mt-1 w-[320px] rounded-md border border-border
                              bg-popover shadow-md overflow-hidden z-50">
                {results.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-muted-foreground">
                    Nothing matches “{query.trim()}”
                  </p>
                ) : results.map((r, i) => (
                  <button
                    key={`${r.href}-${i}`}
                    type="button"
                    onMouseDown={(e) => {
                      // Beat the blur, so the navigation is not cancelled.
                      e.preventDefault();
                      if (blurTimer.current) clearTimeout(blurTimer.current);
                      go(r.href);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left
                               hover:bg-muted/60 transition-colors"
                  >
                    <span className="text-[9px] uppercase tracking-wider font-bold
                                     text-muted-foreground w-12 shrink-0">
                      {r.kind}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs truncate">{r.label}</span>
                      {r.hint && (
                        <span className="block text-[10px] text-muted-foreground truncate">
                          {r.hint}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <TooltipProvider delayDuration={0}>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-8 w-8 flex items-center justify-center
                                       rounded-md hover:bg-muted/50 transition-colors">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {activeAlerts.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5
                                         rounded-full bg-[var(--danger)]" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">Notifications</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between text-xs font-medium">
                  <span>Notifications</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {activeAlerts.length} active
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[280px] overflow-y-auto">
                  {activeAlerts.length === 0 && (
                    <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                      No active alarms
                    </p>
                  )}
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <DropdownMenuItem
                      key={alert.id}
                      onSelect={() => router.push(`/alerts?plant=${alert.plantId}`)}
                      className="flex cursor-pointer flex-col items-start gap-0.5 px-3 py-2"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            alert.severity === 'critical' && 'bg-[var(--danger)]',
                            alert.severity === 'warning' && 'bg-[var(--warning)]',
                            alert.severity === 'info' && 'bg-[var(--info)]'
                          )}
                        />
                        {/* The sensor, not alert.type — that field carries the
                            treatment stage, so every row read "final" or "raw". */}
                        <span className="flex-1 text-xs font-medium truncate">
                          {alert.sensorName}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground pl-3.5 truncate w-full">
                        {alert.plantName}
                        {alert.value != null && alert.unit
                          ? ` · ${alert.value} ${alert.unit}`
                          : ''}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="justify-center text-xs font-medium">
                  <Link href="/alerts">View all alerts</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Switch Theme</TooltipContent>
            </Tooltip>

            {/* Help — the knowledge base is the only support content that
                exists, so that is where this goes rather than nowhere. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/knowledge"
                  className="h-8 w-8 flex items-center justify-center rounded-md
                             hover:bg-muted/50 transition-colors"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Help &amp; Support</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
