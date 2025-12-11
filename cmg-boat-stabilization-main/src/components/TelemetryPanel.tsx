import { TelemetryFrame } from '../types/telemetry';

interface TelemetryPanelProps {
  frame: TelemetryFrame;
}

/**
 * TelemetryPanel displays the current IMU telemetry values:
 * - Roll, Pitch, Yaw (attitude angles)
 * - GyroX, GyroY, GyroZ (angular rates)
 */
export function TelemetryPanel({ frame }: TelemetryPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-100">IMU Telemetry</h2>
      
      <div className="space-y-3">
        {/* Attitude angles */}
        <div className="border-b border-gray-700 pb-3">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Attitude</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-400">Roll</div>
              <div className="text-lg font-mono font-semibold text-blue-400">
                {frame.roll.toFixed(1)}°
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Pitch</div>
              <div className="text-lg font-mono font-semibold text-green-400">
                {frame.pitch.toFixed(1)}°
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Yaw</div>
              <div className="text-lg font-mono font-semibold text-purple-400">
                {frame.yaw.toFixed(1)}°
              </div>
            </div>
          </div>
        </div>

        {/* Gyro rates */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Gyro Rates</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-gray-400">Gyro X</div>
              <div className="text-lg font-mono text-gray-200">
                {frame.gyroX.toFixed(1)}°/s
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Gyro Y</div>
              <div className="text-lg font-mono text-gray-200">
                {frame.gyroY.toFixed(1)}°/s
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Gyro Z</div>
              <div className="text-lg font-mono text-gray-200">
                {frame.gyroZ.toFixed(1)}°/s
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

