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
   * Operational Insights.
   *
   * Reads as an analytics screen, but every recommendation carries an
   * "Apply recommendation" action that writes a setpoint to equipment — feed
   * pressure, chlorine dosing rate, backwash timing. That is the capability
   * gated by writeBack, so it cannot ship while the control path is absent.
   * It could return advisory-only, with the apply action removed.
   */
  operationalInsights: false,

  /**
   * P&ID schematic.
   *
   * A process engineering drawing of the plant — equipment, valves, pipework
   * and their states, with controls to add equipment. It represents and
   * configures plant hardware rather than analysing the readings.
   */
  processSchematic: false,

  /**
   * Data pipeline screen.
   *
   * Shows what each incoming file contained and the decision recorded against
   * every reading in it. Useful for tracing a figure back to its source, but it
   * reports on ingestion rather than analysing the readings, so it sits outside
   * the analytical scope.
   */
  dataPipeline: false,
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
  '/data-pipeline': 'dataPipeline',
  '/insights': 'operationalInsights',
  // Commercial suite
  '/customers': 'businessSuite',
  '/contracts': 'businessSuite',
  '/smart-cart': 'businessSuite',
  '/proposal-builder': 'businessSuite',
  '/inventory-monitor': 'businessSuite',
};

export function isRouteEnabled(href: string): boolean {
  const path = href.split('?')[0];
  const feature = ROUTE_FEATURES[path];
  return feature ? FEATURES[feature] : true;
}
