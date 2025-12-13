'use client';

import { cn } from '@/lib/utils';
import {
  FileText,
  Bell,
  Download,
  Settings,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  variant?: 'default' | 'warning' | 'primary';
}

const quickActions: QuickAction[] = [
  { id: '1', label: 'Generate Report', icon: FileText, shortcut: 'R' },
  { id: '2', label: 'View All Alerts', icon: Bell, shortcut: 'A', variant: 'warning' },
  { id: '3', label: 'Export Data', icon: Download, shortcut: 'E' },
  { id: '4', label: 'Refresh Data', icon: RefreshCw, shortcut: 'F5' },
  { id: '5', label: 'Add Sensor', icon: PlusCircle, variant: 'primary' },
  { id: '6', label: 'Configure Alerts', icon: AlertTriangle },
  { id: '7', label: 'View Analytics', icon: BarChart3 },
  { id: '8', label: 'System Settings', icon: Settings },
];

export function IndustrialQuickActions() {
  return (
    <div className="border-2 border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="bg-slate-100 px-4 py-3 border-b-2 border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quick Actions</span>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-4 gap-px bg-slate-200">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 bg-white',
                'hover:bg-slate-50 transition-colors group',
                action.variant === 'warning' && 'hover:bg-amber-50',
                action.variant === 'primary' && 'hover:bg-blue-50'
              )}
            >
              <div className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center border',
                action.variant === 'warning' && 'bg-amber-50 border-amber-200 group-hover:bg-amber-100',
                action.variant === 'primary' && 'bg-blue-50 border-blue-200 group-hover:bg-blue-100',
                !action.variant && 'bg-slate-50 border-slate-200 group-hover:bg-slate-100'
              )}>
                <Icon className={cn(
                  'h-5 w-5',
                  action.variant === 'warning' && 'text-amber-600',
                  action.variant === 'primary' && 'text-blue-600',
                  !action.variant && 'text-slate-500 group-hover:text-slate-700'
                )} />
              </div>
              <span className={cn(
                'text-xs font-semibold text-center leading-tight',
                action.variant === 'warning' && 'text-amber-700',
                action.variant === 'primary' && 'text-blue-700',
                !action.variant && 'text-slate-600 group-hover:text-slate-900'
              )}>
                {action.label}
              </span>
              {action.shortcut && (
                <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 bg-slate-100 rounded">
                  {action.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
