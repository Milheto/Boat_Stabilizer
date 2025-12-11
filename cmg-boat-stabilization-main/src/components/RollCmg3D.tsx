import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';

interface RollCmg3DProps {
  servoRollAngle: number; // deg - gimbal angle
  diskRollRPM: number;    // RPM - flywheel spin speed
}

/**
 * RollCmg3D - Control Moment Gyro for ROLL stabilization
 * 
 * From spec section 4.1:
 * 
 * COORDINATE SYSTEM:
 * - +X = forward (bow direction)
 * - +Y = starboard (right side)
 * - +Z = up
 * 
 * ROLL CMG CONFIGURATION (CORRECTED):
 * - Spin axis (s_R): aligned with +Y (lateral/starboard) - disk spins around width
 * - Gimbal axis (g_R): aligned with +X (forward/length) - gimbal tilts along boat length
 * - Torque direction: s_R × g_R = (0,1,0) × (1,0,0) = (0,0,-1) = -Z
 *   → This produces torque around Z (yaw), not X (roll)
 * 
 * NOTE: This configuration produces YAW torque, not ROLL torque.
 * For ROLL torque, we would need: s=Z, g=Y → s×g = -X
 * But user wants gimbal to tilt along length (X), so we use: s=Y, g=X → s×g = -Z
 * 
 * PHYSICAL STRUCTURE:
 * - Base: fixed to boat deck
 * - Gimbal frame: rotates around +X axis (length/forward) by servoRollAngle
 * - Flywheel disk: spins around +Y axis (lateral/starboard) at diskRollRPM
 * 
 * POSITION: On deck, slightly aft of center, on boat centerline (Y=0)
 */
export function RollCmg3D({ servoRollAngle, diskRollRPM }: RollCmg3DProps) {
  const gimbalRef = useRef<Group>(null);
  const diskRef = useRef<Group>(null);

  useFrame((state, delta) => {
    // ROLL CMG CONFIGURATION (CORRECTED):
    // - Spin axis (disk): Boat Y (lateral/starboard) - disk spins around width
    // - Gimbal axis: Boat X (forward/length) - gimbal tilts along boat length
    // - Torque: s_R × g_R = (0,1,0) × (1,0,0) = (0,0,-1) = torque around -Z (YAW)
    //
    // PHYSICAL BEHAVIOR:
    // - Gimbal rotates around Boat X axis (length/forward) by servoRollAngle
    // - Disk spins around Boat Y axis (lateral/starboard) at diskRollRPM
    // - When gimbal tilts along length, the spinning disk produces torque around Boat Z (yaw)
    //
    // NOTE: This configuration produces YAW torque, not ROLL torque.
    // But user wants gimbal to tilt along length (X axis), so we use this configuration.
    
    // Gimbal rotation: around Boat X (length/forward)
    // After boat -90°X: Boat X → Three.js X (unchanged)
    // So rotate around X axis
    if (gimbalRef.current) {
      const gimbalAngleRad = (servoRollAngle * Math.PI) / 180;
      gimbalRef.current.rotation.x = gimbalAngleRad; // Rotate around X axis (Boat X = Three.js X)
    }

    // Disk spin: around Boat Y (lateral/starboard)
    // After boat -90°X: Boat Y → Three.js Z (forward)
    // Disk geometry: cylinder with default axis Y (Three.js), which is Boat Z after boat rotation
    // But we need disk to spin around Boat Y, which is Three.js Z after boat -90°X rotation
    // Since disk is inside gimbal, and gimbal rotates around X (Three.js),
    // the disk's local Z axis is Boat Y (after boat rotation)
    // So disk rotates around local Z axis
    if (diskRef.current && Math.abs(diskRollRPM) > 0.1) {
      const spinSpeedRadPerSec = (diskRollRPM * 2 * Math.PI) / 60;
      // Rotate around local Z axis (Boat Y after boat -90°X rotation)
      // This keeps the disk spinning at constant velocity around the gimbal's spin axis
      diskRef.current.rotation.z += spinSpeedRadPerSec * delta;
    }
  });

  return (
    // Position: X=-0.65 (on back bench), Y=0 (centerline), Z=0.055 (on top of bench)
    // Bench is at Z=0.04 with thickness 0.03, so top is at 0.04 + 0.015 = 0.055
    // Boat coordinate system: X=forward, Y=starboard, Z=up
    <group position={[-0.65, 0, 0.055]}>
      {/* Base platform - fixed to deck */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.075]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Gimbal frame - rotates around Y axis (lateral) */}
      <group ref={gimbalRef}>
        {/* Gimbal ring structure - ORANGE to be visible */}
        {/* Top ring */}
        <mesh position={[0, 0.12, 0.075]} castShadow>
          <boxGeometry args={[0.24, 0.03, 0.03]} />
          <meshStandardMaterial 
            color="#f97316" 
            metalness={0.7} 
            roughness={0.3}
            emissive="#ea580c"
            emissiveIntensity={0.4}
          />
        </mesh>
        
        {/* Bottom ring */}
        <mesh position={[0, -0.12, 0.075]} castShadow>
          <boxGeometry args={[0.24, 0.03, 0.03]} />
          <meshStandardMaterial 
            color="#f97316" 
            metalness={0.7} 
            roughness={0.3}
            emissive="#ea580c"
            emissiveIntensity={0.4}
          />
        </mesh>
        
        {/* Side supports */}
        <mesh position={[0.105, 0, 0.075]} castShadow>
          <boxGeometry args={[0.03, 0.24, 0.02]} />
          <meshStandardMaterial color="#fb923c" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.105, 0, 0.075]} castShadow>
          <boxGeometry args={[0.03, 0.24, 0.02]} />
          <meshStandardMaterial color="#fb923c" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Flywheel disk - spins around Boat Y (lateral/starboard) */}
        <group ref={diskRef} position={[0, 0, 0.075]}>
          {/* Main disk - cylinder rotated 90° around X to make it horizontal */}
          {/* In Three.js, cylinder default axis is Y (vertical), rotate 90°X to make it horizontal (axis along Z) */}
          {/* After boat -90°X rotation: Boat Y → Three.js Z, so disk axis along Z (Three.js) = Boat Y */}
          {/* The disk is horizontal (in gimbal's plane), spinning around Z axis (Three.js) = Boat Y (lateral) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 32]} />
            <meshStandardMaterial 
              color="#3b82f6" 
              metalness={0.8} 
              roughness={0.2}
            />
          </mesh>
          
          {/* Center hub - bright to see rotation */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.035, 16]} />
            <meshStandardMaterial 
              color="#ef4444" 
              metalness={0.9} 
              roughness={0.1}
              emissive="#dc2626"
              emissiveIntensity={0.6}
            />
          </mesh>
          
          {/* Spokes to visualize rotation */}
          {/* Spoke along X (in horizontal plane) */}
          <mesh position={[0.067, 0, 0.016]}>
            <boxGeometry args={[0.135, 0.012, 0.004]} />
            <meshStandardMaterial 
              color="#fbbf24" 
              emissive="#f59e0b"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Spoke along Y (in horizontal plane) */}
          <mesh position={[0, 0.067, 0.016]}>
            <boxGeometry args={[0.012, 0.135, 0.004]} />
            <meshStandardMaterial 
              color="#22c55e" 
              emissive="#16a34a"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
