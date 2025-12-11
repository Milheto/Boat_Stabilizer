import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';

interface YawCmg3DProps {
  servoYawAngle: number; // deg - gimbal angle
  diskYawRPM: number;    // RPM - flywheel spin speed
}

/**
 * YawCmg3D - Control Moment Gyro for YAW stabilization
 * 
 * From spec section 4.2:
 * 
 * COORDINATE SYSTEM:
 * - +X = forward (bow direction)
 * - +Y = starboard (right side)
 * - +Z = up
 * 
 * YAW CMG CONFIGURATION:
 * - Spin axis (s_Y): aligned with +X (forward)
 * - Gimbal axis (g_Y): aligned with +Y (lateral)
 * - Torque direction: s_Y × g_Y = (1,0,0) × (0,1,0) = (0,0,1) = +Z
 *   → Produces torque around Z axis (YAW)
 * 
 * PHYSICAL STRUCTURE (from spec section 6.2):
 * - Base: fixed to boat deck
 * - Gimbal frame: rotates around +Y axis by servoYawAngle
 * - Flywheel disk: spins around +X axis at diskYawRPM
 * 
 * POSITION: On deck, slightly forward of center, on boat centerline (Y=0)
 */
export function YawCmg3D({ servoYawAngle, diskYawRPM }: YawCmg3DProps) {
  const gimbalRef = useRef<Group>(null);
  const diskRef = useRef<Group>(null);

  useFrame((state, delta) => {
    // YAW CMG CONFIGURATION:
    // - Spin axis (disk): Boat X (forward) → Three.js X (unchanged after boat -90°X rotation)
    // - Gimbal axis: Boat Y (lateral/starboard) → Three.js -Z after boat -90°X rotation
    // - Torque: s_Y × g_Y = (1,0,0) × (0,1,0) = (0,0,1) = torque around +Z (YAW)
    //
    // PHYSICAL BEHAVIOR:
    // - Gimbal rotates around Boat Y axis (lateral) by servoYawAngle
    // - Disk spins around Boat X axis (forward) at diskYawRPM
    // - When gimbal tilts, the spinning disk produces torque around Boat Z (yaw)
    
    // Gimbal rotation: around Y axis (lateral/starboard)
    // According to CMG physics: Spin(X) × Gimbal(Y) = Torque(Z) = YAW
    // The gimbal tilts the spinning disk around the lateral axis
    if (gimbalRef.current) {
      const gimbalAngleRad = (servoYawAngle * Math.PI) / 180;
      gimbalRef.current.rotation.y = gimbalAngleRad; // Rotate around Y axis (lateral)
    }

    // Disk spin: around Boat X (forward)
    // After boat -90°X: Boat X → Three.js X (unchanged)
    // Disk geometry: cylinder rotated 90° around Z, so cylinder axis is along X
    // Since disk is inside gimbal, it rotates around its local X axis
    // This is correct: local X = Boat X = Three.js X
    if (diskRef.current && Math.abs(diskYawRPM) > 0.1) {
      const spinSpeedRadPerSec = (diskYawRPM * 2 * Math.PI) / 60;
      // Rotate around local X axis (Boat X, unchanged after boat rotation)
      diskRef.current.rotation.x += spinSpeedRadPerSec * delta;
    }
  });

  return (
    // Position: X=0.2 (on front bench), Y=0 (centerline), Z=0.055 (on top of bench)
    // Bench is at Z=0.04 with thickness 0.03, so top is at 0.04 + 0.015 = 0.055
    // Boat coordinate system: X=forward, Y=starboard, Z=up
    <group position={[0.2, 0, 0.055]}>
      {/* Base platform - fixed to deck */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.075]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Gimbal frame - rotates around Y axis (lateral) */}
      <group ref={gimbalRef}>
        {/* Gimbal ring structure - PURPLE to be visible */}
        {/* Top ring */}
        <mesh position={[0, 0.12, 0.075]} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.24]} />
          <meshStandardMaterial 
            color="#a855f7" 
            metalness={0.7} 
            roughness={0.3}
            emissive="#9333ea"
            emissiveIntensity={0.4}
          />
        </mesh>
        
        {/* Bottom ring */}
        <mesh position={[0, -0.12, 0.075]} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.24]} />
          <meshStandardMaterial 
            color="#a855f7" 
            metalness={0.7} 
            roughness={0.3}
            emissive="#9333ea"
            emissiveIntensity={0.4}
          />
        </mesh>
        
        {/* Side supports */}
        <mesh position={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[0.02, 0.24, 0.03]} />
          <meshStandardMaterial color="#c084fc" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.03]} castShadow>
          <boxGeometry args={[0.02, 0.24, 0.03]} />
          <meshStandardMaterial color="#c084fc" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Flywheel disk - spins around X axis (forward) */}
        <group ref={diskRef} position={[0, 0, 0.075]}>
          {/* Main disk - cylinder with axis along X */}
          {/* In Three.js, cylinder default axis is Y, rotate to X */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 32]} />
            <meshStandardMaterial 
              color="#10b981" 
              metalness={0.8} 
              roughness={0.2}
            />
          </mesh>
          
          {/* Center hub - bright to see rotation */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
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
          {/* Spoke along Z */}
          <mesh position={[0.016, 0, 0.067]}>
            <boxGeometry args={[0.004, 0.012, 0.135]} />
            <meshStandardMaterial 
              color="#ec4899" 
              emissive="#db2777"
              emissiveIntensity={0.5}
            />
          </mesh>
          
          {/* Spoke along Y */}
          <mesh position={[0.016, 0.067, 0]}>
            <boxGeometry args={[0.004, 0.135, 0.012]} />
            <meshStandardMaterial 
              color="#f59e0b" 
              emissive="#d97706"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
