'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertRule, SensorType, AlertSeverity } from '@/types';
import { mockPlants } from '@/data/mock-plants';
import {
  X,
  Plus,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreateRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Omit<AlertRule, 'id'>) => void;
}

const sensorTypes: { value: SensorType; label: string; unit: string }[] = [
  { value: 'pH', label: 'pH Level', unit: 'pH' },
  { value: 'flow', label: 'Flow Rate', unit: 'm³/h' },
  { value: 'pressure', label: 'Pressure', unit: 'bar' },
  { value: 'temperature', label: 'Temperature', unit: '°C' },
  { value: 'turbidity', label: 'Turbidity', unit: 'NTU' },
  { value: 'chlorine', label: 'Chlorine', unit: 'mg/L' },
  { value: 'DO', label: 'Dissolved Oxygen', unit: 'mg/L' },
  { value: 'level', label: 'Level', unit: 'm' },
  { value: 'conductivity', label: 'Conductivity', unit: 'µS/cm' },
  { value: 'ORP', label: 'ORP', unit: 'mV' },
];

const conditions = [
  { value: 'above', label: 'Above Threshold' },
  { value: 'below', label: 'Below Threshold' },
  { value: 'equals', label: 'Equals Value' },
  { value: 'between', label: 'Between Range' },
];

const severityOptions: { value: AlertSeverity; label: string; icon: typeof AlertTriangle; color: string }[] = [
  { value: 'critical', label: 'Critical', icon: AlertTriangle, color: 'text-red-600' },
  { value: 'warning', label: 'Warning', icon: AlertCircle, color: 'text-amber-600' },
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-600' },
];

const notificationChannels = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { value: 'push', label: 'Push', icon: Bell },
];

export function CreateRuleModal({ open, onClose, onSave }: CreateRuleModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    sensorType: 'pH' as SensorType,
    condition: 'above' as 'above' | 'below' | 'equals' | 'between',
    threshold: '',
    thresholdMax: '',
    severity: 'warning' as AlertSeverity,
    enabled: true,
    notifyChannels: ['email'] as ('email' | 'sms' | 'whatsapp' | 'push')[],
    plantIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (!formData.threshold) {
      newErrors.threshold = 'Threshold value is required';
    }

    if (formData.condition === 'between' && !formData.thresholdMax) {
      newErrors.thresholdMax = 'Maximum threshold is required for range condition';
    }

    if (formData.plantIds.length === 0) {
      newErrors.plantIds = 'Select at least one plant';
    }

    if (formData.notifyChannels.length === 0) {
      newErrors.notifyChannels = 'Select at least one notification channel';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const rule: Omit<AlertRule, 'id'> = {
      name: formData.name,
      sensorType: formData.sensorType,
      condition: formData.condition,
      threshold: parseFloat(formData.threshold),
      thresholdMax: formData.thresholdMax ? parseFloat(formData.thresholdMax) : undefined,
      severity: formData.severity,
      enabled: formData.enabled,
      notifyChannels: formData.notifyChannels,
      plantIds: formData.plantIds,
    };

    onSave(rule);
    toast.success('Alert rule created', {
      description: `Rule "${formData.name}" has been created successfully.`,
    });
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      name: '',
      sensorType: 'pH',
      condition: 'above',
      threshold: '',
      thresholdMax: '',
      severity: 'warning',
      enabled: true,
      notifyChannels: ['email'],
      plantIds: [],
    });
    setErrors({});
    onClose();
  };

  const togglePlant = (plantId: string) => {
    setFormData((prev) => ({
      ...prev,
      plantIds: prev.plantIds.includes(plantId)
        ? prev.plantIds.filter((id) => id !== plantId)
        : [...prev.plantIds, plantId],
    }));
  };

  const toggleAllPlants = () => {
    setFormData((prev) => ({
      ...prev,
      plantIds: prev.plantIds.length === mockPlants.length ? [] : mockPlants.map((p) => p.id),
    }));
  };

  const toggleNotifyChannel = (channel: 'email' | 'sms' | 'whatsapp' | 'push') => {
    setFormData((prev) => ({
      ...prev,
      notifyChannels: prev.notifyChannels.includes(channel)
        ? prev.notifyChannels.filter((c) => c !== channel)
        : [...prev.notifyChannels, channel],
    }));
  };

  const selectedSensorUnit = sensorTypes.find((s) => s.value === formData.sensorType)?.unit || '';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="bg-slate-100 px-4 py-3 border-b-2 border-slate-300">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center border-2 border-slate-300 bg-white">
              <Plus className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-sm font-bold text-slate-700">
                Create Alert Rule
              </DialogTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">Configure automated alert triggers</p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <div className="bg-white max-h-[70vh] overflow-y-auto">
          {/* Rule Name */}
          <div className="px-4 py-4 border-b border-slate-200">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., High pH Alert"
              className={cn(
                'w-full h-9 px-3 text-sm border-2 bg-white focus:outline-none',
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-slate-500'
              )}
            />
            {errors.name && <p className="text-[10px] text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Sensor Type & Condition */}
          <div className="px-4 py-4 border-b border-slate-200">
            <div className="grid grid-cols-2 gap-4">
              {/* Sensor Type */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Sensor Type *
                </label>
                <div className="relative">
                  <select
                    value={formData.sensorType}
                    onChange={(e) => setFormData({ ...formData, sensorType: e.target.value as SensorType })}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    {sensorTypes.map((sensor) => (
                      <option key={sensor.value} value={sensor.value}>
                        {sensor.label} ({sensor.unit})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Condition *
                </label>
                <div className="relative">
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as typeof formData.condition })}
                    className="w-full h-9 px-3 pr-8 text-sm border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
                  >
                    {conditions.map((condition) => (
                      <option key={condition.value} value={condition.value}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Threshold Values */}
          <div className="px-4 py-4 border-b border-slate-200">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Threshold {formData.condition === 'between' ? 'Range' : 'Value'} *
            </label>
            <div className={cn('grid gap-4', formData.condition === 'between' ? 'grid-cols-2' : 'grid-cols-1')}>
              <div className="relative">
                <input
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                  placeholder={formData.condition === 'between' ? 'Min value' : 'Value'}
                  className={cn(
                    'w-full h-9 px-3 pr-12 text-sm border-2 bg-white focus:outline-none',
                    errors.threshold ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-slate-500'
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                  {selectedSensorUnit}
                </span>
              </div>
              {formData.condition === 'between' && (
                <div className="relative">
                  <input
                    type="number"
                    value={formData.thresholdMax}
                    onChange={(e) => setFormData({ ...formData, thresholdMax: e.target.value })}
                    placeholder="Max value"
                    className={cn(
                      'w-full h-9 px-3 pr-12 text-sm border-2 bg-white focus:outline-none',
                      errors.thresholdMax ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-slate-500'
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400">
                    {selectedSensorUnit}
                  </span>
                </div>
              )}
            </div>
            {errors.threshold && <p className="text-[10px] text-red-600 mt-1">{errors.threshold}</p>}
            {errors.thresholdMax && <p className="text-[10px] text-red-600 mt-1">{errors.thresholdMax}</p>}
          </div>

          {/* Severity */}
          <div className="px-4 py-4 border-b border-slate-200">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Alert Severity *
            </label>
            <div className="flex gap-2">
              {severityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.severity === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, severity: option.value })}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-bold uppercase border-2 transition-colors',
                      isSelected
                        ? option.value === 'critical'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : option.value === 'warning'
                          ? 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isSelected ? option.color : 'text-slate-400')} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plants Selection */}
          <div className="px-4 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Apply to Plants *
              </label>
              <button
                type="button"
                onClick={toggleAllPlants}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-800"
              >
                {formData.plantIds.length === mockPlants.length ? 'DESELECT ALL' : 'SELECT ALL'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mockPlants.map((plant) => {
                const isSelected = formData.plantIds.includes(plant.id);
                return (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => togglePlant(plant.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 text-[11px] border-2 transition-colors text-left',
                      isSelected
                        ? 'border-slate-500 bg-slate-100 text-slate-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    )}
                  >
                    <div
                      className={cn(
                        'w-3 h-3 border-2 flex items-center justify-center',
                        isSelected ? 'border-slate-600 bg-slate-600' : 'border-slate-300'
                      )}
                    >
                      {isSelected && <span className="text-white text-[8px]">&#10003;</span>}
                    </div>
                    <span className="truncate">{plant.name}</span>
                  </button>
                );
              })}
            </div>
            {errors.plantIds && <p className="text-[10px] text-red-600 mt-1">{errors.plantIds}</p>}
          </div>

          {/* Notification Channels */}
          <div className="px-4 py-4 border-b border-slate-200">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Notification Channels *
            </label>
            <div className="flex gap-2">
              {notificationChannels.map((channel) => {
                const Icon = channel.icon;
                const isSelected = formData.notifyChannels.includes(channel.value as typeof formData.notifyChannels[number]);
                return (
                  <button
                    key={channel.value}
                    type="button"
                    onClick={() => toggleNotifyChannel(channel.value as typeof formData.notifyChannels[number])}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-1 px-3 py-2.5 border-2 transition-colors',
                      isSelected
                        ? 'border-slate-500 bg-slate-100 text-slate-700'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-[9px] font-bold uppercase">{channel.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.notifyChannels && <p className="text-[10px] text-red-600 mt-1">{errors.notifyChannels}</p>}
          </div>

          {/* Enable/Disable Toggle */}
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Rule Status
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formData.enabled ? 'Rule will be active immediately' : 'Rule will be saved but not active'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                className={cn(
                  'relative w-12 h-6 rounded-none transition-colors border-2',
                  formData.enabled ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-300 border-slate-400'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 w-4 h-4 bg-white transition-transform',
                    formData.enabled ? 'left-6' : 'left-0.5'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-100 border-t-2 border-slate-300 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-[11px] font-bold uppercase bg-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Rule
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
