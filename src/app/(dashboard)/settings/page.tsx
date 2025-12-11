'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { currentUser } from '@/data/mock-users';

export default function SettingsPage() {
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

  const handleSave = () => {
    toast.success('Settings saved', {
      description: 'Your preferences have been updated successfully.',
    });
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      <div className="p-8">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Notification Channels */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[var(--accent-blue)]">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success-bg)] text-[var(--success)]">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts on WhatsApp
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.whatsapp}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, whatsapp: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning-bg)] text-[var(--warning)]">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive critical alerts via SMS
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-[var(--accent-purple)]">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, push: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alert Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>
                  Configure alert notification rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label>Critical Alerts</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={alertPreferences.criticalEmail}
                        onCheckedChange={(checked) =>
                          setAlertPreferences({ ...alertPreferences, criticalEmail: checked })
                        }
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={alertPreferences.criticalSms}
                        onCheckedChange={(checked) =>
                          setAlertPreferences({ ...alertPreferences, criticalSms: checked })
                        }
                      />
                      <span className="text-sm">SMS</span>
                    </label>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label>Warning Alerts</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={alertPreferences.warningEmail}
                        onCheckedChange={(checked) =>
                          setAlertPreferences({ ...alertPreferences, warningEmail: checked })
                        }
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Switch
                        checked={alertPreferences.warningSms}
                        onCheckedChange={(checked) =>
                          setAlertPreferences({ ...alertPreferences, warningSms: checked })
                        }
                      />
                      <span className="text-sm">SMS</span>
                    </label>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Digest Frequency</Label>
                  <Select
                    value={alertPreferences.digestFrequency}
                    onValueChange={(value) =>
                      setAlertPreferences({ ...alertPreferences, digestFrequency: value })
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly Digest</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Digest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Quiet Hours</Label>
                      <p className="text-sm text-muted-foreground">
                        Pause non-critical notifications
                      </p>
                    </div>
                    <Switch
                      checked={alertPreferences.quietHoursEnabled}
                      onCheckedChange={(checked) =>
                        setAlertPreferences({ ...alertPreferences, quietHoursEnabled: checked })
                      }
                    />
                  </div>
                  {alertPreferences.quietHoursEnabled && (
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={alertPreferences.quietHoursStart}
                          onChange={(e) =>
                            setAlertPreferences({
                              ...alertPreferences,
                              quietHoursStart: e.target.value,
                            })
                          }
                          className="w-[120px]"
                        />
                      </div>
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={alertPreferences.quietHoursEnd}
                        onChange={(e) =>
                          setAlertPreferences({
                            ...alertPreferences,
                            quietHoursEnd: e.target.value,
                          })
                        }
                        className="w-[120px]"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue={currentUser.name} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" defaultValue={currentUser.email} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input defaultValue={currentUser.phone} />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="asia-kolkata">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-kolkata">
                          Asia/Kolkata (IST)
                        </SelectItem>
                        <SelectItem value="asia-dubai">
                          Asia/Dubai (GST)
                        </SelectItem>
                        <SelectItem value="america-new_york">
                          America/New_York (EST)
                        </SelectItem>
                        <SelectItem value="europe-london">
                          Europe/London (GMT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
                <Separator />
                <div className="space-y-4">
                  <Label>Change Password</Label>
                  <div className="space-y-3">
                    <Input type="password" placeholder="Current password" />
                    <Input type="password" placeholder="New password" />
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <Button onClick={handleSave}>Update Password</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Manage devices where you&apos;re logged in
                    </p>
                  </div>
                  <Button variant="outline">View Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>System Audit Log</CardTitle>
                <CardDescription>
                  View recent system activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {[
                    { time: '10:15 AM', action: 'Settings updated - Notification preferences', user: 'Rahul Kumar' },
                    { time: '09:45 AM', action: 'Report generated - Daily Operations Summary', user: 'System' },
                    { time: '09:30 AM', action: 'Alert acknowledged - High pH Chennai WTP-01', user: 'Amit Singh' },
                    { time: '09:00 AM', action: 'User login', user: 'Rahul Kumar' },
                    { time: '08:45 AM', action: 'Threshold updated - Flow Sensor Mumbai WTP-02', user: 'Priya Sharma' },
                  ].map((log, index) => (
                    <div key={index} className="flex items-center gap-4 py-2 border-b last:border-0">
                      <span className="text-muted-foreground w-20">{log.time}</span>
                      <span className="flex-1">{log.action}</span>
                      <span className="text-muted-foreground">{log.user}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
