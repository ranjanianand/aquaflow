'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Clock,
  ArrowRight,
  Loader2,
  AlertOctagon,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  type CommandRequest,
  type CommandResult,
  getRiskDisplay,
  createCommand,
  executeCommand,
} from '@/data/mock-commands';

interface CommandConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commandData: {
    type: CommandRequest['type'];
    equipmentId: string;
    equipmentName: string;
    plantId: string;
    plantName: string;
    parameterName: string;
    currentValue: number | string;
    targetValue: number | string;
    unit: string;
    riskLevel: CommandRequest['riskLevel'];
    reasoning?: string;
    source: CommandRequest['source'];
    expectedOutcome?: {
      metric: string;
      currentValue: number;
      projectedValue: number;
      unit: string;
      percentChange: number;
    };
  };
  onConfirm: (result: CommandResult) => void;
  onCancel: () => void;
  userName: string;
}

export function CommandConfirmationDialog({
  open,
  onOpenChange,
  commandData,
  onConfirm,
  onCancel,
  userName,
}: CommandConfirmationDialogProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<CommandResult | null>(null);

  const riskInfo = getRiskDisplay(commandData.riskLevel);

  const handleConfirm = async () => {
    setIsExecuting(true);

    // Create the command
    const command = createCommand({
      type: commandData.type,
      equipmentId: commandData.equipmentId,
      equipmentName: commandData.equipmentName,
      plantId: commandData.plantId,
      plantName: commandData.plantName,
      parameterName: commandData.parameterName,
      currentValue: commandData.currentValue,
      targetValue: commandData.targetValue,
      unit: commandData.unit,
      riskLevel: commandData.riskLevel,
      reasoning: commandData.reasoning,
      source: commandData.source,
      requestedBy: userName,
    });

    // Execute the command
    const execResult = await executeCommand(command.id, {
      confirmedBy: userName,
      confirmedAt: new Date(),
      notes: notes || undefined,
      overrideReason: overrideReason || undefined,
    });

    setResult(execResult);
    setIsExecuting(false);

    // Auto-close after showing result for 2 seconds
    setTimeout(() => {
      onConfirm(execResult);
      resetState();
    }, 2000);
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const resetState = () => {
    setIsExecuting(false);
    setOverrideReason('');
    setNotes('');
    setResult(null);
  };

  const canConfirm = !riskInfo.requiresReason || overrideReason.trim().length > 0;

  // Calculate change percentage
  const changePercent =
    typeof commandData.currentValue === 'number' &&
    typeof commandData.targetValue === 'number'
      ? (
          ((commandData.targetValue - commandData.currentValue) /
            commandData.currentValue) *
          100
        ).toFixed(1)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Shield className={cn('h-5 w-5', riskInfo.color)} />
            Confirm Command Execution
          </DialogTitle>
        </DialogHeader>

        {/* Result Display */}
        {result && (
          <div
            className={cn(
              'p-4 border-2 flex items-start gap-3',
              result.success
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-red-50 border-red-300'
            )}
          >
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            )}
            <div>
              <h4
                className={cn(
                  'text-sm font-semibold',
                  result.success ? 'text-emerald-800' : 'text-red-800'
                )}
              >
                {result.success ? 'Command Executed Successfully' : 'Command Failed'}
              </h4>
              <p
                className={cn(
                  'text-[12px] mt-1',
                  result.success ? 'text-emerald-700' : 'text-red-700'
                )}
              >
                {result.message}
              </p>
              {result.estimatedDuration && (
                <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Changes will be visible in ~{result.estimatedDuration} seconds
                </p>
              )}
              {result.errors && result.errors.length > 0 && (
                <ul className="text-[11px] text-red-600 mt-2 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Form */}
        {!result && (
          <div className="space-y-4 py-2">
            {/* Risk Level Banner */}
            <div
              className={cn(
                'p-3 border-2 flex items-start gap-3',
                riskInfo.bgColor,
                riskInfo.borderColor
              )}
            >
              {commandData.riskLevel === 'critical' ? (
                <AlertOctagon className={cn('h-5 w-5 flex-shrink-0', riskInfo.color)} />
              ) : commandData.riskLevel === 'high' ? (
                <AlertTriangle className={cn('h-5 w-5 flex-shrink-0', riskInfo.color)} />
              ) : (
                <Info className={cn('h-5 w-5 flex-shrink-0', riskInfo.color)} />
              )}
              <div>
                <h4 className={cn('text-sm font-semibold', riskInfo.color)}>
                  {riskInfo.label}
                </h4>
                <p className={cn('text-[11px] mt-0.5', riskInfo.color)}>
                  {riskInfo.description}
                </p>
              </div>
            </div>

            {/* Equipment & Plant Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Equipment
                </p>
                <p className="text-[13px] font-semibold text-slate-700">
                  {commandData.equipmentName}
                </p>
                <p className="text-[11px] text-slate-500">{commandData.plantName}</p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Source
                </p>
                <p className="text-[13px] font-semibold text-slate-700">
                  {commandData.source === 'ai_optimization'
                    ? 'AI Optimization'
                    : commandData.source === 'virtual_twin'
                    ? 'Virtual Twin'
                    : commandData.source === 'alarm_response'
                    ? 'Alarm Response'
                    : 'Manual'}
                </p>
              </div>
            </div>

            {/* Parameter Change Display */}
            <div className="p-4 border-2 border-slate-200 bg-white">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Parameter Change
              </p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Current</p>
                  <p className="text-xl font-bold font-mono text-slate-700">
                    {commandData.currentValue}
                  </p>
                  <p className="text-[10px] text-slate-500">{commandData.unit}</p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <ArrowRight className="h-6 w-6 text-blue-500" />
                  {changePercent && (
                    <span
                      className={cn(
                        'text-[10px] font-bold mt-1',
                        parseFloat(changePercent) > 0 ? 'text-amber-600' : 'text-emerald-600'
                      )}
                    >
                      {parseFloat(changePercent) > 0 ? '+' : ''}
                      {changePercent}%
                    </span>
                  )}
                </div>

                <div className="text-center">
                  <p className="text-[10px] text-blue-600 uppercase mb-1">New Value</p>
                  <p className="text-xl font-bold font-mono text-blue-700">
                    {commandData.targetValue}
                  </p>
                  <p className="text-[10px] text-blue-500">{commandData.unit}</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 text-center mt-3">
                {commandData.parameterName}
              </p>
            </div>

            {/* Expected Outcome */}
            {commandData.expectedOutcome && (
              <div className="p-3 bg-emerald-50 border border-emerald-200">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
                  Expected Outcome
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-700">
                    {commandData.expectedOutcome.metric}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-mono text-slate-600">
                      {commandData.expectedOutcome.currentValue}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="text-[12px] font-mono font-bold text-emerald-700">
                      {commandData.expectedOutcome.projectedValue}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {commandData.expectedOutcome.unit}
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[9px] font-bold',
                        commandData.expectedOutcome.percentChange < 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {commandData.expectedOutcome.percentChange > 0 ? '+' : ''}
                      {commandData.expectedOutcome.percentChange.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Reasoning */}
            {commandData.reasoning && (
              <div className="p-3 bg-purple-50 border border-purple-200">
                <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600 mb-1">
                  AI Reasoning
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {commandData.reasoning}
                </p>
              </div>
            )}

            {/* Override Reason (for high-risk commands) */}
            {riskInfo.requiresReason && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Override Reason (Required)
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this command should be executed..."
                  rows={2}
                  className={cn(
                    'w-full px-3 py-2 border-2 focus:outline-none resize-none text-[12px]',
                    overrideReason.trim()
                      ? 'border-emerald-300 focus:border-emerald-500'
                      : 'border-red-300 focus:border-red-500'
                  )}
                />
              </div>
            )}

            {/* Optional Notes */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                className="w-full h-9 px-3 border-2 border-slate-300 focus:outline-none focus:border-slate-500 text-[12px]"
              />
            </div>

            {/* Warning Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-800">
                    This action will send a command to the plant
                  </p>
                  <p className="text-[10px] text-amber-700 mt-0.5">
                    Ensure you have verified the change is appropriate for current
                    operating conditions. Command execution is logged for audit
                    purposes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!result && (
          <DialogFooter className="gap-2 flex-shrink-0 pt-2 border-t border-slate-200">
            <button
              onClick={handleCancel}
              disabled={isExecuting}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isExecuting || !canConfirm}
              className={cn(
                'px-4 py-2 text-[11px] font-bold uppercase text-white flex items-center gap-2 disabled:opacity-50',
                commandData.riskLevel === 'critical'
                  ? 'bg-red-600 hover:bg-red-700'
                  : commandData.riskLevel === 'high'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              )}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirm & Execute
                </>
              )}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CommandConfirmationDialog;
