'use client';

import { useState } from 'react';
import { Sensor } from '@/types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ClipboardEdit, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useManualReadingsStore } from '@/stores/manual-readings-store';
import { format } from 'date-fns';

interface ManualEntryModalProps {
  sensor: Sensor | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManualEntryModal({ sensor, open, onClose, onSuccess }: ManualEntryModalProps) {
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const addReading = useManualReadingsStore((state) => state.addReading);

  if (!sensor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numValue = parseFloat(value);

    // Validation
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      return;
    }

    // Warn if significantly out of range but still allow
    const range = sensor.maxThreshold - sensor.minThreshold;
    const isOutOfRange = numValue < sensor.minThreshold - range * 0.5 ||
                         numValue > sensor.maxThreshold + range * 0.5;

    if (isOutOfRange) {
      const confirmSubmit = window.confirm(
        `The value ${numValue} ${sensor.unit} is significantly outside the normal range (${sensor.minThreshold} - ${sensor.maxThreshold} ${sensor.unit}). Are you sure you want to log this reading?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);

    // Simulate brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    addReading({
      sensorId: sensor.id,
      value: numValue,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
      enteredBy: 'Current User', // In production, get from auth
      dataSource: 'manual',
    });

    setIsSubmitting(false);
    setShowSuccess(true);

    // Reset and close after brief success display
    setTimeout(() => {
      setValue('');
      setNotes('');
      setShowSuccess(false);
      onSuccess?.();
      onClose();
    }, 1000);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setValue('');
      setNotes('');
      setError(null);
      setShowSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md p-0 gap-0 border-2 border-slate-300 rounded-none" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="bg-blue-50 px-4 py-3 border-b-2 border-slate-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 border-2 border-slate-300">
              <ClipboardEdit className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-slate-700">Log Manual Reading</DialogTitle>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {sensor.name} • {sensor.type.toUpperCase()}
              </p>
            </div>
          </div>
        </DialogHeader>

        {showSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3" />
            <p className="text-sm font-bold text-emerald-700">Reading Logged Successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="p-4 space-y-4">
              {/* Current Value Reference */}
              <div className="bg-slate-50 border-2 border-slate-200 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Current Sensor Value
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-700">
                    {sensor.currentValue.toFixed(1)} {sensor.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-400">Valid Range</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
                  </span>
                </div>
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Manual Reading Value <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setError(null);
                    }}
                    placeholder={`Enter value in ${sensor.unit}`}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm font-mono border-2 bg-white',
                      'focus:outline-none focus:border-blue-500',
                      error ? 'border-red-300' : 'border-slate-300'
                    )}
                    autoFocus
                    required
                  />
                  <span className="text-sm font-medium text-slate-500 min-w-[50px]">
                    {sensor.unit}
                  </span>
                </div>
                {error && (
                  <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {error}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any relevant notes about this reading..."
                  rows={3}
                  className={cn(
                    'w-full px-3 py-2 text-sm border-2 border-slate-300 bg-white resize-none',
                    'focus:outline-none focus:border-blue-500'
                  )}
                />
              </div>

              {/* Timestamp */}
              <div className="bg-slate-50 border-2 border-slate-200 p-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Timestamp
                  </span>
                  <span className="text-[10px] font-mono text-slate-600">
                    {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  Reading will be logged with current date and time
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <DialogFooter className="bg-slate-100 px-4 py-3 border-t-2 border-slate-300">
              <div className="flex items-center justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className={cn(
                    'px-4 py-2 text-[10px] font-bold uppercase',
                    'bg-white border-2 border-slate-300 text-slate-600',
                    'hover:bg-slate-50 transition-colors',
                    'disabled:opacity-50'
                  )}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !value}
                  className={cn(
                    'px-4 py-2 text-[10px] font-bold uppercase',
                    'bg-blue-600 text-white',
                    'hover:bg-blue-700 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'flex items-center gap-2'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <ClipboardEdit className="h-3 w-3" />
                      Log Reading
                    </>
                  )}
                </button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
