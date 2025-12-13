// Mock data for Service Monitor module

export type ServiceStatus = 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed';
export type ServicePriority = 'critical' | 'high' | 'medium' | 'low';
export type ServiceType = 'breakdown' | 'preventive' | 'corrective' | 'installation' | 'inspection' | 'calibration';

export interface ServiceTicket {
  id: string;
  ticketNumber: string;
  plantId: string;
  plantName: string;
  assetId: string;
  assetName: string;
  type: ServiceType;
  priority: ServicePriority;
  status: ServiceStatus;
  subject: string;
  description: string;
  reportedBy: string;
  assignedTo: string | null;
  assignedTechnicianId: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledDate: string | null;
  completedAt: string | null;
  estimatedHours: number;
  actualHours: number | null;
  partsUsed: ServicePart[];
  notes: ServiceNote[];
  slaDeadline: string;
  slaBreached: boolean;
}

export interface ServicePart {
  partId: string;
  partName: string;
  quantity: number;
  unitCost: number;
}

export interface ServiceNote {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  status: 'available' | 'on_job' | 'off_duty';
  currentTicketId: string | null;
  completedTickets: number;
  avgRating: number;
}

export const technicians: Technician[] = [
  {
    id: 'tech-001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@yozytech.com',
    phone: '+91 98765 43210',
    specialization: ['RO Systems', 'Pumps', 'Electrical'],
    status: 'on_job',
    currentTicketId: 'SRV-2024-001',
    completedTickets: 145,
    avgRating: 4.8,
  },
  {
    id: 'tech-002',
    name: 'Suresh Patel',
    email: 'suresh.patel@yozytech.com',
    phone: '+91 98765 43211',
    specialization: ['Chemical Dosing', 'pH Systems', 'Sensors'],
    status: 'available',
    currentTicketId: null,
    completedTickets: 128,
    avgRating: 4.6,
  },
  {
    id: 'tech-003',
    name: 'Amit Singh',
    email: 'amit.singh@yozytech.com',
    phone: '+91 98765 43212',
    specialization: ['SCADA', 'PLC', 'Automation'],
    status: 'on_job',
    currentTicketId: 'SRV-2024-003',
    completedTickets: 112,
    avgRating: 4.9,
  },
  {
    id: 'tech-004',
    name: 'Vikram Rao',
    email: 'vikram.rao@yozytech.com',
    phone: '+91 98765 43213',
    specialization: ['Filtration', 'Membranes', 'UF Systems'],
    status: 'off_duty',
    currentTicketId: null,
    completedTickets: 98,
    avgRating: 4.5,
  },
];

export const serviceTickets: ServiceTicket[] = [
  {
    id: 'SRV-2024-001',
    ticketNumber: 'SRV-2024-001',
    plantId: 'plant-001',
    plantName: 'Chennai WTP',
    assetId: 'asset-001',
    assetName: 'RO Unit #1',
    type: 'breakdown',
    priority: 'critical',
    status: 'in_progress',
    subject: 'RO membrane pressure drop - Critical',
    description: 'Sudden pressure drop observed in RO Unit #1. Production reduced by 40%. Immediate attention required.',
    reportedBy: 'Operator - Ravi',
    assignedTo: 'Rajesh Kumar',
    assignedTechnicianId: 'tech-001',
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T10:45:00Z',
    scheduledDate: '2024-01-15T09:00:00Z',
    completedAt: null,
    estimatedHours: 4,
    actualHours: null,
    partsUsed: [],
    notes: [
      {
        id: 'note-001',
        author: 'Rajesh Kumar',
        content: 'Arrived at site. Initial inspection shows possible membrane fouling.',
        timestamp: '2024-01-15T09:30:00Z',
      },
      {
        id: 'note-002',
        author: 'Rajesh Kumar',
        content: 'Performing CIP cleaning procedure. Will update in 2 hours.',
        timestamp: '2024-01-15T10:45:00Z',
      },
    ],
    slaDeadline: '2024-01-15T12:30:00Z',
    slaBreached: false,
  },
  {
    id: 'SRV-2024-002',
    ticketNumber: 'SRV-2024-002',
    plantId: 'plant-002',
    plantName: 'Bangalore STP',
    assetId: 'asset-005',
    assetName: 'Dosing Pump #3',
    type: 'preventive',
    priority: 'medium',
    status: 'open',
    subject: 'Scheduled preventive maintenance - Dosing Pump',
    description: 'Quarterly preventive maintenance for chemical dosing pump as per AMC schedule.',
    reportedBy: 'System - Auto Generated',
    assignedTo: null,
    assignedTechnicianId: null,
    createdAt: '2024-01-14T06:00:00Z',
    updatedAt: '2024-01-14T06:00:00Z',
    scheduledDate: '2024-01-16T10:00:00Z',
    completedAt: null,
    estimatedHours: 2,
    actualHours: null,
    partsUsed: [],
    notes: [],
    slaDeadline: '2024-01-16T18:00:00Z',
    slaBreached: false,
  },
  {
    id: 'SRV-2024-003',
    ticketNumber: 'SRV-2024-003',
    plantId: 'plant-003',
    plantName: 'Hyderabad ETP',
    assetId: 'asset-010',
    assetName: 'PLC Controller',
    type: 'corrective',
    priority: 'high',
    status: 'in_progress',
    subject: 'PLC communication failure with SCADA',
    description: 'Intermittent communication loss between PLC and SCADA system. Data logging affected.',
    reportedBy: 'Manager - Priya',
    assignedTo: 'Amit Singh',
    assignedTechnicianId: 'tech-003',
    createdAt: '2024-01-15T07:15:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
    scheduledDate: '2024-01-15T08:00:00Z',
    completedAt: null,
    estimatedHours: 3,
    actualHours: null,
    partsUsed: [],
    notes: [
      {
        id: 'note-003',
        author: 'Amit Singh',
        content: 'Issue identified - faulty ethernet cable. Replacement in progress.',
        timestamp: '2024-01-15T11:00:00Z',
      },
    ],
    slaDeadline: '2024-01-15T15:15:00Z',
    slaBreached: false,
  },
  {
    id: 'SRV-2024-004',
    ticketNumber: 'SRV-2024-004',
    plantId: 'plant-001',
    plantName: 'Chennai WTP',
    assetId: 'asset-003',
    assetName: 'pH Sensor #2',
    type: 'calibration',
    priority: 'low',
    status: 'resolved',
    subject: 'Monthly pH sensor calibration',
    description: 'Routine monthly calibration of pH sensors as per SOP.',
    reportedBy: 'System - Auto Generated',
    assignedTo: 'Suresh Patel',
    assignedTechnicianId: 'tech-002',
    createdAt: '2024-01-10T06:00:00Z',
    updatedAt: '2024-01-10T14:30:00Z',
    scheduledDate: '2024-01-10T10:00:00Z',
    completedAt: '2024-01-10T14:30:00Z',
    estimatedHours: 2,
    actualHours: 1.5,
    partsUsed: [
      { partId: 'part-001', partName: 'pH Buffer Solution 4.0', quantity: 1, unitCost: 450 },
      { partId: 'part-002', partName: 'pH Buffer Solution 7.0', quantity: 1, unitCost: 450 },
    ],
    notes: [
      {
        id: 'note-004',
        author: 'Suresh Patel',
        content: 'Calibration completed successfully. Sensor accuracy within 0.02 pH.',
        timestamp: '2024-01-10T14:30:00Z',
      },
    ],
    slaDeadline: '2024-01-10T18:00:00Z',
    slaBreached: false,
  },
  {
    id: 'SRV-2024-005',
    ticketNumber: 'SRV-2024-005',
    plantId: 'plant-004',
    plantName: 'Mumbai ZLD',
    assetId: 'asset-015',
    assetName: 'Evaporator Unit',
    type: 'inspection',
    priority: 'medium',
    status: 'on_hold',
    subject: 'Annual evaporator inspection',
    description: 'Annual inspection of evaporator unit. Waiting for plant shutdown window.',
    reportedBy: 'Manager - Ankit',
    assignedTo: 'Vikram Rao',
    assignedTechnicianId: 'tech-004',
    createdAt: '2024-01-08T09:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
    scheduledDate: '2024-01-20T08:00:00Z',
    completedAt: null,
    estimatedHours: 8,
    actualHours: null,
    partsUsed: [],
    notes: [
      {
        id: 'note-005',
        author: 'Vikram Rao',
        content: 'Inspection postponed to Jan 20 due to production requirements.',
        timestamp: '2024-01-12T16:00:00Z',
      },
    ],
    slaDeadline: '2024-01-22T18:00:00Z',
    slaBreached: false,
  },
  {
    id: 'SRV-2024-006',
    ticketNumber: 'SRV-2024-006',
    plantId: 'plant-002',
    plantName: 'Bangalore STP',
    assetId: 'asset-008',
    assetName: 'Blower #2',
    type: 'breakdown',
    priority: 'critical',
    status: 'closed',
    subject: 'Blower motor failure - Emergency',
    description: 'Blower #2 motor seized. Aeration affected. Emergency repair completed.',
    reportedBy: 'Operator - Kumar',
    assignedTo: 'Rajesh Kumar',
    assignedTechnicianId: 'tech-001',
    createdAt: '2024-01-05T22:30:00Z',
    updatedAt: '2024-01-06T08:00:00Z',
    scheduledDate: '2024-01-05T23:00:00Z',
    completedAt: '2024-01-06T06:30:00Z',
    estimatedHours: 6,
    actualHours: 7.5,
    partsUsed: [
      { partId: 'part-010', partName: 'Blower Motor 15HP', quantity: 1, unitCost: 45000 },
      { partId: 'part-011', partName: 'Coupling Assembly', quantity: 1, unitCost: 3500 },
      { partId: 'part-012', partName: 'Bearing Set', quantity: 2, unitCost: 1200 },
    ],
    notes: [
      {
        id: 'note-006',
        author: 'Rajesh Kumar',
        content: 'Motor replacement completed. System back online.',
        timestamp: '2024-01-06T06:30:00Z',
      },
      {
        id: 'note-007',
        author: 'Manager - Priya',
        content: 'Verified operation. Ticket closed.',
        timestamp: '2024-01-06T08:00:00Z',
      },
    ],
    slaDeadline: '2024-01-06T02:30:00Z',
    slaBreached: true,
  },
];

// Helper functions
export const getOpenTicketsCount = () =>
  serviceTickets.filter(t => ['open', 'in_progress', 'on_hold'].includes(t.status)).length;

export const getCriticalTicketsCount = () =>
  serviceTickets.filter(t => t.priority === 'critical' && t.status !== 'closed').length;

export const getAvgResolutionTime = () => {
  const resolved = serviceTickets.filter(t => t.completedAt && t.actualHours);
  if (resolved.length === 0) return 0;
  return resolved.reduce((sum, t) => sum + (t.actualHours || 0), 0) / resolved.length;
};

export const getSLAComplianceRate = () => {
  const completed = serviceTickets.filter(t => ['resolved', 'closed'].includes(t.status));
  if (completed.length === 0) return 100;
  const compliant = completed.filter(t => !t.slaBreached).length;
  return Math.round((compliant / completed.length) * 100);
};

export const getAvailableTechnicians = () =>
  technicians.filter(t => t.status === 'available');

export const getServiceTypeLabel = (type: ServiceType): string => {
  const labels: Record<ServiceType, string> = {
    breakdown: 'Breakdown',
    preventive: 'Preventive',
    corrective: 'Corrective',
    installation: 'Installation',
    inspection: 'Inspection',
    calibration: 'Calibration',
  };
  return labels[type];
};

export const getStatusLabel = (status: ServiceStatus): string => {
  const labels: Record<ServiceStatus, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return labels[status];
};

export const getPriorityLabel = (priority: ServicePriority): string => {
  const labels: Record<ServicePriority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };
  return labels[priority];
};
