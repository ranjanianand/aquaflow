'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  ChevronDown,
  MoreVertical,
  X,
  Boxes,
  Check,
  XCircle,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  inventoryItems,
  stockMovements,
  purchaseOrders,
  getLowStockItems,
  getOutOfStockCount,
  getLowStockCount,
  getTotalInventoryValue,
  getPendingOrdersCount,
  getPendingOrdersValue,
  getCategoryLabel,
  getStatusLabel,
  getItemsByCategory,
  type InventoryItem,
  type PurchaseOrder,
} from '@/data/mock-inventory';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';

type TabValue = 'overview' | 'inventory' | 'alerts' | 'movements' | 'orders';

// Industrial Action Menu Component
function ActionMenu({
  onView,
  onStockIn,
  onStockOut,
  onReorder,
  showStockActions = false
}: {
  onView: () => void;
  onStockIn?: () => void;
  onStockOut?: () => void;
  onReorder?: () => void;
  showStockActions?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical className="h-4 w-4 text-slate-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-white border-2 border-slate-300 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
              setOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-[11px] font-medium uppercase hover:bg-slate-100 transition-colors"
          >
            View Details
          </button>
          {showStockActions && onStockIn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStockIn();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-[11px] font-medium uppercase hover:bg-slate-100 transition-colors text-emerald-600"
            >
              Stock In
            </button>
          )}
          {showStockActions && onStockOut && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStockOut();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-[11px] font-medium uppercase hover:bg-slate-100 transition-colors text-red-600"
            >
              Stock Out
            </button>
          )}
          {showStockActions && onReorder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReorder();
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-[11px] font-medium uppercase hover:bg-slate-100 transition-colors text-blue-600"
            >
              Reorder
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function InventoryMonitorPage() {
  const [selectedTab, setSelectedTab] = useState<TabValue>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Modal states
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [createPOModalOpen, setCreatePOModalOpen] = useState(false);
  const [stockActionItem, setStockActionItem] = useState<InventoryItem | null>(null);

  // Form states
  const [addItemForm, setAddItemForm] = useState({
    name: '',
    sku: '',
    category: 'spare_parts',
    description: '',
    unit: 'pcs',
    minStockLevel: 5,
    maxStockLevel: 100,
    reorderPoint: 10,
    reorderQty: 20,
    unitCost: 0,
    supplier: '',
    location: '',
  });

  const [stockInForm, setStockInForm] = useState({
    quantity: 1,
    reason: 'purchase',
    reference: '',
    notes: '',
  });

  const [stockOutForm, setStockOutForm] = useState({
    quantity: 1,
    reason: 'maintenance',
    reference: '',
    notes: '',
  });

  const [reorderForm, setReorderForm] = useState({
    quantity: 0,
    supplier: '',
    notes: '',
  });

  const [createPOForm, setCreatePOForm] = useState({
    supplier: '',
    items: [] as { itemId: string; itemName: string; quantity: number; unitCost: number }[],
    notes: '',
  });

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-emerald-600 text-white';
      case 'low_stock': return 'bg-amber-500 text-white';
      case 'out_of_stock': return 'bg-red-600 text-white';
      case 'on_order': return 'bg-blue-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getPOStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-slate-500 text-white';
      case 'pending_approval': return 'bg-amber-500 text-white';
      case 'approved': return 'bg-blue-600 text-white';
      case 'ordered': return 'bg-purple-600 text-white';
      case 'partial': return 'bg-orange-500 text-white';
      case 'received': return 'bg-emerald-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStockStatusBorder = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'border-l-[3px] border-l-red-500';
      case 'low_stock': return 'border-l-[3px] border-l-amber-500';
      default: return '';
    }
  };

  const categoryData = Object.entries(getItemsByCategory())
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      name: getCategoryLabel(category as any),
      value: count,
    }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

  const stockLevelData = inventoryItems.map(item => ({
    name: item.sku,
    current: item.currentStock,
    min: item.minStockLevel,
    max: item.maxStockLevel,
  })).slice(0, 6);

  const outOfStock = getOutOfStockCount();
  const lowStock = getLowStockCount();
  const pendingOrders = getPendingOrdersCount();

  // Stock Status Distribution for Overview
  const stockStatusDistribution = useMemo(() => {
    let inStock = 0, lowStockCount = 0, outOfStockCount = 0, onOrder = 0;
    inventoryItems.forEach(item => {
      switch (item.status) {
        case 'in_stock': inStock++; break;
        case 'low_stock': lowStockCount++; break;
        case 'out_of_stock': outOfStockCount++; break;
        case 'on_order': onOrder++; break;
      }
    });
    return [
      { name: 'In Stock', value: inStock, color: '#10b981' },
      { name: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
      { name: 'Out of Stock', value: outOfStockCount, color: '#ef4444' },
      { name: 'On Order', value: onOrder, color: '#3b82f6' },
    ].filter(d => d.value > 0);
  }, []);

  // Inventory Value by Category
  const valueByCategory = useMemo(() => {
    const categoryValues: Record<string, number> = {};
    inventoryItems.forEach(item => {
      const value = item.currentStock * item.unitCost;
      categoryValues[item.category] = (categoryValues[item.category] || 0) + value;
    });
    return Object.entries(categoryValues)
      .map(([category, value]) => ({
        name: getCategoryLabel(category as any).replace(' Equipment', '').replace(' & Membranes', ''),
        value: Math.round(value / 1000)
      }))
      .sort((a, b) => b.value - a.value);
  }, []);

  // Stock Movement Trend (mock 7-day data)
  const movementTrendData = useMemo(() => {
    return [
      { day: 'Mon', stockIn: 45, stockOut: 28 },
      { day: 'Tue', stockIn: 32, stockOut: 41 },
      { day: 'Wed', stockIn: 28, stockOut: 35 },
      { day: 'Thu', stockIn: 52, stockOut: 22 },
      { day: 'Fri', stockIn: 38, stockOut: 45 },
      { day: 'Sat', stockIn: 15, stockOut: 12 },
      { day: 'Sun', stockIn: 8, stockOut: 5 },
    ];
  }, []);

  // Top Items by Value
  const topItemsByValue = useMemo(() => {
    return [...inventoryItems]
      .map(item => ({
        name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
        value: Math.round((item.currentStock * item.unitCost) / 1000)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, []);

  // PO Status Distribution
  const poStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    purchaseOrders.forEach(po => {
      counts[po.status] = (counts[po.status] || 0) + 1;
    });
    const statusColors: Record<string, string> = {
      draft: '#64748b',
      pending_approval: '#f59e0b',
      approved: '#3b82f6',
      ordered: '#8b5cf6',
      partial: '#f97316',
      received: '#10b981',
      cancelled: '#ef4444',
    };
    const statusLabels: Record<string, string> = {
      draft: 'Draft',
      pending_approval: 'Pending',
      approved: 'Approved',
      ordered: 'Ordered',
      partial: 'Partial',
      received: 'Received',
      cancelled: 'Cancelled',
    };
    return Object.entries(counts)
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || '#64748b',
      }))
      .filter(d => d.value > 0);
  }, []);

  // Reorder Point Analysis
  const reorderPointAnalysis = useMemo(() => {
    return inventoryItems
      .filter(item => item.currentStock <= item.reorderPoint * 1.5)
      .map(item => ({
        name: item.sku,
        current: item.currentStock,
        reorder: item.reorderPoint,
        min: item.minStockLevel,
      }))
      .slice(0, 8);
  }, []);

  // Handler functions
  const openStockIn = (item: InventoryItem) => {
    setStockActionItem(item);
    setStockInForm({ quantity: 1, reason: 'purchase', reference: '', notes: '' });
    setStockInModalOpen(true);
  };

  const openStockOut = (item: InventoryItem) => {
    setStockActionItem(item);
    setStockOutForm({ quantity: 1, reason: 'maintenance', reference: '', notes: '' });
    setStockOutModalOpen(true);
  };

  const openReorder = (item: InventoryItem) => {
    setStockActionItem(item);
    setReorderForm({ quantity: item.reorderQty, supplier: item.supplier, notes: '' });
    setReorderModalOpen(true);
  };

  const handleAddItem = () => {
    if (!addItemForm.name || !addItemForm.sku) {
      toast.error('Please fill required fields', { description: 'Name and SKU are required.' });
      return;
    }
    toast.success('Item Added', { description: `${addItemForm.name} has been added to inventory.` });
    setAddItemModalOpen(false);
    setAddItemForm({
      name: '', sku: '', category: 'spare_parts', description: '', unit: 'pcs',
      minStockLevel: 5, maxStockLevel: 100, reorderPoint: 10, reorderQty: 20,
      unitCost: 0, supplier: '', location: '',
    });
  };

  const handleStockIn = () => {
    if (stockInForm.quantity <= 0) {
      toast.error('Invalid quantity', { description: 'Quantity must be greater than 0.' });
      return;
    }
    toast.success('Stock In Recorded', {
      description: `Added ${stockInForm.quantity} units of ${stockActionItem?.name}.`,
    });
    setStockInModalOpen(false);
    setStockActionItem(null);
  };

  const handleStockOut = () => {
    if (stockOutForm.quantity <= 0) {
      toast.error('Invalid quantity', { description: 'Quantity must be greater than 0.' });
      return;
    }
    if (stockActionItem && stockOutForm.quantity > stockActionItem.currentStock) {
      toast.error('Insufficient stock', { description: `Only ${stockActionItem.currentStock} units available.` });
      return;
    }
    toast.success('Stock Out Recorded', {
      description: `Removed ${stockOutForm.quantity} units of ${stockActionItem?.name}.`,
    });
    setStockOutModalOpen(false);
    setStockActionItem(null);
  };

  const handleReorder = () => {
    if (reorderForm.quantity <= 0) {
      toast.error('Invalid quantity', { description: 'Quantity must be greater than 0.' });
      return;
    }
    toast.success('Reorder Created', {
      description: `Purchase order created for ${reorderForm.quantity} units of ${stockActionItem?.name}.`,
    });
    setReorderModalOpen(false);
    setStockActionItem(null);
  };

  const handleCreatePO = () => {
    if (!createPOForm.supplier) {
      toast.error('Please select a supplier', { description: 'Supplier is required for purchase orders.' });
      return;
    }
    toast.success('Purchase Order Created', { description: `PO has been created for ${createPOForm.supplier}.` });
    setCreatePOModalOpen(false);
    setCreatePOForm({ supplier: '', items: [], notes: '' });
  };

  const handleApprovePO = (po: PurchaseOrder) => {
    toast.success('PO Approved', { description: `${po.poNumber} has been approved and sent to supplier.` });
    setSelectedPO(null);
  };

  const handleRejectPO = (po: PurchaseOrder) => {
    toast.error('PO Rejected', { description: `${po.poNumber} has been rejected.` });
    setSelectedPO(null);
  };

  const handleQuickOrder = (item: InventoryItem) => {
    toast.success('Order Placed', { description: `Ordered ${item.reorderQty} units of ${item.name} from ${item.supplier}.` });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header Bar */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Boxes className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Inventory Monitor</span>
          <span className="text-[10px] text-slate-400">Track spare parts, consumables, and stock levels</span>
        </div>
        <div className="flex items-center gap-3">
          {outOfStock > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 text-white text-[10px] font-bold">
              <AlertTriangle className="h-3 w-3" />
              {outOfStock} OUT OF STOCK
            </span>
          )}
          {lowStock > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-600 text-white text-[10px] font-bold">
              {lowStock} LOW STOCK
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Industrial Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total Items */}
          <div className="border-2 border-slate-300 bg-white p-4 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Items</span>
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                {inventoryItems.length}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              VALUE: {getTotalInventoryValue().toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Out of Stock */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            outOfStock > 0 && 'border-l-[3px] border-l-red-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Out of Stock</span>
              <AlertTriangle className={cn('h-4 w-4', outOfStock > 0 ? 'text-red-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                outOfStock > 0 ? 'text-red-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                {outOfStock}
              </span>
              <span className="text-[10px] text-slate-500">
                {outOfStock > 0 ? 'NEEDS IMMEDIATE REORDER' : 'ALL STOCKED'}
              </span>
            </div>
          </div>

          {/* Low Stock */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            lowStock > 0 && 'border-l-[3px] border-l-amber-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Low Stock</span>
              <TrendingDown className={cn('h-4 w-4', lowStock > 0 ? 'text-amber-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                lowStock > 0 ? 'text-amber-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                {lowStock}
              </span>
              <span className="text-[10px] text-slate-500">BELOW REORDER POINT</span>
            </div>
          </div>

          {/* Pending Orders */}
          <div className={cn(
            'border-2 border-slate-300 bg-white p-4',
            pendingOrders > 0 && 'border-l-[3px] border-l-purple-500'
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Orders</span>
              <ShoppingCart className={cn('h-4 w-4', pendingOrders > 0 ? 'text-purple-600' : 'text-slate-400')} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={cn(
                'text-2xl font-bold tracking-tight',
                pendingOrders > 0 ? 'text-purple-600' : 'text-slate-700'
              )} style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                {pendingOrders}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              VALUE: {getPendingOrdersValue().toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Tabbed Content Panel */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Panel Header with Tabs */}
          <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex gap-1">
              {(['overview', 'inventory', 'alerts', 'movements', 'orders'] as TabValue[]).map((tab) => {
                const labels: Record<TabValue, string> = {
                  overview: 'Overview',
                  inventory: 'Inventory',
                  alerts: 'Stock Alerts',
                  movements: 'Stock Movements',
                  orders: 'Purchase Orders',
                };
                const counts: Record<TabValue, number | null> = {
                  overview: null,
                  inventory: inventoryItems.length,
                  alerts: getLowStockItems().length,
                  movements: stockMovements.length,
                  orders: purchaseOrders.length,
                };
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={cn(
                      'px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                      selectedTab === tab
                        ? 'bg-slate-700 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                    )}
                  >
                    {labels[tab]}
                    {counts[tab] !== null && <span className="ml-1 text-[9px] opacity-70">({counts[tab]})</span>}
                  </button>
                );
              })}
            </div>
            {selectedTab === 'inventory' && (
              <button
                onClick={() => setAddItemModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add Item
              </button>
            )}
            {selectedTab === 'orders' && (
              <button
                onClick={() => setCreatePOModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Create PO
              </button>
            )}
          </div>

          {/* Overview Tab - Visualizations */}
          {selectedTab === 'overview' && (
            <div className="p-4 space-y-4">
              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Stock Movement Trend */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Stock Movement (7 Days)</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={movementTrendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="day" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Area type="monotone" dataKey="stockIn" stackId="1" stroke="#10b981" fill="#10b98133" strokeWidth={2} name="Stock In" />
                          <Area type="monotone" dataKey="stockOut" stackId="2" stroke="#ef4444" fill="#ef444433" strokeWidth={2} name="Stock Out" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-emerald-500" />
                        <span className="text-[10px] text-slate-500">Stock In</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-red-500" />
                        <span className="text-[10px] text-slate-500">Stock Out</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Status Distribution */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <PieChartIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Stock Status</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stockStatusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {stockStatusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      {stockStatusDistribution.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <div className="h-2 w-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-[9px] text-slate-500">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PO Status Distribution */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <ShoppingCart className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Purchase Orders</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={poStatusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {poStatusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      {poStatusDistribution.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-1">
                          <div className="h-2 w-2" style={{ backgroundColor: entry.color }} />
                          <span className="text-[9px] text-slate-500">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Inventory Value by Category */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Value by Category (₹K)</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={valueByCategory} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis type="category" dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} width={80} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                            formatter={(value: number) => [`₹${value}K`, 'Value']}
                          />
                          <Bar dataKey="value" fill="#8b5cf6" name="Value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Top Items by Value */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Top Items by Value (₹K)</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topItemsByValue} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" fontSize={10} tick={{ fill: '#64748b' }} />
                          <YAxis type="category" dataKey="name" fontSize={9} tick={{ fill: '#64748b' }} width={100} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                            formatter={(value: number) => [`₹${value}K`, 'Value']}
                          />
                          <Bar dataKey="value" fill="#0ea5e9" name="Value" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Items by Category */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Items by Category</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={9} tick={{ fill: '#64748b' }} angle={-15} textAnchor="end" height={50} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="value" fill="#6366f1" name="Items" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Reorder Point Analysis */}
                <div className="border-2 border-slate-300 bg-white overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b-2 border-slate-300 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Items Near Reorder Point</span>
                  </div>
                  <div className="p-3">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reorderPointAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={9} tick={{ fill: '#64748b' }} />
                          <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1e293b',
                              border: 'none',
                              borderRadius: 0,
                              fontSize: 11,
                              color: '#fff'
                            }}
                          />
                          <Bar dataKey="current" fill="#3b82f6" name="Current Stock" />
                          <Bar dataKey="reorder" fill="#f59e0b" name="Reorder Point" />
                          <Bar dataKey="min" fill="#ef4444" name="Min Level" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-blue-500" />
                        <span className="text-[10px] text-slate-500">Current</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-amber-500" />
                        <span className="text-[10px] text-slate-500">Reorder</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-4 bg-red-500" />
                        <span className="text-[10px] text-slate-500">Min</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {selectedTab === 'inventory' && (
            <>
              {/* Filters Row */}
              <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by SKU or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="spare_parts">Spare Parts</option>
                    <option value="consumables">Consumables</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="tools">Tools</option>
                    <option value="safety">Safety</option>
                    <option value="electrical">Electrical</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    <option value="all">All Status</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Inventory Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">SKU</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Item Name</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Category</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Stock</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Min/Max</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Unit Cost</th>
                      <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className={cn(
                          'hover:bg-slate-50 cursor-pointer transition-colors',
                          getStockStatusBorder(item.status)
                        )}
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.name}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.description}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase border border-slate-300 text-slate-600">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'text-sm font-bold',
                              item.currentStock <= item.minStockLevel ? 'text-red-600' : 'text-slate-700'
                            )}
                            style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}
                          >
                            {item.currentStock}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-500" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                            {item.minStockLevel} / {item.maxStockLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getStockStatusColor(item.status))}>
                            {getStatusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                            {item.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ActionMenu
                            onView={() => setSelectedItem(item)}
                            onStockIn={() => openStockIn(item)}
                            onStockOut={() => openStockOut(item)}
                            onReorder={() => openReorder(item)}
                            showStockActions
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Stock Alerts Tab */}
          {selectedTab === 'alerts' && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getLowStockItems().map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'border-2 border-slate-300 bg-white p-4',
                      item.status === 'out_of_stock' ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-amber-500'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] text-slate-500 font-mono">{item.sku}</p>
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-500">{item.supplier}</p>
                      </div>
                      <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getStockStatusColor(item.status))}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-600">CURRENT: <span className="font-bold">{item.currentStock} {item.unit}</span></span>
                        <span className="text-slate-600">REORDER: <span className="font-bold">{item.reorderPoint}</span></span>
                      </div>
                      <div className="h-2 bg-slate-200 overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            item.status === 'out_of_stock' ? 'bg-red-500' : 'bg-amber-500'
                          )}
                          style={{ width: `${Math.min((item.currentStock / item.maxStockLevel) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickOrder(item)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        Order {item.reorderQty}
                      </button>
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase border-2 border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Movements Tab */}
          {selectedTab === 'movements' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Date/Time</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Item</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Type</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Quantity</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Reason</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Reference</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">By</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stockMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {format(new Date(movement.timestamp), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{movement.itemName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {movement.type === 'in' ? (
                            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                          ) : movement.type === 'out' ? (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          ) : (
                            <RotateCcw className="h-4 w-4 text-blue-600" />
                          )}
                          <span className={cn(
                            'text-[10px] font-bold uppercase',
                            movement.type === 'in' ? 'text-emerald-600' : movement.type === 'out' ? 'text-red-600' : 'text-blue-600'
                          )}>
                            {movement.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'text-sm font-bold',
                            movement.type === 'in' ? 'text-emerald-600' : 'text-red-600'
                          )}
                          style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}
                        >
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{movement.reason}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {movement.reference || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{movement.performedBy}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {movement.balanceAfter}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Purchase Orders Tab */}
          {selectedTab === 'orders' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">PO Number</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Supplier</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Items</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Total</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Created</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Expected</th>
                    <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {purchaseOrders.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedPO(po)}
                    >
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {po.poNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">{po.supplierName}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {po.items.length}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">items</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {po.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getPOStatusColor(po.status))}>
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {format(new Date(po.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {po.expectedDelivery ? format(new Date(po.expectedDelivery), 'MMM d') : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ActionMenu onView={() => setSelectedPO(po)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
                {selectedItem?.name}
              </DialogTitle>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          {selectedItem && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SKU</p>
                    <p className="text-sm font-medium" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                      {selectedItem.sku}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category</p>
                    <p className="text-sm">{getCategoryLabel(selectedItem.category)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier</p>
                    <p className="text-sm">{selectedItem.supplier}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location</p>
                    <p className="text-sm">{selectedItem.location}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Unit Cost</p>
                    <p className="text-sm font-bold" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                      {selectedItem.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stock Value</p>
                    <p className="text-sm font-bold" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                      {(selectedItem.currentStock * selectedItem.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Restocked</p>
                    <p className="text-sm">{format(new Date(selectedItem.lastRestocked), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Used</p>
                    <p className="text-sm">{selectedItem.lastUsed ? format(new Date(selectedItem.lastUsed), 'MMM d, yyyy') : 'Never'}</p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Stock Level</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-slate-200 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        selectedItem.currentStock <= selectedItem.minStockLevel ? 'bg-red-500' :
                        selectedItem.currentStock <= selectedItem.reorderPoint ? 'bg-amber-500' : 'bg-emerald-500'
                      )}
                      style={{ width: `${Math.min((selectedItem.currentStock / selectedItem.maxStockLevel) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                    {selectedItem.currentStock} / {selectedItem.maxStockLevel}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-2">
                  <span>MIN: {selectedItem.minStockLevel}</span>
                  <span>REORDER: {selectedItem.reorderPoint}</span>
                  <span>REORDER QTY: {selectedItem.reorderQty}</span>
                </div>
              </div>

              <div className="bg-slate-100 border-t-2 border-slate-300 -mx-4 -mb-4 px-4 py-3 flex gap-2">
                <button
                  onClick={() => {
                    if (selectedItem) openStockIn(selectedItem);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                >
                  <ArrowDownRight className="h-3.5 w-3.5" />
                  Stock In
                </button>
                <button
                  onClick={() => {
                    if (selectedItem) openStockOut(selectedItem);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Stock Out
                </button>
                <button
                  onClick={() => {
                    if (selectedItem) openReorder(selectedItem);
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Reorder
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PO Detail Modal */}
      <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
        <DialogContent className="max-w-2xl p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Purchase Order - {selectedPO?.poNumber}
              </DialogTitle>
              <button
                onClick={() => setSelectedPO(null)}
                className="p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          {selectedPO && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supplier</p>
                  <p className="text-sm font-medium">{selectedPO.supplierName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p>
                  <span className={cn('px-2 py-0.5 text-[9px] font-bold uppercase', getPOStatusColor(selectedPO.status))}>
                    {selectedPO.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Created</p>
                  <p className="text-sm">{format(new Date(selectedPO.createdAt), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expected Delivery</p>
                  <p className="text-sm">{selectedPO.expectedDelivery ? format(new Date(selectedPO.expectedDelivery), 'PPP') : 'Not set'}</p>
                </div>
              </div>

              <div className="border-2 border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Item</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Qty</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Unit Cost</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-slate-600">Received</th>
                      <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedPO.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-sm text-slate-900">{item.itemName}</td>
                        <td className="px-3 py-2 text-sm" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-sm" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {item.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                            {item.receivedQty} / {item.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-bold" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                          {(item.quantity * item.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Amount</p>
                  <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                    {selectedPO.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </p>
                </div>
              </div>

              {selectedPO.status === 'pending_approval' && (
                <div className="bg-slate-100 border-t-2 border-slate-300 -mx-4 -mb-4 px-4 py-3 flex gap-2">
                  <button
                    onClick={() => handleApprovePO(selectedPO)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectPO(selectedPO)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Add New Inventory Item
              </DialogTitle>
              <button
                onClick={() => setAddItemModalOpen(false)}
                className="p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={addItemForm.name}
                  onChange={(e) => setAddItemForm({ ...addItemForm, name: e.target.value })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  placeholder="Enter item name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  SKU *
                </label>
                <input
                  type="text"
                  value={addItemForm.sku}
                  onChange={(e) => setAddItemForm({ ...addItemForm, sku: e.target.value })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  placeholder="e.g., SPR-001"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category
                </label>
                <select
                  value={addItemForm.category}
                  onChange={(e) => setAddItemForm({ ...addItemForm, category: e.target.value })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                >
                  <option value="spare_parts">Spare Parts</option>
                  <option value="consumables">Consumables</option>
                  <option value="chemicals">Chemicals</option>
                  <option value="filters">Filters & Membranes</option>
                  <option value="electrical">Electrical</option>
                  <option value="instrumentation">Instrumentation</option>
                  <option value="safety">Safety Equipment</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Description
                </label>
                <textarea
                  value={addItemForm.description}
                  onChange={(e) => setAddItemForm({ ...addItemForm, description: e.target.value })}
                  className="w-full h-20 px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
                  placeholder="Item description..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Unit
                </label>
                <select
                  value={addItemForm.unit}
                  onChange={(e) => setAddItemForm({ ...addItemForm, unit: e.target.value })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="L">Liters (L)</option>
                  <option value="m">Meters (m)</option>
                  <option value="set">Sets</option>
                  <option value="roll">Rolls</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Unit Cost (INR)
                </label>
                <input
                  type="number"
                  value={addItemForm.unitCost}
                  onChange={(e) => setAddItemForm({ ...addItemForm, unitCost: Number(e.target.value) })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  min="0"
                />
              </div>
            </div>

            <div className="border-t-2 border-slate-200 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Stock Levels</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Min Level</label>
                  <input
                    type="number"
                    value={addItemForm.minStockLevel}
                    onChange={(e) => setAddItemForm({ ...addItemForm, minStockLevel: Number(e.target.value) })}
                    className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Max Level</label>
                  <input
                    type="number"
                    value={addItemForm.maxStockLevel}
                    onChange={(e) => setAddItemForm({ ...addItemForm, maxStockLevel: Number(e.target.value) })}
                    className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={addItemForm.reorderPoint}
                    onChange={(e) => setAddItemForm({ ...addItemForm, reorderPoint: Number(e.target.value) })}
                    className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Reorder Qty</label>
                  <input
                    type="number"
                    value={addItemForm.reorderQty}
                    onChange={(e) => setAddItemForm({ ...addItemForm, reorderQty: Number(e.target.value) })}
                    className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Supplier
                </label>
                <input
                  type="text"
                  value={addItemForm.supplier}
                  onChange={(e) => setAddItemForm({ ...addItemForm, supplier: e.target.value })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Storage Location
                </label>
                <input
                  type="text"
                  value={addItemForm.location}
                  onChange={(e) => setAddItemForm({ ...addItemForm, location: e.target.value })}
                  className="w-full h-9 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  placeholder="e.g., Warehouse A, Shelf 3"
                />
              </div>
            </div>
          </div>
          <div className="bg-slate-100 border-t-2 border-slate-300 px-4 py-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setAddItemModalOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Add Item
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock In Modal */}
      <Dialog open={stockInModalOpen} onOpenChange={setStockInModalOpen}>
        <DialogContent className="max-w-md p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ArrowDownRight className="h-4 w-4" />
                Stock In
              </DialogTitle>
              <button
                onClick={() => setStockInModalOpen(false)}
                className="p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          {stockActionItem && (
            <div className="p-4 space-y-4">
              <div className="bg-slate-50 border-2 border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Item</p>
                <p className="text-sm font-medium text-slate-900">{stockActionItem.name}</p>
                <p className="text-xs text-slate-500" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                  {stockActionItem.sku} | Current Stock: {stockActionItem.currentStock} {stockActionItem.unit}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={stockInForm.quantity}
                  onChange={(e) => setStockInForm({ ...stockInForm, quantity: Number(e.target.value) })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reason
                </label>
                <select
                  value={stockInForm.reason}
                  onChange={(e) => setStockInForm({ ...stockInForm, reason: e.target.value })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                >
                  <option value="purchase">Purchase Order Received</option>
                  <option value="return">Return from Job</option>
                  <option value="transfer">Transfer from Other Location</option>
                  <option value="adjustment">Stock Adjustment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reference (PO/GRN)
                </label>
                <input
                  type="text"
                  value={stockInForm.reference}
                  onChange={(e) => setStockInForm({ ...stockInForm, reference: e.target.value })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  placeholder="e.g., PO-2024-001"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={stockInForm.notes}
                  onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })}
                  className="w-full h-20 px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}
          <div className="bg-slate-100 border-t-2 border-slate-300 px-4 py-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setStockInModalOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStockIn}
              className="px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Confirm Stock In
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Out Modal */}
      <Dialog open={stockOutModalOpen} onOpenChange={setStockOutModalOpen}>
        <DialogContent className="max-w-md p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Stock Out
              </DialogTitle>
              <button
                onClick={() => setStockOutModalOpen(false)}
                className="p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          {stockActionItem && (
            <div className="p-4 space-y-4">
              <div className="bg-slate-50 border-2 border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Item</p>
                <p className="text-sm font-medium text-slate-900">{stockActionItem.name}</p>
                <p className="text-xs text-slate-500" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                  {stockActionItem.sku} | Available: {stockActionItem.currentStock} {stockActionItem.unit}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={stockOutForm.quantity}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: Number(e.target.value) })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  min="1"
                  max={stockActionItem.currentStock}
                />
                {stockOutForm.quantity > stockActionItem.currentStock && (
                  <p className="text-[10px] text-red-600 mt-1">
                    Exceeds available stock ({stockActionItem.currentStock} {stockActionItem.unit})
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reason
                </label>
                <select
                  value={stockOutForm.reason}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                >
                  <option value="maintenance">Maintenance/Repair</option>
                  <option value="consumption">Regular Consumption</option>
                  <option value="transfer">Transfer to Other Location</option>
                  <option value="damaged">Damaged/Expired</option>
                  <option value="adjustment">Stock Adjustment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Reference (Service Ticket/WO)
                </label>
                <input
                  type="text"
                  value={stockOutForm.reference}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, reference: e.target.value })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  placeholder="e.g., SRV-2024-001"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={stockOutForm.notes}
                  onChange={(e) => setStockOutForm({ ...stockOutForm, notes: e.target.value })}
                  className="w-full h-20 px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
          )}
          <div className="bg-slate-100 border-t-2 border-slate-300 px-4 py-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setStockOutModalOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStockOut}
              className="px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Confirm Stock Out
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reorder Modal */}
      <Dialog open={reorderModalOpen} onOpenChange={setReorderModalOpen}>
        <DialogContent className="max-w-md p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Create Reorder
              </DialogTitle>
              <button
                onClick={() => setReorderModalOpen(false)}
                className="p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          {stockActionItem && (
            <div className="p-4 space-y-4">
              <div className="bg-slate-50 border-2 border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Item</p>
                <p className="text-sm font-medium text-slate-900">{stockActionItem.name}</p>
                <p className="text-xs text-slate-500" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                  {stockActionItem.sku}
                </p>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <span className="text-slate-500">
                    Current: <span className="font-bold text-slate-700">{stockActionItem.currentStock}</span>
                  </span>
                  <span className="text-slate-500">
                    Reorder Point: <span className="font-bold text-slate-700">{stockActionItem.reorderPoint}</span>
                  </span>
                  <span className="text-slate-500">
                    Suggested Qty: <span className="font-bold text-slate-700">{stockActionItem.reorderQty}</span>
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Order Quantity *
                </label>
                <input
                  type="number"
                  value={reorderForm.quantity}
                  onChange={(e) => setReorderForm({ ...reorderForm, quantity: Number(e.target.value) })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Supplier
                </label>
                <input
                  type="text"
                  value={reorderForm.supplier}
                  onChange={(e) => setReorderForm({ ...reorderForm, supplier: e.target.value })}
                  className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={reorderForm.notes}
                  onChange={(e) => setReorderForm({ ...reorderForm, notes: e.target.value })}
                  className="w-full h-20 px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
                  placeholder="Additional notes..."
                />
              </div>
              <div className="bg-slate-50 border-2 border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Estimated Cost</p>
                <p className="text-xl font-bold text-slate-700" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                  {(reorderForm.quantity * stockActionItem.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </p>
                <p className="text-[10px] text-slate-500">
                  {reorderForm.quantity} x {stockActionItem.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} per {stockActionItem.unit}
                </p>
              </div>
            </div>
          )}
          <div className="bg-slate-100 border-t-2 border-slate-300 px-4 py-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setReorderModalOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleReorder}
              className="px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
            >
              Create Purchase Order
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create PO Modal */}
      <Dialog open={createPOModalOpen} onOpenChange={setCreatePOModalOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
          <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Create Purchase Order
              </DialogTitle>
              <button
                onClick={() => setCreatePOModalOpen(false)}
                className="p-1 hover:bg-slate-200 transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </DialogHeader>
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Supplier *
              </label>
              <select
                value={createPOForm.supplier}
                onChange={(e) => setCreatePOForm({ ...createPOForm, supplier: e.target.value })}
                className="w-full h-10 px-3 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500"
              >
                <option value="">Select Supplier</option>
                <option value="AquaTech Supplies">AquaTech Supplies</option>
                <option value="Industrial Parts Co.">Industrial Parts Co.</option>
                <option value="ChemPro India">ChemPro India</option>
                <option value="FilterMax Systems">FilterMax Systems</option>
                <option value="Pump Solutions Ltd.">Pump Solutions Ltd.</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Items (Select from low stock)
              </label>
              <div className="border-2 border-slate-200 max-h-48 overflow-y-auto">
                {getLowStockItems().map((item) => {
                  const isSelected = createPOForm.items.some(i => i.itemId === item.id);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50',
                        isSelected && 'bg-slate-100'
                      )}
                      onClick={() => {
                        if (isSelected) {
                          setCreatePOForm({
                            ...createPOForm,
                            items: createPOForm.items.filter(i => i.itemId !== item.id)
                          });
                        } else {
                          setCreatePOForm({
                            ...createPOForm,
                            items: [...createPOForm.items, {
                              itemId: item.id,
                              itemName: item.name,
                              quantity: item.reorderQty,
                              unitCost: item.unitCost
                            }]
                          });
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-4 h-4 border-2 flex items-center justify-center',
                          isSelected ? 'bg-slate-700 border-slate-700' : 'border-slate-300'
                        )}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.sku} | Stock: {item.currentStock} / {item.reorderPoint} | Suggested: {item.reorderQty}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                        {item.unitCost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                  );
                })}
                {getLowStockItems().length === 0 && (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm">
                    No low stock items to reorder
                  </div>
                )}
              </div>
            </div>

            {createPOForm.items.length > 0 && (
              <div className="border-2 border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Order Summary</p>
                <div className="space-y-1">
                  {createPOForm.items.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{item.itemName} x {item.quantity}</span>
                      <span className="font-bold" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                        {(item.quantity * item.unitCost).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Total</span>
                  <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' }}>
                    {createPOForm.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Notes
              </label>
              <textarea
                value={createPOForm.notes}
                onChange={(e) => setCreatePOForm({ ...createPOForm, notes: e.target.value })}
                className="w-full h-20 px-3 py-2 text-sm border-2 border-slate-300 bg-white focus:outline-none focus:border-slate-500 resize-none"
                placeholder="Additional notes for this purchase order..."
              />
            </div>
          </div>
          <div className="bg-slate-100 border-t-2 border-slate-300 px-4 py-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setCreatePOModalOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePO}
              disabled={createPOForm.items.length === 0}
              className={cn(
                'px-4 py-2 text-[11px] font-bold uppercase transition-colors',
                createPOForm.items.length === 0
                  ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                  : 'bg-slate-700 text-white hover:bg-slate-800'
              )}
            >
              Create Purchase Order
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
