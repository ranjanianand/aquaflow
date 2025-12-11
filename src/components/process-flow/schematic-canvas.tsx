'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SchematicNode, SchematicNodeData, EquipmentType, EquipmentMetric } from './schematic-node';
import { Button } from '@/components/ui/button';
import {
  Plus,
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
  ZoomIn,
  ZoomOut,
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

// Initial edges with better styling for schematic view
const initialEdges: Edge[] = [
  // Main process flow - thicker blue lines
  { id: 'e-inlet-screen', source: 'inlet-1', target: 'screen-1', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-screen-pump', source: 'screen-1', target: 'pump-1', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-pump-tank1', source: 'pump-1', target: 'tank-1', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-tank1-tank2', source: 'tank-1', target: 'tank-2', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-tank2-tank3', source: 'tank-2', target: 'tank-3', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-tank3-filter', source: 'tank-3', target: 'filter-1', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-filter-tank4', source: 'filter-1', target: 'tank-4', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-tank4-pump2', source: 'tank-4', target: 'pump-2', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },
  { id: 'e-pump2-outlet', source: 'pump-2', target: 'outlet-1', animated: true, style: { stroke: '#0066ff', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' } },

  // Chemical dosing - green
  { id: 'e-chem1-tank1', source: 'chemical-1', target: 'tank-1', animated: true, style: { stroke: '#10b981', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },
  { id: 'e-chem2-tank4', source: 'chemical-2', target: 'tank-4', animated: true, style: { stroke: '#10b981', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } },

  // Sensor connections - dashed gray
  { id: 'e-tank3-sensor', source: 'tank-3', target: 'sensor-1', style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,5' } },
  { id: 'e-pump2-sensor2', source: 'pump-2', target: 'sensor-2', style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '5,5' } },

  // Valve connections - orange
  { id: 'e-inlet-valve1', source: 'inlet-1', target: 'valve-1', style: { stroke: '#f59e0b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
  { id: 'e-tank3-valve2', source: 'tank-3', target: 'valve-2', style: { stroke: '#f59e0b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
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

interface SchematicCanvasProps {
  onNodeSelect?: (node: Node<SchematicNodeData> | null) => void;
}

export function SchematicCanvas({ onNodeSelect }: SchematicCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLocked, setIsLocked] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node<SchematicNodeData> | null>(null);

  // Real-time simulation
  useEffect(() => {
    if (!isSimulating) return;

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
  }, [isSimulating, setNodes]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isLocked) return;
      const edge: Edge = {
        ...connection,
        id: `e-${connection.source}-${connection.target}`,
        animated: true,
        style: { stroke: '#0066ff', strokeWidth: 4 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' },
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
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const addNode = useCallback(
    (type: EquipmentType) => {
      const id = `${type}-${Date.now()}`;
      const metrics = getDefaultMetrics(type);
      const newNode: Node<SchematicNodeData> = {
        id,
        type: 'schematic',
        position: { x: 400, y: 200 },
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
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  const deleteSelected = useCallback(() => {
    if (isLocked || !selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    onNodeSelect?.(null);
  }, [isLocked, selectedNode, setNodes, setEdges, onNodeSelect]);

  const toggleValve = useCallback(() => {
    if (!selectedNode || selectedNode.data.type !== 'valve') return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedNode.id) return node;
        const currentState = node.data.valveState;
        const newState = currentState === 'open' ? 'closed' : currentState === 'closed' ? 'partial' : 'open';
        const newStatus = newState === 'closed' ? 'idle' : 'running';
        return {
          ...node,
          data: {
            ...node.data,
            valveState: newState,
            status: newStatus,
            metrics: [{ label: 'Position', value: newState === 'open' ? '100' : newState === 'closed' ? '0' : '50', unit: '%', status: 'normal' as const }],
          },
        };
      })
    );
  }, [selectedNode, setNodes]);

  // Stats
  const stats = useMemo(() => {
    const running = nodes.filter((n) => n.data.status === 'running').length;
    const warning = nodes.filter((n) => n.data.status === 'warning' || n.data.hasActiveAlarm).length;
    const offline = nodes.filter((n) => n.data.status === 'offline').length;
    const alarms = nodes.filter((n) => n.data.hasActiveAlarm).length;
    return { running, warning, offline, alarms, total: nodes.length };
  }, [nodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isLocked ? undefined : onNodesChange}
        onEdgesChange={isLocked ? undefined : onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[10, 10]}
        minZoom={0.3}
        maxZoom={3}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#0066ff', strokeWidth: 4 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#0066ff' },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
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

        {/* Top toolbar */}
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

          <Button size="sm" variant="outline" onClick={deleteSelected} disabled={isLocked || !selectedNode}>
            <Trash2 className="h-4 w-4" />
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

          <Button size="sm" variant="outline">
            <Save className="h-4 w-4" />
          </Button>
        </Panel>

        {/* Status legend */}
        <Panel position="top-right" className="flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          {stats.alarms > 0 && (
            <div className="flex items-center gap-1.5 pr-3 border-r border-border">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-[11px] font-semibold text-rose-600">
                {stats.alarms} Alarm{stats.alarms > 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px]">{stats.running}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[11px]">{stats.warning}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px]">{stats.offline}</span>
          </div>
        </Panel>

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

        {/* Instructions */}
        <Panel position="bottom-center" className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-4 py-1.5">
          <p className="text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground">Click</span> for details
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">Drag</span> to move
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">Connect</span> from handles
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
}
