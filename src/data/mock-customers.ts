// Customer Management (CRM) Mock Data

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  communicationPreference: 'email' | 'phone' | 'whatsapp';
}

export interface Customer {
  id: string;
  customerCode: string;
  companyName: string;
  industry: string;
  segment: 'enterprise' | 'sme' | 'government' | 'residential';
  status: 'lead' | 'prospect' | 'active' | 'inactive' | 'churned';
  billingAddress: Address;
  gstNumber?: string;
  panNumber?: string;
  creditLimit: number;
  paymentTerms: number;
  contacts: Contact[];
  plantIds: string[];
  healthScore: number;
  acquisitionDate?: Date;
  assignedAccountManager: string;
  tags: string[];
  totalRevenue: number;
  outstandingAmount: number;
  createdAt: Date;
}

export const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    customerCode: 'CUST-001',
    companyName: 'Tata Steel Limited',
    industry: 'Manufacturing',
    segment: 'enterprise',
    status: 'active',
    billingAddress: {
      street: '43, Tata Centre, Jawaharlal Nehru Road',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700071',
      country: 'India',
    },
    gstNumber: '19AABCT1234A1ZA',
    panNumber: 'AABCT1234A',
    creditLimit: 5000000,
    paymentTerms: 30,
    contacts: [
      {
        id: 'cont-1',
        customerId: 'cust-1',
        name: 'Rajesh Sharma',
        designation: 'Plant Manager',
        email: 'rajesh.sharma@tatasteel.com',
        phone: '+91 98765 43210',
        isPrimary: true,
        isDecisionMaker: true,
        communicationPreference: 'email',
      },
      {
        id: 'cont-2',
        customerId: 'cust-1',
        name: 'Priya Menon',
        designation: 'Operations Head',
        email: 'priya.menon@tatasteel.com',
        phone: '+91 98765 43211',
        isPrimary: false,
        isDecisionMaker: false,
        communicationPreference: 'whatsapp',
      },
    ],
    plantIds: ['plant-1', 'plant-2'],
    healthScore: 92,
    acquisitionDate: new Date('2022-03-15'),
    assignedAccountManager: 'Amit Singh',
    tags: ['Premium', 'Manufacturing', 'Long-term'],
    totalRevenue: 4500000,
    outstandingAmount: 350000,
    createdAt: new Date('2022-03-15'),
  },
  {
    id: 'cust-2',
    customerCode: 'CUST-002',
    companyName: 'Chennai Metropolitan Water Supply',
    industry: 'Government',
    segment: 'government',
    status: 'active',
    billingAddress: {
      street: '1, Pumping Station Road, Kilpauk',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600010',
      country: 'India',
    },
    gstNumber: '33AABCC1234A1ZB',
    creditLimit: 10000000,
    paymentTerms: 45,
    contacts: [
      {
        id: 'cont-3',
        customerId: 'cust-2',
        name: 'K. Venkataraman',
        designation: 'Chief Engineer',
        email: 'venkat@cmwssb.gov.in',
        phone: '+91 44 2534 5678',
        isPrimary: true,
        isDecisionMaker: true,
        communicationPreference: 'email',
      },
    ],
    plantIds: ['plant-3'],
    healthScore: 85,
    acquisitionDate: new Date('2021-08-20'),
    assignedAccountManager: 'Deepa Krishnan',
    tags: ['Government', 'Municipal', 'High-volume'],
    totalRevenue: 8500000,
    outstandingAmount: 1200000,
    createdAt: new Date('2021-08-20'),
  },
  {
    id: 'cust-3',
    customerCode: 'CUST-003',
    companyName: 'Reliance Industries Ltd',
    industry: 'Petrochemical',
    segment: 'enterprise',
    status: 'active',
    billingAddress: {
      street: 'Maker Chambers IV, Nariman Point',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400021',
      country: 'India',
    },
    gstNumber: '27AABCR1234A1ZC',
    panNumber: 'AABCR1234A',
    creditLimit: 8000000,
    paymentTerms: 30,
    contacts: [
      {
        id: 'cont-4',
        customerId: 'cust-3',
        name: 'Vikram Patel',
        designation: 'VP Operations',
        email: 'vikram.patel@ril.com',
        phone: '+91 22 2278 5678',
        isPrimary: true,
        isDecisionMaker: true,
        communicationPreference: 'phone',
      },
    ],
    plantIds: ['plant-4', 'plant-5'],
    healthScore: 95,
    acquisitionDate: new Date('2020-11-10'),
    assignedAccountManager: 'Amit Singh',
    tags: ['Enterprise', 'Petrochemical', 'Strategic'],
    totalRevenue: 12000000,
    outstandingAmount: 0,
    createdAt: new Date('2020-11-10'),
  },
  {
    id: 'cust-4',
    customerCode: 'CUST-004',
    companyName: 'Infosys BPO Limited',
    industry: 'IT Services',
    segment: 'enterprise',
    status: 'active',
    billingAddress: {
      street: 'Plot No. 44, Electronics City',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560100',
      country: 'India',
    },
    gstNumber: '29AABCI1234A1ZD',
    panNumber: 'AABCI1234A',
    creditLimit: 2000000,
    paymentTerms: 30,
    contacts: [
      {
        id: 'cont-5',
        customerId: 'cust-4',
        name: 'Ananya Reddy',
        designation: 'Facilities Manager',
        email: 'ananya.reddy@infosys.com',
        phone: '+91 80 2852 1234',
        isPrimary: true,
        isDecisionMaker: false,
        communicationPreference: 'email',
      },
    ],
    plantIds: ['plant-6'],
    healthScore: 78,
    acquisitionDate: new Date('2023-02-01'),
    assignedAccountManager: 'Deepa Krishnan',
    tags: ['IT Campus', 'Commercial'],
    totalRevenue: 1800000,
    outstandingAmount: 150000,
    createdAt: new Date('2023-02-01'),
  },
  {
    id: 'cust-5',
    customerCode: 'CUST-005',
    companyName: 'Sunrise Pharma Pvt Ltd',
    industry: 'Pharmaceutical',
    segment: 'sme',
    status: 'prospect',
    billingAddress: {
      street: '12, MIDC Industrial Area',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411057',
      country: 'India',
    },
    gstNumber: '27AABCS1234A1ZE',
    creditLimit: 500000,
    paymentTerms: 15,
    contacts: [
      {
        id: 'cont-6',
        customerId: 'cust-5',
        name: 'Suresh Kulkarni',
        designation: 'Director',
        email: 'suresh@sunrisepharma.in',
        phone: '+91 20 2712 3456',
        isPrimary: true,
        isDecisionMaker: true,
        communicationPreference: 'whatsapp',
      },
    ],
    plantIds: [],
    healthScore: 0,
    assignedAccountManager: 'Amit Singh',
    tags: ['Pharma', 'New Prospect'],
    totalRevenue: 0,
    outstandingAmount: 0,
    createdAt: new Date('2024-10-15'),
  },
  {
    id: 'cust-6',
    customerCode: 'CUST-006',
    companyName: 'Hyderabad Municipal Corporation',
    industry: 'Government',
    segment: 'government',
    status: 'active',
    billingAddress: {
      street: 'Tank Bund Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500063',
      country: 'India',
    },
    gstNumber: '36AABHM1234A1ZF',
    creditLimit: 15000000,
    paymentTerms: 60,
    contacts: [
      {
        id: 'cont-7',
        customerId: 'cust-6',
        name: 'Ramesh Rao',
        designation: 'Commissioner',
        email: 'commissioner@ghmc.gov.in',
        phone: '+91 40 2324 5678',
        isPrimary: true,
        isDecisionMaker: true,
        communicationPreference: 'email',
      },
    ],
    plantIds: [],
    healthScore: 72,
    acquisitionDate: new Date('2023-06-01'),
    assignedAccountManager: 'Deepa Krishnan',
    tags: ['Government', 'Municipal', 'Large-scale'],
    totalRevenue: 6500000,
    outstandingAmount: 2800000,
    createdAt: new Date('2023-06-01'),
  },
];

export const getCustomerById = (id: string): Customer | undefined => {
  return mockCustomers.find((customer) => customer.id === id);
};

export const getCustomersByStatus = (status: Customer['status']): Customer[] => {
  return mockCustomers.filter((customer) => customer.status === status);
};

export const getCustomersBySegment = (segment: Customer['segment']): Customer[] => {
  return mockCustomers.filter((customer) => customer.segment === segment);
};

export const getTotalRevenue = (): number => {
  return mockCustomers.reduce((acc, customer) => acc + customer.totalRevenue, 0);
};

export const getTotalOutstanding = (): number => {
  return mockCustomers.reduce((acc, customer) => acc + customer.outstandingAmount, 0);
};

export const getActiveCustomersCount = (): number => {
  return mockCustomers.filter((customer) => customer.status === 'active').length;
};

export const getAverageHealthScore = (): number => {
  const activeCustomers = mockCustomers.filter((c) => c.status === 'active');
  if (activeCustomers.length === 0) return 0;
  return Math.round(
    activeCustomers.reduce((acc, c) => acc + c.healthScore, 0) / activeCustomers.length
  );
};
