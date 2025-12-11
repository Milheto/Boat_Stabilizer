import { TelemetryFrame } from '../types/telemetry';

/**
 * Abstract interface for telemetry data sources.
 * This allows us to swap between mock data, WebSocket, or file-based sources.
 */
export interface TelemetrySource {
  /**
   * Get the initial dataset (all available telemetry frames).
   */
  getInitialData(): Promise<TelemetryFrame[]>;

  /**
   * Optional: subscribe to live updates (for future WebSocket implementation).
   */
  onUpdate?: (callback: (frame: TelemetryFrame) => void) => void;
}

/**
 * Mock telemetry source that returns synthetic data.
 */
export class MockTelemetrySource implements TelemetrySource {
  private data: TelemetryFrame[];

  constructor(data: TelemetryFrame[]) {
    this.data = data;
  }

  async getInitialData(): Promise<TelemetryFrame[]> {
    return Promise.resolve(this.data);
  }
}

