'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { CriticalAlertsBanner } from '@/components/shared/critical-alerts-banner';
import { AuthGuard } from '@/components/auth/auth-guard';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const handleToggle = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsed={collapsed} onToggle={handleToggle} />
        <main
          className={cn(
            'flex-1 flex flex-col transition-all duration-200',
            collapsed ? 'ml-[60px]' : 'ml-[240px]'
          )}
        >
          {/* ISA-101 Compliant: Persistent Critical Alerts Banner */}
          <CriticalAlertsBanner />
          <div className="flex-1">
            {children}
          </div>
        </main>
        <Toaster position="top-right" />
      </div>
    </AuthGuard>
  );
}
