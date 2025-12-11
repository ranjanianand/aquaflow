'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Wrench, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { mockEquipmentHealth } from '@/data/mock-operations';

interface MaintenanceEvent {
  id: string;
  date: Date;
  equipment: string;
  plant: string;
  type: 'scheduled' | 'predicted' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// Generate maintenance events from equipment health data
const generateMaintenanceEvents = (): MaintenanceEvent[] => {
  return mockEquipmentHealth.map((eq) => ({
    id: eq.id,
    date: eq.nextMaintenance,
    equipment: eq.name,
    plant: eq.plantName,
    type: eq.daysRemaining <= 0 ? 'overdue' : eq.status === 'critical' || eq.status === 'warning' ? 'predicted' : 'scheduled',
    priority: eq.status === 'critical' ? 'critical' : eq.status === 'warning' ? 'high' : eq.status === 'attention' ? 'medium' : 'low',
    description: `${eq.type.charAt(0).toUpperCase() + eq.type.slice(1)} maintenance - Health: ${eq.healthScore}%`,
  }));
};

const maintenanceEvents = generateMaintenanceEvents();

export function MaintenanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return maintenanceEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const getPriorityColor = (priority: MaintenanceEvent['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-rose-500';
      case 'high': return 'bg-amber-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-emerald-500';
    }
  };

  const getTypeIcon = (type: MaintenanceEvent['type']) => {
    switch (type) {
      case 'overdue': return AlertTriangle;
      case 'predicted': return Clock;
      case 'scheduled': return Wrench;
    }
  };

  // Upcoming maintenance list (next 14 days)
  const upcomingEvents = maintenanceEvents
    .filter((event) => {
      const eventDate = new Date(event.date);
      const now = new Date();
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= twoWeeks;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4 bg-muted/50">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[14px] font-semibold">Maintenance Calendar</h3>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar View */}
          <div>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h4 className="text-[14px] font-semibold">{monthName}</h4>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-[10px] text-muted-foreground font-medium py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const events = getEventsForDay(day);
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={cn(
                      'h-10 rounded-md border border-transparent flex flex-col items-center justify-start p-1 transition-colors',
                      isToday && 'bg-primary/10 border-primary',
                      events.length > 0 && !isToday && 'bg-muted/50'
                    )}
                  >
                    <span className={cn(
                      'text-[11px] font-medium',
                      isToday && 'text-primary'
                    )}>
                      {day}
                    </span>
                    {events.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={cn('h-1.5 w-1.5 rounded-full', getPriorityColor(event.priority))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-[10px] text-muted-foreground">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-muted-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-muted-foreground">Low</span>
              </div>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div>
            <h4 className="text-[13px] font-semibold mb-3">Upcoming Maintenance (14 days)</h4>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => {
                  const TypeIcon = getTypeIcon(event.type);
                  const daysUntil = Math.ceil(
                    (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'p-3 rounded-lg border-l-4',
                        event.priority === 'critical' && 'border-l-rose-500 bg-rose-50 dark:bg-rose-950/20',
                        event.priority === 'high' && 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
                        event.priority === 'medium' && 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
                        event.priority === 'low' && 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={cn(
                            'h-4 w-4',
                            event.type === 'overdue' && 'text-rose-500',
                            event.type === 'predicted' && 'text-amber-500',
                            event.type === 'scheduled' && 'text-blue-500'
                          )} />
                          <span className="text-[12px] font-semibold">{event.equipment}</span>
                        </div>
                        <span className={cn(
                          'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                          daysUntil <= 3 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300' :
                          daysUntil <= 7 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        )}>
                          {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{event.plant}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{event.description}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-[12px] text-muted-foreground">No upcoming maintenance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
