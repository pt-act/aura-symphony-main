/**
 * Valhalla Telemetry Service
 *
 * Logs script execution events for safety monitoring and pattern analysis.
 * Currently stores in-memory + console; replace with backend endpoint for production.
 */

export interface ValhallaTelemetryEvent {
  toolName: string;
  command: string;
  scriptLength: number;
  safetyScore: number;
  safe: boolean;
  findings: number;
  timestamp: string;
}

// In-memory buffer (last 100 events)
const telemetryBuffer: ValhallaTelemetryEvent[] = [];
const MAX_BUFFER_SIZE = 100;

export function logValhallaTelemetry(event: ValhallaTelemetryEvent): void {
  // Add to buffer
  telemetryBuffer.push(event);
  if (telemetryBuffer.length > MAX_BUFFER_SIZE) {
    telemetryBuffer.shift();
  }

  // Console output for development
  const icon = event.safe ? '✅' : '🔴';
  console.log(
    `[Valhalla Telemetry] ${icon} ${event.toolName} | score: ${event.safetyScore} | findings: ${event.findings} | script: ${event.scriptLength}chars`
  );
}

/**
 * Returns aggregated telemetry stats for dashboard display.
 */
export function getValhallaStats(): {
  totalExecutions: number;
  safeRate: number;
  avgSafetyScore: number;
  topFindings: { category: string; count: number }[];
} {
  const total = telemetryBuffer.length;
  if (total === 0) {
    return { totalExecutions: 0, safeRate: 100, avgSafetyScore: 100, topFindings: [] };
  }

  const safeCount = telemetryBuffer.filter((e) => e.safe).length;
  const avgScore =
    telemetryBuffer.reduce((sum, e) => sum + e.safetyScore, 0) / total;

  return {
    totalExecutions: total,
    safeRate: Math.round((safeCount / total) * 100),
    avgSafetyScore: Math.round(avgScore),
    topFindings: [], // Can be enriched with category tracking
  };
}

/**
 * Returns the raw telemetry buffer for external consumption.
 */
export function getTelemetryBuffer(): ValhallaTelemetryEvent[] {
  return [...telemetryBuffer];
}
