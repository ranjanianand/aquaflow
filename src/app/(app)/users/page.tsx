'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockUsers, roleInfo, rolePermissions } from '@/data/mock-users';
import { User, UserRole } from '@/types';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  X,
  Filter,
  UserPlus,
  Activity,
  Building2,
  Eye,
  Lock,
  Key,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Activity log mock data
const activityLog = [
  {
    id: '1',
    user: 'Rahul Kumar',
    action: 'Acknowledged alert',
    target: 'High pH Level - Chennai WTP-01',
    timestamp: new Date(Date.now() - 15 * 60000),
    type: 'alert',
  },
  {
    id: '2',
    user: 'Priya Sharma',
    action: 'Generated report',
    target: 'Daily Operations Summary',
    timestamp: new Date(Date.now() - 45 * 60000),
    type: 'report',
  },
  {
    id: '3',
    user: 'Amit Singh',
    action: 'Updated threshold',
    target: 'pH Sensor - Delhi WTP-03',
    timestamp: new Date(Date.now() - 2 * 3600000),
    type: 'config',
  },
  {
    id: '4',
    user: 'Sneha Patel',
    action: 'Resolved alert',
    target: 'Flow Rate Warning - Mumbai WTP-02',
    timestamp: new Date(Date.now() - 4 * 3600000),
    type: 'alert',
  },
  {
    id: '5',
    user: 'Vikram Reddy',
    action: 'Logged in',
    target: 'System access',
    timestamp: new Date(Date.now() - 24 * 3600000),
    type: 'auth',
  },
];

type TabType = 'users' | 'permissions' | 'activity';

export default function UsersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleSaveUser = () => {
    toast.success(editingUser ? 'User updated' : 'User added', {
      description: editingUser
        ? 'User details have been updated successfully.'
        : 'New user has been added to the system.',
    });
    setUserModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    toast.success('User removed', {
      description: 'The user has been removed from the system.',
    });
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'operator':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'viewer':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const activeUsers = mockUsers.filter((u) => u.status === 'active').length;
  const adminCount = mockUsers.filter((u) => u.role === 'admin').length;
  const managerCount = mockUsers.filter((u) => u.role === 'manager').length;
  const operatorCount = mockUsers.filter((u) => u.role === 'operator').length;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'users', label: 'Users', icon: <Users className="h-3.5 w-3.5" /> },
    { id: 'permissions', label: 'Permissions', icon: <Shield className="h-3.5 w-3.5" /> },
    { id: 'activity', label: 'Activity Log', icon: <Activity className="h-3.5 w-3.5" /> },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">User Management</span>
          </div>
        </header>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Users className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">User Management</span>
          <span className="text-[10px] text-slate-400">Access control & permissions</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-emerald-400">
            {activeUsers}/{mockUsers.length} ACTIVE
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-blue-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Users</span>
              <Users className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-600">{mockUsers.length}</span>
              <span className="text-[10px] text-slate-500">registered</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-emerald-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Users</span>
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-600">{activeUsers}</span>
              <span className="text-[10px] text-slate-500">online</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-red-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Administrators</span>
              <Shield className="h-3.5 w-3.5 text-red-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-red-600">{adminCount}</span>
              <span className="text-[10px] text-slate-500">admins</span>
            </div>
          </div>

          <div className="border-2 border-slate-300 bg-white p-3 border-l-[3px] border-l-purple-500">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operators</span>
              <Building2 className="h-3.5 w-3.5 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-purple-600">{operatorCount}</span>
              <span className="text-[10px] text-slate-500">field staff</span>
            </div>
          </div>
        </div>

        {/* Main Content Card with Tabs */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden flex-1">
          {/* Tab Navigation */}
          <div className="bg-slate-100 px-2 py-1.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex gap-1">
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
                  {tab.id === 'users' && (
                    <span className="ml-1 font-mono">({mockUsers.length})</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleAddUser}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              <UserPlus className="h-3 w-3" />
              Add User
            </button>
          </div>

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              {/* Filters Row */}
              <div className="p-3 border-b-2 border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Role:</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="operator">Operator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 border-b-2 border-slate-300">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">User</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Contact</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Role</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Plant Access</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Last Active</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleEditUser(user)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center bg-slate-800 text-white text-[11px] font-bold">
                            {getInitials(user.name)}
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border',
                            getRoleColor(user.role)
                          )}
                        >
                          {roleInfo[user.role].label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-slate-600">
                          {user.plantAccess.includes('all')
                            ? 'All Plants'
                            : `${user.plantAccess.length} plants`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(user.lastActive, { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {user.status === 'active' ? (
                            <>
                              <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active</span>
                            </>
                          ) : (
                            <>
                              <div className="h-2 w-2 bg-slate-400 rounded-full" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Inactive</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-1.5 hover:bg-slate-100 transition-colors"
                            title="Actions"
                          >
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </button>

                          {openMenuId === user.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-36 border-2 border-slate-300 bg-white shadow-lg">
                              <button
                                onClick={() => { handleEditUser(user); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Edit className="h-3.5 w-3.5" />
                                Edit User
                              </button>
                              <button
                                onClick={() => { setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                              >
                                <Key className="h-3.5 w-3.5" />
                                Reset Password
                              </button>
                              <button
                                onClick={() => { handleDeleteUser(user.id); setOpenMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-[11px] font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Table Footer */}
              <div className="px-4 py-3 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Showing {filteredUsers.length} of {mockUsers.length} users
                </span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white hover:bg-slate-100 transition-colors disabled:opacity-50" disabled>
                    Previous
                  </button>
                  <span className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold">1</span>
                  <button className="px-3 py-1.5 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white hover:bg-slate-100 transition-colors disabled:opacity-50" disabled>
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div>
              <div className="p-3 border-b-2 border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Role Permissions Matrix</span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100 border-b-2 border-slate-300">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Permission</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 border border-red-200">Admin</span>
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">Manager</span>
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200">Operator</span>
                    </TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200">Viewer</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { key: 'view_dashboard', label: 'View Dashboard' },
                    { key: 'view_monitoring', label: 'View Monitoring' },
                    { key: 'view_alerts', label: 'View Alerts' },
                    { key: 'manage_alerts', label: 'Manage Alerts' },
                    { key: 'view_reports', label: 'View Reports' },
                    { key: 'generate_reports', label: 'Generate Reports' },
                    { key: 'view_assets', label: 'View Assets' },
                    { key: 'manage_assets', label: 'Manage Assets' },
                    { key: 'view_users', label: 'View Users' },
                    { key: 'manage_users', label: 'Manage Users' },
                    { key: 'manage_settings', label: 'Manage Settings' },
                  ].map((permission, index) => (
                    <TableRow key={permission.key} className={cn(
                      'border-b border-slate-200',
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    )}>
                      <TableCell className="text-xs font-medium text-slate-700">{permission.label}</TableCell>
                      {(['admin', 'manager', 'operator', 'viewer'] as UserRole[]).map((role) => (
                        <TableCell key={role} className="text-center">
                          {rolePermissions[role].includes(permission.key) ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-slate-300 mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div>
              <div className="p-3 border-b-2 border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Recent Activity</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{activityLog.length} entries</span>
                </div>
              </div>
              <div className="divide-y divide-slate-200">
                {activityLog.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className={cn(
                      'flex h-9 w-9 items-center justify-center border-2',
                      activity.type === 'alert' && 'bg-emerald-50 border-emerald-200',
                      activity.type === 'report' && 'bg-blue-50 border-blue-200',
                      activity.type === 'config' && 'bg-amber-50 border-amber-200',
                      activity.type === 'auth' && 'bg-slate-50 border-slate-200'
                    )}>
                      {activity.type === 'alert' && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                      {activity.type === 'report' && <Clock className="h-4 w-4 text-blue-600" />}
                      {activity.type === 'config' && <Edit className="h-4 w-4 text-amber-600" />}
                      {activity.type === 'auth' && <Shield className="h-4 w-4 text-slate-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">
                        <span className="font-bold text-slate-800">{activity.user}</span>{' '}
                        {activity.action}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{activity.target}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Activity Footer */}
              <div className="px-4 py-3 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-center">
                <button className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-100 transition-colors">
                  Load More Activity
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal - Industrial Style */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 rounded-none border-2 border-slate-300">
          <DialogTitle className="sr-only">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>

          {/* Modal Header */}
          <div className="bg-slate-100 px-4 py-3 flex items-center justify-between border-b-2 border-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center bg-white border-2 border-slate-300">
                <UserPlus className="h-4 w-4 text-slate-600" />
              </div>
              <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingUser ? 'Edit User' : 'Add New User'}
              </span>
            </div>
            <button
              onClick={() => setUserModalOpen(false)}
              className="p-1.5 hover:bg-slate-200 transition-colors"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                defaultValue={editingUser?.name || ''}
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="e.g., john@aquaflow.io"
                defaultValue={editingUser?.email || ''}
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g., +91 98765 43210"
                defaultValue={editingUser?.phone || ''}
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  defaultValue={editingUser?.role || ''}
                  className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                >
                  <option value="">Select role</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="operator">Operator</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Status
                </label>
                <select
                  defaultValue={editingUser?.status || 'active'}
                  className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Plant Access
              </label>
              <select
                defaultValue={editingUser?.plantAccess.includes('all') ? 'all' : 'selected'}
                className="w-full px-4 py-2 border-2 border-slate-300 text-sm focus:outline-none focus:border-slate-500 bg-white"
              >
                <option value="all">All Plants</option>
                <option value="selected">Selected Plants</option>
              </select>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-100 px-4 py-3 border-t-2 border-slate-300 flex items-center justify-between">
            <button
              onClick={() => setUserModalOpen(false)}
              className="px-4 py-2 border-2 border-slate-300 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveUser}
              className="px-4 py-2 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
            >
              {editingUser ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
