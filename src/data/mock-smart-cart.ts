// Mock data for SMART CART module

export interface CartItem {
  id: string;
  itemId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unitCost: number;
  supplierId: string;
  supplierName: string;
  leadTime: number;
  urgency: 'normal' | 'urgent' | 'critical';
  reason: string;
  requestedBy: string;
  plantId: string;
  plantName: string;
  addedAt: string;
}

export interface SmartRecommendation {
  id: string;
  itemId: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQty: number;
  unitCost: number;
  supplierId: string;
  supplierName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  savings: number | null;
  alternativeSuppliers: AlternativeSupplier[];
}

export interface AlternativeSupplier {
  supplierId: string;
  supplierName: string;
  unitCost: number;
  leadTime: number;
  rating: number;
}

export interface BulkOrder {
  id: string;
  items: CartItem[];
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ProcurementHistory {
  id: string;
  poNumber: string;
  date: string;
  supplier: string;
  items: number;
  totalAmount: number;
  status: 'completed' | 'partial' | 'cancelled';
  deliveredOn: string | null;
}

// Current cart items
export const cartItems: CartItem[] = [
  {
    id: 'cart-001',
    itemId: 'inv-004',
    sku: 'CHM-PAC-50',
    name: 'Poly Aluminium Chloride (PAC)',
    description: 'Coagulant for water treatment - 50kg bag',
    category: 'Chemicals',
    quantity: 15,
    unitCost: 2800,
    supplierId: 'sup-002',
    supplierName: 'AquaChem Industries',
    leadTime: 3,
    urgency: 'critical',
    reason: 'Out of stock - Production affected',
    requestedBy: 'Operator Kumar',
    plantId: 'plant-001',
    plantName: 'Chennai WTP',
    addedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'cart-002',
    itemId: 'inv-002',
    sku: 'CHM-NAOCL-25',
    name: 'Sodium Hypochlorite 12%',
    description: 'Chlorine solution for disinfection - 25L can',
    category: 'Chemicals',
    quantity: 20,
    unitCost: 450,
    supplierId: 'sup-002',
    supplierName: 'AquaChem Industries',
    leadTime: 3,
    urgency: 'urgent',
    reason: 'Low stock alert triggered',
    requestedBy: 'System Auto',
    plantId: 'plant-002',
    plantName: 'Bangalore STP',
    addedAt: '2024-01-15T06:00:00Z',
  },
  {
    id: 'cart-003',
    itemId: 'inv-009',
    sku: 'CHM-ANTISCL-20',
    name: 'Antiscalant Solution',
    description: 'RO antiscalant - 20L can',
    category: 'Chemicals',
    quantity: 10,
    unitCost: 3500,
    supplierId: 'sup-002',
    supplierName: 'AquaChem Industries',
    leadTime: 3,
    urgency: 'normal',
    reason: 'Stock at reorder point',
    requestedBy: 'System Auto',
    plantId: 'plant-001',
    plantName: 'Chennai WTP',
    addedAt: '2024-01-14T18:00:00Z',
  },
];

// Smart recommendations based on AI/ML analysis
export const smartRecommendations: SmartRecommendation[] = [
  {
    id: 'rec-001',
    itemId: 'inv-001',
    sku: 'MEM-RO-400',
    name: 'RO Membrane Element 400 sq.ft',
    currentStock: 4,
    reorderPoint: 3,
    suggestedQty: 4,
    unitCost: 55000,
    supplierId: 'sup-001',
    supplierName: 'WaterTech Solutions Pvt Ltd',
    reason: 'Predictive: Based on usage pattern, stock will reach critical in 45 days',
    priority: 'medium',
    savings: 8800, // 4% bulk discount
    alternativeSuppliers: [
      { supplierId: 'sup-005', supplierName: 'Membrane Tech India', unitCost: 52000, leadTime: 14, rating: 4.0 },
      { supplierId: 'sup-006', supplierName: 'Water Solutions Inc', unitCost: 58000, leadTime: 7, rating: 4.6 },
    ],
  },
  {
    id: 'rec-002',
    itemId: 'inv-003',
    sku: 'SPR-BRG-6210',
    name: 'Ball Bearing 6210-2RS',
    currentStock: 12,
    reorderPoint: 8,
    suggestedQty: 12,
    unitCost: 1200,
    supplierId: 'sup-003',
    supplierName: 'Industrial Spares Co',
    reason: 'Bulk order opportunity: Combine with scheduled maintenance parts',
    priority: 'low',
    savings: 1440, // 10% on bulk
    alternativeSuppliers: [
      { supplierId: 'sup-007', supplierName: 'SKF Authorized', unitCost: 1400, leadTime: 5, rating: 4.9 },
    ],
  },
  {
    id: 'rec-003',
    itemId: 'inv-005',
    sku: 'SPR-SEAL-50',
    name: 'Mechanical Seal 50mm',
    currentStock: 3,
    reorderPoint: 3,
    suggestedQty: 4,
    unitCost: 8500,
    supplierId: 'sup-004',
    supplierName: 'Pump & Motor House',
    reason: 'At reorder point. Scheduled pump maintenance in 30 days.',
    priority: 'high',
    savings: null,
    alternativeSuppliers: [],
  },
  {
    id: 'rec-004',
    itemId: 'inv-006',
    sku: 'CNS-FILT-10',
    name: 'Cartridge Filter 10 micron',
    currentStock: 25,
    reorderPoint: 30,
    suggestedQty: 100,
    unitCost: 350,
    supplierId: 'sup-001',
    supplierName: 'WaterTech Solutions Pvt Ltd',
    reason: 'Volume discount: Order 100+ for 15% discount. Usage trend increasing.',
    priority: 'medium',
    savings: 5250, // 15% on 100
    alternativeSuppliers: [
      { supplierId: 'sup-008', supplierName: 'Filter House', unitCost: 320, leadTime: 10, rating: 4.2 },
    ],
  },
];

// Procurement history
export const procurementHistory: ProcurementHistory[] = [
  {
    id: 'ph-001',
    poNumber: 'PO-2024-003',
    date: '2024-01-02',
    supplier: 'WaterTech Solutions',
    items: 1,
    totalAmount: 17500,
    status: 'completed',
    deliveredOn: '2024-01-08',
  },
  {
    id: 'ph-002',
    poNumber: 'PO-2023-089',
    date: '2023-12-20',
    supplier: 'AquaChem Industries',
    items: 3,
    totalAmount: 45000,
    status: 'completed',
    deliveredOn: '2023-12-24',
  },
  {
    id: 'ph-003',
    poNumber: 'PO-2023-088',
    date: '2023-12-15',
    supplier: 'Industrial Spares Co',
    items: 5,
    totalAmount: 78500,
    status: 'completed',
    deliveredOn: '2023-12-26',
  },
  {
    id: 'ph-004',
    poNumber: 'PO-2023-085',
    date: '2023-12-01',
    supplier: 'Pump & Motor House',
    items: 2,
    totalAmount: 125000,
    status: 'completed',
    deliveredOn: '2023-12-18',
  },
  {
    id: 'ph-005',
    poNumber: 'PO-2023-082',
    date: '2023-11-20',
    supplier: 'WaterTech Solutions',
    items: 4,
    totalAmount: 245000,
    status: 'partial',
    deliveredOn: '2023-11-28',
  },
];

// Helper functions
export const getCartTotal = () =>
  cartItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

export const getCartItemCount = () =>
  cartItems.reduce((sum, item) => sum + item.quantity, 0);

export const getCriticalItemsCount = () =>
  cartItems.filter(item => item.urgency === 'critical').length;

export const getUrgentItemsCount = () =>
  cartItems.filter(item => item.urgency === 'urgent').length;

export const getPotentialSavings = () =>
  smartRecommendations.reduce((sum, rec) => sum + (rec.savings || 0), 0);

export const getCartBySupplier = () => {
  const suppliers: Record<string, { items: CartItem[], total: number }> = {};
  cartItems.forEach(item => {
    if (!suppliers[item.supplierId]) {
      suppliers[item.supplierId] = { items: [], total: 0 };
    }
    suppliers[item.supplierId].items.push(item);
    suppliers[item.supplierId].total += item.quantity * item.unitCost;
  });
  return suppliers;
};

export const getRecommendationsByPriority = (priority: 'high' | 'medium' | 'low') =>
  smartRecommendations.filter(rec => rec.priority === priority);

export const getMonthlyProcurement = () => {
  // Simulated monthly procurement data
  return [
    { month: 'Aug', amount: 185000 },
    { month: 'Sep', amount: 210000 },
    { month: 'Oct', amount: 178000 },
    { month: 'Nov', amount: 320000 },
    { month: 'Dec', amount: 265000 },
    { month: 'Jan', amount: 86500 },
  ];
};

export const getSupplierSpend = () => {
  // Simulated supplier spend distribution
  return [
    { name: 'WaterTech Solutions', value: 35 },
    { name: 'AquaChem Industries', value: 28 },
    { name: 'Industrial Spares', value: 20 },
    { name: 'Pump & Motor House', value: 12 },
    { name: 'Others', value: 5 },
  ];
};
