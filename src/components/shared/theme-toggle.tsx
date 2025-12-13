'use client';

import { useTheme } from '@/contexts/theme-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { themeVariant, setThemeVariant } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Theme Variant
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setThemeVariant('vercel')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-[#0070f3]" />
            <div>
              <span className="block text-sm">Consumer</span>
              <span className="block text-[10px] text-muted-foreground">Vercel-style bright</span>
            </div>
          </div>
          {themeVariant === 'vercel' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setThemeVariant('industrial')}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-[#0D9488]" />
            <div>
              <span className="block text-sm">Industrial</span>
              <span className="block text-[10px] text-muted-foreground">SCADA/Engineering</span>
            </div>
          </div>
          {themeVariant === 'industrial' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Compact inline toggle for header
export function ThemeToggleInline() {
  const { themeVariant, toggleThemeVariant } = useTheme();

  return (
    <button
      onClick={toggleThemeVariant}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        'border border-border',
        themeVariant === 'industrial' ? 'bg-cyan-600' : 'bg-muted'
      )}
      title={`Switch to ${themeVariant === 'vercel' ? 'Industrial' : 'Vercel'} theme`}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
          themeVariant === 'industrial' ? 'translate-x-6' : 'translate-x-1'
        )}
      />
      <span className="sr-only">
        {themeVariant === 'vercel' ? 'Switch to Industrial theme' : 'Switch to Vercel theme'}
      </span>
    </button>
  );
}

// Theme indicator badge for development
export function ThemeBadge() {
  const { themeVariant } = useTheme();

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg',
        themeVariant === 'industrial'
          ? 'bg-teal-700 text-white'
          : 'bg-blue-600 text-white'
      )}
    >
      {themeVariant === 'industrial' ? 'Industrial/SCADA' : 'Consumer/Vercel'}
    </div>
  );
}
