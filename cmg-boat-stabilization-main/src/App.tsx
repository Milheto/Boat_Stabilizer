import { useState, useEffect, useMemo, useRef } from 'react';
import { Boat3DView } from './components/Boat3DView';
import { TelemetryPanel } from './components/TelemetryPanel';
import { ServoPanel } from './components/ServoPanel';
import { TimeSeriesPlots } from './components/TimeSeriesPlots';
import { PlaybackControls } from './components/PlaybackControls';
import { AttitudeControls } from './components/AttitudeControls';
import { TelemetryLog } from './components/TelemetryLog';
import { TelemetryFrame } from './types/telemetry';
import { MockTelemetrySource } from './data/telemetrySource';
import { mockTelemetry } from './data/mockTelemetry';
import { CMGSimulation } from './simulation/cmgSimulation';
import { HTTPTelemetrySource } from './data/httpTelemetrySource';
// import { HTTPTelemetrySource } from './data/httpTelemetrySource';

type Mode = 'playback' | 'simulation' | 'realtime';

/**
 * Main App component
 * 
 * Supports two modes (from spec):
 * 1. PLAYBACK MODE: plays pre-recorded mockTelemetry data
 * 2. SIMULATION MODE: runs real-time PID-based boat dynamics simulation
 */
function App() {
  const [mode, setMode] = useState<Mode>('playback');
  const [telemetry, setTelemetry] = useState<TelemetryFrame[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // For simulation mode
  const [currentFrame, setCurrentFrame] = useState<TelemetryFrame | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // For realtime mode (HTTP polling via backend)
  const [httpSource, setHttpSource] = useState<HTTPTelemetrySource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [ignoredFrames, setIgnoredFrames] = useState<TelemetryFrame[]>([]);  // Track ignored frames
  const [apiConfig, setApiConfig] = useState({
    apiUrl: 'http://localhost:3001/api',
    pollingInterval: 50, // 50ms = 20 Hz (more fluid)
    useLocalTime: false, // Override timestamp with local time
  });
  const startTimeRef = useRef<number>(0);

  // Refs for playback animation
  const playbackAnimationRef = useRef<number | null>(null);
  const playbackLastTimeRef = useRef<number>(0);

  // Refs for simulation
  const simulationRef = useRef<CMGSimulation | null>(null);
  const simulationTelemetryBufferRef = useRef<TelemetryFrame[]>([]);
  const simulationAnimationRef = useRef<number | null>(null);
  const maxBufferSize = 3000; // ~30 seconds at 100 Hz (10ms intervals)

  // Initialize data source and load telemetry (for playback mode)
  useEffect(() => {
    if (mode === 'playback') {
      const source = new MockTelemetrySource(mockTelemetry);
      source.getInitialData().then((data) => {
        setTelemetry(data);
        setCurrentTime(0);
      });
    }
  }, [mode]);

  // Initialize simulation (for simulation mode)
  useEffect(() => {
    if (mode === 'simulation') {
      // Create new simulation instance
      simulationRef.current = new CMGSimulation({
        roll: 5,  // Start with small initial roll
        yaw: 3,   // Start with small initial yaw
      });
      
      // Initialize telemetry buffer with the first frame
      const initialFrame = simulationRef.current.toTelemetryFrame();
      simulationTelemetryBufferRef.current = [initialFrame];
      
      // Set initial state
      setCurrentFrame(initialFrame);
      setCurrentTime(initialFrame.t);
      setTelemetry([initialFrame]);
      
      // Reset playing state when switching to simulation
      setIsPlaying(false);
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== 'realtime') {
      if (httpSource) {
        httpSource.disconnect();
        setHttpSource(null);
        setIsConnected(false);
        setConnectionError(null);
      }
      return;
    }

    const source = new HTTPTelemetrySource(
      apiConfig.apiUrl,
      apiConfig.pollingInterval
    );

    let isMounted = true;

    source.connect()
      .then(() => {
        if (!isMounted) {
          source.disconnect();
          return;
        }

        setHttpSource(source);
        setIsConnected(true);
        setConnectionError(null);
        
        source.onUpdate?.((originalFrame: TelemetryFrame) => {
          if (!isMounted) return;

          // Handle timestamp override
          let frame = originalFrame;
          if (apiConfig.useLocalTime) {
            if (startTimeRef.current === 0) {
              startTimeRef.current = Date.now();
            }
            const t = (Date.now() - startTimeRef.current) / 1000;
            frame = { ...originalFrame, t };
          } else {
            // If switching back, reset start time
            startTimeRef.current = 0;
          }

          setTelemetry(prev => {
            const newData = [...prev, frame];
            if (newData.length > maxBufferSize) {
              return newData.slice(-maxBufferSize);
            }
            return newData;
          });
          
          setCurrentFrame(frame);
          setCurrentTime(frame.t);
        });

        // Track ignored frames
        source.onIgnored?.((frame: TelemetryFrame) => {
          if (!isMounted) return;
          setIgnoredFrames(prev => {
            const newData = [...prev, frame];
            if (newData.length > 100) {
              return newData.slice(-100);
            }
            return newData;
          });
        });
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        console.error('[App] HTTP connection failed:', error);
        setIsConnected(false);
        setConnectionError(error.message || 'Connection failed');
      });

    return () => {
      isMounted = false;
      source.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, apiConfig.apiUrl, apiConfig.pollingInterval, apiConfig.useLocalTime]);

  // Playback animation loop (ONLY in playback mode)
  useEffect(() => {
    if (mode !== 'playback' || telemetry.length === 0) {
      // Clean up if not in playback mode
      if (playbackAnimationRef.current !== null) {
        cancelAnimationFrame(playbackAnimationRef.current);
        playbackAnimationRef.current = null;
      }
      return;
    }

    if (!isPlaying) {
      // Pause: stop animation but don't reset
      if (playbackAnimationRef.current !== null) {
        cancelAnimationFrame(playbackAnimationRef.current);
        playbackAnimationRef.current = null;
      }
      return;
    }

    const duration = telemetry[telemetry.length - 1].t;
    
    // Store current time as starting point
    playbackLastTimeRef.current = currentTime;
    let lastTimestamp = performance.now();

    const animate = (timestamp: number) => {
      // Check if we should continue - re-read from state
      if (!isPlaying || mode !== 'playback') {
        if (playbackAnimationRef.current !== null) {
          cancelAnimationFrame(playbackAnimationRef.current);
          playbackAnimationRef.current = null;
        }
        return;
      }

      // Calculate elapsed time in seconds
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const deltaSeconds = deltaMs / 1000;

      // Update current time
      const newTime = playbackLastTimeRef.current + deltaSeconds;
      playbackLastTimeRef.current = newTime;

      if (newTime >= duration) {
        // End of playback
        setCurrentTime(duration);
        setIsPlaying(false);
        return;
      }

      setCurrentTime(newTime);
      playbackAnimationRef.current = requestAnimationFrame(animate);
    };

    playbackAnimationRef.current = requestAnimationFrame(animate);

    return () => {
      if (playbackAnimationRef.current !== null) {
        cancelAnimationFrame(playbackAnimationRef.current);
        playbackAnimationRef.current = null;
      }
    };
  }, [isPlaying, mode, telemetry.length, currentTime]);

  // Simulation loop (ONLY in simulation mode, and only if not in manual mode)
  // Runs at 100 Hz (10ms intervals) to add points every 10ms
  useEffect(() => {
    if (mode !== 'simulation' || !isPlaying || !simulationRef.current || manualMode) {
      // Clean up animation if not running
      if (simulationAnimationRef.current !== null) {
        cancelAnimationFrame(simulationAnimationRef.current);
        simulationAnimationRef.current = null;
      }
      return;
    }

    const dt = 0.01; // 10ms = 100 Hz 
    const dtMs = dt * 1000; // 10ms in milliseconds
    let lastTime = performance.now();
    let accumulatedTime = 0;

    const simulate = (timestamp: number) => {
      // Check if we should continue
      if (!isPlaying || !simulationRef.current || mode !== 'simulation' || manualMode) {
        if (simulationAnimationRef.current !== null) {
          cancelAnimationFrame(simulationAnimationRef.current);
          simulationAnimationRef.current = null;
        }
        return;
      }

      const elapsed = timestamp - lastTime;
      lastTime = timestamp;
      accumulatedTime += elapsed;

      // Run multiple simulation steps if needed to catch up
      // This ensures we maintain 100 Hz even if the browser is slow
      while (accumulatedTime >= dtMs) {
        // Step simulation forward by dt (10ms)
        simulationRef.current.step(dt);

        // Get new telemetry frame
        const frame = simulationRef.current.toTelemetryFrame();
        
        // Update current frame and time
        setCurrentFrame(frame);
        setCurrentTime(frame.t);

        // Add to buffer for charts (this is the real-time point addition)
        simulationTelemetryBufferRef.current.push(frame);
        
        // Keep buffer size limited to prevent memory issues
        if (simulationTelemetryBufferRef.current.length > maxBufferSize) {
          simulationTelemetryBufferRef.current.shift();
        }

        accumulatedTime -= dtMs;
      }

      // Update telemetry state for charts (this triggers re-render with new data)
      // We update the state with a copy of the buffer so React detects the change
      setTelemetry([...simulationTelemetryBufferRef.current]);

      // Continue animation loop
      simulationAnimationRef.current = requestAnimationFrame(simulate);
    };

    // Start the simulation loop
    simulationAnimationRef.current = requestAnimationFrame(simulate);

    // Cleanup on unmount or when stopping
    return () => {
      if (simulationAnimationRef.current !== null) {
        cancelAnimationFrame(simulationAnimationRef.current);
        simulationAnimationRef.current = null;
      }
    };
  }, [isPlaying, mode, manualMode, maxBufferSize]);

  // Handle manual attitude changes (for testing)
  const handleAttitudeChange = (roll: number, pitch: number, yaw: number) => {
    if (simulationRef.current) {
      simulationRef.current.setAttitude(roll, pitch, yaw);
      const frame = simulationRef.current.toTelemetryFrame();
      setCurrentFrame(frame);
      setCurrentTime(frame.t);
    }
  };

  // Find closest frame to current time (for playback mode)
  const playbackFrame = useMemo(() => {
    if (mode !== 'playback' || telemetry.length === 0) {
      return null;
    }

    // Binary search or simple linear search for closest frame
    let closest = telemetry[0];
    let minDiff = Math.abs(telemetry[0].t - currentTime);

    for (const frame of telemetry) {
      const diff = Math.abs(frame.t - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = frame;
      }
    }
    return closest;
  }, [telemetry, currentTime, mode]);

  // Default empty frame (for when connected but no data yet)
  const emptyFrame: TelemetryFrame = {
    t: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    gyroX: 0,
    gyroY: 0,
    gyroZ: 0,
    servoRollAngle: 0,
    servoYawAngle: 0,
    diskRollRPM: 0,
    diskYawRPM: 0,
  };

  // Select the frame to display based on mode
  // In realtime mode, use empty frame if connected but no data yet
  const rawDisplayFrame = mode === 'simulation' || mode === 'realtime' ? currentFrame : playbackFrame;
  const displayFrame = rawDisplayFrame ?? (mode === 'realtime' && isConnected ? emptyFrame : null);

  // Calculate duration
  const duration = telemetry.length > 0 ? telemetry[telemetry.length - 1].t : 0;

  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle seek (playback mode only)
  const handleSeek = (time: number) => {
    if (mode === 'playback') {
      setCurrentTime(time);
      playbackLastTimeRef.current = time;
      // Don't auto-pause on seek
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setIsPlaying(false);
    
    if (playbackAnimationRef.current !== null) {
      cancelAnimationFrame(playbackAnimationRef.current);
      playbackAnimationRef.current = null;
    }

    setMode(newMode);
    
    if (newMode === 'simulation') {
      if (simulationRef.current) {
        simulationRef.current.reset({
          roll: 5,
          yaw: 3,
        });
      }
      setCurrentTime(0);
    } else if (newMode === 'playback') {
      setCurrentTime(0);
      playbackLastTimeRef.current = 0;
    } else if (newMode === 'realtime') {
      setTelemetry([]);
      setIgnoredFrames([]);
      setCurrentTime(0);
    }
  };

  // Clear telemetry data (for realtime mode)
  const handleClearTelemetry = () => {
    setTelemetry([]);
    setIgnoredFrames([]);
    setCurrentTime(0);
    if (httpSource) {
      httpSource.clearBuffer();
    }
  };

  // Loading state (only shows for playback/simulation before first frame)
  if (!displayFrame) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-gray-300 text-lg">
          {mode === 'playback' ? 'Loading playback data...' : 'Initializing...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Boat CMG Stabilizer</h1>
            <p className="text-xs text-gray-400 mt-1">
              Control Moment Gyro Visualization & Simulation
            </p>
          </div>
          
          {/* Mode selector */}
          <div className="flex gap-2">
            <button
              onClick={() => handleModeChange('playback')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'playback'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📼 Playback
            </button>
            <button
              onClick={() => handleModeChange('simulation')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'simulation'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🎮 Simulation
            </button>
            <button
              onClick={() => handleModeChange('realtime')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                mode === 'realtime'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📡 Realtime
            </button>
          </div>
        </div>
      </header>

      {/* MQTT Connection Status and Configuration (for realtime mode) */}
      {mode === 'realtime' && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span className="text-sm font-medium text-gray-300">
                  {isConnected ? 'Connected to Backend API' : connectionError || 'Disconnected'}
                </span>
              </div>
              {isConnected && httpSource && (
                <div className="flex gap-2">
                  <button
                    onClick={handleClearTelemetry}
                    className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                  >
                    🗑️ Clear Graph
                  </button>
                  <button
                    onClick={() => {
                      httpSource.disconnect();
                      setHttpSource(null);
                      setIsConnected(false);
                    }}
                    className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
            
            {!isConnected && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Backend API URL</label>
                    <input
                      type="text"
                      value={apiConfig.apiUrl}
                      onChange={(e) => setApiConfig({ ...apiConfig, apiUrl: e.target.value })}
                      placeholder="http://localhost:3001/api"
                      className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Polling Interval (ms)</label>
                    <input
                      type="number"
                      value={apiConfig.pollingInterval}
                      onChange={(e) => setApiConfig({ ...apiConfig, pollingInterval: parseInt(e.target.value) || 100 })}
                      placeholder="100"
                      className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="flex items-center mt-2">
                  <input
                    id="useLocalTime"
                    type="checkbox"
                    checked={apiConfig.useLocalTime}
                    onChange={(e) => setApiConfig({ ...apiConfig, useLocalTime: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"
                  />
                  <label htmlFor="useLocalTime" className="ml-2 text-sm text-gray-300">
                    Use Local Time (Fix for static Arduino timestamp)
                  </label>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mt-2">
                  <p>💡 <strong>HTTP Polling:</strong> Frontend faz polling HTTP no backend, que conecta ao MQTT via TCP</p>
                  <p>📡 Backend conecta ao MQTT broker: <code className="bg-gray-900 px-1 rounded">mqtt://mqtt.janks.dev.br:1883</code></p>
                  <p>🔄 Polling: <code className="bg-gray-900 px-1 rounded">{apiConfig.pollingInterval}ms</code> (~{Math.round(1000/apiConfig.pollingInterval)} Hz)</p>
                  <p>⚠️ Certifique-se de que o servidor backend está rodando: <code className="bg-gray-900 px-1 rounded">npm run server</code></p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 3D view and telemetry panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="h-[500px]">
            <Boat3DView frame={displayFrame} />
          </div>

          <div className="space-y-4">
            <TelemetryPanel frame={displayFrame} />
            <ServoPanel frame={displayFrame} />
            {mode === 'simulation' && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="manualMode"
                    checked={manualMode}
                    onChange={(e) => {
                      setManualMode(e.target.checked);
                      setIsPlaying(false);
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="manualMode" className="text-sm font-medium text-gray-300">
                    Manual Attitude Control
                  </label>
                </div>
                {manualMode && (
                  <AttitudeControls
                    onAttitudeChange={handleAttitudeChange}
                    currentRoll={displayFrame.roll}
                    currentPitch={displayFrame.pitch}
                    currentYaw={displayFrame.yaw}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Time series plots */}
        <div className="mb-6">
          <TimeSeriesPlots data={telemetry} currentTime={currentTime} />
        </div>

        {/* Telemetry Log */}
        <div className="mb-6">
          <TelemetryLog data={telemetry} ignoredData={ignoredFrames} maxRows={100} />
        </div>

        {/* Playback controls */}
        <div>
          <PlaybackControls
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
          />
        </div>
      </main>
    </div>
  );
}

export default App;

