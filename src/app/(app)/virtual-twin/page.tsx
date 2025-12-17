'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Boxes,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Save,
  Upload,
  Download,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Droplets,
  DollarSign,
  Leaf,
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  Star,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  Layers,
  Gauge,
  Wind,
  Filter,
  Beaker,
  ThermometerSun,
  GraduationCap,
  Info,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  twinParameters,
  calculateOutcomes,
  savedScenarios,
  generateHistoricalSnapshots,
  categoryInfo,
  outcomeInfo,
  type TwinParameter,
  type SimulationOutcome,
  type SimulationScenario,
} from '@/data/mock-twin';
import { mockPlants } from '@/data/mock-plants';

type ViewMode = 'simulation' | 'playback' | 'training';

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pump: Wind,
  chemical: Beaker,
  filter: Filter,
  process: Gauge,
  environmental: ThermometerSun,
};

const outcomeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  energy: Zap,
  quality: Droplets,
  throughput: TrendingUp,
  cost: DollarSign,
  environmental: Leaf,
};

export default function VirtualTwinPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('simulation');
  const [selectedPlant, setSelectedPlant] = useState('plant-1');
  const [parameters, setParameters] = useState<TwinParameter[]>(twinParameters);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['pump', 'chemical']);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [loadModalOpen, setLoadModalOpen] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [historicalData, setHistoricalData] = useState(generateHistoricalSnapshots(24));

  // Training mode state
  const [trainingMode, setTrainingMode] = useState(false);
  const [trainingTips, setTrainingTips] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Calculate outcomes based on current parameters
  const outcomes = useMemo(() => calculateOutcomes(parameters), [parameters]);

  // Handle parameter change
  const handleParameterChange = useCallback((parameterId: string, value: number) => {
    setParameters(prev =>
      prev.map(p =>
        p.id === parameterId ? { ...p, simulatedValue: value } : p
      )
    );
  }, []);

  // Reset parameters to current values
  const handleReset = useCallback(() => {
    setParameters(prev =>
      prev.map(p => ({ ...p, simulatedValue: p.currentValue }))
    );
    toast.info('Parameters Reset', {
      description: 'All parameters have been reset to current values.',
    });
  }, []);

  // Check if any parameter has changed
  const hasChanges = useMemo(() => {
    return parameters.some(p => p.simulatedValue !== p.currentValue);
  }, [parameters]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Load scenario
  const loadScenario = (scenario: SimulationScenario) => {
    setParameters(prev =>
      prev.map(p => {
        const scenarioParam = scenario.parameters.find(sp => sp.parameterId === p.id);
        return scenarioParam
          ? { ...p, simulatedValue: scenarioParam.value }
          : { ...p, simulatedValue: p.currentValue };
      })
    );
    setLoadModalOpen(false);
    toast.success('Scenario Loaded', {
      description: `"${scenario.name}" has been applied.`,
    });
  };

  // Save scenario
  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error('Name Required', { description: 'Please enter a scenario name.' });
      return;
    }

    toast.success('Scenario Saved', {
      description: `"${scenarioName}" has been saved successfully.`,
    });
    setSaveModalOpen(false);
    setScenarioName('');
    setScenarioDescription('');
  };

  // Playback controls
  const playbackSnapshot = useMemo(() => {
    if (historicalData.length === 0) return null;
    const index = Math.min(playbackPosition, historicalData.length - 1);
    return historicalData[index];
  }, [historicalData, playbackPosition]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying || viewMode !== 'playback') return;

    const interval = setInterval(() => {
      setPlaybackPosition(prev => {
        if (prev >= historicalData.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, historicalData.length, viewMode]);

  // Get outcome icon component
  const getOutcomeIcon = (category: string) => {
    return outcomeIcons[category] || Activity;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-100">
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Boxes className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Virtual Twin Sandbox</span>
          </div>
        </header>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-slate-200 border-2 border-slate-300" />
              ))}
            </div>
            <div className="h-96 bg-slate-200 border-2 border-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Industrial Header */}
      <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Boxes className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Virtual Twin Sandbox</span>
          <span className="text-[10px] text-slate-400">What-If Simulation & Process Modeling</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Training Mode Toggle */}
          <button
            onClick={() => {
              setTrainingMode(!trainingMode);
              setViewMode(trainingMode ? 'simulation' : 'training');
            }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
              trainingMode
                ? 'bg-amber-600 text-white'
                : 'bg-slate-600 text-slate-300'
            )}
          >
            <GraduationCap className="h-3 w-3" />
            TRAINING {trainingMode ? 'ON' : 'OFF'}
          </button>
          {hasChanges && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-cyan-600 text-white text-[10px] font-bold">
              <Activity className="h-3 w-3" />
              SIMULATION ACTIVE
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4">
        {/* Mode Selector & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[
              { id: 'simulation' as ViewMode, label: 'What-If Simulation', icon: Sparkles },
              { id: 'playback' as ViewMode, label: 'Historical Playback', icon: History },
              { id: 'training' as ViewMode, label: 'Training Mode', icon: GraduationCap },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors',
                    viewMode === mode.id
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-300'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {mode.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* Plant Selector */}
            <div className="relative">
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="h-8 px-3 pr-8 text-[11px] font-bold uppercase border-2 border-slate-300 bg-white appearance-none cursor-pointer focus:outline-none focus:border-slate-500"
              >
                {mockPlants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" />
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className={cn(
                'h-8 px-3 flex items-center gap-1.5 text-[10px] font-bold uppercase border-2 border-slate-300 transition-colors',
                hasChanges
                  ? 'bg-white text-slate-600 hover:bg-slate-50'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>

            <button
              onClick={() => setLoadModalOpen(true)}
              className="h-8 px-3 flex items-center gap-1.5 text-[10px] font-bold uppercase border-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            >
              <Upload className="h-3.5 w-3.5" />
              Load
            </button>

            <button
              onClick={() => setSaveModalOpen(true)}
              disabled={!hasChanges}
              className={cn(
                'h-8 px-3 flex items-center gap-1.5 text-[10px] font-bold uppercase transition-colors',
                hasChanges
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              )}
            >
              <Save className="h-3.5 w-3.5" />
              Save Scenario
            </button>
          </div>
        </div>

        {/* Playback Controls (only in playback mode) */}
        {viewMode === 'playback' && (
          <div className="border-2 border-slate-300 bg-white p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlaybackPosition(0)}
                  className="p-2 border border-slate-300 hover:bg-slate-50"
                >
                  <SkipBack className="h-4 w-4 text-slate-600" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={cn(
                    'p-2 border',
                    isPlaying
                      ? 'border-red-300 bg-red-50 text-red-600'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-600'
                  )}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setPlaybackPosition(historicalData.length - 1)}
                  className="p-2 border border-slate-300 hover:bg-slate-50"
                >
                  <SkipForward className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              <div className="flex-1">
                <Slider
                  value={[playbackPosition]}
                  onValueChange={([value]) => setPlaybackPosition(value)}
                  max={historicalData.length - 1}
                  step={1}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase">Speed:</span>
                {[0.5, 1, 2, 4].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                    className={cn(
                      'px-2 py-1 text-[10px] font-bold',
                      playbackSpeed === speed
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {playbackSnapshot && (
                <div className="flex items-center gap-2 text-[11px]">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-slate-600">
                    {format(playbackSnapshot.timestamp, 'MMM d, HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Training Mode Tips */}
        {viewMode === 'training' && (
          <div className="border-2 border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800 mb-1">Training Mode Active</h3>
                <p className="text-[12px] text-amber-700 mb-3">
                  Experiment freely with parameters to understand their effects. Changes in training mode do not affect the actual plant.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-[10px] bg-amber-200 text-amber-800">
                    Try reducing pump speed to see energy savings
                  </span>
                  <span className="px-2 py-1 text-[10px] bg-amber-200 text-amber-800">
                    Increase coagulant dosing during high turbidity
                  </span>
                  <span className="px-2 py-1 text-[10px] bg-amber-200 text-amber-800">
                    Lower RO recovery to extend membrane life
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Parameter Controls */}
          <div className="lg:col-span-2 space-y-3">
            {Object.entries(categoryInfo).map(([category, info]) => {
              const categoryParams = parameters.filter(p => p.category === category);
              const isExpanded = expandedCategories.includes(category);
              const CategoryIcon = categoryIcons[category] || Gauge;
              const hasParamChanges = categoryParams.some(p => p.simulatedValue !== p.currentValue);

              return (
                <div key={category} className="border-2 border-slate-300 bg-white overflow-hidden">
                  <button
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      'w-full bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between hover:bg-slate-50 transition-colors',
                      hasParamChanges && 'border-l-[3px] border-l-cyan-500'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon className={cn('h-4 w-4', info.color)} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {info.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({categoryParams.length} parameters)
                      </span>
                      {hasParamChanges && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-cyan-100 text-cyan-700">
                          MODIFIED
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {categoryParams.map((param) => {
                        const hasChanged = param.simulatedValue !== param.currentValue;
                        const changePercent = ((param.simulatedValue - param.currentValue) / param.currentValue * 100);

                        return (
                          <div
                            key={param.id}
                            className={cn(
                              'p-3 border',
                              hasChanged ? 'border-cyan-300 bg-cyan-50/30' : 'border-slate-200'
                            )}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-[12px] font-semibold text-slate-700">{param.name}</h4>
                                <p className="text-[10px] text-slate-500">{param.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold font-mono text-slate-800">
                                  {param.simulatedValue}
                                  <span className="text-[10px] font-normal text-slate-500 ml-1">{param.unit}</span>
                                </p>
                                {hasChanged && (
                                  <p className={cn(
                                    'text-[10px] font-bold',
                                    changePercent > 0 ? 'text-amber-600' : 'text-emerald-600'
                                  )}>
                                    {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}% from current
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-mono text-slate-400 w-12">{param.min}</span>
                              <Slider
                                value={[param.simulatedValue]}
                                onValueChange={([value]) => handleParameterChange(param.id, value)}
                                min={param.min}
                                max={param.max}
                                step={param.step}
                                className="flex-1"
                              />
                              <span className="text-[10px] font-mono text-slate-400 w-12 text-right">{param.max}</span>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-500">
                                Current: <span className="font-mono font-bold">{param.currentValue} {param.unit}</span>
                              </span>
                              {hasChanged && (
                                <button
                                  onClick={() => handleParameterChange(param.id, param.currentValue)}
                                  className="text-[10px] text-cyan-600 hover:text-cyan-700 font-medium"
                                >
                                  Reset to current
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Outcomes Panel */}
          <div className="space-y-4">
            {/* Simulated Outcomes */}
            <div className="border-2 border-slate-300 bg-white overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 border-b-2 border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    Simulated Outcomes
                  </span>
                </div>
                {hasChanges && (
                  <span className="text-[9px] font-bold text-cyan-600">LIVE SIMULATION</span>
                )}
              </div>
              <div className="p-3 space-y-3">
                {outcomes.map((outcome) => {
                  const OutcomeIcon = getOutcomeIcon(outcome.category);
                  const info = outcomeInfo[outcome.category];

                  return (
                    <div key={outcome.metric} className="p-3 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <OutcomeIcon className={cn('h-4 w-4', info?.color || 'text-slate-500')} />
                          <span className="text-[11px] font-semibold text-slate-700">{outcome.metric}</span>
                        </div>
                        <span className={cn(
                          'flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold',
                          outcome.impact === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                          outcome.impact === 'negative' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        )}>
                          {outcome.impact === 'positive' && <TrendingDown className="h-3 w-3" />}
                          {outcome.impact === 'negative' && <TrendingUp className="h-3 w-3" />}
                          {outcome.impact === 'neutral' && <Minus className="h-3 w-3" />}
                          {outcome.change > 0 ? '+' : ''}{outcome.change}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-[9px] text-slate-500 uppercase">Current</p>
                          <p className="text-sm font-bold font-mono text-slate-600">
                            {outcome.currentValue.toLocaleString()}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                        <div className="text-center">
                          <p className="text-[9px] text-cyan-600 uppercase">Simulated</p>
                          <p className={cn(
                            'text-sm font-bold font-mono',
                            outcome.impact === 'positive' ? 'text-emerald-600' :
                            outcome.impact === 'negative' ? 'text-red-600' :
                            'text-slate-700'
                          )}>
                            {outcome.simulatedValue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 text-center mt-1">{outcome.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Card */}
            <div className={cn(
              'border-2 bg-white overflow-hidden',
              hasChanges
                ? outcomes.every(o => o.impact !== 'negative')
                  ? 'border-emerald-400'
                  : outcomes.some(o => o.impact === 'negative')
                  ? 'border-amber-400'
                  : 'border-slate-300'
                : 'border-slate-300'
            )}>
              <div className={cn(
                'px-4 py-3 text-center',
                hasChanges
                  ? outcomes.every(o => o.impact !== 'negative')
                    ? 'bg-emerald-50'
                    : outcomes.some(o => o.impact === 'negative')
                    ? 'bg-amber-50'
                    : 'bg-slate-50'
                  : 'bg-slate-50'
              )}>
                {!hasChanges ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Ready to Simulate
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Adjust parameters to see projected outcomes
                    </p>
                  </>
                ) : outcomes.every(o => o.impact !== 'negative') ? (
                  <>
                    <CheckCircle className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                      Positive Outlook
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-1">
                      All metrics show improvement or neutral impact
                    </p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      Trade-offs Detected
                    </p>
                    <p className="text-[11px] text-amber-600 mt-1">
                      Some metrics may be negatively impacted
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Scenario Modal */}
      <Dialog open={saveModalOpen} onOpenChange={setSaveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-cyan-600" />
              Save Scenario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Scenario Name
              </label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., Energy Saver Mode"
                className="w-full h-10 px-3 border-2 border-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                Description (Optional)
              </label>
              <textarea
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder="Describe what this scenario optimizes for..."
                rows={3}
                className="w-full px-3 py-2 border-2 border-slate-300 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Modified Parameters</p>
              <div className="space-y-1">
                {parameters
                  .filter(p => p.simulatedValue !== p.currentValue)
                  .map(p => (
                    <div key={p.id} className="flex justify-between text-[11px]">
                      <span className="text-slate-600">{p.name}</span>
                      <span className="font-mono text-slate-800">
                        {p.currentValue} → {p.simulatedValue} {p.unit}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setSaveModalOpen(false)}
              className="px-4 py-2 text-[11px] font-bold uppercase border-2 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveScenario}
              className="px-4 py-2 text-[11px] font-bold uppercase bg-cyan-600 text-white hover:bg-cyan-700"
            >
              Save Scenario
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Scenario Modal */}
      <Dialog open={loadModalOpen} onOpenChange={setLoadModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-600" />
              Load Scenario
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3 max-h-[400px] overflow-y-auto">
            {savedScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => loadScenario(scenario)}
                className="w-full text-left p-4 border-2 border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-semibold text-slate-700">{scenario.name}</h4>
                    {scenario.isFavorite && (
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {format(scenario.createdAt, 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">{scenario.description}</p>
                <div className="flex flex-wrap gap-1">
                  {scenario.parameters.map((p) => {
                    const param = twinParameters.find(tp => tp.id === p.parameterId);
                    return param ? (
                      <span key={p.parameterId} className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-600">
                        {param.name}: {p.value} {param.unit}
                      </span>
                    ) : null;
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Created by {scenario.createdBy}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
