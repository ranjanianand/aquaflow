// Mock data for Inventory Monitor module

export type InventoryCategory = 'spare_parts' | 'consumables' | 'chemicals' | 'tools' | 'safety' | 'electrical' | 'mechanical';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: InventoryCategory;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQty: number;
  unitCost: number;
  location: string;
  supplier: string;
  supplierId: string;
  lastRestocked: string;
  lastUsed: string | null;
  status: StockStatus;
  compatibleAssets: string[];
}

export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference: string | null; // service ticket or PO number
  performedBy: string;
  timestamp: string;
  balanceAfter: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partial' | 'received' | 'cancelled';
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  expectedDelivery: string | null;
  receivedAt: string | null;
}

export interface POItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  receivedQty: number;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  leadTime: number; // days
  rating: number;
}

export const suppliers: Supplier[] = [
  {
    id: 'sup-001',
    name: 'WaterTech Solutions Pvt Ltd',
    contactPerson: 'Ramesh Sharma',
    email: 'ramesh@watertech.in',
    phone: '+91 44 2345 6789',
    address: 'Chennai, Tamil Nadu',
    paymentTerms: 'Net 30',
    leadTime: 7,
    rating: 4.5,
  },
  {
    id: 'sup-002',
    name: 'AquaChem Industries',
    contactPerson: 'Priya Menon',
    email: 'priya@aquachem.in',
    phone: '+91 80 3456 7890',
    address: 'Bangalore, Karnataka',
    paymentTerms: 'Net 45',
    leadTime: 3,
    rating: 4.8,
  },
  {
    id: 'sup-003',
    name: 'Industrial Spares Co',
    contactPerson: 'Vijay Kumar',
    email: 'vijay@indspares.in',
    phone: '+91 40 4567 8901',
    address: 'Hyderabad, Telangana',
    paymentTerms: 'Net 30',
    leadTime: 10,
    rating: 4.2,
  },
  {
    id: 'sup-004',
    name: 'Pump & Motor House',
    contactPerson: 'Sunil Joshi',
    email: 'sunil@pmhouse.in',
    phone: '+91 22 5678 9012',
    address: 'Mumbai, Maharashtra',
    paymentTerms: 'Net 60',
    leadTime: 14,
    rating: 4.0,
  },
];

export const inventoryItems: InventoryItem[] = [
  {
    id: 'inv-001',
    sku: 'MEM-RO-400',
    name: 'RO Membrane Element 400 sq.ft',
    description: 'Toray TM820M-400 replacement membrane element',
    category: 'spare_parts',
    unit: 'nos',
    currentStock: 4,
    minStockLevel: 2,
    maxStockLevel: 10,
    reorderPoint: 3,
    reorderQty: 4,
    unitCost: 55000,
    location: 'Warehouse A - Rack 1',
    supplier: 'WaterTech Solutions Pvt Ltd',
    supplierId: 'sup-001',
    lastRestocked: '2023-12-15',
    lastUsed: '2024-01-10',
    status: 'in_stock',
    compatibleAssets: ['CHN-RO-001', 'CHN-RO-002'],
  },
  {
    id: 'inv-002',
    sku: 'CHM-NAOCL-25',
    name: 'Sodium Hypochlorite 12%',
    description: 'Chlorine solution for disinfection - 25L can',
    category: 'chemicals',
    unit: 'can',
    currentStock: 8,
    minStockLevel: 10,
    maxStockLevel: 50,
    reorderPoint: 15,
    reorderQty: 20,
    unitCost: 450,
    location: 'Chemical Store - Section A',
    supplier: 'AquaChem Industries',
    supplierId: 'sup-002',
    lastRestocked: '2024-01-05',
    lastUsed: '2024-01-15',
    status: 'low_stock',
    compatibleAssets: [],
  },
  {
    id: 'inv-003',
    sku: 'SPR-BRG-6210',
    name: 'Ball Bearing 6210-2RS',
    description: 'SKF deep groove ball bearing for pumps',
    category: 'spare_parts',
    unit: 'nos',
    currentStock: 12,
    minStockLevel: 6,
    maxStockLevel: 24,
    reorderPoint: 8,
    reorderQty: 12,
    unitCost: 1200,
    location: 'Warehouse A - Rack 3',
    supplier: 'Industrial Spares Co',
    supplierId: 'sup-003',
    lastRestocked: '2023-11-20',
    lastUsed: '2024-01-06',
    status: 'in_stock',
    compatibleAssets: ['CHN-PMP-001', 'BLR-PMP-001'],
  },
  {
    id: 'inv-004',
    sku: 'CHM-PAC-50',
    name: 'Poly Aluminium Chloride (PAC)',
    description: 'Coagulant for water treatment - 50kg bag',
    category: 'chemicals',
    unit: 'bag',
    currentStock: 0,
    minStockLevel: 5,
    maxStockLevel: 30,
    reorderPoint: 8,
    reorderQty: 15,
    unitCost: 2800,
    location: 'Chemical Store - Section B',
    supplier: 'AquaChem Industries',
    supplierId: 'sup-002',
    lastRestocked: '2023-10-25',
    lastUsed: '2024-01-12',
    status: 'out_of_stock',
    compatibleAssets: [],
  },
  {
    id: 'inv-005',
    sku: 'SPR-SEAL-50',
    name: 'Mechanical Seal 50mm',
    description: 'Grundfos compatible mechanical seal',
    category: 'spare_parts',
    unit: 'nos',
    currentStock: 3,
    minStockLevel: 2,
    maxStockLevel: 8,
    reorderPoint: 3,
    reorderQty: 4,
    unitCost: 8500,
    location: 'Warehouse A - Rack 2',
    supplier: 'Pump & Motor House',
    supplierId: 'sup-004',
    lastRestocked: '2023-09-10',
    lastUsed: '2023-12-20',
    status: 'in_stock',
    compatibleAssets: ['CHN-PMP-001', 'BLR-PMP-002'],
  },
  {
    id: 'inv-006',
    sku: 'CNS-FILT-10',
    name: 'Cartridge Filter 10 micron',
    description: 'Sediment filter cartridge - 20 inch',
    category: 'consumables',
    unit: 'nos',
    currentStock: 25,
    minStockLevel: 20,
    maxStockLevel: 100,
    reorderPoint: 30,
    reorderQty: 50,
    unitCost: 350,
    location: 'Warehouse B - Rack 1',
    supplier: 'WaterTech Solutions Pvt Ltd',
    supplierId: 'sup-001',
    lastRestocked: '2024-01-08',
    lastUsed: '2024-01-14',
    status: 'in_stock',
    compatibleAssets: [],
  },
  {
    id: 'inv-007',
    sku: 'ELC-CONT-24',
    name: 'Contactor 3P 24A',
    description: 'Schneider LC1D25 contactor',
    category: 'electrical',
    unit: 'nos',
    currentStock: 5,
    minStockLevel: 3,
    maxStockLevel: 12,
    reorderPoint: 4,
    reorderQty: 6,
    unitCost: 2200,
    location: 'Electrical Store',
    supplier: 'Industrial Spares Co',
    supplierId: 'sup-003',
    lastRestocked: '2023-12-01',
    lastUsed: null,
    status: 'in_stock',
    compatibleAssets: [],
  },
  {
    id: 'inv-008',
    sku: 'SFT-GLV-L',
    name: 'Chemical Resistant Gloves - L',
    description: 'Nitrile gloves for chemical handling',
    category: 'safety',
    unit: 'pair',
    currentStock: 45,
    minStockLevel: 30,
    maxStockLevel: 100,
    reorderPoint: 40,
    reorderQty: 50,
    unitCost: 180,
    location: 'Safety Store',
    supplier: 'Industrial Spares Co',
    supplierId: 'sup-003',
    lastRestocked: '2024-01-02',
    lastUsed: '2024-01-15',
    status: 'in_stock',
    compatibleAssets: [],
  },
  {
    id: 'inv-009',
    sku: 'CHM-ANTISCL-20',
    name: 'Antiscalant Solution',
    description: 'RO antiscalant - 20L can',
    category: 'chemicals',
    unit: 'can',
    currentStock: 6,
    minStockLevel: 4,
    maxStockLevel: 20,
    reorderPoint: 6,
    reorderQty: 10,
    unitCost: 3500,
    location: 'Chemical Store - Section C',
    supplier: 'AquaChem Industries',
    supplierId: 'sup-002',
    lastRestocked: '2023-12-20',
    lastUsed: '2024-01-10',
    status: 'low_stock',
    compatibleAssets: [],
  },
  {
    id: 'inv-010',
    sku: 'TLS-WRCH-SET',
    name: 'Combination Wrench Set',
    description: 'Taparia combination wrench set 8-32mm',
    category: 'tools',
    unit: 'set',
    currentStock: 4,
    minStockLevel: 2,
    maxStockLevel: 6,
    reorderPoint: 2,
    reorderQty: 2,
    unitCost: 4500,
    location: 'Tool Room',
    supplier: 'Industrial Spares Co',
    supplierId: 'sup-003',
    lastRestocked: '2023-06-15',
    lastUsed: null,
    status: 'in_stock',
    compatibleAssets: [],
  },
];

export const stockMovements: StockMovement[] = [
  {
    id: 'mov-001',
    itemId: 'inv-002',
    itemName: 'Sodium Hypochlorite 12%',
    type: 'out',
    quantity: 5,
    reason: 'Daily dosing requirement',
    reference: null,
    performedBy: 'Operator Ravi',
    timestamp: '2024-01-15T09:00:00Z',
    balanceAfter: 8,
  },
  {
    id: 'mov-002',
    itemId: 'inv-003',
    itemName: 'Ball Bearing 6210-2RS',
    type: 'out',
    quantity: 2,
    reason: 'Pump maintenance',
    reference: 'SRV-2024-006',
    performedBy: 'Rajesh Kumar',
    timestamp: '2024-01-06T14:30:00Z',
    balanceAfter: 12,
  },
  {
    id: 'mov-003',
    itemId: 'inv-006',
    itemName: 'Cartridge Filter 10 micron',
    type: 'in',
    quantity: 50,
    reason: 'PO Received',
    reference: 'PO-2024-003',
    performedBy: 'Store Incharge',
    timestamp: '2024-01-08T11:00:00Z',
    balanceAfter: 75,
  },
  {
    id: 'mov-004',
    itemId: 'inv-004',
    itemName: 'Poly Aluminium Chloride (PAC)',
    type: 'out',
    quantity: 8,
    reason: 'Weekly consumption',
    reference: null,
    performedBy: 'Operator Kumar',
    timestamp: '2024-01-12T16:00:00Z',
    balanceAfter: 0,
  },
  {
    id: 'mov-005',
    itemId: 'inv-001',
    itemName: 'RO Membrane Element 400 sq.ft',
    type: 'out',
    quantity: 2,
    reason: 'Membrane replacement',
    reference: 'SRV-2023-089',
    performedBy: 'Vikram Rao',
    timestamp: '2024-01-10T10:00:00Z',
    balanceAfter: 4,
  },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-001',
    poNumber: 'PO-2024-001',
    supplierId: 'sup-002',
    supplierName: 'AquaChem Industries',
    items: [
      { itemId: 'inv-004', itemName: 'Poly Aluminium Chloride (PAC)', quantity: 15, unitCost: 2800, receivedQty: 0 },
      { itemId: 'inv-002', itemName: 'Sodium Hypochlorite 12%', quantity: 20, unitCost: 450, receivedQty: 0 },
    ],
    status: 'ordered',
    totalAmount: 51000,
    createdBy: 'Admin',
    createdAt: '2024-01-13T10:00:00Z',
    expectedDelivery: '2024-01-16',
    receivedAt: null,
  },
  {
    id: 'po-002',
    poNumber: 'PO-2024-002',
    supplierId: 'sup-001',
    supplierName: 'WaterTech Solutions Pvt Ltd',
    items: [
      { itemId: 'inv-001', itemName: 'RO Membrane Element 400 sq.ft', quantity: 4, unitCost: 55000, receivedQty: 0 },
    ],
    status: 'pending_approval',
    totalAmount: 220000,
    createdBy: 'Manager Priya',
    createdAt: '2024-01-14T15:00:00Z',
    expectedDelivery: null,
    receivedAt: null,
  },
  {
    id: 'po-003',
    poNumber: 'PO-2024-003',
    supplierId: 'sup-001',
    supplierName: 'WaterTech Solutions Pvt Ltd',
    items: [
      { itemId: 'inv-006', itemName: 'Cartridge Filter 10 micron', quantity: 50, unitCost: 350, receivedQty: 50 },
    ],
    status: 'received',
    totalAmount: 17500,
    createdBy: 'Store Incharge',
    createdAt: '2024-01-02T09:00:00Z',
    expectedDelivery: '2024-01-08',
    receivedAt: '2024-01-08T11:00:00Z',
  },
];

// Helper functions
export const getLowStockItems = () =>
  inventoryItems.filter(i => i.status === 'low_stock' || i.status === 'out_of_stock');

export const getOutOfStockCount = () =>
  inventoryItems.filter(i => i.status === 'out_of_stock').length;

export const getLowStockCount = () =>
  inventoryItems.filter(i => i.status === 'low_stock').length;

export const getTotalInventoryValue = () =>
  inventoryItems.reduce((sum, i) => sum + (i.currentStock * i.unitCost), 0);

export const getPendingOrdersCount = () =>
  purchaseOrders.filter(po => ['pending_approval', 'approved', 'ordered', 'partial'].includes(po.status)).length;

export const getPendingOrdersValue = () =>
  purchaseOrders
    .filter(po => ['pending_approval', 'approved', 'ordered', 'partial'].includes(po.status))
    .reduce((sum, po) => sum + po.totalAmount, 0);

export const getCategoryLabel = (category: InventoryCategory): string => {
  const labels: Record<InventoryCategory, string> = {
    spare_parts: 'Spare Parts',
    consumables: 'Consumables',
    chemicals: 'Chemicals',
    tools: 'Tools',
    safety: 'Safety Equipment',
    electrical: 'Electrical',
    mechanical: 'Mechanical',
  };
  return labels[category];
};

export const getStatusLabel = (status: StockStatus): string => {
  const labels: Record<StockStatus, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    on_order: 'On Order',
  };
  return labels[status];
};

export const getItemsByCategory = () => {
  const result: Record<InventoryCategory, number> = {
    spare_parts: 0, consumables: 0, chemicals: 0, tools: 0,
    safety: 0, electrical: 0, mechanical: 0,
  };
  inventoryItems.forEach(i => result[i.category]++);
  return result;
};
