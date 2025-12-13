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
} from 'lucide-react';
import { toast } from 'sonner';
import { currentUser } from '@/data/mock-users';

type TabType = 'notifications' | 'profile' | 'security' | 'audit';

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

  const tabs = [
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
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
    </div>
  );
}
