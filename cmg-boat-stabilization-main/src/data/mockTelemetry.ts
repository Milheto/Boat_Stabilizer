import { TelemetryFrame } from '../types/telemetry';

/**
 * Generates synthetic telemetry data simulating boat motion and control system responses.
 * 
 * Simulates:
 * - Small oscillations in roll and yaw (sinusoids with different frequencies)
 * - Servo commands acting against the motion (proportional control)
 * - Disk RPMs as almost constant with small noise
 */
export function generateMockTelemetry(durationSeconds: number = 30, sampleRateHz: number = 10): TelemetryFrame[] {
  const frames: TelemetryFrame[] = [];
  const dt = 1 / sampleRateHz;
  const numSamples = Math.floor(durationSeconds * sampleRateHz);

  // Base RPM values
  const baseRollRPM = 3000;
  const baseYawRPM = 3000;

  for (let i = 0; i < numSamples; i++) {
    const t = i * dt;

    // Simulate roll oscillation (period ~4 seconds)
    const rollAmplitude = 5; // degrees
    const rollFreq = 0.25; // Hz
    const roll = rollAmplitude * Math.sin(2 * Math.PI * rollFreq * t);

    // Simulate yaw oscillation (period ~6 seconds)
    const yawAmplitude = 3; // degrees
    const yawFreq = 0.167; // Hz
    const yaw = yawAmplitude * Math.sin(2 * Math.PI * yawFreq * t + Math.PI / 4);

    // Pitch is mostly stable with small noise
    const pitch = 0.5 * Math.sin(2 * Math.PI * 0.1 * t) + (Math.random() - 0.5) * 0.5;

    // Gyro rates (derivatives of angles + noise)
    const gyroX = 2 * Math.PI * rollFreq * rollAmplitude * Math.cos(2 * Math.PI * rollFreq * t) + (Math.random() - 0.5) * 2;
    const gyroY = 2 * Math.PI * 0.1 * 0.5 * Math.cos(2 * Math.PI * 0.1 * t) + (Math.random() - 0.5) * 1;
    const gyroZ = 2 * Math.PI * yawFreq * yawAmplitude * Math.cos(2 * Math.PI * yawFreq * t + Math.PI / 4) + (Math.random() - 0.5) * 1.5;

    // Servo angles: proportional control acting against motion
    // Servos try to counteract the roll/yaw by moving in opposite direction
    const servoRollAngle = -roll * 0.8 + (Math.random() - 0.5) * 1; // deg
    const servoYawAngle = -yaw * 0.8 + (Math.random() - 0.5) * 1; // deg

    // Disk RPMs: almost constant with small noise
    const diskRollRPM = baseRollRPM + (Math.random() - 0.5) * 50;
    const diskYawRPM = baseYawRPM + (Math.random() - 0.5) * 50;

    frames.push({
      t,
      roll,
      pitch,
      yaw,
      gyroX,
      gyroY,
      gyroZ,
      servoRollAngle,
      servoYawAngle,
      diskRollRPM,
      diskYawRPM,
    });
  }

  return frames;
}

// Export a default dataset (30 seconds at 10 Hz)
export const mockTelemetry: TelemetryFrame[] = generateMockTelemetry(30, 10);

