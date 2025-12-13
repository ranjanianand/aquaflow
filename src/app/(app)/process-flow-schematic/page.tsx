'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, StatusDot } from '@/components/shared/status-badge';
import { SchematicCanvas, equipmentOptions, SchematicToolbarState, SchematicToolbarActions } from '@/components/process-flow/schematic-canvas';
import { SchematicNodeData, EquipmentType, EquipmentStatus, ValveState } from '@/components/process-flow/schematic-node';
import {
  Droplets,
  Gauge,
  Cylinder,
  Wind,
  Layers,
  Circle,
  Filter,
  Activity,
  ArrowRight,
  AlertTriangle,
  History,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize2,
  GitBranch,
  Plus,
  Trash2,
  Save,
  Lock,
  Unlock,
  Link2Off,
  Pencil,
  X,
  Check,
  Wifi,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockPlants } from '@/data/mock-plants';
import { Node } from '@xyflow/react';
import Link from 'next/link';
import { Slider } from '@/components/ui/slider';

// Valve icon SVG component
const ValveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v4M12 17v4" />
    <rect x="6" y="7" width="12" height="10" rx="1" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EquipmentIcon: React.FC<{ type: EquipmentType; className?: string }> = ({ type, className }) => {
  switch (type) {
    case 'inlet':
      return <Droplets className={className} />;
    case 'screen':
      return <Filter className={className} />;
    case 'tank':
      return <Cylinder className={className} />;
    case 'pump':
      return <Wind className={className} />;
    case 'filter':
      return <Layers className={className} />;
    case 'chemical':
      return <Circle className={className} />;
    case 'sensor':
      return <Gauge className={className} />;
    case 'outlet':
      return <ArrowRight className={className} />;
    case 'valve':
      return <ValveIcon className={className} />;
    default:
      return <Circle className={className} />;
  }
};

// Generate time labels for playback (last 24 hours)
const generateTimeLabels = () => {
  const labels = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }
  return labels;
};

const timeLabels = generateTimeLabels();

export default function ProcessFlowSchematicPage() {
  const [selectedPlant, setSelectedPlant] = useState('plant-1');
  const [selectedEquipment, setSelectedEquipment] = useState<Node<SchematicNodeData> | null>(null);

  // Historical Playback State
  const [isHistoricalMode, setIsHistoricalMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState([24]); // 0-24 hours ago (24 = now)
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toolbar state from canvas
  const [toolbarState, setToolbarState] = useState<SchematicToolbarState | null>(null);
  const [toolbarActions, setToolbarActions] = useState<SchematicToolbarActions | null>(null);

  // Equipment edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStatus, setEditStatus] = useState<EquipmentStatus>('running');
  const [editValveState, setEditValveState] = useState<ValveState>('open');

  const handleNodeSelect = (node: Node<SchematicNodeData> | null) => {
    setSelectedEquipment(node);
    setIsEditing(false);
    if (node) {
      setEditName(node.data.label);
      setEditStatus(node.data.status);
      if (node.data.valveState) {
        setEditValveState(node.data.valveState);
      }
    }
  };

  // Save equipment changes
  const handleSaveEquipment = () => {
    if (!selectedEquipment || !toolbarActions) return;

    const updates: Partial<SchematicNodeData> = {
      label: editName,
      status: editStatus,
    };

    if (selectedEquipment.data.type === 'valve') {
      updates.valveState = editValveState;
    }

    toolbarActions.updateNode(selectedEquipment.id, updates);
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (selectedEquipment) {
      setEditName(selectedEquipment.data.label);
      setEditStatus(selectedEquipment.data.status);
      if (selectedEquipment.data.valveState) {
        setEditValveState(selectedEquipment.data.valveState);
      }
    }
    setIsEditing(false);
  };

  const handleToolbarStateChange = useCallback((state: SchematicToolbarState, actions: SchematicToolbarActions) => {
    setToolbarState(state);
    setToolbarActions(actions);
  }, []);

  // Playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Auto-advance playback position
      const interval = setInterval(() => {
        setPlaybackPosition((prev) => {
          const newPos = prev[0] + (0.5 * playbackSpeed);
          if (newPos >= 24) {
            setIsPlaying(false);
            clearInterval(interval);
            return [24];
          }
          return [newPos];
        });
      }, 1000);
    }
  };

  const handleSkipBack = () => {
    setPlaybackPosition((prev) => [Math.max(0, prev[0] - 1)]);
  };

  const handleSkipForward = () => {
    setPlaybackPosition((prev) => [Math.min(24, prev[0] + 1)]);
  };

  const toggleHistoricalMode = () => {
    setIsHistoricalMode(!isHistoricalMode);
    if (isHistoricalMode) {
      setPlaybackPosition([24]); // Reset to live
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const currentTimeLabel = timeLabels[Math.floor(playbackPosition[0])];
  const hoursAgo = 24 - playbackPosition[0];

  return (
    <div className={cn(
      "min-h-screen flex flex-col bg-slate-100",
      isFullscreen && "fixed inset-0 z-50 bg-background"
    )}>
      {/* Industrial Header Bar - matching Insights page */}
      {!isFullscreen && (
        <header className="bg-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GitBranch className="h-4 w-4 text-white" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">P&ID Schematic</span>
            <span className="text-[10px] text-slate-400">ISA standard process diagram</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold">
              <Activity className="h-3 w-3" />
              LIVE
            </span>
          </div>
        </header>
      )}

      <div className={cn("flex-1", !isFullscreen && "p-4")}>
        {/* Process Flow Canvas - Full Height with sharp edges matching Insights page */}
        <div className={cn(
          "overflow-hidden flex flex-col border-2 border-slate-300 bg-white",
          isFullscreen && "border-0 h-full"
        )}>
          {/* Toolbar Header Bar - moved from canvas */}
          <div className="flex items-center justify-between px-4 py-2 border-b-2 border-slate-200 bg-slate-50">
            {/* Left side - Status and edit controls */}
            <div className="flex items-center gap-2">
              {/* Status indicator */}
              <div className="flex items-center gap-2 text-[11px] mr-2">
                {isHistoricalMode ? (
                  <>
                    <History className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-amber-600 font-medium">Historical</span>
                  </>
                ) : (
                  <>
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">Live</span>
                  </>
                )}
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">P&ID Schematic</span>
              </div>

              <div className="h-6 w-px bg-slate-300 mx-2" />

              {/* Edit controls */}
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px]"
                onClick={() => toolbarActions?.deleteSelected()}
                disabled={toolbarState?.isLocked || !toolbarState?.selectedNode}
                title="Delete Node"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                className={cn("h-7 text-[11px]", toolbarState?.selectedEdge && 'border-red-500 text-red-600')}
                onClick={() => toolbarActions?.deleteSelectedEdge()}
                disabled={toolbarState?.isLocked || !toolbarState?.selectedEdge}
                title="Delete Connection"
              >
                <Link2Off className="h-3.5 w-3.5" />
              </Button>

              <div className="h-6 w-px bg-slate-300 mx-1" />

              <Button
                size="sm"
                variant={toolbarState?.isSimulating ? 'default' : 'outline'}
                className={cn("h-7 text-[11px]", toolbarState?.isSimulating && 'bg-emerald-600 hover:bg-emerald-700')}
                onClick={() => toolbarActions?.setIsSimulating(!toolbarState?.isSimulating)}
                title={toolbarState?.isSimulating ? 'Pause Simulation' : 'Start Simulation'}
              >
                {toolbarState?.isSimulating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>

              <Button
                size="sm"
                variant={toolbarState?.isLocked ? 'default' : 'outline'}
                className="h-7 text-[11px]"
                onClick={() => toolbarActions?.setIsLocked(!toolbarState?.isLocked)}
                title={toolbarState?.isLocked ? 'Unlock Editing' : 'Lock Editing'}
              >
                {toolbarState?.isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </Button>

              <Button size="sm" variant="outline" className="h-7 text-[11px]" title="Save Layout">
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Right side - Status counts and main controls */}
            <div className="flex items-center gap-3">
              {/* Status legend */}
              {toolbarState?.stats && (
                <div className="flex items-center gap-3 text-[11px] mr-2">
                  {toolbarState.stats.alarms > 0 && (
                    <div className="flex items-center gap-1.5 pr-3 border-r border-slate-300">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
                      <span className="font-semibold text-rose-600">
                        {toolbarState.stats.alarms} Alarm{toolbarState.stats.alarms > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{toolbarState.stats.running}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>{toolbarState.stats.warning}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span>{toolbarState.stats.offline}</span>
                  </div>
                </div>
              )}

              <div className="h-6 w-px bg-slate-300" />

              {/* Historical Mode Toggle */}
              <Button
                variant={isHistoricalMode ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-[11px]",
                  isHistoricalMode && "bg-amber-600 hover:bg-amber-700"
                )}
                onClick={toggleHistoricalMode}
              >
                <History className="h-3.5 w-3.5 mr-1" />
                Playback
              </Button>

              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger className="w-[160px] h-7 text-[11px]">
                  <SelectValue placeholder="Select plant" />
                </SelectTrigger>
                <SelectContent>
                  {mockPlants.map((plant) => (
                    <SelectItem key={plant.id} value={plant.id}>
                      <div className="flex items-center gap-2">
                        <StatusDot
                          status={plant.status === 'online' ? 'normal' : plant.status === 'warning' ? 'warning' : 'critical'}
                        />
                        {plant.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={toggleFullscreen}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>

              {/* Add Equipment Dropdown - Right corner */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-7 text-[11px] bg-slate-700 hover:bg-slate-800" disabled={toolbarState?.isLocked}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Equipment
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Equipment Type</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {equipmentOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <DropdownMenuItem key={opt.type} onClick={() => toolbarActions?.addNode(opt.type)}>
                        <Icon className="h-4 w-4 mr-2" />
                        {opt.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Historical Playback Controls - Only show in historical mode */}
          {isHistoricalMode && (
            <div className="flex items-center gap-4 px-4 py-3 border-b bg-amber-50/50 dark:bg-amber-950/20">
              {/* Playback buttons */}
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handleSkipBack}>
                  <SkipBack className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0",
                    isPlaying ? "bg-amber-600 hover:bg-amber-700" : ""
                  )}
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={handleSkipForward}>
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Timeline Slider */}
              <div className="flex-1 flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground w-12">24h ago</span>
                <Slider
                  value={playbackPosition}
                  onValueChange={setPlaybackPosition}
                  max={24}
                  step={0.1}
                  className="flex-1"
                />
                <span className="text-[10px] font-mono text-emerald-600 w-8">Now</span>
              </div>

              {/* Speed selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Speed:</span>
                <Select value={String(playbackSpeed)} onValueChange={(v) => setPlaybackSpeed(Number(v))}>
                  <SelectTrigger className="w-16 h-7 text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jump to live */}
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={() => {
                  setPlaybackPosition([24]);
                  setIsPlaying(false);
                }}
              >
                <Activity className="h-3 w-3 mr-1" />
                Jump to Live
              </Button>
            </div>
          )}

          {/* Canvas - Optimized Height for visibility of controls */}
          <div style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '520px', width: '100%' }}>
            <SchematicCanvas
              onNodeSelect={handleNodeSelect}
              onToolbarStateChange={handleToolbarStateChange}
              showToolbar={false}
            />
          </div>
        </div>
      </div>

      {/* Equipment Detail Panel - Matching e5.png/e6.png modal style */}
      <Dialog open={!!selectedEquipment} onOpenChange={() => { setSelectedEquipment(null); setIsEditing(false); }}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          {selectedEquipment && (
            <>
              {/* Header - matching e5.png style */}
              <DialogHeader className="p-4 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg border-2',
                    selectedEquipment.data.status === 'running' && 'bg-emerald-50 border-emerald-200 text-emerald-600',
                    selectedEquipment.data.status === 'warning' && 'bg-amber-50 border-amber-200 text-amber-600',
                    selectedEquipment.data.status === 'offline' && 'bg-rose-50 border-rose-200 text-rose-600',
                    selectedEquipment.data.status === 'idle' && 'bg-slate-50 border-slate-200 text-slate-600',
                    selectedEquipment.data.status === 'alarm' && 'bg-rose-50 border-rose-200 text-rose-600'
                  )}>
                    <EquipmentIcon type={selectedEquipment.data.type} className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg font-semibold text-foreground">
                      {selectedEquipment.data.label}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedEquipment.data.type.toUpperCase()} • {selectedEquipment.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      variant={
                        selectedEquipment.data.status === 'running' ? 'success' :
                        selectedEquipment.data.status === 'warning' ? 'warning' :
                        selectedEquipment.data.status === 'offline' ? 'danger' : 'default'
                      }
                      size="sm"
                    >
                      {selectedEquipment.data.status === 'running' ? 'Normal' : selectedEquipment.data.status}
                    </StatusBadge>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <Wifi className="h-3 w-3" />
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Active Alarm Warning */}
                {selectedEquipment.data.hasActiveAlarm && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-rose-50 border border-rose-200">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-100">
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-rose-700">Active Alarm</p>
                      <p className="text-xs text-rose-600 mt-0.5">
                        {selectedEquipment.data.alarmMessage || 'Equipment requires attention'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Edit Mode */}
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Equipment Name */}
                    <div className="space-y-2">
                      <Label htmlFor="equipment-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Equipment Name *
                      </Label>
                      <Input
                        id="equipment-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g., Main Feed Pump"
                        className="h-10 border-slate-300"
                      />
                    </div>

                    {/* Status Selection */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status *
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['running', 'idle', 'warning', 'offline'] as EquipmentStatus[]).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setEditStatus(status)}
                            className={cn(
                              'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                              editStatus === status
                                ? status === 'running' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : status === 'idle' ? 'border-slate-500 bg-slate-50 text-slate-700'
                                : status === 'warning' ? 'border-amber-500 bg-amber-50 text-amber-700'
                                : 'border-rose-500 bg-rose-50 text-rose-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            )}
                          >
                            <div className={cn(
                              'w-2 h-2 rounded-full',
                              status === 'running' && 'bg-emerald-500',
                              status === 'idle' && 'bg-slate-400',
                              status === 'warning' && 'bg-amber-500',
                              status === 'offline' && 'bg-rose-500'
                            )} />
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Valve State Selection (only for valves) */}
                    {selectedEquipment.data.type === 'valve' && (
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Valve Position *
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['open', 'closed', 'partial'] as ValveState[]).map((state) => (
                            <button
                              key={state}
                              type="button"
                              onClick={() => setEditValveState(state)}
                              className={cn(
                                'flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
                                editValveState === state
                                  ? state === 'open' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : state === 'closed' ? 'border-rose-500 bg-rose-50 text-rose-700'
                                  : 'border-amber-500 bg-amber-50 text-amber-700'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              )}
                            >
                              {state.charAt(0).toUpperCase() + state.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Current Value Section - matching e5.png */}
                    {selectedEquipment.data.primaryValue && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Activity className="h-3.5 w-3.5" />
                            <span className="uppercase font-semibold tracking-wide">Current Value</span>
                          </div>
                          <p className="text-2xl font-bold text-emerald-600 tabular-nums">
                            {selectedEquipment.data.primaryValue}
                          </p>
                        </div>

                        {/* Valve State or Setpoint */}
                        {selectedEquipment.data.type === 'valve' && selectedEquipment.data.valveState ? (
                          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Activity className="h-3.5 w-3.5" />
                              <span className="uppercase font-semibold tracking-wide">Valve State</span>
                            </div>
                            <p className={cn(
                              'text-2xl font-bold uppercase tabular-nums',
                              selectedEquipment.data.valveState === 'open' && 'text-emerald-600',
                              selectedEquipment.data.valveState === 'closed' && 'text-rose-600',
                              selectedEquipment.data.valveState === 'partial' && 'text-amber-600'
                            )}>
                              {selectedEquipment.data.valveState}
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <Gauge className="h-3.5 w-3.5" />
                              <span className="uppercase font-semibold tracking-wide">Type</span>
                            </div>
                            <p className="text-lg font-semibold text-foreground">
                              {selectedEquipment.data.type.charAt(0).toUpperCase() + selectedEquipment.data.type.slice(1)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metrics Grid - matching e5.png stat boxes */}
                    {selectedEquipment.data.metrics && selectedEquipment.data.metrics.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current Readings</p>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedEquipment.data.metrics.map((metric, index) => (
                            <Link
                              key={index}
                              href={`/trends?equipment=${selectedEquipment.id}&metric=${metric.label.toLowerCase()}`}
                              className="p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                            >
                              <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide group-hover:text-blue-600">
                                {metric.label}
                              </p>
                              <p className={cn(
                                'text-xl font-bold mt-1 tabular-nums',
                                metric.status === 'warning' && 'text-amber-600',
                                metric.status === 'critical' && 'text-rose-600',
                                !metric.status && 'text-foreground'
                              )}>
                                {metric.value}
                                <span className="text-sm font-medium text-muted-foreground ml-1">
                                  {metric.unit}
                                </span>
                              </p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Last Updated */}
                    {selectedEquipment.data.lastUpdated && (
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t border-slate-100">
                        <Clock className="h-3 w-3" />
                        Last updated: {selectedEquipment.data.lastUpdated}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer - matching e6.png action buttons */}
              <DialogFooter className="p-4 pt-3 border-t border-slate-200 bg-slate-50/50">
                {isEditing ? (
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="flex-1 h-9"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEquipment}
                      className="flex-1 h-9 bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-9"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Link href={`/trends?equipment=${selectedEquipment.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full h-9">
                        <History className="h-3.5 w-3.5 mr-1.5" />
                        View History
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedEquipment(null)}
                      className="h-9 bg-slate-700 text-white hover:bg-slate-800"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
