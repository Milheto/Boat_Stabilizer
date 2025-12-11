import { useState, useEffect } from 'react';

interface AttitudeControlsProps {
  onAttitudeChange: (roll: number, pitch: number, yaw: number) => void;
  currentRoll: number;
  currentPitch: number;
  currentYaw: number;
}

/**
 * AttitudeControls - Manual input controls for boat attitude (roll, pitch, yaw)
 * Used in simulation mode for testing and verification
 */
export function AttitudeControls({
  onAttitudeChange,
  currentRoll,
  currentPitch,
  currentYaw,
}: AttitudeControlsProps) {
  const [roll, setRoll] = useState(currentRoll);
  const [pitch, setPitch] = useState(currentPitch);
  const [yaw, setYaw] = useState(currentYaw);

  // Sync with current values when they change externally
  useEffect(() => {
    setRoll(currentRoll);
    setPitch(currentPitch);
    setYaw(currentYaw);
  }, [currentRoll, currentPitch, currentYaw]);

  const handleRollChange = (value: number) => {
    setRoll(value);
    onAttitudeChange(value, pitch, yaw);
  };

  const handlePitchChange = (value: number) => {
    setPitch(value);
    onAttitudeChange(roll, value, yaw);
  };

  const handleYawChange = (value: number) => {
    setYaw(value);
    onAttitudeChange(roll, pitch, value);
  };

  const handleReset = () => {
    setRoll(0);
    setPitch(0);
    setYaw(0);
    onAttitudeChange(0, 0, 0);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Manual Attitude Controls</h3>
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md transition-colors"
        >
          Reset to 0°
        </button>
      </div>

      <div className="space-y-4">
        {/* Roll Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-red-400">
              🔴 Roll (X-axis)
            </label>
            <span className="text-sm font-mono text-gray-300">
              {roll.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-45"
              max="45"
              step="0.5"
              value={roll}
              onChange={(e) => handleRollChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <input
              type="number"
              min="-45"
              max="45"
              step="0.5"
              value={roll}
              onChange={(e) => handleRollChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-center text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Pitch Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-green-400">
              🟢 Pitch (Y-axis)
            </label>
            <span className="text-sm font-mono text-gray-300">
              {pitch.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-45"
              max="45"
              step="0.5"
              value={pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
            <input
              type="number"
              min="-45"
              max="45"
              step="0.5"
              value={pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-center text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Yaw Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-blue-400">
              🔵 Yaw (Z-axis)
            </label>
            <span className="text-sm font-mono text-gray-300">
              {yaw.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={yaw}
              onChange={(e) => handleYawChange(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <input
              type="number"
              min="-180"
              max="180"
              step="1"
              value={yaw}
              onChange={(e) => handleYawChange(parseFloat(e.target.value) || 0)}
              className="w-20 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded-md text-center text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          Use these controls to manually set the boat's attitude and verify the 3D visualization is working correctly.
        </p>
      </div>
    </div>
  );
}

