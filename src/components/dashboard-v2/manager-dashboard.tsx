'use client';

import { useState } from 'react';
import {
  Building2,
  Activity,
  AlertTriangle,
  Bell,
  Users,
  Wrench,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Timer,
  Zap,
  Droplets,
  BarChart3,
  ChevronRight,
  HardHat,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPlants } from '@/data/mock-plants';
import { getActiveAlerts, getCriticalAlertsCount } from '@/data/mock-alerts';
import {
  mockEquipmentHealth,
  getOverallHealthScore,
  getCriticalEquipmentCount,
  getWarningEquipmentCount,
  getEquipmentNeedingAttention,
} from '@/data/mock-operations';
import {
  mockEnergyKPIs,
  getTotalEnergyConsumed,
  getTotalEnergyCost,
  getAverageSpecificEnergy,
} from '@/data/mock-energy';
import {
  serviceTickets,
  technicians,
  getOpenTicketsCount,
  getCriticalTicketsCount,
  getSLAComplianceRate,
} from '@/data/mock-services';

export function ManagerDashboard() {
  const [selectedPlant, setSelectedPlant] = useState<string>('all');

  // Aggregated metrics
  const onlinePlants = mockPlants.filter((p) => p.status === 'online').length;
  const warningPlants = mockPlants.filter((p) => p.status === 'warning').length;
  const offlinePlants = mockPlants.filter((p) => p.status === 'offline').length;
  const totalSensors = mockPlants.reduce((acc, p) => acc + p.sensorCount, 0);

  const activeAlerts = getActiveAlerts();
  const criticalAlerts = getCriticalAlertsCount();
  const escalatedAlerts = activeAlerts.filter((a) => a.severity === 'critical' && a.status === 'active');

  const overallHealth = getOverallHealthScore();
  const criticalEquipment = getCriticalEquipmentCount();
  const warningEquipment = getWarningEquipmentCount();
  const equipmentNeedingAttention = getEquipmentNeedingAttention();

  const totalEnergy = getTotalEnergyConsumed();
  const energyCost = getTotalEnergyCost();
  const avgSpecificEnergy = getAverageSpecificEnergy();

  const openTickets = getOpenTicketsCount();
  const criticalTickets = getCriticalTicketsCount();
  const slaCompliance = getSLAComplianceRate();
  const availableTechnicians = technicians.filter((t) => t.status === 'available').length;

  // Calculate total water processed
  const totalWaterProcessed = mockEnergyKPIs.reduce((acc, kpi) => acc + kpi.totalWaterProcessed, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Manager Header - Compact */}
      <header className="bg-slate-800 h-10 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Manager Control Center</span>
          {criticalAlerts > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600 rounded">
              <AlertTriangle className="h-3 w-3 text-white animate-pulse" />
              <span className="text-[10px] font-bold text-white">{criticalAlerts} CRITICAL</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPlant}
            onChange={(e) => setSelectedPlant(e.target.value)}
            className="h-6 px-2 bg-slate-700 border border-slate-600 text-white text-[10px] font-medium rounded"
          >
            <option value="all">All Plants</option>
            {mockPlants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-slate-400 font-mono">LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* KPI Cards Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {/* Plants Online */}
          <div className="bg-white border-2 border-slate-300 p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plants Online</span>
              <Building2 className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{onlinePlants}</span>
              <span className="text-xs text-slate-500">/ {mockPlants.length}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {warningPlants > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 font-bold">{warningPlants} WARN</span>
              )}
              {offlinePlants > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 font-bold">{offlinePlants} OFF</span>
              )}
            </div>
          </div>

          {/* Active Sensors */}
          <div className="bg-white border-2 border-slate-300 p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sensors</span>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{totalSensors}</span>
              <span className="text-xs text-emerald-600">Active</span>
            </div>
          </div>

          {/* Active Alarms */}
          <div className={cn(
            "bg-white border-2 border-slate-300 p-3 border-l-[3px]",
            criticalAlerts > 0 ? "border-l-red-500" : "border-l-emerald-500"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Alarms</span>
              <Bell className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold", criticalAlerts > 0 ? "text-red-600" : "text-slate-800")}>
                {activeAlerts.length}
              </span>
              {criticalAlerts > 0 && (
                <span className="text-xs text-red-600 font-medium">{criticalAlerts} Critical</span>
              )}
            </div>
          </div>

          {/* Equipment Health */}
          <div className={cn(
            "bg-white border-2 border-slate-300 p-3 border-l-[3px]",
            overallHealth >= 80 ? "border-l-emerald-500" : overallHealth >= 60 ? "border-l-amber-500" : "border-l-red-500"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Equipment Health</span>
              <Wrench className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{overallHealth}%</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {criticalEquipment > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 font-bold">{criticalEquipment} CRIT</span>
              )}
              {warningEquipment > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 font-bold">{warningEquipment} WARN</span>
              )}
            </div>
          </div>

          {/* Service Tickets */}
          <div className="bg-white border-2 border-slate-300 p-3 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Open Tickets</span>
              <Timer className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{openTickets}</span>
            </div>
            {criticalTickets > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 font-bold">{criticalTickets} CRITICAL</span>
            )}
          </div>

          {/* SLA Compliance */}
          <div className={cn(
            "bg-white border-2 border-slate-300 p-3 border-l-[3px]",
            slaCompliance >= 95 ? "border-l-emerald-500" : slaCompliance >= 85 ? "border-l-amber-500" : "border-l-red-500"
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
              <Shield className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-2xl font-bold",
                slaCompliance >= 95 ? "text-emerald-600" : slaCompliance >= 85 ? "text-amber-600" : "text-red-600"
              )}>
                {slaCompliance}%
              </span>
            </div>
          </div>

          {/* Energy Consumption */}
          <div className="bg-white border-2 border-slate-300 p-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Energy (MTD)</span>
              <Zap className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{(totalEnergy / 1000).toFixed(0)}</span>
              <span className="text-xs text-slate-500">MWh</span>
            </div>
            <span className="text-[9px] text-slate-500">{avgSpecificEnergy} kWh/m³</span>
          </div>

          {/* Water Processed */}
          <div className="bg-white border-2 border-slate-300 p-3 border-l-[3px] border-l-cyan-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Water (MTD)</span>
              <Droplets className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{(totalWaterProcessed / 1000).toFixed(0)}</span>
              <span className="text-xs text-slate-500">K m³</span>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Plant Performance Overview */}
          <div className="lg:col-span-2 bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Plant Performance</span>
              </div>
              <span className="text-[10px] text-slate-500">Last 24 Hours</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Sensors</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Flow (m³/h)</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Energy (kWh)</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Alarms</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPlants.map((plant) => {
                    const plantEnergy = mockEnergyKPIs.find((k) => k.plantId === plant.id);
                    const plantAlerts = activeAlerts.filter((a) => a.plantId === plant.id);
                    const efficiency = plantEnergy ? Math.abs(plantEnergy.comparisonWithBenchmark) : 0;
                    const isBetter = plantEnergy ? plantEnergy.comparisonWithBenchmark < 0 : false;

                    return (
                      <tr key={plant.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">{plant.name}</span>
                            <span className="text-[9px] text-slate-400">{plant.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            plant.status === 'online' ? "bg-emerald-100 text-emerald-700" :
                            plant.status === 'warning' ? "bg-amber-100 text-amber-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {plant.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">{plant.sensorCount}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">
                          {plantEnergy ? Math.round(plantEnergy.totalWaterProcessed / 24) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">
                          {plantEnergy ? plantEnergy.totalEnergy.toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {plantAlerts.length > 0 ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold">{plantAlerts.length}</span>
                          ) : (
                            <span className="text-xs text-emerald-600">Clear</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isBetter ? (
                              <TrendingUp className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            )}
                            <span className={cn("text-xs font-medium", isBetter ? "text-emerald-600" : "text-red-500")}>
                              {efficiency.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Escalated Alarms Panel */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-red-50 px-4 py-2 border-b-2 border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Escalated Alarms</span>
              </div>
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold">{escalatedAlerts.length}</span>
            </div>
            <div className="divide-y divide-slate-200 max-h-[300px] overflow-y-auto">
              {escalatedAlerts.length > 0 ? (
                escalatedAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 hover:bg-red-50 cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-800">{alert.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{alert.plantName} • {alert.sensorName}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-[9px] text-slate-500">
                        Active for {Math.round((Date.now() - new Date(alert.createdAt).getTime()) / 60000)} min
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">No escalated alarms</p>
                  <p className="text-xs text-slate-400">All systems operating normally</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bottom Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Equipment Needing Attention */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-slate-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Maintenance Required</span>
              </div>
              <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold">{equipmentNeedingAttention.length}</span>
            </div>
            <div className="divide-y divide-slate-200 max-h-[250px] overflow-y-auto">
              {equipmentNeedingAttention.slice(0, 5).map((eq) => (
                <div key={eq.id} className="p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-800">{eq.name}</p>
                      <p className="text-[10px] text-slate-500">{eq.plantName}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-bold uppercase",
                        eq.status === 'critical' ? "bg-red-100 text-red-700" :
                        eq.status === 'warning' ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {eq.daysRemaining}d
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all",
                            eq.healthScore >= 70 ? "bg-emerald-500" :
                            eq.healthScore >= 50 ? "bg-amber-500" : "bg-red-500"
                          )}
                          style={{ width: `${eq.healthScore}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{eq.healthScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Status */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="h-4 w-4 text-slate-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Field Technicians</span>
              </div>
              <span className="text-[10px] text-slate-500">{availableTechnicians} Available</span>
            </div>
            <div className="divide-y divide-slate-200">
              {technicians.map((tech) => (
                <div key={tech.id} className="p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                        tech.status === 'available' ? "bg-emerald-500" :
                        tech.status === 'on_job' ? "bg-blue-500" : "bg-slate-400"
                      )}>
                        {tech.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-800">{tech.name}</p>
                        <p className="text-[10px] text-slate-500">{tech.specialization[0]}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        tech.status === 'available' ? "bg-emerald-100 text-emerald-700" :
                        tech.status === 'on_job' ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {tech.status.replace('_', ' ')}
                      </span>
                      <p className="text-[9px] text-slate-400 mt-1">{tech.completedTickets} tickets • {tech.avgRating}★</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Tickets Summary */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-slate-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Service Overview</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Ticket Status Distribution */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 border border-slate-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Open</p>
                  <p className="text-xl font-bold text-slate-800">{serviceTickets.filter((t) => t.status === 'open').length}</p>
                </div>
                <div className="bg-blue-50 p-3 border border-blue-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">In Progress</p>
                  <p className="text-xl font-bold text-blue-700">{serviceTickets.filter((t) => t.status === 'in_progress').length}</p>
                </div>
                <div className="bg-amber-50 p-3 border border-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">On Hold</p>
                  <p className="text-xl font-bold text-amber-700">{serviceTickets.filter((t) => t.status === 'on_hold').length}</p>
                </div>
                <div className="bg-emerald-50 p-3 border border-emerald-200">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Resolved</p>
                  <p className="text-xl font-bold text-emerald-700">{serviceTickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length}</p>
                </div>
              </div>

              {/* SLA Status */}
              <div className="bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA Performance</p>
                  <span className={cn(
                    "text-sm font-bold",
                    slaCompliance >= 95 ? "text-emerald-600" : slaCompliance >= 85 ? "text-amber-600" : "text-red-600"
                  )}>
                    {slaCompliance}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      slaCompliance >= 95 ? "bg-emerald-500" : slaCompliance >= 85 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${slaCompliance}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[9px] text-slate-500">
                  <span>Target: 95%</span>
                  <span>{serviceTickets.filter((t) => t.slaBreached).length} SLA Breaches</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400">Last refresh: Just now</span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-[10px] text-slate-400">Auto-refresh: 30s</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400">Manager View</span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-[10px] text-slate-400">AquaFlow v2.0</span>
        </div>
      </footer>
    </div>
  );
}
