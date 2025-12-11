import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from 'recharts';
import { TelemetryFrame } from '../types/telemetry';

interface TimeSeriesPlotsProps {
  data: TelemetryFrame[];
  currentTime: number;
}

/**
 * TimeSeriesPlots displays time-series graphs for:
 * - Roll and Yaw angles over time
 * - Servo angles over time
 * 
 * Includes a vertical reference line at the current playback time.
 */
export function TimeSeriesPlots({ data, currentTime }: TimeSeriesPlotsProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-100">Time Series</h2>
      
      <div className="space-y-6">
        {/* Roll and Yaw plot */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Attitude Angles</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis 
                dataKey="t" 
                type="number"
                domain={['dataMin', 'dataMax']}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                label={{ value: 'Angle (°)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#f3f4f6' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line 
                type="linear" 
                dataKey="roll" 
                stroke="#60a5fa" 
                strokeWidth={2}
                dot={false}
                name="Roll"
                isAnimationActive={false}
              />
              <Line 
                type="linear" 
                dataKey="yaw" 
                stroke="#a78bfa" 
                strokeWidth={2}
                dot={false}
                name="Yaw"
                isAnimationActive={false}
              />
              <ReferenceLine 
                x={currentTime} 
                stroke="#f87171" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'Current', position: 'top', fill: '#f87171' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Servo angles plot */}
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Servo Angles</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
              <XAxis 
                dataKey="t" 
                type="number"
                domain={['dataMin', 'dataMax']}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                label={{ value: 'Angle (°)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#f3f4f6' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line 
                type="linear" 
                dataKey="servoRollAngle" 
                stroke="#fb923c" 
                strokeWidth={2}
                dot={false}
                name="Roll Servo"
                isAnimationActive={false}
              />
              <Line 
                type="linear" 
                dataKey="servoYawAngle" 
                stroke="#818cf8" 
                strokeWidth={2}
                dot={false}
                name="Yaw Servo"
                isAnimationActive={false}
              />
              <ReferenceLine 
                x={currentTime} 
                stroke="#f87171" 
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{ value: 'Current', position: 'top', fill: '#f87171' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

