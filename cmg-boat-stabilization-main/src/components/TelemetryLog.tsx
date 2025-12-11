import { useEffect, useRef } from 'react';
import { TelemetryFrame } from '../types/telemetry';

interface LogEntry {
  frame: TelemetryFrame;
  ignored: boolean;
}

interface TelemetryLogProps {
  data: TelemetryFrame[];
  ignoredData?: TelemetryFrame[];
  maxRows?: number;
}

export function TelemetryLog({ data, ignoredData = [], maxRows = 50 }: TelemetryLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Combine and sort all entries by timestamp
  const allEntries: LogEntry[] = [
    ...data.map(frame => ({ frame, ignored: false })),
    ...ignoredData.map(frame => ({ frame, ignored: true })),
  ].sort((a, b) => a.frame.t - b.frame.t);

  // Auto-scroll to bottom when new data arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data, ignoredData]);

  // Show only the last N rows
  const displayData = allEntries.slice(-maxRows);

  const ignoredCount = ignoredData.length;

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-100">Telemetry Log</h2>
        {ignoredCount > 0 && (
          <span className="text-xs bg-red-600/30 text-red-300 px-2 py-1 rounded">
            ⚠️ {ignoredCount} ignored
          </span>
        )}
      </div>
      
      <div 
        ref={scrollRef}
        className="overflow-x-auto overflow-y-auto max-h-64 rounded bg-gray-900 border border-gray-700"
      >
        <table className="w-full text-xs text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
            <tr>
              <th className="px-2 py-2 w-8">St</th>
              <th className="px-3 py-2">Time (s)</th>
              <th className="px-3 py-2">Roll (°)</th>
              <th className="px-3 py-2">Pitch (°)</th>
              <th className="px-3 py-2">Yaw (°)</th>
              <th className="px-3 py-2">Gyro X</th>
              <th className="px-3 py-2">Gyro Y</th>
              <th className="px-3 py-2">Gyro Z</th>
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  No telemetry data received yet.
                </td>
              </tr>
            ) : (
              displayData.map((entry, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-gray-800 ${
                    entry.ignored 
                      ? 'bg-red-900/20 text-red-300/70 line-through' 
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <td className="px-2 py-1 text-center">
                    {entry.ignored ? (
                      <span title="Ignored (old timestamp)">❌</span>
                    ) : (
                      <span title="OK">✓</span>
                    )}
                  </td>
                  <td className="px-3 py-1 font-mono">{entry.frame.t.toFixed(3)}</td>
                  <td className={`px-3 py-1 font-mono ${entry.ignored ? '' : 'text-blue-400'}`}>
                    {entry.frame.roll.toFixed(2)}
                  </td>
                  <td className="px-3 py-1 font-mono">{entry.frame.pitch.toFixed(2)}</td>
                  <td className={`px-3 py-1 font-mono ${entry.ignored ? '' : 'text-purple-400'}`}>
                    {entry.frame.yaw.toFixed(2)}
                  </td>
                  <td className="px-3 py-1 font-mono">{entry.frame.gyroX.toFixed(2)}</td>
                  <td className="px-3 py-1 font-mono">{entry.frame.gyroY.toFixed(2)}</td>
                  <td className="px-3 py-1 font-mono">{entry.frame.gyroZ.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>Showing last {Math.min(allEntries.length, maxRows)} frames</span>
        <span>
          Total: {data.length} accepted
          {ignoredCount > 0 && <span className="text-red-400 ml-2">/ {ignoredCount} ignored</span>}
        </span>
      </div>
    </div>
  );
}
