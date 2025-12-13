'use client';

import {
  Building2,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Zap,
  Droplets,
  Leaf,
  FileText,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  BarChart3,
  Target,
  Award,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPlants } from '@/data/mock-plants';
import { getCriticalAlertsCount, getActiveAlertsCount } from '@/data/mock-alerts';
import {
  mockCostMetrics,
  getOverallHealthScore,
  getOverallProcessEfficiency,
  getTotalPotentialSavings,
  getCriticalEquipmentCount,
} from '@/data/mock-operations';
import {
  mockEnergyKPIs,
  getTotalEnergyConsumed,
  getTotalEnergyCost,
  getAverageSpecificEnergy,
  getTotalCarbonEmissions,
  mockSustainabilityMetrics,
} from '@/data/mock-energy';
import {
  mockContracts,
  getTotalContractValue,
  getActiveContractsCount,
  getExpiringContracts,
} from '@/data/mock-contracts';
import {
  mockCustomers,
  getTotalRevenue,
  getTotalOutstanding,
  getActiveCustomersCount,
  getAverageHealthScore,
} from '@/data/mock-customers';
import { getSLAComplianceRate } from '@/data/mock-services';

export function ExecutiveDashboard() {
  // Financial Metrics
  const totalContractValue = getTotalContractValue();
  const totalRevenue = getTotalRevenue();
  const totalOutstanding = getTotalOutstanding();
  const activeContracts = getActiveContractsCount();
  const expiringContracts = getExpiringContracts(30);

  // Customer Metrics
  const activeCustomers = getActiveCustomersCount();
  const avgCustomerHealth = getAverageHealthScore();

  // Operational Metrics
  const onlinePlants = mockPlants.filter((p) => p.status === 'online').length;
  const totalPlants = mockPlants.length;
  const overallHealth = getOverallHealthScore();
  const processEfficiency = getOverallProcessEfficiency();
  const criticalEquipment = getCriticalEquipmentCount();
  const criticalAlerts = getCriticalAlertsCount();
  const activeAlerts = getActiveAlertsCount();
  const slaCompliance = getSLAComplianceRate();

  // Energy & Sustainability
  const totalEnergy = getTotalEnergyConsumed();
  const energyCost = getTotalEnergyCost();
  const avgSpecificEnergy = getAverageSpecificEnergy();
  const carbonEmissions = getTotalCarbonEmissions();
  const totalWaterProcessed = mockEnergyKPIs.reduce((acc, kpi) => acc + kpi.totalWaterProcessed, 0);

  // Cost Savings
  const potentialSavings = getTotalPotentialSavings();
  const realizedSavings = mockCostMetrics.totalSavings;

  // Calculate uptime (mock - based on plant status)
  const uptimePercentage = ((onlinePlants / totalPlants) * 100).toFixed(1);

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Executive Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <PieChart className="h-5 w-5 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Executive Dashboard</span>
          <span className="text-[10px] text-slate-400">Business Performance Overview</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-300">MTD: Dec 1-12, 2024</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-400 font-mono">LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-4">
        {/* Top KPI Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Contract Revenue */}
          <div className="bg-white border-2 border-slate-300 p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Contract Value (Active)</span>
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{formatCurrency(totalContractValue)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500">{activeContracts} Active Contracts</span>
            </div>
          </div>

          {/* Lifetime Revenue */}
          <div className="bg-white border-2 border-slate-300 p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Revenue (LTD)</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">+12.5% YoY</span>
            </div>
          </div>

          {/* Outstanding */}
          <div className="bg-white border-2 border-slate-300 p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outstanding</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500">DSO: 42 days</span>
            </div>
          </div>

          {/* Operational Uptime */}
          <div className={cn(
            "bg-white border-2 border-slate-300 p-4 border-l-4",
            parseFloat(uptimePercentage) >= 95 ? "border-l-emerald-500" : "border-l-amber-500"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant Uptime</span>
              <Shield className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{uptimePercentage}%</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500">{onlinePlants}/{totalPlants} Plants Online</span>
            </div>
          </div>

          {/* Process Efficiency */}
          <div className={cn(
            "bg-white border-2 border-slate-300 p-4 border-l-4",
            processEfficiency >= 90 ? "border-l-emerald-500" : processEfficiency >= 80 ? "border-l-blue-500" : "border-l-amber-500"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Process Efficiency</span>
              <Target className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-800">{processEfficiency}%</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {processEfficiency >= 90 ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-amber-500" />
              )}
              <span className={cn("text-[10px] font-medium", processEfficiency >= 90 ? "text-emerald-600" : "text-amber-600")}>
                Target: 95%
              </span>
            </div>
          </div>

          {/* SLA Compliance */}
          <div className={cn(
            "bg-white border-2 border-slate-300 p-4 border-l-4",
            slaCompliance >= 95 ? "border-l-emerald-500" : slaCompliance >= 85 ? "border-l-amber-500" : "border-l-red-500"
          )}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SLA Compliance</span>
              <Award className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                "text-2xl font-bold",
                slaCompliance >= 95 ? "text-emerald-600" : slaCompliance >= 85 ? "text-amber-600" : "text-red-600"
              )}>
                {slaCompliance}%
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-slate-500">Target: 95%</span>
            </div>
          </div>
        </section>

        {/* Middle Section - 3 Column Layout */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Financial Overview */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-2 border-b-2 border-emerald-200">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-700" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Financial Summary</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Revenue Breakdown */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Revenue by Customer</p>
                <div className="space-y-2">
                  {mockCustomers
                    .filter((c) => c.totalRevenue > 0)
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 4)
                    .map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between">
                        <span className="text-xs text-slate-700">{customer.companyName}</span>
                        <span className="text-xs font-bold text-slate-800">{formatCurrency(customer.totalRevenue)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="border-t border-slate-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Monthly Operating Cost</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Energy</span>
                    <span className="text-xs font-mono text-slate-700">{formatCurrency(mockCostMetrics.energyCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Chemicals</span>
                    <span className="text-xs font-mono text-slate-700">{formatCurrency(mockCostMetrics.chemicalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Maintenance</span>
                    <span className="text-xs font-mono text-slate-700">{formatCurrency(mockCostMetrics.maintenanceCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Labor</span>
                    <span className="text-xs font-mono text-slate-700">{formatCurrency(mockCostMetrics.laborCost)}</span>
                  </div>
                </div>
              </div>

              {/* Savings */}
              <div className="bg-emerald-50 border border-emerald-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Monthly Savings</span>
                  <span className="text-lg font-bold text-emerald-700">{formatCurrency(realizedSavings)}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <span className="text-[10px] text-emerald-600">+{mockCostMetrics.percentChange}% vs last month</span>
                </div>
              </div>
            </div>
          </div>

          {/* Energy & Sustainability */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-2 border-b-2 border-blue-200">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-blue-700" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">Energy & Sustainability</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Energy KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span className="text-[9px] font-bold uppercase text-slate-500">Energy MTD</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{(totalEnergy / 1000).toFixed(1)} MWh</p>
                  <p className="text-[9px] text-slate-500">{formatCurrency(energyCost)}</p>
                </div>
                <div className="bg-slate-50 p-3 border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Droplets className="h-3 w-3 text-cyan-500" />
                    <span className="text-[9px] font-bold uppercase text-slate-500">Water MTD</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{(totalWaterProcessed / 1000).toFixed(1)}K m³</p>
                  <p className="text-[9px] text-slate-500">{avgSpecificEnergy} kWh/m³</p>
                </div>
              </div>

              {/* Efficiency Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Energy Efficiency vs Benchmark</span>
                  <span className="text-xs font-bold text-emerald-600">-5.2%</span>
                </div>
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400" />
                  <div className="h-full bg-emerald-500 w-[45%]" />
                </div>
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500">
                  <span>Better</span>
                  <span>Benchmark</span>
                  <span>Worse</span>
                </div>
              </div>

              {/* Carbon Footprint */}
              <div className="bg-green-50 border border-green-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-green-600" />
                    <span className="text-[10px] font-bold uppercase text-green-700">Carbon Footprint</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-lg font-bold text-green-800">{(carbonEmissions / 1000).toFixed(1)} tons</p>
                    <p className="text-[9px] text-green-600">CO₂ Emissions MTD</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-800">{mockSustainabilityMetrics.treesEquivalent}</p>
                    <p className="text-[9px] text-green-600">Trees Equivalent</p>
                  </div>
                </div>
              </div>

              {/* Sustainability Metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-slate-50 border border-slate-200">
                  <p className="text-sm font-bold text-slate-800">{mockSustainabilityMetrics.renewablePercentage}%</p>
                  <p className="text-[8px] text-slate-500 uppercase">Renewable</p>
                </div>
                <div className="text-center p-2 bg-slate-50 border border-slate-200">
                  <p className="text-sm font-bold text-slate-800">{mockSustainabilityMetrics.waterRecycled / 1000}K</p>
                  <p className="text-[8px] text-slate-500 uppercase">m³ Recycled</p>
                </div>
                <div className="text-center p-2 bg-slate-50 border border-slate-200">
                  <p className="text-sm font-bold text-slate-800">{mockSustainabilityMetrics.wasteReduction}%</p>
                  <p className="text-[8px] text-slate-500 uppercase">Waste Reduced</p>
                </div>
              </div>
            </div>
          </div>

          {/* Risk & Compliance */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 border-b-2 border-purple-200">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-700" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">Risk & Compliance</span>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Risk Indicators */}
              <div className="space-y-3">
                {/* Critical Alerts */}
                <div className={cn(
                  "p-3 border-l-4",
                  criticalAlerts > 0 ? "bg-red-50 border-red-500" : "bg-emerald-50 border-emerald-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={cn("h-4 w-4", criticalAlerts > 0 ? "text-red-600" : "text-emerald-600")} />
                      <span className="text-xs font-medium text-slate-700">Critical Alarms</span>
                    </div>
                    <span className={cn(
                      "text-lg font-bold",
                      criticalAlerts > 0 ? "text-red-600" : "text-emerald-600"
                    )}>
                      {criticalAlerts}
                    </span>
                  </div>
                </div>

                {/* Equipment at Risk */}
                <div className={cn(
                  "p-3 border-l-4",
                  criticalEquipment > 0 ? "bg-amber-50 border-amber-500" : "bg-emerald-50 border-emerald-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className={cn("h-4 w-4", criticalEquipment > 0 ? "text-amber-600" : "text-emerald-600")} />
                      <span className="text-xs font-medium text-slate-700">Equipment Critical</span>
                    </div>
                    <span className={cn(
                      "text-lg font-bold",
                      criticalEquipment > 0 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {criticalEquipment}
                    </span>
                  </div>
                </div>

                {/* Contract Renewals */}
                <div className={cn(
                  "p-3 border-l-4",
                  expiringContracts.length > 0 ? "bg-amber-50 border-amber-500" : "bg-emerald-50 border-emerald-500"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className={cn("h-4 w-4", expiringContracts.length > 0 ? "text-amber-600" : "text-emerald-600")} />
                      <span className="text-xs font-medium text-slate-700">Contracts Expiring (30d)</span>
                    </div>
                    <span className={cn(
                      "text-lg font-bold",
                      expiringContracts.length > 0 ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {expiringContracts.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance Score */}
              <div className="bg-slate-50 p-4 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Overall Compliance Score</p>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="35"
                        fill="none"
                        stroke={slaCompliance >= 90 ? "#10b981" : slaCompliance >= 80 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(slaCompliance / 100) * 220} 220`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-800">{slaCompliance}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">SLA Adherence</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Regulatory</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Safety</span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Health */}
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Health</span>
                  <span className={cn(
                    "text-sm font-bold",
                    avgCustomerHealth >= 80 ? "text-emerald-600" : avgCustomerHealth >= 60 ? "text-amber-600" : "text-red-600"
                  )}>
                    {avgCustomerHealth}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full",
                      avgCustomerHealth >= 80 ? "bg-emerald-500" : avgCustomerHealth >= 60 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${avgCustomerHealth}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-500 mt-1">{activeCustomers} Active Customers</p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section - Contract & Customer Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Active Contracts */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Active Contracts</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold">{activeContracts}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Value</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Renewal</th>
                  </tr>
                </thead>
                <tbody>
                  {mockContracts
                    .filter((c) => c.status === 'active')
                    .slice(0, 5)
                    .map((contract) => (
                      <tr key={contract.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-700">{contract.customerName}</p>
                          <p className="text-[10px] text-slate-500">{contract.contractNumber}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">
                            {contract.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">
                          {formatCurrency(contract.value)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {contract.autoRenew ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold">AUTO</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold">MANUAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white border-2 border-slate-300 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b-2 border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Top Customers</span>
              </div>
              <span className="text-[10px] text-slate-500">By Revenue</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Segment</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Revenue</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCustomers
                    .filter((c) => c.totalRevenue > 0)
                    .sort((a, b) => b.totalRevenue - a.totalRevenue)
                    .slice(0, 5)
                    .map((customer) => (
                      <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-700">{customer.companyName}</p>
                          <p className="text-[10px] text-slate-500">{customer.industry}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "px-2 py-0.5 text-[9px] font-bold uppercase",
                            customer.segment === 'enterprise' ? "bg-purple-100 text-purple-700" :
                            customer.segment === 'government' ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {customer.segment}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-slate-700">
                          {formatCurrency(customer.totalRevenue)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              customer.healthScore >= 80 ? "bg-emerald-500" :
                              customer.healthScore >= 60 ? "bg-amber-500" : "bg-red-500"
                            )} />
                            <span className="text-xs font-medium text-slate-700">{customer.healthScore}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400">Last refresh: Just now</span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-[10px] text-slate-400">Auto-refresh: 5 min</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-slate-400">Executive View</span>
          <span className="text-[10px] text-slate-400">•</span>
          <span className="text-[10px] text-slate-400">AquaFlow v2.0</span>
        </div>
      </footer>
    </div>
  );
}
