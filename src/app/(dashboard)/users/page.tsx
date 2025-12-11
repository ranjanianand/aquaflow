'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/shared/status-badge';
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
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';
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

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-screen">
      <Header
        title="User Management"
        subtitle="Manage users and permissions"
      />

      <div className="p-8 space-y-6">
        <Tabs defaultValue="users">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users ({mockUsers.length})
              </TabsTrigger>
              <TabsTrigger value="permissions">
                <Shield className="h-4 w-4 mr-2" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Clock className="h-4 w-4 mr-2" />
                Activity Log
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button onClick={handleAddUser}>
                <Plus className="h-4 w-4 mr-1" />
                Add User
              </Button>
            </div>
          </div>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Plant Access</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="gradient-bg text-sm font-semibold text-white">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase',
                              roleInfo[user.role].bgColor,
                              roleInfo[user.role].color
                            )}
                          >
                            {roleInfo[user.role].label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {user.plantAccess.includes('all')
                              ? 'All Plants'
                              : `${user.plantAccess.length} plants`}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(user.lastActive, { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {user.status === 'active' ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                                <span className="text-[var(--success)]">Active</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Inactive</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader className="border-b bg-muted/50 px-6 py-4">
                <CardTitle className="text-base font-semibold">Role Permissions Matrix</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Permission</TableHead>
                      <TableHead className="text-center">Admin</TableHead>
                      <TableHead className="text-center">Manager</TableHead>
                      <TableHead className="text-center">Operator</TableHead>
                      <TableHead className="text-center">Viewer</TableHead>
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
                    ].map((permission) => (
                      <TableRow key={permission.key}>
                        <TableCell className="font-medium">{permission.label}</TableCell>
                        {(['admin', 'manager', 'operator', 'viewer'] as UserRole[]).map((role) => (
                          <TableCell key={role} className="text-center">
                            {rolePermissions[role].includes(permission.key) ? (
                              <CheckCircle className="h-5 w-5 text-[var(--success)] mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader className="border-b bg-muted/50 px-6 py-4">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {activityLog.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 pb-4 border-b last:border-0"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        {activity.type === 'alert' && (
                          <CheckCircle className="h-4 w-4 text-[var(--success)]" />
                        )}
                        {activity.type === 'report' && (
                          <Clock className="h-4 w-4 text-[var(--accent-blue)]" />
                        )}
                        {activity.type === 'config' && (
                          <Edit className="h-4 w-4 text-[var(--warning)]" />
                        )}
                        {activity.type === 'auth' && (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.user}</span>{' '}
                          {activity.action}
                        </p>
                        <p className="text-sm text-muted-foreground">{activity.target}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g., John Doe"
                defaultValue={editingUser?.name || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="e.g., john@aquaflow.io"
                defaultValue={editingUser?.email || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                placeholder="e.g., +91 98765 43210"
                defaultValue={editingUser?.phone || ''}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue={editingUser?.role || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plant Access</Label>
              <Select defaultValue={editingUser?.plantAccess.includes('all') ? 'all' : 'selected'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  <SelectItem value="selected">Selected Plants</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              {editingUser ? 'Save Changes' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
