'use client';

import { Search, Bell, HelpCircle } from 'lucide-react';
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
import { getAlertsByStatus } from '@/data/mock-alerts';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/shared/theme-toggle';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const activeAlerts = getAlertsByStatus('active');

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Main header */}
      <div className="flex h-14 items-center justify-between px-6">
        <div className="min-w-0">
          <h1 className="text-base font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden lg:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="h-8 w-[180px] pl-8 text-xs bg-muted/40 border-0 focus-visible:ring-1 rounded-md"
            />
          </div>

          {/* Notifications */}
          <TooltipProvider delayDuration={0}>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {activeAlerts.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
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
                  {activeAlerts.slice(0, 5).map((alert) => (
                    <DropdownMenuItem
                      key={alert.id}
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
                        <span className="flex-1 text-xs font-medium truncate">{alert.type}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground pl-3.5">{alert.plantName}</p>
                    </DropdownMenuItem>
                  ))}
                </div>
                {activeAlerts.length > 5 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="justify-center text-xs text-primary font-medium">
                      View all alerts
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ThemeToggle />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Switch Theme</TooltipContent>
            </Tooltip>

            {/* Help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Help & Support</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
