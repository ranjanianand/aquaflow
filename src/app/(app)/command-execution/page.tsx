'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Server,
  Cpu,
  Radio,
  Database,
  Monitor,
  Loader2,
  Play,
  Info,
  Zap,
  Lock,
  Activity,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  type CommandResult,
  getRiskDisplay,
  createCommand,
  executeCommand,
} from '@/data/mock-commands';

type ExecutionStage =
  | 'review'
  | 'preflight'
  | 'authorization'
  | 'transmission'
  | 'gateway'
  | 'plc'
  | 'equipment'
  | 'verification'
  | 'complete';

interface StageInfo {
  id: ExecutionStage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EXECUTION_STAGES: StageInfo[] = [
  { id: 'review', label: 'Review', icon: FileText },
  { id: 'preflight', label: 'Pre-flight', icon: Activity },
  { id: 'authorization', label: 'Auth', icon: Lock },
  { id: 'transmission', label: 'Send', icon: Radio },
  { id: 'gateway', label: 'Gateway', icon: Server },
  { id: 'plc', label: 'PLC', icon: Cpu },
  { id: 'equipment', label: 'Equipment', icon: Zap },
  { id: 'verification', label: 'Verify', icon: CheckCircle },
  { id: 'complete', label: 'Done', icon: CheckCircle },
];

interface PreflightCheck {
  id: string;
  label: string;
  status: 'pending' | 'checking' | 'passed' | 'failed';
}

const PREFLIGHT_CHECKS: PreflightCheck[] = [
  { id: 'gateway', label: 'Gateway', status: 'pending' },
  { id: 'plc', label: 'PLC Comm', status: 'pending' },
  { id: 'interlock', label: 'Interlocks', status: 'pending' },
  { id: 'auth', label: 'Auth', status: 'pending' },
  { id: 'range', label: 'Range', status: 'pending' },
  { id: 'rate', label: 'Rate Limit', status: 'pending' },
];

const SIGNAL_PATH = [
  { icon: Monitor, label: 'UI', stage: 'review' as ExecutionStage },
  { icon: Database, label: 'API', stage: 'authorization' as ExecutionStage },
  { icon: Radio, label: 'MQTT', stage: 'transmission' as ExecutionStage },
  { icon: Server, label: 'Gateway', stage: 'gateway' as ExecutionStage },
  { icon: Cpu, label: 'PLC', stage: 'plc' as ExecutionStage },
  { icon: Zap, label: 'Device', stage: 'equipment' as ExecutionStage },
];

function CommandExecutionContent() {
  const router = useRouter();
  const logRef = useRef<HTMLDivElement>(null);

  // Parse command data from URL - use window.location directly to avoid Next.js hydration issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [commandData, setCommandData] = useState<any>(null);
  const [isParsingData, setIsParsingData] = useState(true);

  useEffect(() => {
    // Use window.location.search directly instead of useSearchParams
    // This avoids hydration mismatch issues in Next.js App Router
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');
    if (data) {
      try {
        // URLSearchParams.get() already decodes URL-encoded values
        // So we only need JSON.parse, not decodeURIComponent
        const parsed = JSON.parse(data);
        setCommandData(parsed);
      } catch (e) {
        console.error('Failed to parse command data:', e);
        setCommandData(null);
      }
    } else {
      setCommandData(null);
    }
    setIsParsingData(false);
  }, []);

  const [currentStage, setCurrentStage] = useState<ExecutionStage>('review');
  const [isExecuting, setIsExecuting] = useState(false);
  const [preflightChecks, setPreflightChecks] = useState<PreflightCheck[]>(PREFLIGHT_CHECKS);
  const [preflightComplete, setPreflightComplete] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [result, setResult] = useState<CommandResult | null>(null);
  const [stageHistory, setStageHistory] = useState<{ stage: ExecutionStage; status: 'success' | 'error' }[]>([]);
  const [executionLog, setExecutionLog] = useState<{ time: Date; message: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((isExecuting || currentStage !== 'review') && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isExecuting, startTime, currentStage]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [executionLog]);

  // Show loading while parsing URL data
  if (isParsingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center p-6 bg-white border-2 border-slate-200 max-w-sm">
          <Loader2 className="h-10 w-10 text-blue-500 mx-auto mb-3 animate-spin" />
          <h1 className="text-lg font-bold text-slate-800 mb-2">Loading Command</h1>
          <p className="text-sm text-slate-600">
            Preparing execution interface...
          </p>
        </div>
      </div>
    );
  }

  if (!commandData) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center p-6 bg-white border-2 border-slate-200 max-w-sm">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-slate-800 mb-2">No Command Data</h1>
          <p className="text-sm text-slate-600 mb-4">
            Initiate from optimization or virtual twin pages.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium hover:bg-slate-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const riskInfo = getRiskDisplay(commandData.riskLevel);
  const requiresReason = commandData.riskLevel === 'high' || commandData.riskLevel === 'critical';
  const canExecute = !requiresReason || overrideReason.trim().length > 0;

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setExecutionLog(prev => [...prev, { time: new Date(), message, type }]);
  };

  const runPreflightChecks = async () => {
    setCurrentStage('preflight');
    setStartTime(new Date());
    addLog('Starting pre-flight checks...', 'info');

    const updatedChecks: PreflightCheck[] = [...PREFLIGHT_CHECKS];

    for (let i = 0; i < updatedChecks.length; i++) {
      const check = updatedChecks[i];
      setPreflightChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'checking' } : c));
      await new Promise(resolve => setTimeout(resolve, 350 + Math.random() * 150));
      updatedChecks[i] = { ...check, status: 'passed' };
      setPreflightChecks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'passed' } : c));
      addLog(`✓ ${check.label}: OK`, 'success');
    }

    setPreflightComplete(true);
    setStageHistory(prev => [...prev, { stage: 'preflight', status: 'success' }]);

    const hasCriticalFailure = updatedChecks.some(c => (c.id === 'interlock' || c.id === 'plc') && c.status === 'failed');
    if (!hasCriticalFailure) {
      addLog('Pre-flight complete. Ready.', 'success');
      setCurrentStage('authorization');
    } else {
      addLog('Pre-flight failed.', 'error');
    }
  };

  const executeCommandFlow = async () => {
    setIsExecuting(true);
    if (!startTime) setStartTime(new Date());

    addLog('Authorizing...', 'info');
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 300));
    setStageHistory(prev => [...prev, { stage: 'authorization', status: 'success' }]);
    addLog('✓ Authorized', 'success');

    setCurrentStage('transmission');
    addLog('Publishing to MQTT...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 400));
    setStageHistory(prev => [...prev, { stage: 'transmission', status: 'success' }]);
    addLog(`✓ Published`, 'success');

    setCurrentStage('gateway');
    addLog('Gateway processing...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 500));
    setStageHistory(prev => [...prev, { stage: 'gateway', status: 'success' }]);
    addLog('✓ Gateway OK', 'success');

    setCurrentStage('plc');
    addLog(`Writing to PLC...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 300));
    setStageHistory(prev => [...prev, { stage: 'plc', status: 'success' }]);
    addLog('✓ PLC write OK', 'success');

    setCurrentStage('equipment');
    addLog(`${commandData.equipmentName} responding...`, 'info');
    await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 1000));
    setStageHistory(prev => [...prev, { stage: 'equipment', status: 'success' }]);
    addLog('✓ Equipment actuated', 'success');

    setCurrentStage('verification');
    addLog('Verifying...', 'info');
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 200));

    const command = createCommand({
      type: commandData.type || 'setpoint',
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
      requestedBy: 'Operator',
    });

    const execResult = await executeCommand(command.id, {
      confirmedBy: 'Operator',
      confirmedAt: new Date(),
      overrideReason: overrideReason || undefined,
    });

    setResult(execResult);
    setStageHistory(prev => [...prev, { stage: 'verification', status: execResult.success ? 'success' : 'error' }]);

    if (execResult.success) {
      addLog('✓ Verified', 'success');
      setCurrentStage('complete');
      addLog(`✓ SUCCESS: ${commandData.targetValue} ${commandData.unit}`, 'success');
    } else {
      addLog(`✗ Failed: ${execResult.message}`, 'error');
    }

    setIsExecuting(false);
  };

  const changePercent =
    typeof commandData.currentValue === 'number' && typeof commandData.targetValue === 'number'
      ? (((commandData.targetValue - commandData.currentValue) / commandData.currentValue) * 100).toFixed(1)
      : null;

  const currentStageIndex = EXECUTION_STAGES.findIndex(s => s.id === currentStage);

  const getSignalPathStatus = (stage: ExecutionStage) => {
    const stageIdx = EXECUTION_STAGES.findIndex(s => s.id === stage);
    if (stageIdx < currentStageIndex || currentStage === 'complete') return 'complete';
    if (stageIdx === currentStageIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Minimal Header */}
      <header className="flex-shrink-0 bg-slate-800 text-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-slate-700 rounded"
              disabled={isExecuting}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className={cn(
              'w-7 h-7 rounded flex items-center justify-center',
              commandData.riskLevel === 'critical' ? 'bg-red-600' :
              commandData.riskLevel === 'high' ? 'bg-orange-600' :
              commandData.riskLevel === 'medium' ? 'bg-amber-600' : 'bg-emerald-600'
            )}>
              <Shield className="h-3.5 w-3.5 text-white" />
            </div>
            <h1 className="text-sm font-bold">Command Execution</h1>
          </div>
          <div className="flex items-center gap-3">
            {(currentStageIndex > 0 || isExecuting) && (
              <div className="flex items-center gap-1.5 bg-slate-700 px-2 py-1 rounded text-xs">
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="font-mono font-bold">{elapsedTime}s</span>
              </div>
            )}
            <div className={cn(
              'px-2 py-1 flex items-center gap-1.5 text-[10px] font-bold uppercase rounded',
              commandData.riskLevel === 'critical' ? 'bg-red-600' :
              commandData.riskLevel === 'high' ? 'bg-orange-600' :
              commandData.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-600'
            )}>
              {commandData.riskLevel === 'critical' ? <AlertOctagon className="h-3 w-3" /> :
               commandData.riskLevel === 'high' ? <AlertTriangle className="h-3 w-3" /> :
               <Info className="h-3 w-3" />}
              {riskInfo.label}
            </div>
          </div>
        </div>
      </header>

      {/* Pipeline - Full Width */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          {EXECUTION_STAGES.map((stage, index) => {
            const StageIcon = stage.icon;
            const isActive = stage.id === currentStage;
            const isComplete = index < currentStageIndex || currentStage === 'complete';
            const isFailed = stageHistory.find(h => h.stage === stage.id)?.status === 'error';

            return (
              <div key={stage.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                    isComplete && !isFailed ? 'bg-emerald-500 border-emerald-500 text-white' :
                    isFailed ? 'bg-red-500 border-red-500 text-white' :
                    isActive ? 'bg-blue-500 border-blue-500 text-white' :
                    'bg-white border-slate-300 text-slate-400'
                  )}>
                    {isComplete && !isFailed ? <CheckCircle className="h-4 w-4" /> :
                     isFailed ? <XCircle className="h-4 w-4" /> :
                     isActive && isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> :
                     <StageIcon className="h-4 w-4" />}
                  </div>
                  <span className={cn(
                    'text-[9px] font-semibold mt-1',
                    isActive ? 'text-blue-600' : isComplete ? 'text-emerald-600' : 'text-slate-400'
                  )}>
                    {stage.label}
                  </span>
                </div>
                {index < EXECUTION_STAGES.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2 min-w-[20px]',
                    index < currentStageIndex ? 'bg-emerald-500' : 'bg-slate-200'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content - Fixed height, no page scroll */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="max-w-6xl mx-auto h-full flex flex-col overflow-hidden">
          {/* Equipment/Plant Heading - Prominent at top */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{commandData.equipmentName}</h2>
                <p className="text-sm text-slate-500">{commandData.plantName}</p>
              </div>
            </div>
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border-2',
              commandData.source === 'ai_optimization' ? 'bg-purple-50 border-purple-300' :
              commandData.source === 'virtual_twin' ? 'bg-cyan-50 border-cyan-300' :
              commandData.source === 'alarm_response' ? 'bg-orange-50 border-orange-300' :
              'bg-slate-50 border-slate-300'
            )}>
              {commandData.source === 'ai_optimization' ? <Cpu className="h-5 w-5 text-purple-600" /> :
               commandData.source === 'virtual_twin' ? <Database className="h-5 w-5 text-cyan-600" /> :
               commandData.source === 'alarm_response' ? <AlertTriangle className="h-5 w-5 text-orange-600" /> :
               <Monitor className="h-5 w-5 text-slate-600" />}
              <span className={cn(
                'text-sm font-semibold',
                commandData.source === 'ai_optimization' ? 'text-purple-700' :
                commandData.source === 'virtual_twin' ? 'text-cyan-700' :
                commandData.source === 'alarm_response' ? 'text-orange-700' :
                'text-slate-700'
              )}>
                {commandData.source === 'ai_optimization' ? 'AI Autonomous Optimization' :
                 commandData.source === 'virtual_twin' ? 'Virtual Twin Simulation' :
                 commandData.source === 'alarm_response' ? 'Alarm Response' :
                 'Manual Command'}
              </span>
            </div>
          </div>

          {/* Two Column Grid - Fixed Height */}
          <div className="flex-1 grid grid-cols-2 gap-6 min-h-0 overflow-hidden">
            {/* Left - Command Info - Scrollable */}
            <div className="space-y-3 overflow-y-auto pr-2">
              {/* Parameter Change - Ultra Compact */}
              <div className="bg-white border-2 border-slate-200 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Parameter Change</p>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-semibold rounded-full">
                    {commandData.parameterName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-[8px] text-slate-500 uppercase">Current</p>
                    <p className="text-2xl font-bold font-mono text-slate-700">{commandData.currentValue}</p>
                    <p className="text-[10px] text-slate-500">{commandData.unit}</p>
                  </div>
                  <div className="flex flex-col items-center px-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                    {changePercent && (
                      <span className={cn(
                        'text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full',
                        parseFloat(changePercent) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      )}>
                        {parseFloat(changePercent) > 0 ? '+' : ''}{changePercent}%
                      </span>
                    )}
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[8px] text-blue-600 uppercase">Target</p>
                    <p className="text-2xl font-bold font-mono text-blue-700">{commandData.targetValue}</p>
                    <p className="text-[10px] text-blue-500">{commandData.unit}</p>
                  </div>
                </div>
              </div>

              {/* AI Reasoning with Root Cause - Compact */}
              {(commandData.reasoning || commandData.rootCause) && (
                <div className="bg-purple-50 border-2 border-purple-200 p-3 rounded-lg">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600 mb-2">AI Analysis & Reasoning</p>

                  {/* Root Cause / Trigger - Only show if we have actual root cause data */}
                  {commandData.rootCause && (
                    <div className="mb-2 pb-2 border-b border-purple-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                        </div>
                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Root Cause Detected</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-snug pl-6">{commandData.rootCause}</p>
                    </div>
                  )}

                  {/* AI Recommendation */}
                  {commandData.reasoning && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded bg-purple-200 flex items-center justify-center">
                          <Cpu className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">AI Recommendation</span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-snug pl-6">{commandData.reasoning}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Expected Outcome - Compact */}
              {commandData.expectedOutcome && (
                <div className="bg-emerald-50 border-2 border-emerald-200 p-3 rounded-lg">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mb-2">Expected Outcome</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700">{commandData.expectedOutcome.metric}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base text-slate-600">{commandData.expectedOutcome.currentValue}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                      <span className="font-mono text-base font-bold text-emerald-700">{commandData.expectedOutcome.projectedValue}</span>
                      <span className={cn(
                        'px-2 py-0.5 text-[10px] font-bold rounded-full',
                        commandData.expectedOutcome.percentChange < 0 ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'
                      )}>
                        {commandData.expectedOutcome.percentChange > 0 ? '+' : ''}{commandData.expectedOutcome.percentChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Override Reason */}
              {requiresReason && currentStage === 'review' && (
                <div className="bg-white border border-red-300 p-3 rounded">
                  <p className="text-[9px] font-bold uppercase text-red-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Override Required
                  </p>
                  <textarea
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Reason for high-risk command..."
                    rows={2}
                    className={cn(
                      'w-full px-3 py-2 text-[12px] border focus:outline-none resize-none rounded',
                      overrideReason.trim() ? 'border-emerald-400 bg-emerald-50' : 'border-red-300 bg-red-50'
                    )}
                  />
                </div>
              )}

              {/* Result */}
              {result && (
                <div className={cn(
                  'p-4 border rounded',
                  result.success ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'
                )}>
                  <div className="flex items-center gap-4">
                    {result.success ? (
                      <CheckCircle className="h-10 w-10 text-emerald-500" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-500" />
                    )}
                    <div>
                      <h3 className={cn('text-base font-bold', result.success ? 'text-emerald-800' : 'text-red-800')}>
                        {result.success ? 'Command Executed Successfully' : 'Command Failed'}
                      </h3>
                      <p className={cn('text-[12px]', result.success ? 'text-emerald-700' : 'text-red-700')}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right - Execution Panel - Fixed Height, No Page Scroll */}
            <div className="bg-slate-900 border-2 border-slate-700 p-4 rounded-lg flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Execution Flow</p>
                {isExecuting && (
                  <span className="text-[11px] text-blue-400 flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Running
                  </span>
                )}
              </div>

              {/* Signal Path */}
              <div className="flex items-center justify-between mb-3 px-3 py-3 bg-slate-800 rounded-lg flex-shrink-0">
                {SIGNAL_PATH.map((item, index) => {
                  const ItemIcon = item.icon;
                  const status = getSignalPathStatus(item.stage);
                  return (
                    <div key={index} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                          status === 'complete' ? 'bg-emerald-500 text-white' :
                          status === 'active' ? 'bg-blue-500 text-white animate-pulse' :
                          'bg-slate-700 text-slate-500'
                        )}>
                          {status === 'complete' ? <CheckCircle className="h-4 w-4" /> :
                           status === 'active' && isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> :
                           <ItemIcon className="h-4 w-4" />}
                        </div>
                        <span className={cn(
                          'text-[9px] mt-1.5 font-semibold',
                          status === 'complete' ? 'text-emerald-400' :
                          status === 'active' ? 'text-blue-400' : 'text-slate-500'
                        )}>
                          {item.label}
                        </span>
                      </div>
                      {index < SIGNAL_PATH.length - 1 && (
                        <div className={cn('flex-1 h-0.5 mx-1.5 min-w-[8px]', status === 'complete' ? 'bg-emerald-500' : 'bg-slate-700')} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pre-flight Checks */}
              {(currentStage === 'preflight' || preflightComplete || currentStageIndex > 1) && (
                <div className="mb-3 flex-shrink-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Pre-flight Checks</p>
                  <div className="grid grid-cols-3 gap-2">
                    {preflightChecks.map(check => (
                      <div key={check.id} className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium',
                        check.status === 'passed' ? 'bg-emerald-900/50 text-emerald-400' :
                        check.status === 'checking' ? 'bg-blue-900/50 text-blue-400' :
                        'bg-slate-800 text-slate-500'
                      )}>
                        {check.status === 'checking' && <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />}
                        {check.status === 'passed' && <CheckCircle className="h-3 w-3 flex-shrink-0" />}
                        {check.status === 'pending' && <div className="w-3 h-3 rounded-full border border-slate-500 flex-shrink-0" />}
                        <span className="truncate">{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Log - Fixed height with internal scroll */}
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2 flex-shrink-0">Execution Log</p>
                <div
                  ref={logRef}
                  className="flex-1 overflow-y-auto font-mono text-[11px] space-y-1 bg-slate-950 p-3 rounded-lg min-h-[120px] max-h-[200px]"
                >
                  {executionLog.length === 0 ? (
                    <p className="text-slate-600">Waiting for execution...</p>
                  ) : (
                    executionLog.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-slate-600 flex-shrink-0">
                          {log.time.toLocaleTimeString('en-US', { hour12: false })}
                        </span>
                        <span className={cn(
                          log.type === 'success' ? 'text-emerald-400' :
                          log.type === 'error' ? 'text-red-400' :
                          log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between flex-shrink-0">
                <span className="text-[9px] text-slate-500">
                  {currentStage === 'complete' ? (
                    <span className="text-emerald-400 font-bold">Done in {elapsedTime}s</span>
                  ) : 'Est: ~15-20s'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.back()}
                    disabled={isExecuting}
                    className="px-3 py-1.5 text-[10px] font-bold uppercase border border-slate-600 text-slate-400 hover:bg-slate-800 disabled:opacity-50 rounded"
                  >
                    Cancel
                  </button>

                  {currentStage === 'review' && (
                    <button
                      onClick={runPreflightChecks}
                      disabled={!canExecute}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded flex items-center gap-1"
                    >
                      <Activity className="h-3 w-3" />
                      Pre-flight
                    </button>
                  )}

                  {currentStage === 'authorization' && !isExecuting && (
                    <button
                      onClick={executeCommandFlow}
                      className={cn(
                        'px-3 py-1.5 text-[10px] font-bold uppercase text-white rounded flex items-center gap-1',
                        commandData.riskLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                        commandData.riskLevel === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                        'bg-emerald-600 hover:bg-emerald-700'
                      )}
                    >
                      <Play className="h-3 w-3" />
                      Execute
                    </button>
                  )}

                  {isExecuting && (
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-white bg-blue-600 rounded flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {elapsedTime}s
                    </div>
                  )}

                  {currentStage === 'complete' && (
                    <button
                      onClick={() => router.back()}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Done
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export the component directly - no Suspense needed since we use window.location
export default CommandExecutionContent;
