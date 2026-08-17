/**
 * Feature flags.
 *
 * The platform reads plant readings from JSON files and analyses them. One
 * test decides whether a screen ships: does it analyse the readings?
 *
 * Screens that operate the plant, that describe or configure its hardware, or
 * that are commercial rather than analytical are switched off — not deleted.
 * The code stays for when the scope changes.
 *
 * Screens that analyse accumulated history stay ON even where little history
 * exists yet. How much data has arrived is a matter of time, not capability,
 * and they become useful the moment the plants provide their existing records.
 */

export const FEATURES = {
  /**
   * Sending setpoints, start/stop and other commands to plant equipment.
   * Requires a write path back to the PLCs, which file ingestion does not
   * provide. Turning this on without one produces commands that silently
   * never arrive.
   */
  writeBack: false,

  /**
   * Edge gateway, PLC session and MQTT broker management.
   * There is no gateway in a file-drop model — the plant exports a file and
   * we read it. These screens would describe hardware that does not exist.
   */
  gatewayManagement: false,

  /**
   * Autonomous optimisation. Generates and applies commands, so it inherits
   * the writeBack constraint. Could ship as advisory-only — recommendations
   * an operator applies by hand — but not as written.
   */
  autonomousOptimization: false,

  /**
   * Digital twin. A twin needs live two-way state with the plant; with batch
   * file ingestion it degrades to a schematic of last-known values, which is
   * what the P&ID screen already provides. Its "apply scenario" action also
   * writes commands.
   */
  virtualTwin: false,

  /**
   * Commercial suite — customers, contracts, procurement, proposals,
   * inventory. Unrelated to plant analytics and out of scope for this phase.
   * Nothing here is broken; it simply belongs to a different product.
   */
  businessSuite: false,

  /**
   * Insights.
   *
   * Was withheld because the screen mixed three things: analytics over sensor
   * data, operational recommendations that wrote setpoints to equipment (feed
   * pressure, dosing rate, backwash timing), and a commercial view of cost and
   * savings. The first is arithmetic over readings; the second needed the
   * control path gated by writeBack; the third needed a price list.
   *
   * Rebuilt as the first only — breach rates, silent instruments, held values,
   * what the ingest discarded. No setpoints are written and no costs are
   * shown, so nothing here depends on a capability the system lacks.
   */
  operationalInsights: true,

  /**
   * Process diagrams — both the P&ID schematic and the process flow canvas.
   *
   * Process engineering drawings of the plant: equipment, valves, pipework and
   * their states, with controls to add, edit and delete equipment. They
   * represent and configure plant hardware rather than analysing the readings.
   *
   * Both are covered by this one flag. They differ only in degree — the
   * schematic carries more editing controls — and the two screens showed
   * roughly ninety hardcoded equipment readings each. Those cannot be derived:
   * there is no equipment table, and nothing maps a diagram node to a sensor
   * tag. Hiding one while showing the other left the same drawing visible
   * under a different name.
   */
  processSchematic: false,

  /**
   * Alarm orchestration — the "Smart" tab on the Alarms screen.
   *
   * Correlation groups, first-out analysis, suppression rules and fatigue
   * metrics. These are genuinely useful, and none of them exist: there is no
   * correlation engine and no suppression rules, so the tab reported findings
   * from a fixture. The rest of the Alarms screen is live.
   */
  alarmOrchestration: false,

  /**
   * Maintenance.
   *
   * Service visits, engineer scheduling, spares and work orders. It reports on
   * the servicing organisation rather than on the plant readings, and there is
   * no source for any of it — no work-order table, no service history, no
   * engineer roster. Everything on the screen is fixture data.
   *
   * Distinct from Asset Health, which analyses sensor behaviour and stays on.
   */
  maintenanceModule: false,

  /**
   * Data pipeline screen.
   *
   * Shows what each incoming file contained and the decision recorded against
   * every reading in it. Useful for tracing a figure back to its source, but it
   * reports on ingestion rather than analysing the readings, so it sits outside
   * the analytical scope.
   */
  dataPipeline: false,

  /**
   * Executive view.
   *
   * Reports contract value, lifetime revenue, outstanding balances, customer
   * health and contract renewals. Those are commercial figures rather than an
   * analysis of the plant readings, which places the view with the rest of the
   * commercial suite.
   */
  executiveView: false,
} as const;

export type FeatureName = keyof typeof FEATURES;

export function isEnabled(feature: FeatureName): boolean {
  return FEATURES[feature];
}

/** Routes hidden from navigation while their feature is off. */
export const ROUTE_FEATURES: Record<string, FeatureName> = {
  '/command-execution': 'writeBack',
  '/autonomous-optimization': 'autonomousOptimization',
  '/virtual-twin': 'virtualTwin',
  '/process-flow-schematic': 'processSchematic',
  '/process-flow': 'processSchematic',
  '/data-pipeline': 'dataPipeline',
  '/service-monitor': 'maintenanceModule',
  // Role views share a route, so this key carries its query string
  '/dashboard-v2?role=executive': 'executiveView',
  '/insights': 'operationalInsights',
  // Commercial suite
  '/customers': 'businessSuite',
  '/contracts': 'businessSuite',
  '/smart-cart': 'businessSuite',
  '/proposal-builder': 'businessSuite',
  '/inventory-monitor': 'businessSuite',
};

export function isRouteEnabled(href: string): boolean {
  // Match the full href first: the dashboard role views differ only by query.
  const feature = ROUTE_FEATURES[href] ?? ROUTE_FEATURES[href.split('?')[0]];
  return feature ? FEATURES[feature] : true;
}
