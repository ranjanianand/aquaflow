'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Sparkles,
  AlertTriangle,
  Clock,
  TrendingUp,
  DollarSign,
  Trash2,
  Plus,
  Minus,
  Send,
  Package,
  Truck,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  PieChart as PieChartIcon,
  X,
  Activity,
  Calendar,
} from 'lucide-react';
import {
  cartItems,
  smartRecommendations,
  procurementHistory,
  getCartTotal,
  getCartItemCount,
  getCriticalItemsCount,
  getUrgentItemsCount,
  getPotentialSavings,
  getCartBySupplier,
  getMonthlyProcurement,
  getSupplierSpend,
  type SmartRecommendation,
} from '@/data/mock-smart-cart';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

type TabType = 'overview' | 'cart' | 'recommendations' | 'history';

export default function SmartCartPage() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<SmartRecommendation | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-rose-600 text-white';
      case 'urgent': return 'bg-amber-500 text-white';
      case 'normal': return 'bg-blue-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const supplierGroups = getCartBySupplier();
  const monthlyData = getMonthlyProcurement();
  const supplierSpend = getSupplierSpend();
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Category breakdown data for charts
  const categoryData = [
    { name: 'Chemicals', value: 45, amount: 125000 },
    { name: 'Filters', value: 25, amount: 68000 },
    { name: 'Spare Parts', value: 20, amount: 54000 },
    { name: 'Consumables', value: 10, amount: 28000 },
  ];

  // Urgency breakdown for bar chart
  const urgencyData = [
    { name: 'Critical', count: getCriticalItemsCount(), fill: '#ef4444' },
    { name: 'Urgent', count: getUrgentItemsCount(), fill: '#f59e0b' },
    { name: 'Normal', count: cartItems.length - getCriticalItemsCount() - getUrgentItemsCount(), fill: '#3b82f6' },
  ];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'cart', label: 'Shopping Cart', icon: <ShoppingCart className="h-3.5 w-3.5" /> },
    { id: 'recommendations', label: 'AI Recommendations', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: 'history', label: 'Order History', icon: <Calendar className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center">
        <div className="flex items-center gap-4">
          <ShoppingCart className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Smart Cart</span>
          <span className="text-[10px] text-slate-400">Intelligent procurement & ordering</span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI Stats Cards - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cart Items</span>
              <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-600">{cartItems.length}</span>
              <span className="text-[10px] text-slate-500">{getCartItemCount()} units</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cart Value</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-emerald-600">
                {getCartTotal().toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-rose-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Critical Items</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-rose-600">{getCriticalItemsCount()}</span>
              <span className="text-[10px] text-slate-500">order now</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-amber-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Urgent Items</span>
              <Clock className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-600">{getUrgentItemsCount()}</span>
              <span className="text-[10px] text-slate-500">this week</span>
            </div>
          </div>

          <div className="border-2 border-purple-400 bg-purple-50 p-3 border-l-[3px] border-l-purple-600">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Potential Savings</span>
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-purple-700">
                {getPotentialSavings().toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* Full-width Tabs Container */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-slate-100 px-2 py-1.5 border-b-2 border-slate-300 flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab Content - Charts */}
          {activeTab === 'overview' && (
            <div className="p-4 space-y-4">
              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Procurement Trend */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Monthly Procurement Trend</span>
                  </div>
                  <div className="p-4">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="month" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                          <Tooltip
                            contentStyle={{
                              border: '2px solid #cbd5e1',
                              borderRadius: 0,
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                            formatter={(value: number) =>
                              value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                            }
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            fill="#3b82f633"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Supplier Distribution */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Supplier Distribution</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-6">
                      <div className="h-[180px] w-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={supplierSpend}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {supplierSpend.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-2">
                        {supplierSpend.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-bold font-mono text-slate-800">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Category Breakdown</span>
                  </div>
                  <div className="p-4">
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                          <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} width={80} />
                          <Tooltip
                            contentStyle={{
                              border: '2px solid #cbd5e1',
                              borderRadius: 0,
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                            formatter={(value: number, name: string) => {
                              if (name === 'value') return [`${value}%`, 'Share'];
                              return [value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }), 'Amount'];
                            }}
                          />
                          <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Urgency Breakdown & Quick Actions */}
                <div className="border-2 border-slate-200 bg-white overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Urgency Breakdown</span>
                  </div>
                  <div className="p-4">
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={urgencyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              border: '2px solid #cbd5e1',
                              borderRadius: 0,
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                          />
                          <Bar dataKey="count" fill="#3b82f6">
                            {urgencyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Quick Actions */}
                    <div className="mt-4 pt-4 border-t-2 border-slate-200">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Quick Actions</span>
                      <div className="flex gap-2">
                        <button className="flex-1 p-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300">
                          <Package className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-[10px] font-medium text-slate-700">Reorder Low Stock</span>
                        </button>
                        <button className="flex-1 p-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300">
                          <Truck className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-[10px] font-medium text-slate-700">Track Orders</span>
                        </button>
                        <button className="flex-1 p-2 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-300">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-[10px] font-medium text-slate-700">Spend Analytics</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cart Tab Content */}
          {activeTab === 'cart' && (
            <div className="divide-y divide-slate-200">
              {Object.entries(supplierGroups).map(([supplierId, group]) => (
                <div key={supplierId}>
                  {/* Supplier Header */}
                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      {group.items[0].supplierName}
                    </span>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500">Subtotal: </span>
                      <span className="font-bold font-mono text-slate-800">
                        {group.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Item</th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Plant</th>
                        <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Qty</th>
                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit Price</th>
                        <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Urgency</th>
                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            <p className="text-[10px] font-mono text-slate-500">{item.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">{item.plantName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button className="p-1 border border-slate-300 hover:bg-slate-100 transition-colors">
                                <Minus className="h-3 w-3 text-slate-600" />
                              </button>
                              <span className="w-8 text-center font-mono text-sm">{item.quantity}</span>
                              <button className="p-1 border border-slate-300 hover:bg-slate-100 transition-colors">
                                <Plus className="h-3 w-3 text-slate-600" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-sm text-slate-700">
                            {item.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getUrgencyStyles(item.urgency)}`}>
                              {item.urgency}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                            {(item.quantity * item.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                          <td className="px-2 py-3">
                            <button className="p-1 text-rose-500 hover:bg-rose-50 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {/* Cart Total Footer */}
              <div className="p-4 bg-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Cart Value</span>
                  <p className="text-2xl font-bold font-mono text-slate-800">
                    {getCartTotal().toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </p>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )}

          {/* Recommendations Tab Content */}
          {activeTab === 'recommendations' && (
            <div className="divide-y divide-slate-200">
              {/* AI Banner */}
              <div className="p-4 bg-purple-50 border-b-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center bg-purple-100 border border-purple-200">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-900">AI-Powered Recommendations</p>
                    <p className="text-xs text-purple-700">
                      Based on usage patterns, predictive maintenance, and bulk order opportunities
                    </p>
                  </div>
                </div>
              </div>

              {smartRecommendations.map((rec) => (
                <div key={rec.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800">{rec.name}</p>
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${getPriorityStyles(rec.priority)}`}>
                          {rec.priority}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500">{rec.sku}</p>
                      <p className="text-xs text-slate-600 mt-2">{rec.reason}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                        <span>Current: <strong className="font-mono">{rec.currentStock}</strong></span>
                        <span>Reorder: <strong className="font-mono">{rec.reorderPoint}</strong></span>
                        <span>Suggested: <strong className="font-mono text-blue-600">{rec.suggestedQty}</strong></span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-lg font-bold font-mono text-slate-800">
                        {(rec.suggestedQty * rec.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </p>
                      {rec.savings && (
                        <p className="text-xs font-bold text-emerald-600">
                          Save {rec.savings.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSelectedRecommendation(rec)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      Add to Cart
                    </button>
                    {rec.alternativeSuppliers.length > 0 && (
                      <button
                        onClick={() => setSelectedRecommendation(rec)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors"
                      >
                        Compare Suppliers
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Tab Content */}
          {activeTab === 'history' && (
            <div>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-200">
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">PO Number</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Items</th>
                    <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount</th>
                    <th className="text-center px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {procurementHistory.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-sm text-slate-800">{order.poNumber}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{format(new Date(order.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{order.supplier}</td>
                      <td className="px-4 py-3 text-center font-mono text-sm">{order.items}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                        {order.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          order.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {order.deliveredOn ? format(new Date(order.deliveredOn), 'MMM d') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recommendation Detail Modal - Industrial Style */}
      <Dialog open={!!selectedRecommendation} onOpenChange={() => setSelectedRecommendation(null)}>
        <DialogContent className="max-w-2xl p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Add Recommendation to Cart</DialogTitle>
          {selectedRecommendation && (
            <>
              {/* Modal Header */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                    <ShoppingCart className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Add to Cart</span>
                    <p className="text-[10px] text-slate-500">{selectedRecommendation.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecommendation(null)}
                  className="p-1 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* AI Recommendation Box */}
                <div className="border-2 border-purple-200 bg-purple-50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block mb-2">AI Recommendation</span>
                  <p className="text-sm text-purple-900">{selectedRecommendation.reason}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border-2 border-slate-200 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Current Stock</span>
                    <span className="text-2xl font-bold font-mono text-slate-800">{selectedRecommendation.currentStock}</span>
                  </div>
                  <div className="border-2 border-blue-200 bg-blue-50 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">Suggested Qty</span>
                    <span className="text-2xl font-bold font-mono text-blue-700">{selectedRecommendation.suggestedQty}</span>
                  </div>
                  <div className="border-2 border-slate-200 p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Total Cost</span>
                    <span className="text-xl font-bold font-mono text-slate-800">
                      {(selectedRecommendation.suggestedQty * selectedRecommendation.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Alternative Suppliers Table */}
                {selectedRecommendation.alternativeSuppliers.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Alternative Suppliers</span>
                    <table className="w-full border-2 border-slate-200">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier</th>
                          <th className="text-right px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit Cost</th>
                          <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Lead Time</th>
                          <th className="text-center px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Rating</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-blue-50">
                          <td className="px-3 py-2 text-sm font-semibold text-slate-800">{selectedRecommendation.supplierName}</td>
                          <td className="px-3 py-2 text-right font-mono text-sm">
                            {selectedRecommendation.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </td>
                          <td className="px-3 py-2 text-center text-sm">7 days</td>
                          <td className="px-3 py-2 text-center font-mono">4.5</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-blue-600 text-white">Preferred</span>
                          </td>
                        </tr>
                        {selectedRecommendation.alternativeSuppliers.map((alt) => (
                          <tr key={alt.supplierId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-sm text-slate-700">{alt.supplierName}</td>
                            <td className="px-3 py-2 text-right font-mono text-sm">
                              {alt.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </td>
                            <td className="px-3 py-2 text-center text-sm">{alt.leadTime} days</td>
                            <td className="px-3 py-2 text-center font-mono">{alt.rating}</td>
                            <td className="px-3 py-2">
                              <button className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-800">Select</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Savings Banner */}
                {selectedRecommendation.savings && (
                  <div className="border-2 border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-800">
                      You can save {selectedRecommendation.savings.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} with this order!
                    </p>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t-2 border-slate-200">
                  <button
                    onClick={() => setSelectedRecommendation(null)}
                    className="px-4 py-2 border-2 border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setSelectedRecommendation(null)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Modal - Industrial Style */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">Checkout Cart</DialogTitle>
          {/* Modal Header */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-b-2 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center bg-slate-100 border border-slate-300">
                <Send className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">Checkout</span>
            </div>
            <button
              onClick={() => setShowCheckout(false)}
              className="p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Summary Box */}
            <div className="border-2 border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Items in Cart</span>
                <span className="font-mono font-bold text-slate-800">{cartItems.length} items ({getCartItemCount()} units)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Suppliers</span>
                <span className="font-mono font-bold text-slate-800">{Object.keys(supplierGroups).length}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-slate-300">
                <span className="font-bold text-slate-700">Total Amount</span>
                <span className="font-bold font-mono text-slate-800">
                  {getCartTotal().toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </span>
              </div>
            </div>

            {/* What will be created */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">This will create:</span>
              <ul className="text-xs space-y-1 text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400"></span>
                  {Object.keys(supplierGroups).length} Purchase Order(s)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400"></span>
                  Separate POs for each supplier
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-slate-400"></span>
                  Pending approval workflow
                </li>
              </ul>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t-2 border-slate-200">
              <button
                onClick={() => setShowCheckout(false)}
                className="px-4 py-2 border-2 border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
              >
                <Send className="h-3 w-3" />
                Create Purchase Orders
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
