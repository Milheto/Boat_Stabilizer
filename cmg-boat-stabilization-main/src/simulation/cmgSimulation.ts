import { TelemetryFrame } from '../types/telemetry';
import { PID, createPID, computePID, resetPID } from './pid';

/**
 * BoatState represents the internal state of the boat simulation.
 */
export type BoatState = {
  t: number;              // time (s)
  roll: number;           // deg
  rollRate: number;       // deg/s
  pitch: number;          // deg (for manual control/testing)
  yaw: number;            // deg
  yawRate: number;        // deg/s
  servoRollAngle: number; // deg - gimbal angle for roll CMG
  servoYawAngle: number;  // deg - gimbal angle for yaw CMG
  diskRollRPM: number;   // RPM - flywheel speed for roll CMG
  diskYawRPM: number;     // RPM - flywheel speed for yaw CMG
};

/**
 * Simulation configuration parameters.
 * These can be tuned to adjust the behavior of the simulation.
 */
export type SimulationConfig = {
  // Dynamics parameters
  rollDamping: number;      // cR - damping coefficient for roll
  rollStiffness: number;    // kR - stiffness coefficient for roll
  yawDamping: number;       // cY - damping coefficient for yaw
  yawStiffness: number;     // kY - stiffness coefficient for yaw
  
  // Control effectiveness (torque per unit gimbal angle)
  rollControlGain: number;  // How much torque per deg of servoRollAngle
  yawControlGain: number;   // How much torque per deg of servoYawAngle
  
  // PID parameters for roll control
  rollPID: {
    kp: number;
    ki: number;
    kd: number;
  };
  
  // PID parameters for yaw control
  yawPID: {
    kp: number;
    ki: number;
    kd: number;
  };
  
  // Servo limits
  servoAngleMin: number;    // deg
  servoAngleMax: number;    // deg
  
  // Disk RPM
  baseRPM: number;          // Base RPM for both disks
  rpmNoise: number;         // RPM noise amplitude
};

/**
 * Default simulation configuration.
 * These values produce plausible boat dynamics with PID control.
 */
export const DEFAULT_CONFIG: SimulationConfig = {
  rollDamping: 0.5,         // Moderate damping
  rollStiffness: 0.1,       // Low stiffness (boat tends to oscillate)
  yawDamping: 0.4,
  yawStiffness: 0.08,
  rollControlGain: 0.3,     // Control torque per degree of gimbal angle (increased for more sensitivity)
  yawControlGain: 0.25,     // Control torque per degree of gimbal angle (increased for more sensitivity)
  rollPID: {
    kp: 4.0,                // Proportional gain (increased for faster response)
    ki: 1.0,                // Integral gain (increased for better steady-state)
    kd: 2.5,                // Derivative gain (increased for better damping)
  },
  yawPID: {
    kp: 3.5,                // Proportional gain (increased for faster response)
    ki: 0.8,                // Integral gain (increased for better steady-state)
    kd: 2.0,                // Derivative gain (increased for better damping)
  },
  servoAngleMin: -30,       // deg - maximum gimbal deflection
  servoAngleMax: 30,
  baseRPM: 6000,           // RPM - flywheel speed
  rpmNoise: 50,            // RPM - noise amplitude
};

/**
 * CMGSimulation manages the boat dynamics simulation with PID control.
 */
export class CMGSimulation {
  private state: BoatState;
  private config: SimulationConfig;
  private rollPID: PID;
  private yawPID: PID;

  constructor(initialState?: Partial<BoatState>, config?: Partial<SimulationConfig>) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize state
    this.state = {
      t: 0,
      roll: 0,
      rollRate: 0,
      pitch: 0,
      yaw: 0,
      yawRate: 0,
      servoRollAngle: 0,
      servoYawAngle: 0,
      diskRollRPM: this.config.baseRPM,
      diskYawRPM: this.config.baseRPM,
      ...initialState,
    };

    // Initialize PID controllers
    this.rollPID = createPID(
      this.config.rollPID.kp,
      this.config.rollPID.ki,
      this.config.rollPID.kd,
      this.config.servoAngleMin,
      this.config.servoAngleMax
    );
    
    this.yawPID = createPID(
      this.config.yawPID.kp,
      this.config.yawPID.ki,
      this.config.yawPID.kd,
      this.config.servoAngleMin,
      this.config.servoAngleMax
    );
  }

  /**
   * Get current simulation state.
   */
  getState(): BoatState {
    return { ...this.state };
  }

  /**
   * Reset simulation to initial state.
   */
  reset(initialState?: Partial<BoatState>): void {
    this.state = {
      t: 0,
      roll: 0,
      rollRate: 0,
      pitch: 0,
      yaw: 0,
      yawRate: 0,
      servoRollAngle: 0,
      servoYawAngle: 0,
      diskRollRPM: this.config.baseRPM,
      diskYawRPM: this.config.baseRPM,
      ...initialState,
    };
    resetPID(this.rollPID);
    resetPID(this.yawPID);
  }

  /**
   * Manually set the boat attitude (roll, pitch, yaw).
   * This allows direct control for testing purposes.
   */
  setAttitude(roll: number, pitch: number, yaw: number): void {
    this.state.roll = roll;
    this.state.pitch = pitch;
    this.state.yaw = yaw;
    // Reset rates when manually setting attitude
    this.state.rollRate = 0;
    this.state.yawRate = 0;
  }

  /**
   * Compute disturbance forces (simulating waves).
   * Simple sinusoidal disturbances at different frequencies.
   */
  private computeDisturbances(t: number): { rollDisturbance: number; yawDisturbance: number } {
    // Roll disturbance: low frequency wave (period ~4 seconds)
    // Increased amplitude to make CMG compensation more visible
    const rollDisturbance = 3.0 * Math.sin(2 * Math.PI * 0.25 * t);
    
    // Yaw disturbance: slightly different frequency (period ~5 seconds)
    // Increased amplitude to make CMG compensation more visible
    const yawDisturbance = 2.5 * Math.sin(2 * Math.PI * 0.2 * t + Math.PI / 4);
    
    return { rollDisturbance, yawDisturbance };
  }

  /**
   * Step the simulation forward by dt seconds.
   * 
   * The simulation uses a simplified dynamic model:
   * - Roll: rollRate_dot = -cR * rollRate - kR * roll + uR + disturbanceR
   * - Yaw: yawRate_dot = -cY * yawRate - kY * yaw + uY + disturbanceY
   * 
   * Where uR and uY are control torques from CMGs, approximated as proportional
   * to the servo gimbal angles.
   */
  step(dt: number): BoatState {
    // Compute disturbances
    const { rollDisturbance, yawDisturbance } = this.computeDisturbances(this.state.t);

    // Compute PID control outputs (setpoint is 0 for stabilization)
    const servoRollAngle = computePID(this.rollPID, this.state.roll, 0, dt);
    const servoYawAngle = computePID(this.yawPID, this.state.yaw, 0, dt);

    // Compute control torques (simplified: proportional to gimbal angle)
    const rollControlTorque = this.config.rollControlGain * servoRollAngle;
    const yawControlTorque = this.config.yawControlGain * servoYawAngle;

    // Compute state derivatives
    // Roll dynamics: rollRate_dot = -cR * rollRate - kR * roll + uR + disturbanceR
    const rollRateDot = 
      -this.config.rollDamping * this.state.rollRate 
      - this.config.rollStiffness * this.state.roll 
      + rollControlTorque 
      + rollDisturbance;

    // Yaw dynamics: yawRate_dot = -cY * yawRate - kY * yaw + uY + disturbanceY
    const yawRateDot = 
      -this.config.yawDamping * this.state.yawRate 
      - this.config.yawStiffness * this.state.yaw 
      + yawControlTorque 
      + yawDisturbance;

    // Euler integration
    this.state.rollRate += rollRateDot * dt;
    this.state.roll += this.state.rollRate * dt;
    
    this.state.yawRate += yawRateDot * dt;
    this.state.yaw += this.state.yawRate * dt;

    // Update servo angles
    this.state.servoRollAngle = servoRollAngle;
    this.state.servoYawAngle = servoYawAngle;

    // Update disk RPMs (nearly constant with small noise)
    this.state.diskRollRPM = this.config.baseRPM + (Math.random() - 0.5) * this.config.rpmNoise;
    this.state.diskYawRPM = this.config.baseRPM + (Math.random() - 0.5) * this.config.rpmNoise;

    // Update time
    this.state.t += dt;

    return this.getState();
  }

  /**
   * Convert current BoatState to TelemetryFrame format.
   * This includes computing gyro rates from the state.
   */
  toTelemetryFrame(): TelemetryFrame {
    return {
      t: this.state.t,
      roll: this.state.roll,
      pitch: this.state.pitch,
      yaw: this.state.yaw,
      gyroX: this.state.rollRate,  // Roll rate around X axis
      gyroY: 0,                    // Pitch rate around Y axis (not simulated)
      gyroZ: this.state.yawRate,   // Yaw rate around Z axis
      servoRollAngle: this.state.servoRollAngle,
      servoYawAngle: this.state.servoYawAngle,
      diskRollRPM: this.state.diskRollRPM,
      diskYawRPM: this.state.diskYawRPM,
    };
  }
}

