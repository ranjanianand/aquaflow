/**
 * Feature flags.
 *
 * The platform ingests plant readings from JSON files dropped in object
 * storage. That path is one-way: we read what the plant exports, and there is
 * no channel back into the PLCs.
 *
 * Anything that writes to the plant, or that describes edge hardware we no
 * longer operate, is therefore switched off rather than deleted — the code
 * stays for when a control path exists, but it must not ship enabled and
 * imply a capability the system does not have.
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
   * Digital twin. Simulation and display are fine; "apply scenario" writes
   * commands and is gated by writeBack separately.
   */
  virtualTwin: true,

  /**
   * Predictive maintenance. Needs months of accumulated history before its
   * output means anything. Enable once there is real data behind it.
   */
  predictive: false,
} as const;

export type FeatureName = keyof typeof FEATURES;

export function isEnabled(feature: FeatureName): boolean {
  return FEATURES[feature];
}

/** Routes hidden from navigation while their feature is off. */
export const ROUTE_FEATURES: Record<string, FeatureName> = {
  '/command-execution': 'writeBack',
  '/autonomous-optimization': 'autonomousOptimization',
  '/predictive': 'predictive',
  '/virtual-twin': 'virtualTwin',
};

export function isRouteEnabled(href: string): boolean {
  const path = href.split('?')[0];
  const feature = ROUTE_FEATURES[path];
  return feature ? FEATURES[feature] : true;
}
