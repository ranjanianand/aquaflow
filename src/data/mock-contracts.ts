// Contract & AMC Management Mock Data

export interface SLADefinition {
  responseTime: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  resolutionTime: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  uptimeGuarantee: number;
  preventiveMaintenanceFrequency: 'weekly' | 'monthly' | 'quarterly';
}

export interface EscalationLevel {
  level: number;
  triggerAfterMinutes: number;
  notifyRoles: string[];
  notifyUsers: string[];
  notifyCustomerContacts: boolean;
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  type: 'amc' | 'camc' | 'warranty' | 'o_and_m' | 'consumables' | 'project';
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  startDate: Date;
  endDate: Date;
  value: number;
  billingFrequency: 'monthly' | 'quarterly' | 'annual';
  autoRenew: boolean;
  coveredPlants: string[];
  coveredPlantNames: string[];
  sla: SLADefinition;
  escalationMatrix: EscalationLevel[];
  documents: string[];
  createdAt: Date;
  renewalReminder: boolean;
  lastServiceDate?: Date;
  nextServiceDate?: Date;
}

const defaultSLA: SLADefinition = {
  responseTime: {
    critical: 2,
    high: 4,
    medium: 8,
    low: 24,
  },
  resolutionTime: {
    critical: 8,
    high: 24,
    medium: 48,
    low: 72,
  },
  uptimeGuarantee: 99.5,
  preventiveMaintenanceFrequency: 'monthly',
};

const defaultEscalation: EscalationLevel[] = [
  {
    level: 1,
    triggerAfterMinutes: 60,
    notifyRoles: ['operator'],
    notifyUsers: [],
    notifyCustomerContacts: false,
  },
  {
    level: 2,
    triggerAfterMinutes: 120,
    notifyRoles: ['manager'],
    notifyUsers: [],
    notifyCustomerContacts: true,
  },
  {
    level: 3,
    triggerAfterMinutes: 240,
    notifyRoles: ['admin'],
    notifyUsers: [],
    notifyCustomerContacts: true,
  },
];

export const mockContracts: Contract[] = [
  {
    id: 'contract-1',
    contractNumber: 'AMC-2024-001',
    customerId: 'cust-1',
    customerName: 'Tata Steel Limited',
    type: 'camc',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    value: 1200000,
    billingFrequency: 'quarterly',
    autoRenew: true,
    coveredPlants: ['plant-1', 'plant-2'],
    coveredPlantNames: ['Chennai WTP-01', 'Mumbai WTP-02'],
    sla: {
      ...defaultSLA,
      uptimeGuarantee: 99.9,
    },
    escalationMatrix: defaultEscalation,
    documents: ['contract.pdf', 'sla_agreement.pdf'],
    createdAt: new Date('2023-12-15'),
    renewalReminder: true,
    lastServiceDate: new Date('2024-11-15'),
    nextServiceDate: new Date('2024-12-15'),
  },
  {
    id: 'contract-2',
    contractNumber: 'OM-2024-002',
    customerId: 'cust-2',
    customerName: 'Chennai Metropolitan Water Supply',
    type: 'o_and_m',
    status: 'active',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2027-03-31'),
    value: 5000000,
    billingFrequency: 'monthly',
    autoRenew: false,
    coveredPlants: ['plant-3'],
    coveredPlantNames: ['Delhi WTP-03'],
    sla: defaultSLA,
    escalationMatrix: defaultEscalation,
    documents: ['contract.pdf', 'scope_of_work.pdf', 'sla_agreement.pdf'],
    createdAt: new Date('2024-03-01'),
    renewalReminder: true,
    lastServiceDate: new Date('2024-12-01'),
    nextServiceDate: new Date('2025-01-01'),
  },
  {
    id: 'contract-3',
    contractNumber: 'AMC-2024-003',
    customerId: 'cust-3',
    customerName: 'Reliance Industries Ltd',
    type: 'camc',
    status: 'active',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2025-05-31'),
    value: 2400000,
    billingFrequency: 'quarterly',
    autoRenew: true,
    coveredPlants: ['plant-4', 'plant-5'],
    coveredPlantNames: ['Bangalore WTP-04', 'Hyderabad WTP-05'],
    sla: {
      ...defaultSLA,
      responseTime: {
        critical: 1,
        high: 2,
        medium: 4,
        low: 8,
      },
    },
    escalationMatrix: defaultEscalation,
    documents: ['contract.pdf'],
    createdAt: new Date('2024-05-15'),
    renewalReminder: true,
    lastServiceDate: new Date('2024-11-20'),
    nextServiceDate: new Date('2024-12-20'),
  },
  {
    id: 'contract-4',
    contractNumber: 'WRN-2024-004',
    customerId: 'cust-4',
    customerName: 'Infosys BPO Limited',
    type: 'warranty',
    status: 'active',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-01-31'),
    value: 0,
    billingFrequency: 'annual',
    autoRenew: false,
    coveredPlants: ['plant-6'],
    coveredPlantNames: ['Pune WTP-06'],
    sla: defaultSLA,
    escalationMatrix: defaultEscalation,
    documents: ['warranty_certificate.pdf'],
    createdAt: new Date('2024-02-01'),
    renewalReminder: true,
    lastServiceDate: new Date('2024-10-15'),
    nextServiceDate: new Date('2025-01-15'),
  },
  {
    id: 'contract-5',
    contractNumber: 'CON-2023-005',
    customerId: 'cust-6',
    customerName: 'Hyderabad Municipal Corporation',
    type: 'consumables',
    status: 'active',
    startDate: new Date('2023-07-01'),
    endDate: new Date('2024-06-30'),
    value: 800000,
    billingFrequency: 'monthly',
    autoRenew: true,
    coveredPlants: [],
    coveredPlantNames: [],
    sla: defaultSLA,
    escalationMatrix: [],
    documents: ['contract.pdf', 'chemical_schedule.pdf'],
    createdAt: new Date('2023-06-15'),
    renewalReminder: true,
  },
  {
    id: 'contract-6',
    contractNumber: 'AMC-2023-006',
    customerId: 'cust-1',
    customerName: 'Tata Steel Limited',
    type: 'amc',
    status: 'expired',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    value: 1000000,
    billingFrequency: 'quarterly',
    autoRenew: false,
    coveredPlants: ['plant-1'],
    coveredPlantNames: ['Chennai WTP-01'],
    sla: defaultSLA,
    escalationMatrix: defaultEscalation,
    documents: ['contract.pdf'],
    createdAt: new Date('2022-12-15'),
    renewalReminder: false,
  },
];

export const getContractById = (id: string): Contract | undefined => {
  return mockContracts.find((contract) => contract.id === id);
};

export const getContractsByCustomer = (customerId: string): Contract[] => {
  return mockContracts.filter((contract) => contract.customerId === customerId);
};

export const getContractsByStatus = (status: Contract['status']): Contract[] => {
  return mockContracts.filter((contract) => contract.status === status);
};

export const getContractsByType = (type: Contract['type']): Contract[] => {
  return mockContracts.filter((contract) => contract.type === type);
};

export const getActiveContractsCount = (): number => {
  return mockContracts.filter((contract) => contract.status === 'active').length;
};

export const getExpiringContracts = (days: number = 30): Contract[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return mockContracts.filter(
    (contract) =>
      contract.status === 'active' &&
      contract.endDate <= futureDate &&
      contract.endDate >= now
  );
};

export const getTotalContractValue = (): number => {
  return mockContracts
    .filter((c) => c.status === 'active')
    .reduce((acc, contract) => acc + contract.value, 0);
};

export const getContractTypeLabel = (type: Contract['type']): string => {
  const labels: Record<Contract['type'], string> = {
    amc: 'AMC',
    camc: 'CAMC',
    warranty: 'Warranty',
    o_and_m: 'O&M',
    consumables: 'Consumables',
    project: 'Project',
  };
  return labels[type];
};
