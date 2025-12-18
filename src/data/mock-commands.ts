// Mock Command API for AquaFlow Control Capability
// This is a prototype implementation - connects to mock data only

export type CommandType =
  | 'setpoint'      // Change a setpoint value
  | 'start'         // Start equipment
  | 'stop'          // Stop equipment
  | 'adjust'        // Adjust parameter
  | 'apply'         // Apply scenario/optimization
  | 'acknowledge'   // Acknowledge alarm
  | 'reset';        // Reset to default

export type CommandStatus =
  | 'pending'       // Awaiting confirmation
  | 'confirmed'     // User confirmed, ready to send
  | 'sending'       // Being sent to gateway
  | 'executed'      // Successfully executed
  | 'failed'        // Execution failed
  | 'cancelled'     // User cancelled
  | 'expired';      // Command expired before execution

export type CommandRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CommandRequest {
  id: string;
  type: CommandType;
  equipmentId: string;
  equipmentName: string;
  plantId: string;
  plantName: string;
  parameterName: string;
  currentValue: number | string;
  targetValue: number | string;
  unit: string;
  riskLevel: CommandRiskLevel;
  reasoning?: string;
  source: 'manual' | 'ai_optimization' | 'virtual_twin' | 'alarm_response';
  requestedBy: string;
  requestedAt: Date;
  expiresAt: Date;
}

export interface CommandResult {
  success: boolean;
  commandId: string;
  message: string;
  executedAt?: Date;
  estimatedDuration?: number; // seconds until effect is visible
  errors?: string[];
  warnings?: string[];
}

export interface CommandConfirmation {
  commandId: string;
  confirmedBy: string;
  confirmedAt: Date;
  notes?: string;
  overrideReason?: string; // Required for high-risk commands
}

export interface AuditLogEntry {
  id: string;
  commandId: string;
  action: 'created' | 'confirmed' | 'executed' | 'failed' | 'cancelled' | 'expired';
  performedBy: string;
  performedAt: Date;
  details: string;
  plantId: string;
  plantName: string;
  equipmentName: string;
  parameterName: string;
  previousValue: number | string;
  newValue: number | string;
  unit: string;
  riskLevel: CommandRiskLevel;
  source: CommandRequest['source'];
}

// In-memory audit log for prototype
const auditLog: AuditLogEntry[] = [];

// Mock pending commands
const pendingCommands: Map<string, CommandRequest> = new Map();

// Generate unique command ID
const generateCommandId = (): string => {
  return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generate unique audit log ID
const generateAuditId = (): string => {
  return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Risk assessment based on command type and parameter
export const assessCommandRisk = (
  type: CommandType,
  parameterName: string,
  changePercent: number
): CommandRiskLevel => {
  // Critical parameters always high risk
  const criticalParams = ['pressure', 'chemical dosing', 'pH', 'chlorine'];
  const isCritical = criticalParams.some(p =>
    parameterName.toLowerCase().includes(p)
  );

  if (isCritical && Math.abs(changePercent) > 20) return 'critical';
  if (isCritical && Math.abs(changePercent) > 10) return 'high';
  if (Math.abs(changePercent) > 25) return 'high';
  if (Math.abs(changePercent) > 15) return 'medium';
  return 'low';
};

// Get risk level display info
export const getRiskDisplay = (riskLevel: CommandRiskLevel): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  requiresReason: boolean;
} => {
  const displays: Record<CommandRiskLevel, ReturnType<typeof getRiskDisplay>> = {
    low: {
      label: 'Low Risk',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-300',
      description: 'Safe to apply. Minor process adjustment.',
      requiresReason: false,
    },
    medium: {
      label: 'Medium Risk',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-300',
      description: 'Moderate change. Monitor for 15-30 minutes after application.',
      requiresReason: false,
    },
    high: {
      label: 'High Risk',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-300',
      description: 'Significant change. Requires supervisor approval.',
      requiresReason: true,
    },
    critical: {
      label: 'Critical',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      description: 'Major process impact. Requires manager approval and documented reason.',
      requiresReason: true,
    },
  };
  return displays[riskLevel];
};

// Create a new command request
export const createCommand = (
  request: Omit<CommandRequest, 'id' | 'requestedAt' | 'expiresAt'>
): CommandRequest => {
  const command: CommandRequest = {
    ...request,
    id: generateCommandId(),
    requestedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
  };

  pendingCommands.set(command.id, command);

  // Add to audit log
  addAuditEntry({
    commandId: command.id,
    action: 'created',
    performedBy: request.requestedBy,
    details: `Command created: Change ${request.parameterName} from ${request.currentValue} to ${request.targetValue} ${request.unit}`,
    plantId: request.plantId,
    plantName: request.plantName,
    equipmentName: request.equipmentName,
    parameterName: request.parameterName,
    previousValue: request.currentValue,
    newValue: request.targetValue,
    unit: request.unit,
    riskLevel: request.riskLevel,
    source: request.source,
  });

  return command;
};

// Execute a command (mock - simulates sending to gateway)
export const executeCommand = async (
  commandId: string,
  confirmation: Omit<CommandConfirmation, 'commandId'>
): Promise<CommandResult> => {
  const command = pendingCommands.get(commandId);

  if (!command) {
    return {
      success: false,
      commandId,
      message: 'Command not found or already processed',
      errors: ['Command ID not found in pending queue'],
    };
  }

  // Check if expired
  if (new Date() > command.expiresAt) {
    pendingCommands.delete(commandId);
    addAuditEntry({
      commandId,
      action: 'expired',
      performedBy: 'System',
      details: 'Command expired before execution',
      plantId: command.plantId,
      plantName: command.plantName,
      equipmentName: command.equipmentName,
      parameterName: command.parameterName,
      previousValue: command.currentValue,
      newValue: command.targetValue,
      unit: command.unit,
      riskLevel: command.riskLevel,
      source: command.source,
    });

    return {
      success: false,
      commandId,
      message: 'Command expired',
      errors: ['Command validity period has passed'],
    };
  }

  // Check if high-risk command requires reason
  const riskInfo = getRiskDisplay(command.riskLevel);
  if (riskInfo.requiresReason && !confirmation.overrideReason) {
    return {
      success: false,
      commandId,
      message: 'Override reason required',
      errors: [`${riskInfo.label} commands require documented reason`],
    };
  }

  // Add confirmation audit entry
  addAuditEntry({
    commandId,
    action: 'confirmed',
    performedBy: confirmation.confirmedBy,
    details: `Command confirmed${confirmation.notes ? `: ${confirmation.notes}` : ''}${
      confirmation.overrideReason ? ` (Override: ${confirmation.overrideReason})` : ''
    }`,
    plantId: command.plantId,
    plantName: command.plantName,
    equipmentName: command.equipmentName,
    parameterName: command.parameterName,
    previousValue: command.currentValue,
    newValue: command.targetValue,
    unit: command.unit,
    riskLevel: command.riskLevel,
    source: command.source,
  });

  // Simulate network delay (500ms - 1.5s)
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Simulate 95% success rate (5% random failure for realism)
  const isSuccess = Math.random() > 0.05;

  if (isSuccess) {
    pendingCommands.delete(commandId);

    addAuditEntry({
      commandId,
      action: 'executed',
      performedBy: 'Gateway',
      details: `Command executed successfully. ${command.parameterName} changed to ${command.targetValue} ${command.unit}`,
      plantId: command.plantId,
      plantName: command.plantName,
      equipmentName: command.equipmentName,
      parameterName: command.parameterName,
      previousValue: command.currentValue,
      newValue: command.targetValue,
      unit: command.unit,
      riskLevel: command.riskLevel,
      source: command.source,
    });

    return {
      success: true,
      commandId,
      message: `Command executed successfully`,
      executedAt: new Date(),
      estimatedDuration: 15 + Math.floor(Math.random() * 30), // 15-45 seconds
    };
  } else {
    addAuditEntry({
      commandId,
      action: 'failed',
      performedBy: 'Gateway',
      details: 'PLC communication timeout',
      plantId: command.plantId,
      plantName: command.plantName,
      equipmentName: command.equipmentName,
      parameterName: command.parameterName,
      previousValue: command.currentValue,
      newValue: command.targetValue,
      unit: command.unit,
      riskLevel: command.riskLevel,
      source: command.source,
    });

    return {
      success: false,
      commandId,
      message: 'Command execution failed',
      errors: ['PLC communication timeout - Gateway did not respond within 5 seconds'],
      warnings: ['Retry recommended after checking gateway status'],
    };
  }
};

// Cancel a pending command
export const cancelCommand = async (
  commandId: string,
  cancelledBy: string,
  reason?: string
): Promise<CommandResult> => {
  const command = pendingCommands.get(commandId);

  if (!command) {
    return {
      success: false,
      commandId,
      message: 'Command not found',
      errors: ['Command ID not found in pending queue'],
    };
  }

  pendingCommands.delete(commandId);

  addAuditEntry({
    commandId,
    action: 'cancelled',
    performedBy: cancelledBy,
    details: `Command cancelled${reason ? `: ${reason}` : ''}`,
    plantId: command.plantId,
    plantName: command.plantName,
    equipmentName: command.equipmentName,
    parameterName: command.parameterName,
    previousValue: command.currentValue,
    newValue: command.targetValue,
    unit: command.unit,
    riskLevel: command.riskLevel,
    source: command.source,
  });

  return {
    success: true,
    commandId,
    message: 'Command cancelled successfully',
  };
};

// Add entry to audit log
const addAuditEntry = (
  entry: Omit<AuditLogEntry, 'id' | 'performedAt'>
): void => {
  auditLog.unshift({
    ...entry,
    id: generateAuditId(),
    performedAt: new Date(),
  });

  // Keep only last 1000 entries for memory management
  if (auditLog.length > 1000) {
    auditLog.pop();
  }
};

// Get audit log entries
export const getAuditLog = (options?: {
  plantId?: string;
  limit?: number;
  offset?: number;
  action?: AuditLogEntry['action'];
  riskLevel?: CommandRiskLevel;
  source?: CommandRequest['source'];
  startDate?: Date;
  endDate?: Date;
}): AuditLogEntry[] => {
  let filtered = [...auditLog];

  if (options?.plantId) {
    filtered = filtered.filter(e => e.plantId === options.plantId);
  }
  if (options?.action) {
    filtered = filtered.filter(e => e.action === options.action);
  }
  if (options?.riskLevel) {
    filtered = filtered.filter(e => e.riskLevel === options.riskLevel);
  }
  if (options?.source) {
    filtered = filtered.filter(e => e.source === options.source);
  }
  if (options?.startDate) {
    filtered = filtered.filter(e => e.performedAt >= options.startDate!);
  }
  if (options?.endDate) {
    filtered = filtered.filter(e => e.performedAt <= options.endDate!);
  }

  const offset = options?.offset || 0;
  const limit = options?.limit || 50;

  return filtered.slice(offset, offset + limit);
};

// Get audit log statistics
export const getAuditStats = (plantId?: string): {
  total: number;
  executed: number;
  failed: number;
  cancelled: number;
  byRiskLevel: Record<CommandRiskLevel, number>;
  bySource: Record<string, number>;
} => {
  const filtered = plantId
    ? auditLog.filter(e => e.plantId === plantId)
    : auditLog;

  const executed = filtered.filter(e => e.action === 'executed').length;
  const failed = filtered.filter(e => e.action === 'failed').length;
  const cancelled = filtered.filter(e => e.action === 'cancelled').length;

  const byRiskLevel: Record<CommandRiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const bySource: Record<string, number> = {};

  filtered.forEach(entry => {
    if (entry.action === 'executed') {
      byRiskLevel[entry.riskLevel]++;
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;
    }
  });

  return {
    total: filtered.length,
    executed,
    failed,
    cancelled,
    byRiskLevel,
    bySource,
  };
};

// Get pending commands
export const getPendingCommands = (): CommandRequest[] => {
  return Array.from(pendingCommands.values());
};

// Clear all data (for testing)
export const clearAllCommandData = (): void => {
  pendingCommands.clear();
  auditLog.length = 0;
};

// Initialize with some sample audit entries for demo
export const initializeSampleAuditData = (): void => {
  const sampleEntries: Array<Omit<AuditLogEntry, 'id' | 'performedAt'>> = [
    {
      commandId: 'cmd-sample-001',
      action: 'executed',
      performedBy: 'Amit Singh',
      details: 'Command executed successfully. Pump Speed changed to 2650 RPM',
      plantId: 'plant-1',
      plantName: 'Chennai WTP-01',
      equipmentName: 'RO Feed Pump P1',
      parameterName: 'Pump Speed',
      previousValue: 2850,
      newValue: 2650,
      unit: 'RPM',
      riskLevel: 'low',
      source: 'ai_optimization',
    },
    {
      commandId: 'cmd-sample-002',
      action: 'executed',
      performedBy: 'Priya Sharma',
      details: 'Command executed successfully. Dosing Rate changed to 2.1 mg/L',
      plantId: 'plant-1',
      plantName: 'Chennai WTP-01',
      equipmentName: 'Chlorine Dosing Unit',
      parameterName: 'Dosing Rate',
      previousValue: 2.4,
      newValue: 2.1,
      unit: 'mg/L',
      riskLevel: 'low',
      source: 'ai_optimization',
    },
    {
      commandId: 'cmd-sample-003',
      action: 'failed',
      performedBy: 'Gateway',
      details: 'PLC communication timeout',
      plantId: 'plant-2',
      plantName: 'Mumbai WTP-02',
      equipmentName: 'Sand Filter Bank A',
      parameterName: 'Backwash Frequency',
      previousValue: 8,
      newValue: 12,
      unit: 'hours',
      riskLevel: 'medium',
      source: 'manual',
    },
    {
      commandId: 'cmd-sample-004',
      action: 'executed',
      performedBy: 'Rahul Kumar',
      details: 'Virtual Twin scenario applied. Aeration reduced to optimize energy.',
      plantId: 'plant-3',
      plantName: 'Delhi WTP-03',
      equipmentName: 'Aeration Blower',
      parameterName: 'Air Flow Rate',
      previousValue: 1200,
      newValue: 1050,
      unit: 'm³/h',
      riskLevel: 'low',
      source: 'virtual_twin',
    },
    {
      commandId: 'cmd-sample-005',
      action: 'cancelled',
      performedBy: 'Amit Singh',
      details: 'Command cancelled: Inlet turbidity spike detected, maintaining current dosing',
      plantId: 'plant-1',
      plantName: 'Chennai WTP-01',
      equipmentName: 'Coagulant Dosing',
      parameterName: 'Dosing Rate',
      previousValue: 45,
      newValue: 38,
      unit: 'mg/L',
      riskLevel: 'medium',
      source: 'ai_optimization',
    },
  ];

  // Add entries with staggered timestamps (last 24 hours)
  sampleEntries.forEach((entry, index) => {
    const hoursAgo = index * 4 + Math.floor(Math.random() * 3);
    const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    auditLog.push({
      ...entry,
      id: generateAuditId(),
      performedAt: timestamp,
    });
  });
};

// Initialize sample data on module load
initializeSampleAuditData();
