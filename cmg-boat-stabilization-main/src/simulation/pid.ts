/**
 * PID Controller implementation for boat stabilization.
 * 
 * Each PID controller (roll and yaw) computes a control output based on:
 * - Proportional term: error (setpoint - current value)
 * - Integral term: accumulated error over time
 * - Derivative term: rate of change of error
 */

export type PID = {
  kp: number;              // Proportional gain
  ki: number;              // Integral gain
  kd: number;              // Derivative gain
  integrator: number;      // Accumulated integral term
  prevError: number | null; // Previous error for derivative calculation
  outputMin: number;       // Minimum output limit
  outputMax: number;       // Maximum output limit
};

/**
 * Initialize a PID controller with given parameters.
 */
export function createPID(kp: number, ki: number, kd: number, outputMin: number, outputMax: number): PID {
  return {
    kp,
    ki,
    kd,
    integrator: 0,
    prevError: null,
    outputMin,
    outputMax,
  };
}

/**
 * Reset a PID controller (clear integrator and previous error).
 */
export function resetPID(pid: PID): void {
  pid.integrator = 0;
  pid.prevError = null;
}

/**
 * Compute PID output given current value, setpoint, and time delta.
 * 
 * @param pid - The PID controller state
 * @param currentValue - Current measured value
 * @param setpoint - Desired value (typically 0 for stabilization)
 * @param dt - Time step in seconds
 * @returns Control output (limited between outputMin and outputMax)
 */
export function computePID(pid: PID, currentValue: number, setpoint: number, dt: number): number {
  const error = setpoint - currentValue;

  // Proportional term
  const pTerm = pid.kp * error;

  // Integral term (with anti-windup: don't accumulate if output is saturated)
  pid.integrator += error * dt;
  // Simple anti-windup: limit integrator accumulation
  const maxIntegrator = Math.abs((pid.outputMax - pid.outputMin) / (pid.ki + 1e-6));
  pid.integrator = Math.max(-maxIntegrator, Math.min(maxIntegrator, pid.integrator));
  const iTerm = pid.ki * pid.integrator;

  // Derivative term
  let dTerm = 0;
  if (pid.prevError !== null) {
    const errorDerivative = (error - pid.prevError) / dt;
    dTerm = pid.kd * errorDerivative;
  }
  pid.prevError = error;

  // Compute output
  let output = pTerm + iTerm + dTerm;

  // Limit output
  output = Math.max(pid.outputMin, Math.min(pid.outputMax, output));

  return output;
}

