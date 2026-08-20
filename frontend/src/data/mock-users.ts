import { User, UserRole } from '@/types';

// Helper to create dates relative to now
const minutesAgo = (minutes: number): Date => new Date(Date.now() - minutes * 60000);
const hoursAgo = (hours: number): Date => new Date(Date.now() - hours * 3600000);
const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 3600000);

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Rahul Kumar',
    email: 'rahul.kumar@aquaflow.io',
    phone: '+91 98765 43210',
    role: 'admin',
    plantAccess: ['all'],
    lastActive: minutesAgo(5),
    status: 'active',
  },
  {
    id: 'user-2',
    name: 'Priya Sharma',
    email: 'priya.sharma@aquaflow.io',
    phone: '+91 98765 43211',
    role: 'manager',
    plantAccess: ['plant-1', 'plant-2', 'plant-4'],
    lastActive: minutesAgo(15),
    status: 'active',
  },
  {
    id: 'user-3',
    name: 'Amit Singh',
    email: 'amit.singh@aquaflow.io',
    phone: '+91 98765 43212',
    role: 'operator',
    plantAccess: ['plant-1', 'plant-3'],
    lastActive: hoursAgo(2),
    status: 'active',
  },
  {
    id: 'user-4',
    name: 'Sneha Patel',
    email: 'sneha.patel@aquaflow.io',
    phone: '+91 98765 43213',
    role: 'operator',
    plantAccess: ['plant-2', 'plant-5'],
    lastActive: hoursAgo(4),
    status: 'active',
  },
  {
    id: 'user-5',
    name: 'Vikram Reddy',
    email: 'vikram.reddy@aquaflow.io',
    phone: '+91 98765 43214',
    role: 'viewer',
    plantAccess: ['plant-4', 'plant-5', 'plant-6'],
    lastActive: daysAgo(1),
    status: 'active',
  },
  {
    id: 'user-6',
    name: 'Anjali Menon',
    email: 'anjali.menon@aquaflow.io',
    phone: '+91 98765 43215',
    role: 'manager',
    plantAccess: ['plant-3', 'plant-5', 'plant-6'],
    lastActive: hoursAgo(1),
    status: 'active',
  },
  {
    id: 'user-7',
    name: 'Deepak Gupta',
    email: 'deepak.gupta@aquaflow.io',
    phone: '+91 98765 43216',
    role: 'operator',
    plantAccess: ['plant-6'],
    lastActive: daysAgo(3),
    status: 'inactive',
  },
];

// Current user (for session simulation)
export const currentUser: User = mockUsers[0];

export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getUsersByRole = (role: UserRole): User[] => {
  return mockUsers.filter(user => user.role === role);
};

export const getUsersByPlant = (plantId: string): User[] => {
  return mockUsers.filter(
    user => user.plantAccess.includes('all') || user.plantAccess.includes(plantId)
  );
};

export const getActiveUsersCount = (): number => {
  return mockUsers.filter(user => user.status === 'active').length;
};

// Role permissions
export const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'view_dashboard',
    'view_monitoring',
    'view_alerts',
    'manage_alerts',
    'view_trends',
    'view_reports',
    'generate_reports',
    'view_assets',
    'manage_assets',
    'view_users',
    'manage_users',
    'view_settings',
    'manage_settings',
    'view_ai_support',
    'view_predictive',
    'view_process_flow',
  ],
  manager: [
    'view_dashboard',
    'view_monitoring',
    'view_alerts',
    'manage_alerts',
    'view_trends',
    'view_reports',
    'generate_reports',
    'view_assets',
    'view_users',
    'view_settings',
    'view_ai_support',
    'view_predictive',
    'view_process_flow',
  ],
  operator: [
    'view_dashboard',
    'view_monitoring',
    'view_alerts',
    'manage_alerts',
    'view_trends',
    'view_reports',
    'view_assets',
    'view_ai_support',
    'view_process_flow',
  ],
  viewer: [
    'view_dashboard',
    'view_monitoring',
    'view_alerts',
    'view_trends',
    'view_reports',
    'view_assets',
    'view_process_flow',
  ],
};

export const hasPermission = (userId: string, permission: string): boolean => {
  const user = getUserById(userId);
  if (!user) return false;
  return rolePermissions[user.role].includes(permission);
};

// Role display info
export const roleInfo: Record<UserRole, { label: string; color: string; bgColor: string }> = {
  admin: { label: 'Admin', color: 'text-red-600', bgColor: 'bg-red-50' },
  manager: { label: 'Manager', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  operator: { label: 'Operator', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  viewer: { label: 'Viewer', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};
