interface PlaybackControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
}

/**
 * PlaybackControls provides play/pause and time scrubbing controls
 * for the telemetry playback.
 */
export function PlaybackControls({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
}: PlaybackControlsProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek(newTime);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 border border-gray-700">
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={onPlayPause}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        {/* Time slider */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`,
            }}
          />
        </div>

        {/* Time display */}
        <div className="text-sm font-mono text-gray-200 min-w-[100px] text-right">
          t = {currentTime.toFixed(2)} s
        </div>

        {/* Duration display */}
        <div className="text-xs text-gray-400 font-mono">
          / {duration.toFixed(2)} s
        </div>
      </div>
    </div>
  );
}

