'use client';

import { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Shield,
  User,
  Clock,
  FileText,
  Save,
  Settings,
  Key,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  LogIn,
  LogOut,
  Edit3,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Router,
  Server,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  Activity,
  RefreshCw,
  Network,
  ChevronRight,
  Database,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { currentUser } from '@/data/mock-users';
import {
  mockGateways,
  mqttBrokerConfig,
  getGatewayStatusColor,
  getPLCStatusColor,
  getOnlineGatewaysCount,
  getTotalPLCConnections,
  getConnectedPLCCount,
  getTotalDataPointsPerSecond,
  Gateway,
} from '@/data/mock-gateways';
import { mockPlants } from '@/data/mock-plants';
import { X, MoreVertical } from 'lucide-react';

type TabType = 'notifications' | 'profile' | 'security' | 'audit' | 'integration';

// Mock audit log data
const auditLogs = [
  {
    id: 1,
    time: '10:15 AM',
    date: '2025-01-15',
    action: 'Settings updated - Notification preferences',
    user: 'Rahul Kumar',
    type: 'settings',
    ip: '192.168.1.45'
  },
  {
    id: 2,
    time: '09:45 AM',
    date: '2025-01-15',
    action: 'Report generated - Daily Operations Summary',
    user: 'System',
    type: 'report',
    ip: 'System'
  },
  {
    id: 3,
    time: '09:30 AM',
    date: '2025-01-15',
    action: 'Alert acknowledged - High pH Chennai WTP-01',
    user: 'Amit Singh',
    type: 'alert',
    ip: '192.168.1.52'
  },
  {
    id: 4,
    time: '09:00 AM',
    date: '2025-01-15',
    action: 'User login',
    user: 'Rahul Kumar',
    type: 'login',
    ip: '192.168.1.45'
  },
  {
    id: 5,
    time: '08:45 AM',
    date: '2025-01-15',
    action: 'Threshold updated - Flow Sensor Mumbai WTP-02',
    user: 'Priya Sharma',
    type: 'settings',
    ip: '192.168.1.38'
  },
  {
    id: 6,
    time: '08:30 AM',
    date: '2025-01-15',
    action: 'User logout',
    user: 'Amit Singh',
    type: 'logout',
    ip: '192.168.1.52'
  },
  {
    id: 7,
    time: '08:15 AM',
    date: '2025-01-15',
    action: 'New user created - Operator Account',
    user: 'Rahul Kumar',
    type: 'user',
    ip: '192.168.1.45'
  },
  {
    id: 8,
    time: '08:00 AM',
    date: '2025-01-15',
    action: 'Password changed',
    user: 'Priya Sharma',
    type: 'security',
    ip: '192.168.1.38'
  },
];

const getAuditIcon = (type: string) => {
  switch (type) {
    case 'login': return <LogIn className="h-4 w-4" />;
    case 'logout': return <LogOut className="h-4 w-4" />;
    case 'settings': return <Settings className="h-4 w-4" />;
    case 'alert': return <AlertTriangle className="h-4 w-4" />;
    case 'report': return <FileText className="h-4 w-4" />;
    case 'user': return <User className="h-4 w-4" />;
    case 'security': return <Shield className="h-4 w-4" />;
    default: return <Clock className="h-4 w-4" />;
  }
};

const getAuditTypeColor = (type: string) => {
  switch (type) {
    case 'login': return 'bg-emerald-100 text-emerald-700';
    case 'logout': return 'bg-slate-100 text-slate-700';
    case 'settings': return 'bg-blue-100 text-blue-700';
    case 'alert': return 'bg-amber-100 text-amber-700';
    case 'report': return 'bg-purple-100 text-purple-700';
    case 'user': return 'bg-cyan-100 text-cyan-700';
    case 'security': return 'bg-red-100 text-red-700';
    default: return 'bg-slate-100 text-slate-700';
  }
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [expandedGateway, setExpandedGateway] = useState<string | null>(null);
  const [showAddGatewayModal, setShowAddGatewayModal] = useState(false);
  const [newGateway, setNewGateway] = useState({
    plantId: '',
    name: '',
    model: 'Siemens IOT2050',
    ipAddress: '',
    macAddress: '',
    serialNumber: '',
    bufferSize: 512,
  });
  const [showAddPLCModal, setShowAddPLCModal] = useState(false);
  const [selectedGatewayForPLC, setSelectedGatewayForPLC] = useState<string | null>(null);
  const [newPLC, setNewPLC] = useState({
    name: '',
    protocol: 'Modbus TCP' as 'Modbus TCP' | 'Modbus RTU' | 'OPC-UA' | 'EtherNet/IP' | 'Profinet',
    ipAddress: '',
    port: 502,
    vendor: '',
    model: '',
    pollIntervalMs: 1000,
    registerCount: 64,
  });
  const [plcActionMenu, setPLCActionMenu] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    whatsapp: true,
    push: true,
  });

  const [alertPreferences, setAlertPreferences] = useState({
    criticalEmail: true,
    criticalSms: true,
    warningEmail: true,
    warningSms: false,
    infoEmail: false,
    digestFrequency: 'daily',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });

  const [profile, setProfile] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone || '',
    timezone: 'asia-kolkata',
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('Settings saved', {
        description: 'Your preferences have been updated successfully.',
      });
    }, 500);
  };

  const handleAddGateway = () => {
    // Validation
    if (!newGateway.plantId) {
      toast.error('Plant is required', { description: 'Please select a plant for this gateway.' });
      return;
    }
    if (!newGateway.name.trim()) {
      toast.error('Name is required', { description: 'Please enter a gateway name.' });
      return;
    }
    if (!newGateway.ipAddress.trim()) {
      toast.error('IP Address is required', { description: 'Please enter a valid IP address.' });
      return;
    }
    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newGateway.ipAddress)) {
      toast.error('Invalid IP Address', { description: 'Please enter a valid IPv4 address (e.g., 192.168.1.1).' });
      return;
    }
    if (!newGateway.macAddress.trim()) {
      toast.error('MAC Address is required', { description: 'Please enter a valid MAC address.' });
      return;
    }
    // Basic MAC validation
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newGateway.macAddress)) {
      toast.error('Invalid MAC Address', { description: 'Please enter a valid MAC address (e.g., 00:1A:2B:3C:4D:5E).' });
      return;
    }
    if (!newGateway.serialNumber.trim()) {
      toast.error('Serial Number is required', { description: 'Please enter a serial number.' });
      return;
    }

    // Mock save - In real app, this would call an API
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowAddGatewayModal(false);
      // Reset form
      setNewGateway({
        plantId: '',
        name: '',
        model: 'Siemens IOT2050',
        ipAddress: '',
        macAddress: '',
        serialNumber: '',
        bufferSize: 512,
      });
      toast.success('Gateway added', {
        description: `${newGateway.name} has been configured successfully.`,
      });
    }, 500);
  };

  const gatewayModels = [
    'Siemens IOT2050',
    'Advantech UNO-2484G',
    'Dell Edge Gateway 5200',
    'Moxa UC-8200',
    'Beckhoff CX9020',
  ];

  const plcProtocols = [
    { value: 'Modbus TCP', port: 502 },
    { value: 'Modbus RTU', port: 502 },
    { value: 'OPC-UA', port: 4840 },
    { value: 'EtherNet/IP', port: 44818 },
    { value: 'Profinet', port: 34962 },
  ];

  const plcVendors = [
    { name: 'Siemens', models: ['S7-300', 'S7-1200', 'S7-1500'] },
    { name: 'Allen-Bradley', models: ['CompactLogix', 'ControlLogix', 'MicroLogix'] },
    { name: 'Schneider', models: ['M340', 'M580', 'Quantum'] },
    { name: 'ABB', models: ['AC500', 'AC500-eCo', 'AC500-XC'] },
    { name: 'Rockwell', models: ['ControlLogix', 'CompactLogix', 'Micro800'] },
    { name: 'Mitsubishi', models: ['iQ-R', 'iQ-F', 'Q Series'] },
    { name: 'Omron', models: ['NX Series', 'NJ Series', 'CJ Series'] },
  ];

  const handleOpenAddPLC = (gatewayId: string) => {
    setSelectedGatewayForPLC(gatewayId);
    setShowAddPLCModal(true);
  };

  const handleAddPLC = () => {
    // Validation
    if (!newPLC.name.trim()) {
      toast.error('Name is required', { description: 'Please enter a PLC name.' });
      return;
    }
    if (!newPLC.ipAddress.trim()) {
      toast.error('IP Address is required', { description: 'Please enter a valid IP address.' });
      return;
    }
    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(newPLC.ipAddress)) {
      toast.error('Invalid IP Address', { description: 'Please enter a valid IPv4 address (e.g., 192.168.1.10).' });
      return;
    }
    if (!newPLC.vendor) {
      toast.error('Vendor is required', { description: 'Please select a PLC vendor.' });
      return;
    }
    if (!newPLC.model) {
      toast.error('Model is required', { description: 'Please select a PLC model.' });
      return;
    }

    // Mock save - In real app, this would call an API
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowAddPLCModal(false);
      // Reset form
      setNewPLC({
        name: '',
        protocol: 'Modbus TCP',
        ipAddress: '',
        port: 502,
        vendor: '',
        model: '',
        pollIntervalMs: 1000,
        registerCount: 64,
      });
      setSelectedGatewayForPLC(null);
      toast.success('PLC connection added', {
        description: `${newPLC.name} has been configured successfully.`,
      });
    }, 500);
  };

  const handleDeletePLC = (plcId: string, plcName: string) => {
    setPLCActionMenu(null);
    toast.success('PLC connection removed', {
      description: `${plcName} has been removed from the gateway.`,
    });
  };

  const handleEditPLC = (plcId: string) => {
    setPLCActionMenu(null);
    toast.info('Edit PLC', {
      description: 'Edit functionality would open a pre-filled form.',
    });
  };

  const handleRefreshPLC = (plcId: string, plcName: string) => {
    setPLCActionMenu(null);
    toast.success('Connection refreshed', {
      description: `Attempting to reconnect to ${plcName}...`,
    });
  };

  const tabs = [
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'integration' as TabType, label: 'Integration', icon: Router },
    { id: 'profile' as TabType, label: 'Profile', icon: User },
    { id: 'security' as TabType, label: 'Security', icon: Shield },
    { id: 'audit' as TabType, label: 'Audit Log', icon: FileText },
  ];

  // Stats for header
  const stats = [
    {
      label: 'Active Channels',
      value: Object.values(notifications).filter(Boolean).length,
      total: 4,
      color: 'border-l-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      label: 'Alert Rules',
      value: 5,
      status: 'Active',
      color: 'border-l-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      label: 'Security Status',
      value: security.twoFactorEnabled ? '2FA ON' : '2FA OFF',
      status: security.twoFactorEnabled ? 'Secure' : 'Partial',
      color: security.twoFactorEnabled ? 'border-l-emerald-500' : 'border-l-amber-500',
      bgColor: security.twoFactorEnabled ? 'bg-emerald-50' : 'bg-amber-50',
      textColor: security.twoFactorEnabled ? 'text-emerald-600' : 'text-amber-600'
    },
    {
      label: 'Audit Events',
      value: auditLogs.length,
      status: 'Today',
      color: 'border-l-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Industrial Header - Standard */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Settings className="h-4 w-4 text-white" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">System Settings</span>
          <span className="text-[10px] text-slate-400">Manage account preferences and security</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400">{currentUser.name}</span>
          <div className="h-6 w-6 bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`bg-white border-2 border-slate-300 border-l-[3px] ${stat.color} p-4`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                {stat.label}
              </p>
              <div className="flex items-end justify-between">
                <span className={`text-lg font-bold font-mono ${stat.textColor}`}>
                  {stat.value}
                </span>
                {stat.total && (
                  <span className="text-xs text-slate-500">/ {stat.total}</span>
                )}
                {stat.status && (
                  <span className={`text-xs px-2 py-0.5 ${stat.bgColor} ${stat.textColor} font-medium`}>
                    {stat.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Full-width Tabs Container */}
        <div className="border-2 border-slate-300 bg-white overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-slate-100 px-2 py-1.5 border-b-2 border-slate-300 flex items-center justify-between">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              {isLoading ? 'Saving...' : 'Save All'}
            </button>
          </div>

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-4 space-y-4">
              {/* Notification Channels */}
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Notification Channels</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email', icon: Mail, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
                    { key: 'whatsapp', label: 'WhatsApp Notifications', desc: 'Receive alerts on WhatsApp', icon: MessageSquare, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
                    { key: 'sms', label: 'SMS Notifications', desc: 'Receive critical alerts via SMS', icon: Smartphone, iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
                    { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications', icon: Bell, iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
                  ].map((channel) => {
                    const Icon = channel.icon;
                    const isEnabled = notifications[channel.key as keyof typeof notifications];
                    return (
                      <div
                        key={channel.key}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 flex items-center justify-center ${channel.iconBg}`}>
                            <Icon className={`h-5 w-5 ${channel.iconColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{channel.label}</p>
                            <p className="text-xs text-slate-500">{channel.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setNotifications({
                              ...notifications,
                              [channel.key]: !isEnabled,
                            })
                          }
                          className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            isEnabled
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-500 border border-slate-300'
                          }`}
                        >
                          {isEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alert Preferences */}
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Alert Preferences</span>
                </div>
              <div className="p-4 space-y-6">
                {/* Critical Alerts */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Critical Alerts
                  </p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        onClick={() =>
                          setAlertPreferences({
                            ...alertPreferences,
                            criticalEmail: !alertPreferences.criticalEmail,
                          })
                        }
                        className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                          alertPreferences.criticalEmail
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {alertPreferences.criticalEmail && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-slate-700">Email</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        onClick={() =>
                          setAlertPreferences({
                            ...alertPreferences,
                            criticalSms: !alertPreferences.criticalSms,
                          })
                        }
                        className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                          alertPreferences.criticalSms
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {alertPreferences.criticalSms && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-slate-700">SMS</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                {/* Warning Alerts */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Warning Alerts
                  </p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        onClick={() =>
                          setAlertPreferences({
                            ...alertPreferences,
                            warningEmail: !alertPreferences.warningEmail,
                          })
                        }
                        className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                          alertPreferences.warningEmail
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {alertPreferences.warningEmail && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-slate-700">Email</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <button
                        onClick={() =>
                          setAlertPreferences({
                            ...alertPreferences,
                            warningSms: !alertPreferences.warningSms,
                          })
                        }
                        className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                          alertPreferences.warningSms
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {alertPreferences.warningSms && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-slate-700">SMS</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                {/* Digest Frequency */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Digest Frequency
                  </p>
                  <div className="relative w-64">
                    <select
                      value={alertPreferences.digestFrequency}
                      onChange={(e) =>
                        setAlertPreferences({
                          ...alertPreferences,
                          digestFrequency: e.target.value,
                        })
                      }
                      className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm font-medium appearance-none focus:outline-none focus:border-slate-500"
                    >
                      <option value="realtime">Real-time</option>
                      <option value="hourly">Hourly Digest</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                {/* Quiet Hours */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Quiet Hours
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pause non-critical notifications
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setAlertPreferences({
                          ...alertPreferences,
                          quietHoursEnabled: !alertPreferences.quietHoursEnabled,
                        })
                      }
                      className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        alertPreferences.quietHoursEnabled
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500 border border-slate-300'
                      }`}
                    >
                      {alertPreferences.quietHoursEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {alertPreferences.quietHoursEnabled && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <input
                          type="time"
                          value={alertPreferences.quietHoursStart}
                          onChange={(e) =>
                            setAlertPreferences({
                              ...alertPreferences,
                              quietHoursStart: e.target.value,
                            })
                          }
                          className="h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                        />
                      </div>
                      <span className="text-slate-500 font-medium">to</span>
                      <input
                        type="time"
                        value={alertPreferences.quietHoursEnd}
                        onChange={(e) =>
                          setAlertPreferences({
                            ...alertPreferences,
                            quietHoursEnd: e.target.value,
                          })
                        }
                        className="h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Integration Tab */}
          {activeTab === 'integration' && (
            <div className="p-4 space-y-4">
              {/* MQTT Broker Configuration */}
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">MQTT Broker</span>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    mqttBrokerConfig.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {mqttBrokerConfig.status === 'connected' ? (
                      <Wifi className="h-3 w-3" />
                    ) : (
                      <WifiOff className="h-3 w-3" />
                    )}
                    {mqttBrokerConfig.status}
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Host</p>
                      <p className="text-sm font-mono text-slate-700">{mqttBrokerConfig.host}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Port</p>
                      <p className="text-sm font-mono text-slate-700">{mqttBrokerConfig.port}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Protocol</p>
                      <p className="text-sm font-mono text-slate-700 uppercase">{mqttBrokerConfig.protocol}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">QoS Level</p>
                      <p className="text-sm font-mono text-slate-700">{mqttBrokerConfig.qos}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-100 flex items-center justify-center">
                        <Router className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold font-mono text-slate-800">{mqttBrokerConfig.connectedGateways}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Gateways Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold font-mono text-slate-800">{mqttBrokerConfig.messagesPerSecond.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Messages/sec</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-purple-100 flex items-center justify-center">
                        <Zap className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold font-mono text-slate-800">{getTotalDataPointsPerSecond().toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 uppercase">Data Points/sec</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gateway Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border-2 border-slate-200 border-l-[3px] border-l-emerald-500 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Gateways Online</p>
                  <p className="text-xl font-bold font-mono text-emerald-600">{getOnlineGatewaysCount()}<span className="text-slate-400 text-sm">/{mockGateways.length}</span></p>
                </div>
                <div className="bg-white border-2 border-slate-200 border-l-[3px] border-l-blue-500 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total PLCs</p>
                  <p className="text-xl font-bold font-mono text-blue-600">{getTotalPLCConnections()}</p>
                </div>
                <div className="bg-white border-2 border-slate-200 border-l-[3px] border-l-emerald-500 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">PLCs Connected</p>
                  <p className="text-xl font-bold font-mono text-emerald-600">{getConnectedPLCCount()}<span className="text-slate-400 text-sm">/{getTotalPLCConnections()}</span></p>
                </div>
                <div className="bg-white border-2 border-slate-200 border-l-[3px] border-l-purple-500 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Throughput</p>
                  <p className="text-xl font-bold font-mono text-purple-600">{getTotalDataPointsPerSecond().toLocaleString()}<span className="text-slate-400 text-sm">/s</span></p>
                </div>
              </div>

              {/* Plant Gateways */}
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Router className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Plant Gateways</span>
                  </div>
                  <button
                    onClick={() => setShowAddGatewayModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Add Gateway
                  </button>
                </div>
                <div className="divide-y divide-slate-200">
                  {mockGateways.map((gateway) => {
                    const statusColor = getGatewayStatusColor(gateway.status);
                    const isExpanded = expandedGateway === gateway.id;
                    return (
                      <div key={gateway.id}>
                        {/* Gateway Row */}
                        <div
                          className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                          onClick={() => setExpandedGateway(isExpanded ? null : gateway.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 flex items-center justify-center ${statusColor.bg}`}>
                              <Router className={`h-5 w-5 ${statusColor.text}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                {gateway.name}
                                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusColor.bg} ${statusColor.text}`}>
                                  {gateway.status}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500">
                                {gateway.plantName} • {gateway.model} • {gateway.ipAddress}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs font-mono text-slate-600">{gateway.dataPointsPerSecond}/s</p>
                              <p className="text-[10px] text-slate-500">{gateway.plcConnections.length} PLCs</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5" title="CPU Usage">
                                <Cpu className="h-3.5 w-3.5 text-slate-400" />
                                <span className={`text-xs font-mono ${gateway.cpuUsage > 70 ? 'text-amber-600' : 'text-slate-600'}`}>{gateway.cpuUsage}%</span>
                              </div>
                              <div className="flex items-center gap-1.5" title="Memory Usage">
                                <HardDrive className="h-3.5 w-3.5 text-slate-400" />
                                <span className={`text-xs font-mono ${gateway.memoryUsage > 70 ? 'text-amber-600' : 'text-slate-600'}`}>{gateway.memoryUsage}%</span>
                              </div>
                            </div>
                            <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {/* Expanded PLC Details */}
                        {isExpanded && (
                          <div className="bg-slate-50 border-t border-slate-200 p-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              {/* Gateway Details */}
                              <div className="bg-white border border-slate-200 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Gateway Details</p>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div>
                                    <span className="text-slate-500">Serial:</span>
                                    <span className="ml-2 font-mono text-slate-700">{gateway.serialNumber}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Firmware:</span>
                                    <span className="ml-2 font-mono text-slate-700">{gateway.firmwareVersion}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">MAC:</span>
                                    <span className="ml-2 font-mono text-slate-700">{gateway.macAddress}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500">Uptime:</span>
                                    <span className="ml-2 font-mono text-slate-700">{Math.floor(gateway.uptime / 24)}d {gateway.uptime % 24}h</span>
                                  </div>
                                </div>
                              </div>
                              {/* Buffer Status */}
                              <div className="bg-white border border-slate-200 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Offline Buffer</p>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-slate-500">Used</span>
                                      <span className="text-xs font-mono text-slate-700">{gateway.bufferUsed} / {gateway.bufferSize} MB</span>
                                    </div>
                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${gateway.bufferUsed / gateway.bufferSize > 0.7 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                        style={{ width: `${(gateway.bufferUsed / gateway.bufferSize) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  <Database className={`h-6 w-6 ${gateway.bufferUsed / gateway.bufferSize > 0.7 ? 'text-amber-500' : 'text-slate-400'}`} />
                                </div>
                              </div>
                            </div>

                            {/* PLC Connections */}
                            <div className="bg-white border border-slate-200 overflow-visible">
                              <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Network className="h-3.5 w-3.5 text-slate-500" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">PLC Connections</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddPLC(gateway.id);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white bg-slate-700 hover:bg-slate-800 transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add PLC
                                </button>
                              </div>
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="text-left px-3 py-2">Name</th>
                                    <th className="text-left px-3 py-2">Protocol</th>
                                    <th className="text-left px-3 py-2">Address</th>
                                    <th className="text-left px-3 py-2">Vendor / Model</th>
                                    <th className="text-left px-3 py-2">Poll Rate</th>
                                    <th className="text-left px-3 py-2">Registers</th>
                                    <th className="text-left px-3 py-2">Status</th>
                                    <th className="text-right px-3 py-2">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {gateway.plcConnections.map((plc) => {
                                    const plcStatusColor = getPLCStatusColor(plc.status);
                                    return (
                                      <tr key={plc.id} className="border-t border-slate-100 hover:bg-slate-50">
                                        <td className="px-3 py-2 text-sm font-medium text-slate-700">{plc.name}</td>
                                        <td className="px-3 py-2">
                                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono">{plc.protocol}</span>
                                        </td>
                                        <td className="px-3 py-2 text-xs font-mono text-slate-600">{plc.ipAddress}:{plc.port}</td>
                                        <td className="px-3 py-2 text-xs text-slate-600">{plc.vendor} {plc.model}</td>
                                        <td className="px-3 py-2 text-xs font-mono text-slate-600">{plc.pollIntervalMs}ms</td>
                                        <td className="px-3 py-2 text-xs font-mono text-slate-600">{plc.registerCount}</td>
                                        <td className="px-3 py-2">
                                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${plcStatusColor.bg} ${plcStatusColor.text}`}>
                                            {plc.status}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <div className="relative">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setPLCActionMenu(plcActionMenu === plc.id ? null : plc.id);
                                              }}
                                              className="p-1.5 hover:bg-slate-100 text-slate-500 rounded"
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </button>
                                            {/* Dropdown Menu */}
                                            {plcActionMenu === plc.id && (
                                              <>
                                                {/* Backdrop to close menu when clicking outside */}
                                                <div
                                                  className="fixed inset-0 z-40"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPLCActionMenu(null);
                                                  }}
                                                />
                                                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white border-2 border-slate-200 shadow-xl z-50 rounded">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleRefreshPLC(plc.id, plc.name);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 text-left"
                                                  >
                                                    <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
                                                    Refresh Connection
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleEditPLC(plc.id);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 text-left"
                                                  >
                                                    <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                                                    Edit Configuration
                                                  </button>
                                                  <div className="border-t border-slate-200" />
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleDeletePLC(plc.id, plc.name);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 text-left"
                                                  >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Remove PLC
                                                  </button>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-4 space-y-4">
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Profile Information</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-6 mb-6 pb-6 border-b border-slate-200">
                    <div className="h-20 w-20 bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {currentUser.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-slate-800">{currentUser.name}</p>
                      <p className="text-sm text-slate-500">{currentUser.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                          {currentUser.role}
                        </span>
                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          currentUser.status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {currentUser.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Timezone
                      </label>
                      <div className="relative">
                        <select
                          value={profile.timezone}
                          onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                          className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm appearance-none focus:outline-none focus:border-slate-500"
                        >
                          <option value="asia-kolkata">Asia/Kolkata (IST)</option>
                          <option value="asia-dubai">Asia/Dubai (GST)</option>
                          <option value="america-new_york">America/New_York (EST)</option>
                          <option value="europe-london">Europe/London (GMT)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-4 space-y-4">
              {/* Two-Factor Authentication */}
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Two-Factor Authentication</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 flex items-center justify-center ${
                        security.twoFactorEnabled ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}>
                        <Shield className={`h-5 w-5 ${
                          security.twoFactorEnabled ? 'text-emerald-600' : 'text-amber-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {security.twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {security.twoFactorEnabled
                            ? 'Your account is protected with two-factor authentication'
                            : 'Enable 2FA for additional account security'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled })}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        security.twoFactorEnabled
                          ? 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Change Password</span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.current ? 'text' : 'password'}
                        value={security.currentPassword}
                        onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.new ? 'text' : 'password'}
                        value={security.newPassword}
                        onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        value={security.confirmPassword}
                        onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isLoading || !security.currentPassword || !security.newPassword || !security.confirmPassword}
                    className="flex items-center gap-2 h-10 px-4 bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <Key className="h-4 w-4" />
                    Update Password
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-slate-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Active Sessions</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {[
                    { device: 'Windows Desktop', location: 'Mumbai, India', ip: '192.168.1.45', current: true },
                    { device: 'iPhone 14 Pro', location: 'Mumbai, India', ip: '192.168.1.89', current: false },
                    { device: 'MacBook Pro', location: 'Chennai, India', ip: '192.168.2.15', current: false },
                  ].map((session, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-100 flex items-center justify-center">
                          <Monitor className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                            {session.device}
                            {session.current && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {session.location} • {session.ip}
                          </p>
                        </div>
                      </div>
                      {!session.current && (
                        <button className="px-3 py-1.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider hover:bg-red-200 transition-colors">
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <div className="p-4">
              <div className="border-2 border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">System Audit Log</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select className="h-8 px-3 pr-8 border-2 border-slate-300 bg-white text-xs font-medium appearance-none focus:outline-none focus:border-slate-500">
                        <option value="all">All Types</option>
                        <option value="login">Login</option>
                        <option value="settings">Settings</option>
                        <option value="alert">Alert</option>
                        <option value="security">Security</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
                    </div>
                    <button className="px-3 py-1.5 bg-slate-700 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors">
                      Export Log
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Time
                        </th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Type
                        </th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Action
                        </th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          User
                        </th>
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-mono text-slate-700">{log.time}</p>
                              <p className="text-xs text-slate-500">{log.date}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getAuditTypeColor(log.type)}`}>
                              {getAuditIcon(log.type)}
                              {log.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate">
                            {log.action}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-medium ${
                              log.user === 'System' ? 'text-slate-500 italic' : 'text-slate-700'
                            }`}>
                              {log.user}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-slate-500">{log.ip}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-4 py-2 border-t-2 border-slate-200 bg-slate-50 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Showing <span className="font-mono font-bold">1-{auditLogs.length}</span> of{' '}
                    <span className="font-mono font-bold">{auditLogs.length}</span> entries
                  </p>
                  <div className="flex items-center gap-1">
                    <button className="h-7 px-3 border-2 border-slate-300 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>
                      Previous
                    </button>
                    <button className="h-7 w-7 border-2 border-slate-700 bg-slate-700 text-white text-[10px] font-bold">
                      1
                    </button>
                    <button className="h-7 px-3 border-2 border-slate-300 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Gateway Modal */}
      {showAddGatewayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddGatewayModal(false)}
          />
          {/* Modal */}
          <div className="relative bg-white border-2 border-slate-300 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <Router className="h-5 w-5 text-white" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Add New Gateway</span>
              </div>
              <button
                onClick={() => setShowAddGatewayModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Plant Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Plant <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={newGateway.plantId}
                    onChange={(e) => setNewGateway({ ...newGateway, plantId: e.target.value })}
                    className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm appearance-none focus:outline-none focus:border-slate-500"
                  >
                    <option value="">Select a plant...</option>
                    {mockPlants.map((plant) => (
                      <option key={plant.id} value={plant.id}>
                        {plant.name} - {plant.location}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Gateway Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Gateway Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGateway.name}
                  onChange={(e) => setNewGateway({ ...newGateway, name: e.target.value })}
                  placeholder="e.g., Chennai Edge Gateway"
                  className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Gateway Model <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={newGateway.model}
                    onChange={(e) => setNewGateway({ ...newGateway, model: e.target.value })}
                    className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm appearance-none focus:outline-none focus:border-slate-500"
                  >
                    {gatewayModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Network Configuration */}
              <div className="border-t-2 border-slate-200 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Configuration
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      IP Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newGateway.ipAddress}
                      onChange={(e) => setNewGateway({ ...newGateway, ipAddress: e.target.value })}
                      placeholder="192.168.x.x"
                      className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      MAC Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newGateway.macAddress}
                      onChange={(e) => setNewGateway({ ...newGateway, macAddress: e.target.value.toUpperCase() })}
                      placeholder="00:1A:2B:3C:4D:5E"
                      className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hardware Information */}
              <div className="border-t-2 border-slate-200 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Hardware Information
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Serial Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newGateway.serialNumber}
                      onChange={(e) => setNewGateway({ ...newGateway, serialNumber: e.target.value.toUpperCase() })}
                      placeholder="SN-XXX-2024-001"
                      className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Offline Buffer Size (MB)
                    </label>
                    <div className="relative">
                      <select
                        value={newGateway.bufferSize}
                        onChange={(e) => setNewGateway({ ...newGateway, bufferSize: parseInt(e.target.value) })}
                        className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm font-mono appearance-none focus:outline-none focus:border-slate-500"
                      >
                        <option value={128}>128 MB</option>
                        <option value={256}>256 MB</option>
                        <option value={512}>512 MB</option>
                        <option value={1024}>1024 MB (1 GB)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <Server className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Gateway Configuration</p>
                    <p className="text-xs text-blue-700 mt-1">
                      After adding the gateway, you can configure PLC connections from the gateway details panel.
                      The gateway will automatically attempt to connect to the MQTT broker.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 border-t-2 border-slate-200 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => setShowAddGatewayModal(false)}
                className="h-10 px-4 border-2 border-slate-300 bg-white text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGateway}
                disabled={isLoading}
                className="h-10 px-4 bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Gateway
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add PLC Modal */}
      {showAddPLCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowAddPLCModal(false);
              setSelectedGatewayForPLC(null);
            }}
          />
          {/* Modal */}
          <div className="relative bg-white border-2 border-slate-300 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <Network className="h-5 w-5 text-white" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Add PLC Connection</span>
              </div>
              <button
                onClick={() => {
                  setShowAddPLCModal(false);
                  setSelectedGatewayForPLC(null);
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Gateway Info */}
              {selectedGatewayForPLC && (
                <div className="bg-slate-100 border border-slate-200 p-3 flex items-center gap-3">
                  <Router className="h-5 w-5 text-slate-600" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Gateway</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {mockGateways.find(g => g.id === selectedGatewayForPLC)?.name}
                    </p>
                  </div>
                </div>
              )}

              {/* PLC Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  PLC Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPLC.name}
                  onChange={(e) => setNewPLC({ ...newPLC, name: e.target.value })}
                  placeholder="e.g., Main Process PLC"
                  className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm focus:outline-none focus:border-slate-500"
                />
              </div>

              {/* Protocol Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Protocol <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={newPLC.protocol}
                      onChange={(e) => {
                        const protocol = e.target.value as typeof newPLC.protocol;
                        const defaultPort = plcProtocols.find(p => p.value === protocol)?.port || 502;
                        setNewPLC({ ...newPLC, protocol, port: defaultPort });
                      }}
                      className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm appearance-none focus:outline-none focus:border-slate-500"
                    >
                      {plcProtocols.map((protocol) => (
                        <option key={protocol.value} value={protocol.value}>
                          {protocol.value}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Default Port
                  </label>
                  <input
                    type="number"
                    value={newPLC.port}
                    onChange={(e) => setNewPLC({ ...newPLC, port: parseInt(e.target.value) || 502 })}
                    className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              {/* Network Configuration */}
              <div className="border-t-2 border-slate-200 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Configuration
                </p>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    IP Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPLC.ipAddress}
                    onChange={(e) => setNewPLC({ ...newPLC, ipAddress: e.target.value })}
                    placeholder="192.168.x.x"
                    className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              {/* Vendor & Model */}
              <div className="border-t-2 border-slate-200 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  Hardware Information
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={newPLC.vendor}
                        onChange={(e) => setNewPLC({ ...newPLC, vendor: e.target.value, model: '' })}
                        className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm appearance-none focus:outline-none focus:border-slate-500"
                      >
                        <option value="">Select vendor...</option>
                        {plcVendors.map((vendor) => (
                          <option key={vendor.name} value={vendor.name}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={newPLC.model}
                        onChange={(e) => setNewPLC({ ...newPLC, model: e.target.value })}
                        disabled={!newPLC.vendor}
                        className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm appearance-none focus:outline-none focus:border-slate-500 disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">Select model...</option>
                        {newPLC.vendor && plcVendors.find(v => v.name === newPLC.vendor)?.models.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Polling Configuration */}
              <div className="border-t-2 border-slate-200 pt-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Polling Configuration
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Poll Interval (ms)
                    </label>
                    <div className="relative">
                      <select
                        value={newPLC.pollIntervalMs}
                        onChange={(e) => setNewPLC({ ...newPLC, pollIntervalMs: parseInt(e.target.value) })}
                        className="w-full h-10 px-3 pr-10 border-2 border-slate-300 bg-white text-sm font-mono appearance-none focus:outline-none focus:border-slate-500"
                      >
                        <option value={100}>100 ms (High Speed)</option>
                        <option value={250}>250 ms</option>
                        <option value={500}>500 ms</option>
                        <option value={1000}>1000 ms (Default)</option>
                        <option value={2000}>2000 ms</option>
                        <option value={5000}>5000 ms (Low Speed)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Register Count
                    </label>
                    <input
                      type="number"
                      value={newPLC.registerCount}
                      onChange={(e) => setNewPLC({ ...newPLC, registerCount: parseInt(e.target.value) || 64 })}
                      min={1}
                      max={500}
                      className="w-full h-10 px-3 border-2 border-slate-300 bg-white text-sm font-mono focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                  <Network className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">PLC Connection</p>
                    <p className="text-xs text-blue-700 mt-1">
                      The gateway will automatically attempt to establish connection with the PLC using the specified protocol.
                      Ensure the PLC is accessible from the gateway network.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 border-t-2 border-slate-200 flex items-center justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => {
                  setShowAddPLCModal(false);
                  setSelectedGatewayForPLC(null);
                }}
                className="h-10 px-4 border-2 border-slate-300 bg-white text-slate-600 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPLC}
                disabled={isLoading}
                className="h-10 px-4 bg-slate-700 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add PLC
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
