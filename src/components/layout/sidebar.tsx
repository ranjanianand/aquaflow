'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Activity,
  Bell,
  FileText,
  Building2,
  Users,
  Settings,
  MessageSquare,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Workflow,
  LogOut,
  Briefcase,
  ScrollText,
  BookOpen,
  Zap,
  Wrench,
  Box,
  Package,
  ShoppingCart,
  FileCheck,
  Gauge,
  HardHat,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { getActiveAlertsCount } from '@/data/mock-alerts';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { title: 'Operator View', href: '/dashboard-v2', icon: HardHat },
      { title: 'Manager View', href: '/dashboard-v2?role=manager', icon: BarChart3 },
      { title: 'Executive View', href: '/dashboard-v2?role=executive', icon: PieChart },
      { title: 'Alarms', href: '/alerts', icon: Bell, badge: getActiveAlertsCount() },
    ],
  },
  {
    title: 'Operations',
    items: [
      { title: 'Real-Time', href: '/monitoring', icon: Activity },
      { title: 'Maintenance', href: '/service-monitor', icon: Wrench },
      { title: 'Asset Health', href: '/asset-monitor', icon: Box },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { title: 'Trends', href: '/insights', icon: Lightbulb },
      { title: 'Predictive', href: '/predictive', icon: Cpu },
      { title: 'Energy', href: '/energy', icon: Zap },
    ],
  },
  {
    title: 'Engineering',
    items: [
      { title: 'AI Assistant', href: '/ai-support', icon: MessageSquare },
      { title: 'P&ID', href: '/process-flow-schematic', icon: Workflow },
    ],
  },
  {
    title: 'Business',
    items: [
      { title: 'Customers', href: '/customers', icon: Briefcase },
      { title: 'Contracts', href: '/contracts', icon: ScrollText },
      { title: 'Procurement', href: '/smart-cart', icon: ShoppingCart },
      { title: 'Proposals', href: '/proposal-builder', icon: FileCheck },
      { title: 'Inventory', href: '/inventory-monitor', icon: Package },
    ],
  },
  {
    title: 'Administration',
    items: [
      { title: 'Plants & Assets', href: '/assets', icon: Building2 },
      { title: 'Knowledge Base', href: '/knowledge', icon: BookOpen },
      { title: 'Reports', href: '/reports', icon: FileText },
      { title: 'Users', href: '/users', icon: Users },
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();

  // Build current URL with query params for comparison
  const currentUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  // Check if a nav item is active (handles both path-only and path+query URLs)
  const isNavItemActive = (href: string) => {
    // For URLs with query params, do exact match
    if (href.includes('?')) {
      return currentUrl === href;
    }
    // For path-only URLs, match only if current URL has no query params or different path
    return pathname === href && !searchParams.toString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Fallback user info
  const displayUser = user || { name: 'User', email: '', role: 'viewer' as const };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card flex flex-col transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-[240px]'
        )}
      >
        {/* Logo & Collapse Toggle */}
        <div className={cn(
          'flex items-center border-b border-border',
          collapsed ? 'flex-col justify-center px-2 py-2 gap-1 h-14' : 'justify-between px-4 h-14'
        )}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggle}
                  className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Image
                    src="/mwts-logo.png"
                    alt="MWTS"
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                  <ChevronRight className="h-2.5 w-2.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                Expand sidebar
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Image
                src="/mwts-logo.png"
                alt="MWTS"
                width={40}
                height={40}
                className="h-9 w-auto object-contain"
              />
              <button
                onClick={onToggle}
                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          {navigation.map((section, sectionIdx) => (
            <div key={section.title} className={cn(sectionIdx > 0 && 'mt-4')}>
              {!collapsed && (
                <h3 className="mb-1.5 -mx-2 px-4 py-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-100/80 border-y border-slate-200/60">
                  {section.title}
                </h3>
              )}
              {collapsed && (
                <div className="mb-1 mt-1 h-[2px] mx-1 bg-slate-200 rounded-full" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = isNavItemActive(item.href);
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        'group relative flex items-center rounded-md transition-colors duration-150',
                        collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-2.5 px-2.5 py-2',
                        isActive
                          ? 'bg-slate-700 text-white font-medium shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <Icon className={cn('shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />
                      {!collapsed && (
                        <>
                          <span className="text-sm">{item.title}</span>
                          {item.badge && item.badge > 0 && (
                            <span className={cn(
                              'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium',
                              isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && item.badge && item.badge > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-medium text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-border p-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className="flex w-full items-center justify-center rounded-md p-1.5 transition-colors hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {getInitials(displayUser.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p className="text-xs font-medium">{displayUser.name}</p>
                <p className="text-[10px] text-muted-foreground">Click to log out</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {getInitials(displayUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">{displayUser.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{displayUser.role}</p>
              </div>
              <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
