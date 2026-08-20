// Mock data for Proposal Builder module

export type ProposalStatus = 'draft' | 'pending_review' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
export type ProposalType = 'new_project' | 'amc' | 'upgrade' | 'consumables' | 'service' | 'custom';

export interface Proposal {
  id: string;
  proposalNumber: string;
  title: string;
  type: ProposalType;
  customerId: string;
  customerName: string;
  contactPerson: string;
  contactEmail: string;
  status: ProposalStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  validUntil: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  sections: ProposalSection[];
  lineItems: LineItem[];
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  taxes: number;
  total: number;
  terms: string;
  notes: string;
  attachments: Attachment[];
}

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface LineItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  notes: string | null;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  type: ProposalType;
  description: string;
  sections: ProposalSection[];
  defaultItems: Omit<LineItem, 'id'>[];
  defaultTerms: string;
}

export const proposalTemplates: ProposalTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Water Treatment Plant - New Installation',
    type: 'new_project',
    description: 'Complete WTP installation proposal with equipment, civil works, and commissioning',
    sections: [
      { id: 's1', title: 'Executive Summary', content: 'Brief overview of the proposed solution...', order: 1 },
      { id: 's2', title: 'Technical Specifications', content: 'Detailed technical specifications...', order: 2 },
      { id: 's3', title: 'Scope of Work', content: 'Complete scope of work including...', order: 3 },
      { id: 's4', title: 'Project Timeline', content: 'Implementation schedule...', order: 4 },
      { id: 's5', title: 'Warranty & Support', content: 'Warranty terms and support details...', order: 5 },
    ],
    defaultItems: [
      { description: 'RO System 100 KLD', category: 'Equipment', quantity: 1, unit: 'nos', unitPrice: 2500000, amount: 2500000, notes: null },
      { description: 'Pre-treatment System', category: 'Equipment', quantity: 1, unit: 'lot', unitPrice: 800000, amount: 800000, notes: null },
      { description: 'Civil & Structural Works', category: 'Civil', quantity: 1, unit: 'lot', unitPrice: 500000, amount: 500000, notes: null },
      { description: 'Installation & Commissioning', category: 'Services', quantity: 1, unit: 'lot', unitPrice: 300000, amount: 300000, notes: null },
    ],
    defaultTerms: '50% advance, 40% on delivery, 10% on commissioning. Validity: 30 days.',
  },
  {
    id: 'tpl-002',
    name: 'Annual Maintenance Contract (AMC)',
    type: 'amc',
    description: 'Standard AMC proposal with preventive maintenance and breakdown support',
    sections: [
      { id: 's1', title: 'Scope of AMC', content: 'Coverage details and inclusions...', order: 1 },
      { id: 's2', title: 'Service Schedule', content: 'Preventive maintenance schedule...', order: 2 },
      { id: 's3', title: 'Response Time SLA', content: 'Guaranteed response times...', order: 3 },
      { id: 's4', title: 'Exclusions', content: 'Items not covered under AMC...', order: 4 },
    ],
    defaultItems: [
      { description: 'Comprehensive AMC - 12 months', category: 'Service', quantity: 1, unit: 'year', unitPrice: 180000, amount: 180000, notes: null },
      { description: 'Quarterly Preventive Maintenance', category: 'Service', quantity: 4, unit: 'visits', unitPrice: 15000, amount: 60000, notes: 'Included in AMC' },
      { description: 'Emergency Support (24x7)', category: 'Service', quantity: 1, unit: 'year', unitPrice: 0, amount: 0, notes: 'Included' },
    ],
    defaultTerms: '100% advance for annual contract. Validity: 15 days.',
  },
  {
    id: 'tpl-003',
    name: 'System Upgrade Proposal',
    type: 'upgrade',
    description: 'Proposal for system upgrades, capacity enhancement, or technology upgrades',
    sections: [
      { id: 's1', title: 'Current System Assessment', content: 'Analysis of existing system...', order: 1 },
      { id: 's2', title: 'Proposed Upgrades', content: 'Recommended improvements...', order: 2 },
      { id: 's3', title: 'Benefits & ROI', content: 'Expected benefits and return on investment...', order: 3 },
      { id: 's4', title: 'Implementation Plan', content: 'Phased implementation approach...', order: 4 },
    ],
    defaultItems: [],
    defaultTerms: '50% advance, 50% on completion. Validity: 30 days.',
  },
  {
    id: 'tpl-004',
    name: 'Consumables & Spares Quote',
    type: 'consumables',
    description: 'Quick quote for consumables, chemicals, and spare parts',
    sections: [
      { id: 's1', title: 'Product Details', content: 'Detailed product specifications...', order: 1 },
      { id: 's2', title: 'Delivery Terms', content: 'Delivery schedule and terms...', order: 2 },
    ],
    defaultItems: [],
    defaultTerms: '100% advance. Delivery within 7 working days. Validity: 7 days.',
  },
];

export const proposals: Proposal[] = [
  {
    id: 'prop-001',
    proposalNumber: 'PROP-2024-001',
    title: 'WTP Upgrade - Phase 2 Expansion',
    type: 'upgrade',
    customerId: 'cust-001',
    customerName: 'TechPark Industries',
    contactPerson: 'Arun Sharma',
    contactEmail: 'arun.sharma@techpark.com',
    status: 'sent',
    createdBy: 'Sales Manager',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-12T14:00:00Z',
    validUntil: '2024-02-10',
    sentAt: '2024-01-12T14:30:00Z',
    viewedAt: '2024-01-12T16:45:00Z',
    respondedAt: null,
    sections: [
      { id: 's1', title: 'Executive Summary', content: 'Phase 2 expansion to increase capacity from 100 KLD to 200 KLD...', order: 1 },
      { id: 's2', title: 'Technical Proposal', content: 'Additional RO train with 100 KLD capacity...', order: 2 },
      { id: 's3', title: 'Project Timeline', content: '12 weeks from order confirmation...', order: 3 },
    ],
    lineItems: [
      { id: 'li-001', description: 'RO System 100 KLD - Additional Train', category: 'Equipment', quantity: 1, unit: 'nos', unitPrice: 2200000, amount: 2200000, notes: null },
      { id: 'li-002', description: 'High Pressure Pump 64 m³/hr', category: 'Equipment', quantity: 2, unit: 'nos', unitPrice: 180000, amount: 360000, notes: 'Grundfos CRN series' },
      { id: 'li-003', description: 'Piping & Valves', category: 'Materials', quantity: 1, unit: 'lot', unitPrice: 280000, amount: 280000, notes: 'SS316L' },
      { id: 'li-004', description: 'Electrical Panel & Cabling', category: 'Electrical', quantity: 1, unit: 'lot', unitPrice: 320000, amount: 320000, notes: null },
      { id: 'li-005', description: 'Installation & Commissioning', category: 'Services', quantity: 1, unit: 'lot', unitPrice: 250000, amount: 250000, notes: null },
    ],
    subtotal: 3410000,
    discount: 5,
    discountType: 'percentage',
    taxes: 553620,
    total: 3793120,
    terms: '40% advance with order, 40% on delivery, 20% on commissioning. Warranty: 12 months from commissioning.',
    notes: 'Price valid for 30 days. Delivery: 8-10 weeks from advance receipt.',
    attachments: [
      { id: 'att-001', name: 'Technical_Datasheet.pdf', type: 'application/pdf', size: 2450000, url: '/files/tech_ds.pdf' },
      { id: 'att-002', name: 'Project_Layout.dwg', type: 'application/dwg', size: 5200000, url: '/files/layout.dwg' },
    ],
  },
  {
    id: 'prop-002',
    proposalNumber: 'PROP-2024-002',
    title: 'Comprehensive AMC - Bangalore STP',
    type: 'amc',
    customerId: 'cust-002',
    customerName: 'GreenValley Township',
    contactPerson: 'Priya Menon',
    contactEmail: 'priya@greenvalley.in',
    status: 'accepted',
    createdBy: 'Service Manager',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z',
    validUntil: '2024-01-20',
    sentAt: '2024-01-05T15:00:00Z',
    viewedAt: '2024-01-06T09:30:00Z',
    respondedAt: '2024-01-08T10:00:00Z',
    sections: [
      { id: 's1', title: 'AMC Scope', content: 'Comprehensive maintenance coverage for 500 KLD STP...', order: 1 },
      { id: 's2', title: 'Service Schedule', content: 'Monthly preventive maintenance visits...', order: 2 },
      { id: 's3', title: 'SLA Terms', content: '4-hour response for critical issues, 24-hour for normal...', order: 3 },
    ],
    lineItems: [
      { id: 'li-006', description: 'Comprehensive AMC - 12 months', category: 'Service', quantity: 1, unit: 'year', unitPrice: 360000, amount: 360000, notes: null },
      { id: 'li-007', description: 'Consumables Package', category: 'Materials', quantity: 1, unit: 'lot', unitPrice: 85000, amount: 85000, notes: 'Filters, lubricants, chemicals' },
    ],
    subtotal: 445000,
    discount: 0,
    discountType: 'fixed',
    taxes: 80100,
    total: 525100,
    terms: '100% advance payment. Contract period: April 2024 to March 2025.',
    notes: 'Includes 24x7 emergency support. Excludes major breakdowns and spare parts.',
    attachments: [],
  },
  {
    id: 'prop-003',
    proposalNumber: 'PROP-2024-003',
    title: 'Chemical Supply - Q1 2024',
    type: 'consumables',
    customerId: 'cust-003',
    customerName: 'Metro Water Authority',
    contactPerson: 'Suresh Kumar',
    contactEmail: 'suresh.kumar@metrowater.gov.in',
    status: 'draft',
    createdBy: 'Sales Executive',
    createdAt: '2024-01-14T10:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
    validUntil: '2024-01-21',
    sentAt: null,
    viewedAt: null,
    respondedAt: null,
    sections: [
      { id: 's1', title: 'Product Details', content: 'Quarterly chemical supply as per rate contract...', order: 1 },
    ],
    lineItems: [
      { id: 'li-008', description: 'Sodium Hypochlorite 12%', category: 'Chemicals', quantity: 200, unit: 'can (25L)', unitPrice: 450, amount: 90000, notes: null },
      { id: 'li-009', description: 'Poly Aluminium Chloride', category: 'Chemicals', quantity: 100, unit: 'bag (50kg)', unitPrice: 2800, amount: 280000, notes: null },
      { id: 'li-010', description: 'Lime Powder', category: 'Chemicals', quantity: 50, unit: 'bag (25kg)', unitPrice: 180, amount: 9000, notes: null },
    ],
    subtotal: 379000,
    discount: 3,
    discountType: 'percentage',
    taxes: 66162,
    total: 433792,
    terms: 'Payment: Net 30 days. Delivery: Weekly batches as per schedule.',
    notes: 'Prices as per annual rate contract RC-2023-045.',
    attachments: [],
  },
  {
    id: 'prop-004',
    proposalNumber: 'PROP-2024-004',
    title: 'New ETP Installation - Pharma Plant',
    type: 'new_project',
    customerId: 'cust-004',
    customerName: 'PharmaCare Ltd',
    contactPerson: 'Dr. Anand Rao',
    contactEmail: 'anand.rao@pharmacare.com',
    status: 'pending_review',
    createdBy: 'Business Development',
    createdAt: '2024-01-13T14:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    validUntil: '2024-02-13',
    sentAt: null,
    viewedAt: null,
    respondedAt: null,
    sections: [
      { id: 's1', title: 'Executive Summary', content: 'Turn-key ETP solution for pharmaceutical effluent...', order: 1 },
      { id: 's2', title: 'Process Design', content: 'Multi-stage treatment: Equalization > Primary > Secondary > Tertiary...', order: 2 },
      { id: 's3', title: 'Compliance', content: 'Designed to meet CPCB/SPCB discharge norms...', order: 3 },
      { id: 's4', title: 'Project Execution', content: '16-week implementation schedule...', order: 4 },
    ],
    lineItems: [
      { id: 'li-011', description: 'ETP System 200 KLD - Complete', category: 'Equipment', quantity: 1, unit: 'lot', unitPrice: 8500000, amount: 8500000, notes: 'Turn-key solution' },
      { id: 'li-012', description: 'Civil Works', category: 'Civil', quantity: 1, unit: 'lot', unitPrice: 2200000, amount: 2200000, notes: 'Tanks, foundations, buildings' },
      { id: 'li-013', description: 'Electrical & Instrumentation', category: 'Electrical', quantity: 1, unit: 'lot', unitPrice: 1800000, amount: 1800000, notes: 'Complete E&I package' },
      { id: 'li-014', description: 'SCADA & Automation', category: 'Automation', quantity: 1, unit: 'lot', unitPrice: 950000, amount: 950000, notes: 'Siemens S7-1500 based' },
      { id: 'li-015', description: 'Project Management', category: 'Services', quantity: 1, unit: 'lot', unitPrice: 450000, amount: 450000, notes: null },
    ],
    subtotal: 13900000,
    discount: 500000,
    discountType: 'fixed',
    taxes: 2412000,
    total: 15812000,
    terms: '30% advance, 30% against material dispatch, 30% on erection completion, 10% on commissioning & handover.',
    notes: 'Includes 1-year comprehensive warranty. O&M support available separately.',
    attachments: [
      { id: 'att-003', name: 'Process_Flow_Diagram.pdf', type: 'application/pdf', size: 1800000, url: '/files/pfd.pdf' },
      { id: 'att-004', name: 'Compliance_Certificate.pdf', type: 'application/pdf', size: 450000, url: '/files/compliance.pdf' },
    ],
  },
  {
    id: 'prop-005',
    proposalNumber: 'PROP-2023-089',
    title: 'Membrane Replacement - Chennai WTP',
    type: 'service',
    customerId: 'cust-001',
    customerName: 'TechPark Industries',
    contactPerson: 'Arun Sharma',
    contactEmail: 'arun.sharma@techpark.com',
    status: 'rejected',
    createdBy: 'Service Manager',
    createdAt: '2023-12-20T10:00:00Z',
    updatedAt: '2023-12-28T11:00:00Z',
    validUntil: '2024-01-05',
    sentAt: '2023-12-20T14:00:00Z',
    viewedAt: '2023-12-21T09:00:00Z',
    respondedAt: '2023-12-28T11:00:00Z',
    sections: [
      { id: 's1', title: 'Requirement', content: 'Replacement of 6 RO membrane elements...', order: 1 },
    ],
    lineItems: [
      { id: 'li-016', description: 'RO Membrane TM820M-400', category: 'Spares', quantity: 6, unit: 'nos', unitPrice: 55000, amount: 330000, notes: 'Toray make' },
      { id: 'li-017', description: 'Installation Charges', category: 'Services', quantity: 1, unit: 'lot', unitPrice: 25000, amount: 25000, notes: null },
    ],
    subtotal: 355000,
    discount: 0,
    discountType: 'fixed',
    taxes: 63900,
    total: 418900,
    terms: '100% advance. Delivery: 2 weeks.',
    notes: 'Customer opted for local supplier.',
    attachments: [],
  },
];

// Helper functions
export const getProposalsByStatus = (status: ProposalStatus) =>
  proposals.filter(p => p.status === status);

export const getDraftProposals = () =>
  proposals.filter(p => p.status === 'draft');

export const getPendingProposals = () =>
  proposals.filter(p => ['pending_review', 'sent', 'viewed'].includes(p.status));

export const getAcceptedProposals = () =>
  proposals.filter(p => p.status === 'accepted');

export const getTotalPipelineValue = () =>
  proposals
    .filter(p => ['sent', 'viewed', 'pending_review'].includes(p.status))
    .reduce((sum, p) => sum + p.total, 0);

export const getConversionRate = () => {
  const sent = proposals.filter(p => ['sent', 'viewed', 'accepted', 'rejected'].includes(p.status)).length;
  const accepted = proposals.filter(p => p.status === 'accepted').length;
  return sent > 0 ? Math.round((accepted / sent) * 100) : 0;
};

export const getAvgProposalValue = () => {
  if (proposals.length === 0) return 0;
  return Math.round(proposals.reduce((sum, p) => sum + p.total, 0) / proposals.length);
};

export const getProposalTypeLabel = (type: ProposalType): string => {
  const labels: Record<ProposalType, string> = {
    new_project: 'New Project',
    amc: 'AMC',
    upgrade: 'Upgrade',
    consumables: 'Consumables',
    service: 'Service',
    custom: 'Custom',
  };
  return labels[type];
};

export const getStatusLabel = (status: ProposalStatus): string => {
  const labels: Record<ProposalStatus, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    sent: 'Sent',
    viewed: 'Viewed',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
  };
  return labels[status];
};

export const getMonthlyProposals = () => {
  return [
    { month: 'Aug', sent: 8, accepted: 5, value: 2400000 },
    { month: 'Sep', sent: 12, accepted: 7, value: 3800000 },
    { month: 'Oct', sent: 10, accepted: 6, value: 2900000 },
    { month: 'Nov', sent: 15, accepted: 9, value: 5200000 },
    { month: 'Dec', sent: 11, accepted: 6, value: 3100000 },
    { month: 'Jan', sent: 4, accepted: 1, value: 525100 },
  ];
};
