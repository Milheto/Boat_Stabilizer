# Boat CMG Visualizer 🚤

A real-time 3D visualization dashboard for a boat stabilization system using two Control Moment Gyroscopes (CMGs). Built with React, Three.js, and MQTT telemetry.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🎯 Features

- **3D Boat Visualization**: Real-time 3D model that rotates according to telemetry data (roll, pitch, yaw)
- **CMG Visualization**: 3D representation of the two control moment gyroscopes
- **IMU Telemetry Display**: Shows current attitude angles and gyro rates
- **Control System Panel**: Displays servo angles and disk RPMs
- **Time-Series Charts**: Visualize roll/yaw and servo angles over time
- **Playback Controls**: Play/pause and time scrubbing for telemetry replay
- **Real-time MQTT**: Connects to Arduino/ESP32 via MQTT broker

---

## 🚀 Quick Start (New Machine Setup)

### Prerequisites

Make sure you have the following installed:

| Tool | Version | Installation |
|------|---------|--------------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/) or `brew install node` (macOS) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) or `brew install git` (macOS) |

### Step 1: Clone the Repository

```bash
git clone https://github.com/Gui-Avila/cmg-boat-stabilization.git
cd cmg-boat-stabilization
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run the Application

You have two options:

#### Option A: Run Everything at Once (Recommended)

```bash
npm run dev:all
```

This starts both:
- **Backend server** (port 3001) - MQTT bridge that connects to the Arduino/ESP32
- **Frontend** (port 5173) - React visualization dashboard

#### Option B: Run Separately (for debugging)

Terminal 1 - Start the MQTT bridge server:
```bash
npm run server
```

Terminal 2 - Start the frontend:
```bash
npm run dev
```

### Step 4: Open in Browser

Navigate to: **http://localhost:5173**

---

## 📡 Architecture

```
┌─────────────┐     MQTT      ┌──────────────┐     HTTP      ┌──────────────┐
│  Arduino/   │──────────────▶│   Backend    │──────────────▶│   Frontend   │
│   ESP32     │   (port 8883) │  server.js   │  (port 3001)  │   React App  │
│             │               │  MQTT Client │               │  (port 5173) │
└─────────────┘               └──────────────┘               └──────────────┘
                                    │
                                    ▼
                            mqtt.janks.dev.br
                              Topic: nautica
```

---

## 🔧 Configuration

### MQTT Broker Settings

The server connects to an MQTT broker. Edit `server.js` to change:

```javascript
const MQTT_BROKER = 'mqtts://mqtt.janks.dev.br:8883';
const MQTT_TOPIC = 'nautica';
const MQTT_USERNAME = 'aula';
const MQTT_PASSWORD = 'your-password';
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/telemetry` | GET | Get latest telemetry frame |
| `/api/status` | GET | Get MQTT connection status |
| `/api/publish` | POST | Publish command to MQTT |

---

## 📊 Telemetry Data Format

The system expects JSON telemetry in this format:

```json
{
  "t": 12.5,
  "roll": 5.2,
  "pitch": -1.3,
  "yaw": 45.0,
  "gyroX": 0.5,
  "gyroY": -0.2,
  "gyroZ": 1.1,
  "servoRollAngle": 15.0,
  "servoYawAngle": -10.0,
  "diskRollRPM": 3000,
  "diskYawRPM": 3000
}
```

| Field | Unit | Description |
|-------|------|-------------|
| `t` | seconds | Timestamp |
| `roll` | degrees | Roll angle |
| `pitch` | degrees | Pitch angle |
| `yaw` | degrees | Yaw angle |
| `gyroX/Y/Z` | deg/s | Angular velocities |
| `servoRollAngle` | degrees | Roll CMG gimbal angle |
| `servoYawAngle` | degrees | Yaw CMG gimbal angle |
| `diskRollRPM` | RPM | Roll flywheel speed |
| `diskYawRPM` | RPM | Yaw flywheel speed |

---

## 🛠️ Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run server` | Start MQTT bridge server |
| `npm run dev:all` | Start both frontend and server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Project Structure

```
├── src/
│   ├── components/           # React components
│   │   ├── Boat3DView.tsx       # 3D boat visualization
│   │   ├── RollCmg3D.tsx        # Roll CMG 3D model
│   │   ├── YawCmg3D.tsx         # Yaw CMG 3D model
│   │   ├── TelemetryPanel.tsx   # IMU data display
│   │   ├── ServoPanel.tsx       # Servo/RPM display
│   │   ├── TimeSeriesPlots.tsx  # Charts
│   │   └── PlaybackControls.tsx # Playback UI
│   ├── data/
│   │   ├── httpTelemetrySource.ts  # HTTP polling
│   │   ├── mockTelemetry.ts        # Simulated data
│   │   └── telemetrySource.ts      # Data abstraction
│   ├── simulation/
│   │   ├── cmgSimulation.ts     # CMG physics
│   │   └── pid.ts               # PID controller
│   ├── types/
│   │   └── telemetry.ts         # TypeScript types
│   ├── App.tsx                  # Main app
│   └── main.tsx                 # Entry point
├── scripts/                  # Arduino simulator scripts
├── server.js                 # MQTT bridge server
└── package.json
```

---

## 🧪 Testing Without Hardware

### Using Mock Data

The app includes a simulation mode that generates synthetic telemetry data. Select "Simulation" mode in the UI to use it.

### Arduino Simulator

To test with simulated serial data:

```bash
# Install serialport if needed
npm install serialport

# List available ports
node scripts/simulateArduino.js

# Run on specific port
node scripts/simulateArduino.js /dev/ttyUSB0
```

---

## 🔌 Hardware Setup

### Arduino/ESP32 Code

See `src/data/mainArduinoFile.cpp` for the reference Arduino implementation that:
- Reads IMU data (MPU6050)
- Controls servo motors
- Publishes telemetry via MQTT

### Required Hardware

- ESP32 or Arduino with WiFi
- MPU6050 IMU sensor
- 2x Servo motors for CMG gimbals
- 2x Brushless motors for flywheels

---

## 🛡️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Three.js | 3D Graphics |
| @react-three/fiber | React Three.js |
| Recharts | Charts |
| Tailwind CSS | Styling |
| Express | Backend Server |
| MQTT.js | MQTT Client |

---

## 📄 License

MIT License - feel free to use this project for your own boat stabilization experiments!

---

## 👥 Contributors

- Guilherme Avila - PUC-Rio Microprocessors Project

---

## 🔗 Links

- **Repository**: https://github.com/Gui-Avila/cmg-boat-stabilization
- **MQTT Broker**: mqtt.janks.dev.br:8883
