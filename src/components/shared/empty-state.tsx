'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileX,
  AlertCircle,
  Inbox,
  Search,
  Bell,
  Activity,
  FileText,
  Users,
  Building2,
  RefreshCw,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction}>
              <Plus className="h-4 w-4 mr-1" />
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios

export function NoDataEmptyState({
  onRefresh,
  className,
}: {
  onRefresh?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={FileX}
      title="No Data Available"
      description="There's no data to display at the moment. Try refreshing or check back later."
      actionLabel={onRefresh ? 'Refresh' : undefined}
      onAction={onRefresh}
      className={className}
    />
  );
}

export function NoAlertsEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Bell}
      title="No Alerts"
      description="Great news! There are no active alerts at this time. All systems are operating normally."
      className={className}
    />
  );
}

export function NoSearchResultsEmptyState({
  query,
  onClear,
  className,
}: {
  query: string;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No Results Found"
      description={`We couldn't find any results matching "${query}". Try adjusting your search terms.`}
      actionLabel={onClear ? 'Clear Search' : undefined}
      onAction={onClear}
      className={className}
    />
  );
}

export function NoSensorsEmptyState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Activity}
      title="No Sensors Configured"
      description="This plant doesn't have any sensors configured yet. Add sensors to start monitoring."
      actionLabel={onAdd ? 'Add Sensor' : undefined}
      onAction={onAdd}
      className={className}
    />
  );
}

export function NoReportsEmptyState({
  onGenerate,
  className,
}: {
  onGenerate?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={FileText}
      title="No Reports Generated"
      description="You haven't generated any reports yet. Create your first report to get started."
      actionLabel={onGenerate ? 'Generate Report' : undefined}
      onAction={onGenerate}
      className={className}
    />
  );
}

export function NoPlantsEmptyState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Building2}
      title="No Plants Configured"
      description="You haven't added any plants yet. Add your first plant to start monitoring."
      actionLabel={onAdd ? 'Add Plant' : undefined}
      onAction={onAdd}
      className={className}
    />
  );
}

export function NoUsersEmptyState({
  onAdd,
  className,
}: {
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={Users}
      title="No Users Found"
      description="No users match your current filters. Try adjusting the filters or add a new user."
      actionLabel={onAdd ? 'Add User' : undefined}
      onAction={onAdd}
      className={className}
    />
  );
}

export function ErrorEmptyState({
  onRetry,
  message,
  className,
}: {
  onRetry?: () => void;
  message?: string;
  className?: string;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="Something Went Wrong"
      description={message || "We encountered an error while loading this content. Please try again."}
      actionLabel={onRetry ? 'Try Again' : undefined}
      onAction={onRetry}
      className={className}
    />
  );
}

export function ConnectionErrorEmptyState({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      icon={RefreshCw}
      title="Connection Lost"
      description="Unable to connect to the server. Please check your connection and try again."
      actionLabel={onRetry ? 'Reconnect' : undefined}
      onAction={onRetry}
      className={className}
    />
  );
}

// Table empty state wrapper
export function TableEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  colSpan = 7,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState
          title={title}
          description={description}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      </td>
    </tr>
  );
}

// Additional domain-specific empty states

import {
  Lightbulb,
  Wrench,
  TrendingUp,
  Calendar,
  Cpu,
  CheckCircle2
} from 'lucide-react';

export function NoInsightsEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Lightbulb}
      title="No Active Insights"
      description="No optimization recommendations at this time. The system is operating efficiently."
      className={className}
    />
  );
}

export function NoMaintenanceEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Wrench}
      title="No Scheduled Maintenance"
      description="All maintenance tasks are up to date. No upcoming maintenance scheduled."
      className={className}
    />
  );
}

export function NoTrendsEmptyState({
  onSelectSensor,
  className
}: {
  onSelectSensor?: () => void;
  className?: string
}) {
  return (
    <EmptyState
      icon={TrendingUp}
      title="Select a Sensor"
      description="Choose a plant and sensor to view historical trends and analysis."
      actionLabel={onSelectSensor ? 'Select Sensor' : undefined}
      onAction={onSelectSensor}
      className={className}
    />
  );
}

export function NoPredictionsEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Cpu}
      title="No Predictions Available"
      description="Not enough historical data to generate predictions. Continue monitoring to enable predictive analytics."
      className={className}
    />
  );
}

export function AllHealthyEmptyState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 mb-4">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
        All Systems Healthy
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        All equipment is operating within normal parameters. No issues detected.
      </p>
    </div>
  );
}

export function NoEventsEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Calendar}
      title="No Upcoming Events"
      description="No maintenance or calibration events scheduled for this period."
      className={className}
    />
  );
}
