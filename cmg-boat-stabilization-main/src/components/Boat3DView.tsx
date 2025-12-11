import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Text } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import { Group } from 'three';
import { TelemetryFrame } from '../types/telemetry';
import { RollCmg3D } from './RollCmg3D';
import { YawCmg3D } from './YawCmg3D';
import { createBoatHullGeometry, createTrapezoidBench, BOAT_CONFIG } from './boatGeometry';

interface Boat3DViewProps {
  frame: TelemetryFrame;
}

/**
 * BoatMesh renders the boat and CMGs with proper coordinate system.
 * 
 * COORDINATE SYSTEM (boat frame - from spec section 1):
 * - +X = forward (stern to bow) → RED axis
 * - +Y = starboard (right when facing forward) → GREEN axis
 * - +Z = up (keel to sky) → BLUE axis
 * 
 * THREE.JS BOXGEOMETRY:
 * - args[0] = width (X axis in Three.js)
 * - args[1] = height (Y axis in Three.js - UP in default)
 * - args[2] = depth (Z axis in Three.js)
 * 
 * BUT we want:
 * - X = forward (length)
 * - Y = lateral (width)
 * - Z = up (height)
 * 
 * So we need: [length, width, height] = [X, Y, Z]
 */
function BoatMesh({ 
  roll, 
  pitch, 
  yaw, 
  servoRollAngle, 
  servoYawAngle, 
  diskRollRPM, 
  diskYawRPM 
}: { 
  roll: number; 
  pitch: number; 
  yaw: number;
  servoRollAngle: number;
  servoYawAngle: number;
  diskRollRPM: number;
  diskYawRPM: number;
}) {
  const boatRef = useRef<Group>(null);

  // Convert degrees to radians
  const rollRad = (roll * Math.PI) / 180;
  const pitchRad = (pitch * Math.PI) / 180;
  const yawRad = (yaw * Math.PI) / 180;

  // Create boat hull geometry (memoized to avoid recreation on every render)
  const boatHullGeometry = useMemo(() => createBoatHullGeometry(BOAT_CONFIG), []);
  
  // Create bench geometries (memoized)
  const frontBenchGeometry = useMemo(() => 
    createTrapezoidBench(BOAT_CONFIG.width * 0.79, BOAT_CONFIG.width * 0.79, 0.22, 0.03), 
    []
  );
  const backBenchGeometry = useMemo(() => 
    createTrapezoidBench(BOAT_CONFIG.width * 0.7, BOAT_CONFIG.width * 0.7 * 1.1, 0.22, 0.03), 
    []
  );

  useFrame(() => {
    if (boatRef.current) {
      // Boat coordinate system: X=forward/Roll, Y=starboard/Pitch, Z=up/Yaw
      // Three.js default: X=right, Y=up, Z=forward
      // 
      // We want boat in XY plane (horizontal), pointing +X, with Z up
      // Map: Boat X = Three.js X, Boat Y = Three.js Z, Boat Z = Three.js Y
      // So: rotate -90° around X: Y→Z, Z→-Y
      // Result: X=X, Y=Z, Z=-Y
      // But we want Y=+Z (not -Z), so we also rotate 180° around X: Y→-Y, Z→-Z
      // Combined: rotate 90° around X
      // 
      // Actually, let me recalculate:
      // Start: X=right, Y=up, Z=forward
      // Rotate 90° around X: X→X, Y→-Z, Z→Y
      // Result: X=right, Y=-forward, Z=up
      // This gives: Boat X = Three.js X ✓, Boat Y = Three.js -Z ✗, Boat Z = Three.js Y ✓
      // 
      // Let me try -90° around X:
      // Start: X=right, Y=up, Z=forward
      // Rotate -90° around X: X→X, Y→Z, Z→-Y
      // Result: X=right, Y=forward, Z=up
      // This gives: Boat X = Three.js X ✓, Boat Y = Three.js Z ✓, Boat Z = Three.js Y ✓
      // Perfect! But we need to check the Y direction...
      // 
      // Actually, the mapping is correct with -90° around X
      // Base rotation: -90° around X to map boat coords to Three.js
      // Then apply boat attitude rotations
      boatRef.current.rotation.set(-Math.PI / 2, 0, 0);
      boatRef.current.rotateX(rollRad);
      boatRef.current.rotateY(pitchRad);
      boatRef.current.rotateZ(yawRad);
    }
  });

  return (
    <group ref={boatRef}>
      {/* Parametric boat hull - NO rotation, same as benches */}
      {/* Boat coordinate system: X=forward, Y=starboard, Z=up */}
      {/* Geometry is created in XY plane (horizontal), pointing +X, with Z up */}
      {/* Position: center at [0, 0, 0.05] in boat coords (slightly above water) */}
      <mesh 
        geometry={boatHullGeometry}
        position={[0, 0, 0.05]} 
        castShadow 
        receiveShadow
        renderOrder={1}
      >
        <meshStandardMaterial 
          color="#8B4513" 
          metalness={0.0} 
          roughness={0.7}
        />
      </mesh>

      {/* Front bench - correct orientation (no rotation) */}
      <mesh
        geometry={frontBenchGeometry}
        position={[0.2, 0, 0.04]}
        castShadow
      >
        <meshStandardMaterial 
          color="#8B4513" 
          metalness={0.0} 
          roughness={0.7}
        />
      </mesh>

      {/* Back bench - correct orientation (no rotation) */}
      <mesh
        geometry={backBenchGeometry}
        position={[-0.65, 0, 0.04]}
        castShadow
      >
        <meshStandardMaterial 
          color="#8B4513" 
          metalness={0.0} 
          roughness={0.7}
        />
      </mesh>

      {/* CMG modules on deck */}
      <RollCmg3D servoRollAngle={servoRollAngle} diskRollRPM={diskRollRPM} />
      <YawCmg3D servoYawAngle={servoYawAngle} diskYawRPM={diskYawRPM} />
    </group>
  );
}

/**
 * Boat3DView component - main 3D visualization container
 */
export function Boat3DView({ frame }: Boat3DViewProps) {
  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden relative">
      {/* Info overlay */}
      <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-3 py-2 rounded backdrop-blur-sm">
        <div className="font-semibold mb-1">3D Boat View</div>
        <div className="text-[10px] opacity-90 space-y-0.5">
          <div>🔴 X = Forward</div>
          <div>🟢 Y = Starboard (right)</div>
          <div>🔵 Z = Up</div>
          <div className="mt-1 pt-1 border-t border-white/20">
            <span className="text-orange-400">🟠</span> Roll CMG | 
            <span className="text-purple-400"> 🟣</span> Yaw CMG
          </div>
        </div>
      </div>
      
      <div className="w-full h-full">
        <Canvas shadows camera={{ position: [5, 5, 8], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 10]} 
            intensity={1.2}
            castShadow
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={5}
            shadow-camera-bottom={-5}
          />
          <directionalLight position={[-5, -5, 5]} intensity={0.3} />
          <pointLight position={[0, 0, 8]} intensity={0.5} />

          {/* Camera controls - looking down at XY plane */}
          <OrbitControls 
            enableDamping 
            dampingFactor={0.08}
            minDistance={3}
            maxDistance={15}
            target={[0, 0, 0]}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
          />

          {/* Coordinate axes - standard Three.js coordinate system */}
          {/* X = right (RED) = Roll */}
          {/* Y = up (GREEN) = Pitch */}
          {/* Z = forward (BLUE) = Yaw */}
          {/* All axes start from origin [0, 0, 0] */}
          <group>
            {/* X-axis (Roll) - RED - Right/Left */}
            <group>
              {/* Cylinder along X-axis: rotate 90° around Z to make it horizontal */}
              <mesh position={[1.625, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.03, 0.03, 3.25, 8]} />
                <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.4} />
              </mesh>
              {/* Arrowhead pointing +X: cone default points +Y, rotate -90° around Z to point +X */}
              <mesh position={[3.25 + 0.125, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.08, 0.25, 8]} />
                <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.6} />
              </mesh>
              {/* Label on the side */}
              <Text position={[3.5, 0.15, 0]} fontSize={0.2} color="#dc2626" anchorX="center" anchorY="middle">
                ROLL (X)
              </Text>
            </group>

            {/* Y-axis (Pitch) - GREEN - Forward/Backward (swapped position with Z) */}
            <group>
              {/* Cylinder along Z-axis position: rotate 90° around X to make it point forward */}
              <mesh position={[0, 0, 1.625]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 3.25, 8]} />
                <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.4} />
              </mesh>
              {/* Arrowhead pointing +Z: cone default points +Y, rotate 90° around X to point +Z (corrected) */}
              <mesh position={[0, 0, 3.25 + 0.125]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.08, 0.25, 8]} />
                <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.6} />
              </mesh>
              {/* Label on the side */}
              <Text position={[0.15, 0, 3.5]} fontSize={0.2} color="#22c55e" anchorX="left" anchorY="middle">
                PITCH (Y)
              </Text>
            </group>

            {/* Z-axis (Yaw) - BLUE - Up/Down (swapped position with Y) */}
            <group>
              {/* Cylinder along Y-axis position: default orientation is correct */}
              <mesh position={[0, 1.625, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 3.25, 8]} />
                <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.4} />
              </mesh>
              {/* Arrowhead pointing +Y: cone default points +Y, no rotation needed */}
              <mesh position={[0, 3.25 + 0.125, 0]}>
                <coneGeometry args={[0.08, 0.25, 8]} />
                <meshStandardMaterial color="#3b82f6" emissive="#1e40af" emissiveIntensity={0.6} />
              </mesh>
              {/* Label on the side */}
              <Text position={[0.15, 3.5, 0]} fontSize={0.2} color="#3b82f6" anchorX="left" anchorY="middle">
                YAW (Z)
              </Text>
            </group>
          </group>

          {/* Water plane - horizontal plane matching boat orientation */}
          {/* Boat is rotated -90° around X, so it's in XZ plane (horizontal) */}
          {/* PlaneGeometry default is in XY plane, rotate -90° around X to make it XZ plane */}
          {/* Position Y=-0.1 to place it below the boat (boat is at Z=0.05 in boat coords) */}
          <mesh 
            position={[0, -0.1, 0]} 
            rotation={[-Math.PI / 2, 0, 0]} 
            receiveShadow
            renderOrder={-1}
          >
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial 
              color="#0c4a6e" 
              metalness={0.2}
              roughness={0.8}
              transparent
              opacity={0.6}
              depthWrite={false}
            />
          </mesh>

          {/* Grid on horizontal plane matching boat orientation */}
          {/* Grid from drei creates grid in XY plane, rotate -90° around X to make it XZ plane */}
          <group rotation={[-Math.PI / 2, 0, 0]}>
          <Grid
            args={[20, 20]}
            position={[0, 0, 0]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#3b82f6"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#1e40af"
            fadeDistance={25}
            fadeStrength={1}
            infiniteGrid={false}
          />
          </group>

          {/* Boat with CMGs */}
          <BoatMesh 
            roll={frame.roll} 
            pitch={frame.pitch} 
            yaw={frame.yaw}
            servoRollAngle={frame.servoRollAngle}
            servoYawAngle={frame.servoYawAngle}
            diskRollRPM={frame.diskRollRPM}
            diskYawRPM={frame.diskYawRPM}
          />
        </Canvas>
      </div>

      {/* Attitude display */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-3 py-2 rounded backdrop-blur-sm font-mono">
        <div className="text-red-400">Roll:  {frame.roll.toFixed(1)}°</div>
        <div className="text-green-400">Pitch: {frame.pitch.toFixed(1)}°</div>
        <div className="text-blue-400">Yaw:   {frame.yaw.toFixed(1)}°</div>
      </div>
      
      {/* Servo angles display */}
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-3 py-2 rounded backdrop-blur-sm font-mono">
        <div className="text-orange-400">Roll Servo: {frame.servoRollAngle.toFixed(1)}°</div>
        <div className="text-purple-400">Yaw Servo:  {frame.servoYawAngle.toFixed(1)}°</div>
        <div className="text-cyan-400 text-[10px] mt-1">
          Disks: {frame.diskRollRPM.toFixed(0)} / {frame.diskYawRPM.toFixed(0)} RPM
        </div>
      </div>
    </div>
  );
}
