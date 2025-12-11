'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Activity,
  Bell,
  TrendingUp,
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
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Live Monitoring', href: '/monitoring', icon: Activity },
      { title: 'Alerts Center', href: '/alerts', icon: Bell, badge: getActiveAlertsCount() },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { title: 'Insights', href: '/insights', icon: Lightbulb },
      { title: 'AI Support', href: '/ai-support', icon: MessageSquare },
      { title: 'Predictive', href: '/predictive', icon: Cpu },
      { title: 'Process Flow', href: '/process-flow-schematic', icon: Workflow },
    ],
  },
  {
    title: 'Management',
    items: [
      { title: 'Plants & Assets', href: '/assets', icon: Building2 },
      { title: 'Reports', href: '/reports', icon: FileText },
      { title: 'Users', href: '/users', icon: Users },
      { title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
  // Hidden: { title: 'Trends & Analysis', href: '/trends', icon: TrendingUp },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
                    src="/yozy-logo.png"
                    alt="YOZY"
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
                src="/yozy-logo.png"
                alt="YOZY"
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
                <h3 className="mb-1.5 px-2 text-[11px] font-medium text-muted-foreground">
                  {section.title}
                </h3>
              )}
              {collapsed && sectionIdx > 0 && (
                <div className="mb-2 h-px mx-2 bg-border" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        'group relative flex items-center rounded-md transition-colors duration-150',
                        collapsed ? 'justify-center h-10 w-10 mx-auto' : 'gap-2.5 px-2.5 py-2',
                        isActive
                          ? 'bg-foreground text-background font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      <Icon className={cn('shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')} />
                      {!collapsed && (
                        <>
                          <span className="text-[13px]">{item.title}</span>
                          {item.badge && item.badge > 0 && (
                            <span className={cn(
                              'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-medium',
                              isActive ? 'bg-background/20 text-background' : 'bg-destructive text-white'
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
                    <AvatarFallback className="bg-foreground text-background text-xs font-medium">
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
                <AvatarFallback className="bg-foreground text-background text-xs font-medium">
                  {getInitials(displayUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-[13px] font-medium truncate">{displayUser.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{displayUser.role}</p>
              </div>
              <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
