/**
 * TelemetryFrame represents a single frame of telemetry data from the boat's IMU and control systems.
 * 
 * All angles are in degrees.
 * Gyro rates are in degrees per second.
 * Disk RPMs are in revolutions per minute.
 */
export type TelemetryFrame = {
  t: number;          // time in seconds
  roll: number;       // deg
  pitch: number;      // deg
  yaw: number;        // deg
  gyroX: number;      // deg/s
  gyroY: number;      // deg/s
  gyroZ: number;      // deg/s
  servoRollAngle: number; // deg - gimbal angle for roll CMG
  servoYawAngle: number;  // deg - gimbal angle for yaw CMG
  diskRollRPM: number;    // RPM of disk responsible for roll
  diskYawRPM: number;     // RPM of disk responsible for yaw
};

