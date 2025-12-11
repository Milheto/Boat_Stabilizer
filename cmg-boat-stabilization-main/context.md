# Boat CMG Visualizer – Full Technical Spec (for Cursor / Devs)

This document describes, in detail, the **theory**, the **geometry**, the **data model**, and the **UI + simulation behavior** for a small boat stabilization project using **two Control Moment Gyros (CMGs)**.

You can give this as **context** to an AI coding assistant (e.g. Cursor) or use it as a design spec for your team.

---

## 0. High-Level Goal

We are building a **visualization + simulation tool** for a small boat that uses **two CMGs** to stabilize:

- **ROLL** (rotation around the boat’s longitudinal axis, X)
- **YAW** (rotation around the boat’s vertical axis, Z)

The tool must:

1. Render a **3D model of the boat** and show its attitude (roll, pitch, yaw).
2. Render **two CMG modules** on the boat:
   - One responsible primarily for **roll stabilization**.
   - One responsible primarily for **yaw stabilization**.
3. Visually show:
   - **Gimbal angles** (servo angles) of each CMG.
   - The **flywheels spinning** at (approximately) constant RPM.
4. Display **IMU data** (angles and angular rates).
5. Display **control outputs** (servo commands, disk RPMs).
6. Support an internal **simulation mode**:
   - A simple, plausible dynamical model of boat roll and yaw.
   - Two PID controllers that try to keep roll ≈ 0 and yaw ≈ 0.
   - Simulation feeds the 3D visualization and charts.
7. Later, this tool can be connected to **real IMU + firmware** (via WebSocket / serial bridge).

---

## 1. Coordinate System & Attitude Definitions (Boat Frame)

We define a **boat-fixed coordinate system**:

- **Axes:**
  - **+X**: forward, from stern to bow.
  - **+Y**: starboard (right side) when facing forward.
  - **+Z**: up, from keel toward the sky.

- **Rotations:**
  - **Roll (φ)** – rotation about **+X**  
    → boat “leans” left/right.
  - **Pitch (θ)** – rotation about **+Y**  
    → nose up/down (we ignore it for control but still track it).
  - **Yaw (ψ)** – rotation about **+Z**  
    → boat turns left/right in plan view.

In the code, we will use:

- `roll`  → rotation about X (deg)
- `pitch` → rotation about Y (deg)
- `yaw`   → rotation about Z (deg)

### 1.1. Rotation Order

In the 3D engine (Three.js / React Three Fiber), we must pick a rotation order and be consistent. A common choice:

> World rotation of the boat: **yaw → pitch → roll**

Meaning:

1. Start with the boat aligned with world axes.
2. Apply yaw rotation around Z.
3. Then pitch around Y.
4. Then roll around X.

**Important:**  
Add code comments explaining:

- The chosen axis convention.
- The chosen rotation order.
- How `roll`, `pitch`, `yaw` (in degrees) are mapped to these rotations.

---

## 2. Physical System Overview

We are modeling a **small boat prototype** (roughly 40–60 cm length) equipped with:

1. **IMU** (e.g., MPU-6050, ICM-20948):
   - Mounted near the **center of gravity (CG)** of the boat.
   - Measures:
     - Angular rates: `gyroX`, `gyroY`, `gyroZ` (deg/s).
     - Accelerations (for angle estimation).
   - IMU axes are aligned with the **boat axes**.

2. **Two CMGs (Control Moment Gyros)**:
   - Each CMG consists of:
     - A **flywheel** (disk) spinning at nearly **constant RPM**.
     - A **single gimbal axis** driven by a **servo**.
   - They are mounted rigidly on the boat.

3. **Roles of the CMGs:**
   - **Roll CMG** → generates torque mainly in **ROLL (around X)**.
   - **Yaw CMG**  → generates torque mainly in **YAW (around Z)**.

4. **Control Focus:**
   - We want to stabilize **roll** and **yaw**.
   - We **ignore pitch control** for now.

---

## 3. CMG Theory: How a Disk + Servo Produces Torque

A CMG uses a spinning flywheel to produce control torques via gyroscopic effects.

### 3.1. Flywheel / Disk

For each disk:

- **Moment of inertia** \( J \) (depends on mass and radius):
  - For a solid disk:  
    \[
    J = \frac{1}{2} m r^2
    \]
- **Spin speed** \( \omega \) (rad/s):  
  - 6000 rpm → \( \omega \approx 6000 \times 2\pi / 60 \approx 628 \) rad/s.
- **Angular momentum**:
  \[
  \mathbf{H} = J \, \omega \, \hat{s}
  \]
  - \( \hat{s} \) is the unit vector along the flywheel’s spin axis.
  - \( \mathbf{H} \) is a vector that points along the spin axis.

### 3.2. Gimbal Motion & Torque

The CMG includes a **gimbal**:

- The gimbal axis has direction \( \hat{g} \).
- The gimbal can rotate with angular rate \( \dot{\theta}_\text{gimbal} \) around \( \hat{g} \).

When the gimbal rotates, the CMG generates a torque on the boat:

\[
\boldsymbol{\tau} = \mathbf{H} \times \dot{\boldsymbol{\theta}}_\text{gimbal}
\]

Where:

- \( \mathbf{H} = J\omega \hat{s} \) (angular momentum).
- \( \dot{\boldsymbol{\theta}}_\text{gimbal} = \dot{\theta}_\text{gimbal} \hat{g} \).

Key points:

- **Direction** of the torque:
  - Given by the cross product \( \hat{s} \times \hat{g} \).
  - This determines which axis (roll/pitch/yaw) the CMG mainly acts on.
- **Magnitude** of the torque:
  - \( |\boldsymbol{\tau}| \propto H \cdot |\dot{\theta}_\text{gimbal}| \).
  - Larger \(J\), larger \(\omega\), or faster gimbal motion → larger torque.

In our design:

- The flywheels run at **approximately constant RPM**.
- Control action comes from **changing the gimbal angle over time** via **servo commands**.

We are not using reaction wheels (which change disk RPM to produce torque), but **CMGs** (which change the disk’s orientation).

---

## 4. Geometry of the Two CMGs (Orientation in the Boat Frame)

We want each CMG to mainly produce torque around one axis:

- **Roll CMG** → torque in **roll** (X).
- **Yaw CMG** → torque in **yaw** (Z).

We choose:

- Both gimbal axes are aligned with **+Y**.
- The flywheels have different spin axes.

### 4.1. Roll CMG (Stabilizes ROLL, Torque Around X)

**Goal:** torque mainly along ±X.

We choose:

- **Spin axis** of Roll CMG flywheel: **aligned with +Z** (vertical).
  - \( \hat{s}_R = (0, 0, 1) \).
- **Gimbal axis**: **aligned with +Y**.
  - \( \hat{g}_R = (0, 1, 0) \).

Then:

\[
\hat{s}_R \times \hat{g}_R = (0,0,1) \times (0,1,0) = (-1,0,0) = -\hat{x}
\]

So:

- The Roll CMG torque points along **±X** (roll axis).
- In boat coordinates, it primarily affects **roll**.

**Interpretation (for 3D model):**

- The Roll CMG disk’s initial spin axis points straight **up** (+Z).
- The Roll CMG gimbal rotates that axis **forward/backward** around +Y.
- The boat sees a **roll torque** when the servo moves.

### 4.2. Yaw CMG (Stabilizes YAW, Torque Around Z)

**Goal:** torque mainly along ±Z.

We choose:

- **Spin axis** of Yaw CMG flywheel: **aligned with +X** (forward).
  - \( \hat{s}_Y = (1, 0, 0) \).
- **Gimbal axis**: **aligned with +Y** (same as Roll CMG).
  - \( \hat{g}_Y = (0, 1, 0) \).

Then:

\[
\hat{s}_Y \times \hat{g}_Y = (1,0,0) \times (0,1,0) = (0,0,1) = \hat{z}
\]

So:

- The Yaw CMG torque points along **±Z** (yaw axis).
- It primarily affects **yaw**.

**Interpretation (for 3D model):**

- The Yaw CMG disk’s initial spin axis points **forward** (+X).
- The Yaw CMG gimbal rotates that axis **up/down** around +Y.
- The boat sees a **yaw torque** when that servo moves.

---

## 5. Telemetry Data Model

We define a telemetry frame that collects all the relevant signals at time `t`:

```ts
export type TelemetryFrame = {
  t: number;              // time in seconds

  // Boat attitude (in degrees):
  roll: number;           // rotation about +X
  pitch: number;          // rotation about +Y
  yaw: number;            // rotation about +Z

  // IMU angular rates (deg/s):
  gyroX: number;          // roll rate (about X)
  gyroY: number;          // pitch rate (about Y)
  gyroZ: number;          // yaw rate (about Z)

  // CMG gimbal (servo) angles:
  servoRollAngle: number; // deg, Roll CMG gimbal angle (rotation about Y)
  servoYawAngle: number;  // deg, Yaw CMG gimbal angle (rotation about Y)

  // Flywheel RPM:
  diskRollRPM: number;    // RPM of Roll CMG flywheel
  diskYawRPM: number;     // RPM of Yaw CMG flywheel
};
This is the core datatype for:
3D visualization (Boat3DView + CMGs).
Numeric panels.
Time-series plots.
Both simulation and real hardware streaming should map to this.
6. UI Behavior & 3D Representation
We want a cockpit-like UI:
One main page with:
3D boat view.
Numeric telemetry panels.
Time-series plots.
Playback / simulation controls.
6.1. 3D Boat View
Component: Boat3DView
Responsibilities:

Render the boat mesh:
Can be a simple stretched box or a basic hull shape.
Add simple lighting and camera with orbit controls (user rotates view).
Apply the boat’s attitude using roll, pitch, yaw from currentFrame:
Convert degrees → radians.
Respect the chosen axis & rotation order (yaw → pitch → roll).
Make Boat3DView the parent transform for the CMG components:
CMGs are children so they move together with the boat.
6.2. CMGs in 3D
We add two child components:
RollCmg3D – Roll CMG 3D assembly.
YawCmg3D – Yaw CMG 3D assembly.
Each assembly should:
Be placed at a visible position on the boat (on deck).
Composed of:
A base: fixed to boat.
A gimbal frame: rotates around local Y axis by servo*Angle.
A flywheel: a cylinder spinning around its spin axis.
RollCmg3D
Local placement: e.g., at (x0, y0, z0) relative to the boat center.
Transform hierarchy (pseudo):
Boat transform (roll/pitch/yaw)
Group at CMG position
Base mesh (static)
Gimbal group (rotate around Y by servoRollAngle)
Disk mesh (cylinder)
Rotating around its local Z axis based on diskRollRPM.
Disk spin:
Angular velocity:
ω
roll
=
2
π
⋅
diskRollRPM
60
ω 
roll
​	
 =2π⋅ 
60
diskRollRPM
​	
 
Use useFrame to increment the disk rotation each frame:
rotation.z += omega_roll * deltaTime.
YawCmg3D
Local placement: e.g., mirrored on the other side of the boat center.
Transform hierarchy:
Boat transform
Group at CMG position
Base mesh
Gimbal group (rotate around Y by servoYawAngle)
Disk mesh (cylinder)
Rotating around its local X axis based on diskYawRPM.
Disk spin:
Angular velocity:
ω
yaw
=
2
π
⋅
diskYawRPM
60
ω 
yaw
​	
 =2π⋅ 
60
diskYawRPM
​	
 
In useFrame:
rotation.x += omega_yaw * deltaTime.
6.3. Numeric Panels
TelemetryPanel
Displays:
roll, pitch, yaw (deg, e.g. 1 decimal place).
gyroX, gyroY, gyroZ (deg/s).
ServoPanel
Displays:
servoRollAngle (deg).
servoYawAngle (deg).
diskRollRPM.
diskYawRPM.
Optionally:
Small bar indicators for servo angles and RPM, to make visualization intuitive.
6.4. Time-Series Plots
Component: TimeSeriesPlots
Input:
data: TelemetryFrame[]
currentTime: number
Use a chart library (e.g. Recharts) to plot:
Plot 1 – Attitude:
roll(t)
yaw(t)
Plot 2 – Control:
servoRollAngle(t)
servoYawAngle(t)
Optional: draw a vertical reference line at currentTime in the plots.
7. Simulation Logic (Internal Physics + PID Control)
The visualization should support a Simulation Mode:
Instead of reading a static mock dataset, we:
Simulate the boat’s roll and yaw.
Apply PID controllers to compute servo angles.
Generate TelemetryFrames in real time.
7.1. Boat Simulation State
type BoatState = {
  t: number;               // time, seconds
  roll: number;            // deg
  rollRate: number;        // deg/s
  yaw: number;             // deg
  yawRate: number;         // deg/s
  servoRollAngle: number;  // deg
  servoYawAngle: number;   // deg
  diskRollRPM: number;     // RPM
  diskYawRPM: number;      // RPM
};
7.2. Simplified Dynamics
We want a simple model where:
Without control, roll and yaw oscillate and slowly decay.
With control, oscillations are reduced.
We can use damped second-order behavior in degrees:
Roll:

ϕ
˙
=
rollRate
ϕ
˙
​	
 =rollRate
rollRate
˙
=
−
c
R
⋅
rollRate
−
k
R
⋅
ϕ
+
u
R
+
d
R
(
t
)
rollRate
˙
 =−c 
R
​	
 ⋅rollRate−k 
R
​	
 ⋅ϕ+u 
R
​	
 +d 
R
​	
 (t)
Yaw:
ψ
˙
=
yawRate
ψ
˙
​	
 =yawRate
yawRate
˙
=
−
c
Y
⋅
yawRate
−
k
Y
⋅
ψ
+
u
Y
+
d
Y
(
t
)
yawRate
˙
​	
 =−c 
Y
​	
 ⋅yawRate−k 
Y
​	
 ⋅ψ+u 
Y
​	
 +d 
Y
​	
 (t)
Where:
c
R
,
k
R
,
c
Y
,
k
Y
c 
R
​	
 ,k 
R
​	
 ,c 
Y
​	
 ,k 
Y
​	
  = damping and stiffness-like constants.
d
R
(
t
)
,
d
Y
(
t
)
d 
R
​	
 (t),d 
Y
​	
 (t) = disturbances (e.g. sinusoids simulating waves).
u
R
,
u
Y
u 
R
​	
 ,u 
Y
​	
  = control terms (approximate influence of CMGs).
We can approximate:
u
R
∝
servoRollAngle
u 
R
​	
 ∝servoRollAngle
u
Y
∝
servoYawAngle
u 
Y
​	
 ∝servoYawAngle
We integrate using Euler:
x
k
+
1
=
x
k
+
x
˙
⋅
Δ
t
x 
k+1
​	
 =x 
k
​	
 + 
x
˙
 ⋅Δt
7.3. PID Controllers
We implement standardized PID structs:
type PID = {
  kp: number;
  ki: number;
  kd: number;
  integrator: number;
  prevError: number | null;
  outputMin: number;
  outputMax: number;
};
Roll PID:
Setpoint: rollSetpoint = 0 deg.
Error: e_R = rollSetpoint - roll.
Output: servoRollAngle command (deg).
Clamp servoRollAngle to e.g. [-30, +30] deg.
Yaw PID:
Setpoint: yawSetpoint = 0 deg.
Error: e_Y = yawSetpoint - yaw.
Output: servoYawAngle (deg).
Clamp similarly.
For extra realism, we can:
Use rollRate / yawRate to influence derivative term.
Optionally apply rate limiting on servo angles: servo angles cannot change faster than, say, 60°/s.
7.4. Disk RPMs in Simulation
We can keep:
diskRollRPM ≈ constant, e.g. 6000 ± small noise.
diskYawRPM ≈ same idea.
These values are used for:
Visual spin speed in 3D.
Display in ServoPanel.
In this first version, we do not feed RPM into the dynamics; we treat torque as proportional to servo angle for simplicity.
7.5. Simulation Step Function
We define a function like:
function stepSimulation(state: BoatState, dt: number, pidRoll: PID, pidYaw: PID): BoatState {
  // 1. compute disturbances dR(t), dY(t)
  // 2. compute PID outputs for roll and yaw => servoRollAngle, servoYawAngle
  // 3. compute uR, uY from servo angles
  // 4. compute derivatives of roll, rollRate, yaw, yawRate
  // 5. integrate state forward by dt
  // 6. update disk RPM if needed (nearly constant)
  // 7. return new state
}
We can place this logic in a dedicated module, e.g. src/simulation/cmgSimulation.ts.
8. Integration With the React UI
We want two modes:
Playback Mode – uses pre-recorded mockTelemetry data.
Simulation Mode – uses the simulation engine described above.
8.1. App-Level State
In App.tsx (or equivalent):
mode: 'playback' | 'simulation'
For Playback:
telemetry: TelemetryFrame[]
currentTime: number
isPlaying: boolean
currentFrame: TelemetryFrame
For Simulation:
simState: BoatState
simFrames: TelemetryFrame[] (past history for charts)
simRunning: boolean
8.2. Playback Mode Flow
Load mockTelemetry on mount.
Use requestAnimationFrame or setInterval to advance currentTime when isPlaying.
Interpolate or pick the nearest frame to set currentFrame.
Feed currentFrame into:
Boat3DView
TelemetryPanel
ServoPanel
TimeSeriesPlots (using telemetry array and currentTime).
8.3. Simulation Mode Flow
Initialize simState:
e.g., small non-zero roll and yaw, zero rates, fixed RPMs.
Use requestAnimationFrame or setInterval:
Compute dt from elapsed time.
Call stepSimulation(simState, dt, pidRoll, pidYaw) → newState.
Convert newState into a TelemetryFrame.
Update:
simState = newState
Append the new TelemetryFrame to simFrames (keep only last N seconds).
The “current frame” for the UI is the latest TelemetryFrame from simFrames.
8.4. Wiring to Components
In both modes (Playback/Simulation):
Boat3DView receives a TelemetryFrame called currentFrame.
TelemetryPanel receives currentFrame.
ServoPanel receives currentFrame.
TimeSeriesPlots receives:
Either telemetry (Playback) or simFrames (Simulation).
A currentTime marker.
A simple mode toggle (e.g. buttons “Playback” / “Simulation”) allows switching between them.
9. What the Visualization Should Clearly Show
When everything is wired:
3D Boat:
Correctly oriented by roll, pitch, yaw.
Shows visibly when the boat is rolling or yawing.
Roll CMG:
On deck, with:
Gimbal frame tilting according to servoRollAngle.
Disk spinning around vertical axis at diskRollRPM.
In Simulation mode, as roll disturbances happen, the gimbal angle responds.
Yaw CMG:
On deck, with:
Gimbal frame tilting according to servoYawAngle.
Disk spinning around forward axis at diskYawRPM.
In Simulation mode, as yaw disturbances happen, the gimbal responds.
IMU & Control Data:
Numeric panels show:
Attitude: roll, pitch, yaw.
Gyro rates: gyroX, gyroY, gyroZ.
Servo angles and disk RPMs.
Charts:
Show the time evolution of:
roll(t) and yaw(t).
servoRollAngle(t) and servoYawAngle(t).
Simulation Behavior:
Without control (or with very low PID gains), the boat’s roll and yaw:
Oscillate and decay slowly (due to damping).
With tuned PID gains:
Roll/yaw oscillations are significantly smaller and settle faster.
CMG gimbals move in a way that is visually intuitive: they tilt to oppose the motion.
10. Implementation Notes for the Codebase
Tech stack (recommended):
React + TypeScript.
Vite for bundling.
@react-three/fiber + @react-three/drei for 3D.
A charting lib (e.g. Recharts).
Optional: Tailwind CSS for styling.
File structure suggestion:
src/types/TelemetryFrame.ts → Type definitions.
src/data/mockTelemetry.ts → sample playback dataset.
src/components/Boat3DView.tsx → 3D boat container (uses CMG components).
src/components/RollCmg3D.tsx → 3D Roll CMG.
src/components/YawCmg3D.tsx → 3D Yaw CMG.
src/components/TelemetryPanel.tsx → numeric display.
src/components/ServoPanel.tsx → servo & RPM display.
src/components/TimeSeriesPlots.tsx → Recharts-based plots.
src/components/PlaybackControls.tsx → controls for playback mode.
src/simulation/cmgSimulation.ts → physics + PID step logic.
src/App.tsx → high-level wiring (mode selection, state, etc.).
Comments to add:
Explain the coordinate system and rotation order in Boat3DView.
In CMG components, clearly label:
Which rotation corresponds to the gimbal.
Which rotation corresponds to the disk spin.
In the simulation code:
Document the simplified dynamics.
Document the PID gains and their roles.