import { TelemetryFrame } from '../types/telemetry';

interface ServoPanelProps {
  frame: TelemetryFrame;
}

/**
 * ServoPanel displays the control system values:
 * - Servo angles (gimbal positions)
 * - Disk RPMs (spinning disk speeds)
 */
export function ServoPanel({ frame }: ServoPanelProps) {
  const maxRPM = 3500; // Maximum RPM for bar visualization

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-100">Control System</h2>
      
      <div className="space-y-4">
        {/* Servo angles */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Servo Angles</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400">Roll Servo</div>
              <div className="text-xl font-mono font-semibold text-orange-400">
                {frame.servoRollAngle.toFixed(1)}°
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Yaw Servo</div>
              <div className="text-xl font-mono font-semibold text-indigo-400">
                {frame.servoYawAngle.toFixed(1)}°
              </div>
            </div>
          </div>
        </div>

        {/* Disk RPMs */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Disk RPM</h3>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Roll Disk</span>
                <span className="font-mono text-gray-300">{frame.diskRollRPM.toFixed(0)} RPM</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (frame.diskRollRPM / maxRPM) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Yaw Disk</span>
                <span className="font-mono text-gray-300">{frame.diskYawRPM.toFixed(0)} RPM</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (frame.diskYawRPM / maxRPM) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

