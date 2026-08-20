'use client';

import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  reconnectEdge,
} from '@xyflow/react';
import type { Connection, Edge, Node, OnReconnect } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SchematicNode, SchematicNodeData, EquipmentType, EquipmentMetric } from './schematic-node';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Minus,
  Trash2,
  Save,
  Lock,
  Unlock,
  Droplets,
  Filter,
  Cylinder,
  Wind,
  Layers,
  Circle,
  Gauge,
  ArrowRight,
  Play,
  Pause,
  Maximize2,
  Link2Off,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const nodeTypes = {
  schematic: SchematicNode,
};

// Helper to generate static trend data (deterministic for SSR)
const generateStaticTrendData = (baseValue: number): number[] => {
  const offsets = [0.97, 0.99, 1.02, 1.01, 0.98, 1.0, 1.03, 1.01];
  return offsets.map(offset => baseValue * offset);
};

// Helper to simulate value fluctuation
const fluctuateValue = (currentValue: string, variance: number = 0.05): string => {
  const num = parseFloat(currentValue.replace(/,/g, ''));
  if (isNaN(num)) return currentValue;
  const newValue = num * (1 + (Math.random() - 0.5) * variance * 2);
  return num >= 100 ? Math.round(newValue).toLocaleString() : newValue.toFixed(1);
};

// Deterministic seeded random number generator for historical playback
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12345.6789) * 43758.5453;
  return x - Math.floor(x);
};

// Generate historical value based on node ID and time position (deterministic)
const generateHistoricalValue = (
  nodeId: string,
  baseValue: number,
  hoursAgo: number,
  variance: number = 0.15
): number => {
  // Create a unique seed from nodeId and time
  const nodeHash = nodeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = nodeHash * 1000 + hoursAgo * 100;

  // Generate wave pattern (simulates daily cycle)
  const dailyCycle = Math.sin((24 - hoursAgo) * Math.PI / 12) * 0.1;

  // Add some noise
  const noise = (seededRandom(seed) - 0.5) * variance * 2;

  // Simulate occasional anomalies (1 in 20 chance at each hour)
  const anomalySeed = seededRandom(seed + 999);
  const hasAnomaly = anomalySeed > 0.95;
  const anomalyFactor = hasAnomaly ? (seededRandom(seed + 1000) > 0.5 ? 1.3 : 0.7) : 1;

  return baseValue * (1 + dailyCycle + noise) * anomalyFactor;
};

// Format value based on magnitude
const formatHistoricalValue = (value: number, originalValue: string): string => {
  const originalNum = parseFloat(originalValue.replace(/,/g, ''));
  if (originalNum >= 100) {
    return Math.round(value).toLocaleString();
  } else if (originalNum >= 10) {
    return value.toFixed(1);
  } else {
    return value.toFixed(2);
  }
};

// Initial nodes - more compact spacing for schematic view
const createInitialNodes = (): Node<SchematicNodeData>[] => [
  {
    id: 'inlet-1',
    type: 'schematic',
    position: { x: 50, y: 180 },
    data: {
      label: 'Raw Water Inlet',
      type: 'inlet',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '1,250 m³/h',
      metrics: [
        { label: 'Flow', value: '1,250', unit: 'm³/h', trend: generateStaticTrendData(1250), status: 'normal' },
        { label: 'Turbidity', value: '45', unit: 'NTU', trend: generateStaticTrendData(45), status: 'normal' },
      ],
    },
  },
  {
    id: 'valve-1',
    type: 'schematic',
    position: { x: 150, y: 80 },
    data: {
      label: 'V-101',
      type: 'valve',
      status: 'running',
      valveState: 'open',
      lastUpdated: 'just now',
      metrics: [{ label: 'Position', value: '100', unit: '%', status: 'normal' }],
    },
  },
  {
    id: 'screen-1',
    type: 'schematic',
    position: { x: 180, y: 180 },
    data: {
      label: 'Coarse Screen',
      type: 'screen',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '98.5%',
      metrics: [
        { label: 'Efficiency', value: '98.5', unit: '%', trend: generateStaticTrendData(98.5), status: 'normal' },
        { label: 'ΔP', value: '0.3', unit: 'bar', trend: generateStaticTrendData(0.3), status: 'normal' },
      ],
    },
  },
  {
    id: 'pump-1',
    type: 'schematic',
    position: { x: 310, y: 180 },
    data: {
      label: 'P-101',
      type: 'pump',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '4.2 bar',
      metrics: [
        { label: 'Flow', value: '1,180', unit: 'm³/h', trend: generateStaticTrendData(1180), status: 'normal' },
        { label: 'Pressure', value: '4.2', unit: 'bar', trend: generateStaticTrendData(4.2), status: 'normal' },
      ],
    },
  },
  {
    id: 'chemical-1',
    type: 'schematic',
    position: { x: 440, y: 80 },
    data: {
      label: 'Coagulant',
      type: 'chemical',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '42 mg/L',
      metrics: [
        { label: 'Dose', value: '42', unit: 'mg/L', trend: generateStaticTrendData(42), status: 'normal' },
        { label: 'Tank', value: '72', unit: '%', trend: generateStaticTrendData(72), status: 'normal' },
      ],
    },
  },
  {
    id: 'tank-1',
    type: 'schematic',
    position: { x: 440, y: 180 },
    data: {
      label: 'Flash Mixer',
      type: 'tank',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '120 RPM',
      metrics: [
        { label: 'Retention', value: '30', unit: 'sec', status: 'normal' },
        { label: 'RPM', value: '120', unit: '', trend: generateStaticTrendData(120), status: 'normal' },
      ],
    },
  },
  {
    id: 'tank-2',
    type: 'schematic',
    position: { x: 570, y: 180 },
    data: {
      label: 'Flocculation',
      type: 'tank',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '25 min',
      metrics: [
        { label: 'Retention', value: '25', unit: 'min', status: 'normal' },
        { label: 'G-Value', value: '45', unit: 's⁻¹', trend: generateStaticTrendData(45), status: 'normal' },
      ],
    },
  },
  {
    id: 'tank-3',
    type: 'schematic',
    position: { x: 700, y: 180 },
    data: {
      label: 'Sedimentation',
      type: 'tank',
      status: 'warning',
      hasActiveAlarm: true,
      alarmMessage: 'Sludge level high - 18%',
      lastUpdated: 'just now',
      primaryValue: '18%',
      metrics: [
        { label: 'Retention', value: '4', unit: 'hrs', status: 'normal' },
        { label: 'Sludge', value: '18', unit: '%', trend: generateStaticTrendData(18), status: 'warning' },
      ],
    },
  },
  {
    id: 'sensor-1',
    type: 'schematic',
    position: { x: 700, y: 80 },
    data: {
      label: 'pH Sensor',
      type: 'sensor',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: 'pH 7.2',
      metrics: [
        { label: 'pH', value: '7.2', unit: '', trend: generateStaticTrendData(7.2), status: 'normal' },
        { label: 'Temp', value: '24', unit: '°C', trend: generateStaticTrendData(24), status: 'normal' },
      ],
    },
  },
  {
    id: 'valve-2',
    type: 'schematic',
    position: { x: 780, y: 80 },
    data: {
      label: 'V-102',
      type: 'valve',
      status: 'idle',
      valveState: 'closed',
      lastUpdated: 'just now',
      metrics: [{ label: 'Position', value: '0', unit: '%', status: 'normal' }],
    },
  },
  {
    id: 'filter-1',
    type: 'schematic',
    position: { x: 830, y: 180 },
    data: {
      label: 'Sand Filter',
      type: 'filter',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '1.8 m',
      metrics: [
        { label: 'Flow', value: '980', unit: 'm³/h', trend: generateStaticTrendData(980), status: 'normal' },
        { label: 'Head Loss', value: '1.8', unit: 'm', trend: generateStaticTrendData(1.8), status: 'normal' },
      ],
    },
  },
  {
    id: 'chemical-2',
    type: 'schematic',
    position: { x: 960, y: 80 },
    data: {
      label: 'Chlorine',
      type: 'chemical',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '2.5 mg/L',
      metrics: [
        { label: 'Dose', value: '2.5', unit: 'mg/L', trend: generateStaticTrendData(2.5), status: 'normal' },
        { label: 'Residual', value: '0.8', unit: 'mg/L', trend: generateStaticTrendData(0.8), status: 'normal' },
      ],
    },
  },
  {
    id: 'tank-4',
    type: 'schematic',
    position: { x: 960, y: 180 },
    data: {
      label: 'Clear Water',
      type: 'tank',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '85%',
      metrics: [
        { label: 'Level', value: '85', unit: '%', trend: generateStaticTrendData(85), status: 'normal' },
        { label: 'Volume', value: '4,250', unit: 'm³', trend: generateStaticTrendData(4250), status: 'normal' },
      ],
    },
  },
  {
    id: 'pump-2',
    type: 'schematic',
    position: { x: 1090, y: 180 },
    data: {
      label: 'P-201',
      type: 'pump',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '6.5 bar',
      metrics: [
        { label: 'Flow', value: '950', unit: 'm³/h', trend: generateStaticTrendData(950), status: 'normal' },
        { label: 'Pressure', value: '6.5', unit: 'bar', trend: generateStaticTrendData(6.5), status: 'normal' },
      ],
    },
  },
  {
    id: 'sensor-2',
    type: 'schematic',
    position: { x: 1170, y: 80 },
    data: {
      label: 'Flow Meter',
      type: 'sensor',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '945 m³/h',
      metrics: [
        { label: 'Flow', value: '945', unit: 'm³/h', trend: generateStaticTrendData(945), status: 'normal' },
        { label: 'Total', value: '12,847', unit: 'm³', status: 'normal' },
      ],
    },
  },
  {
    id: 'outlet-1',
    type: 'schematic',
    position: { x: 1220, y: 180 },
    data: {
      label: 'Distribution',
      type: 'outlet',
      status: 'running',
      lastUpdated: 'just now',
      primaryValue: '5.8 bar',
      metrics: [
        { label: 'Flow', value: '945', unit: 'm³/h', trend: generateStaticTrendData(945), status: 'normal' },
        { label: 'Pressure', value: '5.8', unit: 'bar', trend: generateStaticTrendData(5.8), status: 'normal' },
      ],
    },
  },
];

// Initial edges with better styling for schematic view - using smoothstep for orthogonal P&ID routing
const initialEdges: Edge[] = [
  // Main process flow - thicker blue lines with smoothstep for proper orthogonal routing
  { id: 'e-inlet-screen', source: 'inlet-1', target: 'screen-1', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-screen-pump', source: 'screen-1', target: 'pump-1', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-pump-tank1', source: 'pump-1', target: 'tank-1', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-tank1-tank2', source: 'tank-1', target: 'tank-2', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-tank2-tank3', source: 'tank-2', target: 'tank-3', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-tank3-filter', source: 'tank-3', target: 'filter-1', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-filter-tank4', source: 'filter-1', target: 'tank-4', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-tank4-pump2', source: 'tank-4', target: 'pump-2', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },
  { id: 'e-pump2-outlet', source: 'pump-2', target: 'outlet-1', type: 'smoothstep', animated: true, style: { stroke: '#0066ff', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 } },

  // Chemical dosing - green with smoothstep for vertical connections
  { id: 'e-chem1-tank1', source: 'chemical-1', target: 'tank-1', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 16, height: 16 } },
  { id: 'e-chem2-tank4', source: 'chemical-2', target: 'tank-4', type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981', width: 16, height: 16 } },

  // Sensor connections - dashed gray
  { id: 'e-tank3-sensor', source: 'tank-3', target: 'sensor-1', type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4,4' } },
  { id: 'e-pump2-sensor2', source: 'pump-2', target: 'sensor-2', type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4,4' } },

  // Valve connections - orange
  { id: 'e-inlet-valve1', source: 'inlet-1', target: 'valve-1', type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b', width: 16, height: 16 } },
  { id: 'e-tank3-valve2', source: 'tank-3', target: 'valve-2', type: 'smoothstep', style: { stroke: '#f59e0b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b', width: 16, height: 16 } },
];

// Valve icon for dropdown
const ValveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v4M12 17v4" />
    <rect x="6" y="7" width="12" height="10" rx="1" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Equipment options for dropdown
const equipmentOptions: { type: EquipmentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'inlet', label: 'Inlet', icon: Droplets },
  { type: 'outlet', label: 'Outlet', icon: ArrowRight },
  { type: 'pump', label: 'Pump', icon: Wind },
  { type: 'tank', label: 'Tank', icon: Cylinder },
  { type: 'filter', label: 'Filter', icon: Layers },
  { type: 'screen', label: 'Screen', icon: Filter },
  { type: 'valve', label: 'Valve', icon: ValveIcon },
  { type: 'chemical', label: 'Chemical Dosing', icon: Circle },
  { type: 'sensor', label: 'Sensor', icon: Gauge },
];

// Default metrics for new equipment
const getDefaultMetrics = (type: EquipmentType): EquipmentMetric[] => {
  switch (type) {
    case 'inlet':
      return [
        { label: 'Flow', value: '850', unit: 'm³/h', trend: generateStaticTrendData(850), status: 'normal' },
        { label: 'Turbidity', value: '32', unit: 'NTU', trend: generateStaticTrendData(32), status: 'normal' },
      ];
    case 'outlet':
      return [
        { label: 'Flow', value: '820', unit: 'm³/h', trend: generateStaticTrendData(820), status: 'normal' },
        { label: 'Pressure', value: '4.8', unit: 'bar', trend: generateStaticTrendData(4.8), status: 'normal' },
      ];
    case 'pump':
      return [
        { label: 'Flow', value: '780', unit: 'm³/h', trend: generateStaticTrendData(780), status: 'normal' },
        { label: 'Pressure', value: '5.2', unit: 'bar', trend: generateStaticTrendData(5.2), status: 'normal' },
      ];
    case 'tank':
      return [
        { label: 'Level', value: '68', unit: '%', trend: generateStaticTrendData(68), status: 'normal' },
        { label: 'Volume', value: '2,450', unit: 'm³', trend: generateStaticTrendData(2450), status: 'normal' },
      ];
    case 'filter':
      return [
        { label: 'Flow', value: '720', unit: 'm³/h', trend: generateStaticTrendData(720), status: 'normal' },
        { label: 'Head Loss', value: '1.4', unit: 'm', trend: generateStaticTrendData(1.4), status: 'normal' },
      ];
    case 'screen':
      return [
        { label: 'Efficiency', value: '97.2', unit: '%', trend: generateStaticTrendData(97.2), status: 'normal' },
        { label: 'ΔP', value: '0.25', unit: 'bar', trend: generateStaticTrendData(0.25), status: 'normal' },
      ];
    case 'valve':
      return [{ label: 'Position', value: '100', unit: '%', status: 'normal' }];
    case 'chemical':
      return [
        { label: 'Dose', value: '35', unit: 'mg/L', trend: generateStaticTrendData(35), status: 'normal' },
        { label: 'Tank', value: '82', unit: '%', trend: generateStaticTrendData(82), status: 'normal' },
      ];
    case 'sensor':
      return [
        { label: 'pH', value: '7.1', unit: '', trend: generateStaticTrendData(7.1), status: 'normal' },
        { label: 'Temp', value: '23', unit: '°C', trend: generateStaticTrendData(23), status: 'normal' },
      ];
    default:
      return [];
  }
};

const getDefaultLabel = (type: EquipmentType, id: string): string => {
  const typeLabels: Record<EquipmentType, string> = {
    inlet: 'Inlet',
    outlet: 'Outlet',
    pump: 'Pump',
    tank: 'Tank',
    filter: 'Filter',
    screen: 'Screen',
    valve: 'Valve',
    chemical: 'Chemical',
    sensor: 'Sensor',
  };
  const shortId = id.slice(-4).toUpperCase();
  return `${typeLabels[type]} ${shortId}`;
};

const getPrimaryValue = (type: EquipmentType, metrics: EquipmentMetric[]): string => {
  if (!metrics.length) return '';
  const m = metrics[0];
  return `${m.value} ${m.unit}`;
};

// Toolbar state interface for external control
export interface SchematicToolbarState {
  isLocked: boolean;
  isSimulating: boolean;
  selectedNode: Node<SchematicNodeData> | null;
  selectedEdge: Edge | null;
  zoomLevel: number;
  stats: { running: number; warning: number; offline: number; alarms: number; total: number };
}

export interface SchematicToolbarActions {
  setIsLocked: (locked: boolean) => void;
  setIsSimulating: (simulating: boolean) => void;
  addNode: (type: EquipmentType) => void;
  deleteSelected: () => void;
  deleteSelectedEdge: () => void;
  toggleValve: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  updateNode: (nodeId: string, data: Partial<SchematicNodeData>) => void;
}

interface SchematicCanvasProps {
  onNodeSelect?: (node: Node<SchematicNodeData> | null) => void;
  onToolbarStateChange?: (state: SchematicToolbarState, actions: SchematicToolbarActions) => void;
  showToolbar?: boolean; // Whether to show the internal toolbar (default: true for backwards compatibility)
  isHistoricalMode?: boolean; // Whether historical playback is active
  playbackPosition?: number; // 0-24 hours (24 = now, 0 = 24h ago)
}

function SchematicCanvasInner({
  onNodeSelect,
  onToolbarStateChange,
  showToolbar = true,
  isHistoricalMode = false,
  playbackPosition = 24,
}: SchematicCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLocked, setIsLocked] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node<SchematicNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // React Flow instance for zoom controls and viewport
  const { zoomIn, zoomOut, fitView, getZoom, getViewport, screenToFlowPosition } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(1);

  // Refs to hold latest values for stable callbacks
  const selectedNodeRef = useRef<Node<SchematicNodeData> | null>(null);
  const selectedEdgeRef = useRef<Edge | null>(null);
  const isLockedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => {
    selectedNodeRef.current = selectedNode;
  }, [selectedNode]);

  useEffect(() => {
    selectedEdgeRef.current = selectedEdge;
  }, [selectedEdge]);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Update zoom level display when view changes
  const handleMoveEnd = useCallback(() => {
    setZoomLevel(getZoom());
  }, [getZoom]);

  // Real-time simulation - pause when in historical mode
  useEffect(() => {
    if (!isSimulating || isHistoricalMode) return;

    const interval = setInterval(() => {
      setNodes((nds) =>
        nds.map((node) => {
          if (!node.data.metrics) return node;

          const updatedMetrics = node.data.metrics.map((metric: EquipmentMetric) => {
            if (metric.label === 'Retention' || metric.label === 'Position') {
              return metric;
            }

            const newValue = fluctuateValue(metric.value);
            const newTrend = metric.trend
              ? [...metric.trend.slice(1), parseFloat(newValue.replace(/,/g, ''))]
              : undefined;

            return { ...metric, value: newValue, trend: newTrend };
          });

          const primaryValue = getPrimaryValue(node.data.type, updatedMetrics);

          return {
            ...node,
            data: {
              ...node.data,
              metrics: updatedMetrics,
              primaryValue,
              lastUpdated: 'just now',
            },
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating, isHistoricalMode, setNodes]);

  // Store original node values for historical playback
  const originalNodeValuesRef = useRef<Map<string, { primaryValue?: string; metrics?: EquipmentMetric[] }>>(new Map());

  // Capture original values when entering historical mode
  useEffect(() => {
    if (isHistoricalMode && originalNodeValuesRef.current.size === 0) {
      // Store original values
      const originalValues = new Map<string, { primaryValue?: string; metrics?: EquipmentMetric[] }>();
      setNodes((nds) => {
        nds.forEach((node) => {
          originalValues.set(node.id, {
            primaryValue: node.data.primaryValue,
            metrics: node.data.metrics ? [...node.data.metrics] : undefined,
          });
        });
        return nds;
      });
      originalNodeValuesRef.current = originalValues;
    } else if (!isHistoricalMode) {
      // Restore original values when exiting historical mode
      if (originalNodeValuesRef.current.size > 0) {
        setNodes((nds) =>
          nds.map((node) => {
            const original = originalNodeValuesRef.current.get(node.id);
            if (original) {
              return {
                ...node,
                data: {
                  ...node.data,
                  primaryValue: original.primaryValue,
                  metrics: original.metrics,
                  lastUpdated: 'just now',
                },
              };
            }
            return node;
          })
        );
      }
      originalNodeValuesRef.current = new Map();
    }
  }, [isHistoricalMode, setNodes]);

  // Historical playback - update nodes based on playback position
  useEffect(() => {
    if (!isHistoricalMode) return;

    const hoursAgo = 24 - playbackPosition;

    // Generate timestamp for display
    const now = new Date();
    const historicalTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    const timeString = historicalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = historicalTime.toLocaleDateString([], { month: 'short', day: 'numeric' });

    setNodes((nds) =>
      nds.map((node) => {
        const original = originalNodeValuesRef.current.get(node.id);
        if (!original || !original.metrics) return node;

        // Generate historical values for each metric
        const updatedMetrics = original.metrics.map((metric: EquipmentMetric) => {
          if (metric.label === 'Position') {
            return metric; // Valve position doesn't change historically
          }

          const baseValue = parseFloat(metric.value.replace(/,/g, ''));
          if (isNaN(baseValue)) return metric;

          const historicalValue = generateHistoricalValue(node.id, baseValue, hoursAgo);
          const formattedValue = formatHistoricalValue(historicalValue, metric.value);

          // Generate trend data for the period around this time
          const trendData = [];
          for (let i = 7; i >= 0; i--) {
            const trendHoursAgo = hoursAgo + i * 0.5;
            if (trendHoursAgo >= 0 && trendHoursAgo <= 24) {
              trendData.push(generateHistoricalValue(node.id, baseValue, trendHoursAgo));
            }
          }

          // Determine status based on historical value deviation
          const deviation = Math.abs(historicalValue - baseValue) / baseValue;
          let status: 'normal' | 'warning' | 'critical' = 'normal';
          if (deviation > 0.25) {
            status = 'critical';
          } else if (deviation > 0.15) {
            status = 'warning';
          }

          return {
            ...metric,
            value: formattedValue,
            trend: trendData.length > 0 ? trendData : metric.trend,
            status,
          };
        });

        const primaryValue = getPrimaryValue(node.data.type, updatedMetrics);

        return {
          ...node,
          data: {
            ...node.data,
            metrics: updatedMetrics,
            primaryValue,
            lastUpdated: `${dateString} ${timeString}`,
          },
        };
      })
    );
  }, [isHistoricalMode, playbackPosition, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isLocked) return;
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        type: 'smoothstep', // Orthogonal routing for P&ID schematics
        animated: true,
        style: { stroke: '#0066ff', strokeWidth: 3 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 },
      } as Edge;
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges, isLocked]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<SchematicNodeData>) => {
      setSelectedNode(node);
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // Edge click handler - select edge for deletion
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (isLocked) return;
      setSelectedEdge(edge);
      setSelectedNode(null);
      onNodeSelect?.(null);
    },
    [isLocked, onNodeSelect]
  );

  // Edge reconnection handler - drag edge to new node
  const onReconnect: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      if (isLocked) return;
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [isLocked, setEdges]
  );

  // Delete selected edge - uses refs for stable callback
  const deleteSelectedEdge = useCallback(() => {
    if (isLockedRef.current || !selectedEdgeRef.current) return;
    const edgeId = selectedEdgeRef.current.id;
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
  }, [setEdges]);

  // Add node at viewport center and auto-select it (visually only, no dialog)
  const addNode = useCallback(
    (type: EquipmentType) => {
      const id = `${type}-${Date.now()}`;
      const metrics = getDefaultMetrics(type);

      // Get viewport center position in flow coordinates
      const centerPosition = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      });

      const newNode: Node<SchematicNodeData> = {
        id,
        type: 'schematic',
        position: { x: centerPosition.x - 30, y: centerPosition.y - 40 }, // Offset to center the node
        selected: true, // Auto-select the new node (visual highlight only)
        data: {
          label: getDefaultLabel(type, id),
          type,
          status: 'running',
          valveState: type === 'valve' ? 'open' : undefined,
          lastUpdated: 'just now',
          metrics,
          primaryValue: getPrimaryValue(type, metrics),
        },
      };

      // Deselect all existing nodes, add new node as selected
      setNodes((nds) => [
        ...nds.map(n => ({ ...n, selected: false })),
        newNode
      ]);

      // Update internal state but DON'T trigger dialog (don't call onNodeSelect)
      setSelectedNode(newNode);
    },
    [setNodes, screenToFlowPosition]
  );

  // Delete selected node - uses refs for stable callback
  const deleteSelected = useCallback(() => {
    if (isLockedRef.current || !selectedNodeRef.current) return;
    const nodeId = selectedNodeRef.current.id;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [setNodes, setEdges, onNodeSelect]);

  // Toggle valve state - uses refs for stable callback
  const toggleValve = useCallback(() => {
    const node = selectedNodeRef.current;
    if (!node || node.data.type !== 'valve') return;

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== node.id) return n;
        const currentState = n.data.valveState;
        const newState = currentState === 'open' ? 'closed' : currentState === 'closed' ? 'partial' : 'open';
        const newStatus = newState === 'closed' ? 'idle' : 'running';
        return {
          ...n,
          data: {
            ...n.data,
            valveState: newState,
            status: newStatus,
            metrics: [{ label: 'Position', value: newState === 'open' ? '100' : newState === 'closed' ? '0' : '50', unit: '%', status: 'normal' as const }],
          },
        };
      })
    );
  }, [setNodes]);

  // Update node data - for editing node properties from modal
  const updateNode = useCallback(
    (nodeId: string, newData: Partial<SchematicNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id !== nodeId) return n;
          const updatedNode = {
            ...n,
            data: {
              ...n.data,
              ...newData,
            },
          };
          // Also update selectedNode if this is the selected one
          if (selectedNodeRef.current?.id === nodeId) {
            setSelectedNode(updatedNode);
          }
          return updatedNode;
        })
      );
    },
    [setNodes]
  );

  // Keyboard handler for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Delete - remove selected edge or node
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEdge && !isLocked) {
          e.preventDefault();
          deleteSelectedEdge();
        } else if (selectedNodeRef.current && !isLocked) {
          e.preventDefault();
          deleteSelected();
        }
      }

      // Escape - deselect all
      if (e.key === 'Escape') {
        setSelectedEdge(null);
        setSelectedNode(null);
        onNodeSelect?.(null);
      }

      // Ctrl/Cmd + 0 - Fit to view
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        fitView({ padding: 0.2, duration: 300 });
      }

      // Ctrl/Cmd + Plus - Zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoomIn();
      }

      // Ctrl/Cmd + Minus - Zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoomOut();
      }

      // L - Toggle lock
      if (e.key === 'l' || e.key === 'L') {
        setIsLocked(!isLockedRef.current);
      }

      // Space - Toggle simulation
      if (e.key === ' ' && !isLocked) {
        e.preventDefault();
        setIsSimulating((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEdge, isLocked, deleteSelectedEdge, deleteSelected, onNodeSelect, fitView, zoomIn, zoomOut]);

  // Stats
  const stats = useMemo(() => {
    const running = nodes.filter((n) => n.data.status === 'running').length;
    const warning = nodes.filter((n) => n.data.status === 'warning' || n.data.hasActiveAlarm).length;
    const offline = nodes.filter((n) => n.data.status === 'offline').length;
    const alarms = nodes.filter((n) => n.data.hasActiveAlarm).length;
    return { running, warning, offline, alarms, total: nodes.length };
  }, [nodes]);

  // Stable actions object - created once, never changes
  const toolbarActionsRef = useRef<SchematicToolbarActions | null>(null);

  // Initialize actions ref once after first render
  useEffect(() => {
    toolbarActionsRef.current = {
      setIsLocked,
      setIsSimulating,
      addNode,
      deleteSelected,
      deleteSelectedEdge,
      toggleValve,
      zoomIn,
      zoomOut,
      fitView: () => fitView({ padding: 0.2, duration: 300 }),
      updateNode,
    };
  }, [addNode, deleteSelected, deleteSelectedEdge, toggleValve, zoomIn, zoomOut, fitView, updateNode]);

  // Store onToolbarStateChange in ref to avoid it as a dependency
  const onToolbarStateChangeRef = useRef(onToolbarStateChange);
  useEffect(() => {
    onToolbarStateChangeRef.current = onToolbarStateChange;
  }, [onToolbarStateChange]);

  // Expose toolbar state to parent - only triggers when state values change
  useEffect(() => {
    if (onToolbarStateChangeRef.current && toolbarActionsRef.current) {
      const state: SchematicToolbarState = {
        isLocked,
        isSimulating,
        selectedNode,
        selectedEdge,
        zoomLevel,
        stats,
      };
      onToolbarStateChangeRef.current(state, toolbarActionsRef.current);
    }
  }, [isLocked, isSimulating, selectedNode, selectedEdge, zoomLevel, stats]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges.map((e) => ({
          ...e,
          // Highlight selected edge
          style: {
            ...e.style,
            stroke: selectedEdge?.id === e.id ? '#ef4444' : (e.style?.stroke || '#0066ff'),
            strokeWidth: selectedEdge?.id === e.id ? 5 : (e.style?.strokeWidth || 4),
          },
        }))}
        onNodesChange={isLocked ? undefined : onNodesChange}
        onEdgesChange={isLocked ? undefined : onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onReconnect={onReconnect}
        onMoveEnd={handleMoveEnd}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[10, 10]}
        minZoom={0.2}
        maxZoom={4}
        edgesReconnectable={!isLocked}
        defaultEdgeOptions={{
          type: 'smoothstep', // Orthogonal routing for P&ID schematics
          animated: true,
          style: { stroke: '#0066ff', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff', width: 20, height: 20 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={2} color="#cbd5e1" />
        <MiniMap
          nodeColor={(node: Node<SchematicNodeData>) => {
            if (node.data.hasActiveAlarm) return '#dc2626';
            switch (node.data.status) {
              case 'running': return '#10b981';
              case 'warning': return '#f59e0b';
              case 'offline':
              case 'alarm': return '#ef4444';
              default: return '#9ca3af';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-card !border !border-border !rounded-lg"
        />

        {/* Top toolbar - conditionally shown */}
        {showToolbar && (
          <Panel position="top-left" className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="default" disabled={isLocked}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Equipment Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {equipmentOptions.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <DropdownMenuItem key={opt.type} onClick={() => addNode(opt.type)}>
                      <Icon className="h-4 w-4 mr-2" />
                      {opt.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="sm" variant="outline" onClick={deleteSelected} disabled={isLocked || !selectedNode} title="Delete Node">
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Delete selected edge/connection */}
            <Button
              size="sm"
              variant="outline"
              onClick={deleteSelectedEdge}
              disabled={isLocked || !selectedEdge}
              title="Delete Connection"
              className={selectedEdge ? 'border-red-500 text-red-600' : ''}
            >
              <Link2Off className="h-4 w-4" />
            </Button>

            {selectedNode?.data.type === 'valve' && (
              <Button
                size="sm"
                variant="outline"
                onClick={toggleValve}
                disabled={isLocked}
                className="border-amber-500 text-amber-600 hover:bg-amber-50"
              >
                <ValveIcon className="h-4 w-4" />
              </Button>
            )}

            <div className="h-6 w-px bg-border mx-1" />

            <Button
              size="sm"
              variant={isSimulating ? 'default' : 'outline'}
              onClick={() => setIsSimulating(!isSimulating)}
              className={isSimulating ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              size="sm"
              variant={isLocked ? 'default' : 'outline'}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>

            <Button size="sm" variant="outline" title="Save Layout">
              <Save className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-md px-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => zoomOut()}
                className="h-7 w-7 p-0"
                title="Zoom Out"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] font-medium text-muted-foreground w-10 text-center tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => zoomIn()}
                className="h-7 w-7 p-0"
                title="Zoom In"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => fitView({ padding: 0.2, duration: 300 })}
              title="Fit to View"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </Panel>
        )}

        {/* Zoom Controls - bottom right (only shown when external toolbar is hidden) */}
        {showToolbar && (
          <Panel position="bottom-right" className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1 py-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => zoomOut()}
              className="h-6 w-6 p-0"
              title="Zoom Out"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] font-mono text-slate-600 w-9 text-center tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => zoomIn()}
              className="h-6 w-6 p-0"
              title="Zoom In"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <div className="h-4 w-px bg-slate-200 mx-0.5" />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fitView({ padding: 0.2, duration: 300 })}
              className="h-6 w-6 p-0"
              title="Fit to View"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </Panel>
        )}

        {/* Flow legend */}
        <Panel position="bottom-left" className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-1 bg-blue-500 rounded" />
              <span>Process</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-emerald-500 rounded" />
              <span>Chemical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-amber-500 rounded" />
              <span>Valve</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 border border-gray-400 border-dashed" />
              <span>Sensor</span>
            </div>
          </div>
        </Panel>

        {/* Instructions with keyboard shortcuts */}
        <Panel position="bottom-center" className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-4 py-1.5">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">Click</span> node for details
            <span className="mx-1.5">•</span>
            <span className="font-medium text-foreground">Hover</span> for connections
            <span className="mx-1.5">•</span>
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Del</kbd> delete
            <span className="mx-1.5">•</span>
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">L</kbd> lock
            <span className="mx-1.5">•</span>
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Space</kbd> pause
            <span className="mx-1.5">•</span>
            <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[9px] font-mono">Ctrl+0</kbd> fit
          </p>
        </Panel>

        {/* Selected edge indicator - shows above zoom controls */}
        {selectedEdge && (
          <Panel position="top-right" className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded px-3 py-1.5">
            <p className="text-[10px] text-red-700 dark:text-red-400 font-medium">
              Press <kbd className="px-1 py-0.5 bg-red-100 dark:bg-red-900/50 rounded text-[9px]">Delete</kbd> to remove connection
            </p>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// Wrapper component with ReactFlowProvider for zoom controls
export function SchematicCanvas({
  onNodeSelect,
  onToolbarStateChange,
  showToolbar = true,
  isHistoricalMode = false,
  playbackPosition = 24,
}: SchematicCanvasProps) {
  return (
    <ReactFlowProvider>
      <SchematicCanvasInner
        onNodeSelect={onNodeSelect}
        onToolbarStateChange={onToolbarStateChange}
        showToolbar={showToolbar}
        isHistoricalMode={isHistoricalMode}
        playbackPosition={playbackPosition}
      />
    </ReactFlowProvider>
  );
}

// Export equipment options for external toolbar
export { equipmentOptions };
