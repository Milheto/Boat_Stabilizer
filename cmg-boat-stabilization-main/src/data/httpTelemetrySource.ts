import { TelemetryFrame } from '../types/telemetry';
import { TelemetrySource } from './telemetrySource';

export class HTTPTelemetrySource implements TelemetrySource {
  private apiUrl: string;
  private pollingInterval: number;
  private intervalId: NodeJS.Timeout | null = null;
  private updateCallbacks: ((frame: TelemetryFrame) => void)[] = [];
  private ignoredCallbacks: ((frame: TelemetryFrame) => void)[] = [];  // Callbacks for ignored frames
  private buffer: TelemetryFrame[] = [];
  private isPolling = false;
  private lastServerTimestamp: number | null = null;
  private lastFrameT: number | null = null;  // Track last t to ignore old frames

  constructor(apiUrl: string = 'http://localhost:3001/api', pollingInterval: number = 100) {
    this.apiUrl = apiUrl;
    this.pollingInterval = pollingInterval; // milliseconds (100ms = 10 Hz)
  }

  async connect(): Promise<void> {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.lastServerTimestamp = null;
    this.lastFrameT = null;  // Reset on reconnect
    
    // Start polling
    this.startPolling();
  }

  private async startPolling(): Promise<void> {
    const poll = async () => { 
      if (!this.isPolling) return;

      try {
        const response = await fetch(`${this.apiUrl}/telemetry`);
        
        if (response.status === 204) {
          // No data yet, skip
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Remove serverTimestamp if present
        const { serverTimestamp, ...frame } = data;
        
        // Skip if duplicate (same server timestamp)
        if (serverTimestamp && serverTimestamp === this.lastServerTimestamp) {
          return;
        }
        this.lastServerTimestamp = serverTimestamp;

        // Validate frame
        if (typeof frame.t === 'number') {
          // Skip frames with t <= last frame's t (ignore out-of-order frames)
          if (this.lastFrameT !== null && frame.t <= this.lastFrameT) {
            console.warn(`[HTTP] Ignoring old frame: t=${frame.t} <= lastT=${this.lastFrameT}`);
            // Notify ignored callbacks
            const ignoredFrame: TelemetryFrame = {
              t: frame.t,
              roll: frame.roll ?? 0,
              pitch: frame.pitch ?? 0,
              yaw: frame.yaw ?? 0,
              gyroX: frame.gyroX ?? 0,
              gyroY: frame.gyroY ?? 0,
              gyroZ: frame.gyroZ ?? 0,
              servoRollAngle: frame.servoRollAngle ?? 0,
              servoYawAngle: frame.servoYawAngle ?? 0,
              diskRollRPM: frame.diskRollRPM ?? 0,
              diskYawRPM: frame.diskYawRPM ?? 0,
            };
            this.ignoredCallbacks.forEach((callback) => {
              try {
                callback(ignoredFrame);
              } catch (error) {
                console.error('[HTTP] Error in ignored callback:', error);
              }
            });
            return;
          }
          this.lastFrameT = frame.t;

          const telemetryFrame: TelemetryFrame = {
            t: frame.t,
            roll: frame.roll ?? 0,
            pitch: frame.pitch ?? 0,
            yaw: frame.yaw ?? 0,
            gyroX: frame.gyroX ?? 0,
            gyroY: frame.gyroY ?? 0,
            gyroZ: frame.gyroZ ?? 0,
            servoRollAngle: frame.servoRollAngle ?? 0,
            servoYawAngle: frame.servoYawAngle ?? 0,
            diskRollRPM: frame.diskRollRPM ?? 0,
            diskYawRPM: frame.diskYawRPM ?? 0,
          };

          // Add to buffer
          this.buffer.push(telemetryFrame);
          const maxBufferSize = 3000;
          if (this.buffer.length > maxBufferSize) {
            this.buffer.shift();
          }

          // Notify callbacks
          this.updateCallbacks.forEach((callback) => {
            try {
              callback(telemetryFrame);
            } catch (error) {
              console.error('[HTTP] Error in callback:', error);
            }
          });
        }
      } catch (error) {
        console.error('[HTTP] Polling error:', error);
      }
    };

    // Initial poll
    await poll();

    // Set up interval
    this.intervalId = setInterval(poll, this.pollingInterval);
  }

  disconnect(): void {
    this.isPolling = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async getInitialData(): Promise<TelemetryFrame[]> {
    return Promise.resolve([...this.buffer]);
  }

  onUpdate(callback: (frame: TelemetryFrame) => void): void {
    this.updateCallbacks.push(callback);
  }

  onIgnored(callback: (frame: TelemetryFrame) => void): void {
    this.ignoredCallbacks.push(callback);
  }

  removeUpdateListener(callback: (frame: TelemetryFrame) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  removeIgnoredListener(callback: (frame: TelemetryFrame) => void): void {
    const index = this.ignoredCallbacks.indexOf(callback);
    if (index > -1) {
      this.ignoredCallbacks.splice(index, 1);
    }
  }

  getConnectionStatus(): boolean {
    return this.isPolling;
  }

  clearBuffer(): void {
    this.buffer = [];
    this.lastFrameT = null;  // Reset so next frame is accepted
  }
}

