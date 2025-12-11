import express from 'express';
import cors from 'cors';
import mqtt from 'mqtt';

const app = express();
app.use(cors());
app.use(express.json());

// MQTT Broker configuration
// Note: Using 'mqtts' (Secure MQTT) on port 8883 as per Arduino example
const MQTT_BROKER = 'mqtts://mqtt.janks.dev.br:8883';
const MQTT_TOPIC = 'nautica';
const MQTT_USERNAME = 'aula';
const MQTT_PASSWORD = 'zowmad-tavQez'; // Correct password ending in 'z'

// Store latest telemetry data
let latestTelemetry = null;
let latestTimestamp = null;

// Connect to MQTT broker
// We use rejectUnauthorized: false to allow self-signed certificates if needed,
// similar to how the Arduino code uses a specific certificate.
console.log('Connecting to MQTT broker:', MQTT_BROKER);
const mqttClient = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  rejectUnauthorized: false, // Allow self-signed certs (important for 8883 without proper CA setup)
});

mqttClient.on('connect', () => {
  console.log('✅ MQTT connected to broker');
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('❌ MQTT subscription error:', err);
    } else {
      console.log('✅ Subscribed to topic:', MQTT_TOPIC);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    // Validate required field
    if (typeof data.t === 'number') {
      latestTelemetry = {
        t: data.t,
        roll: data.roll ?? 0,
        pitch: data.pitch ?? 0,
        yaw: data.yaw ?? 0,
        gyroX: data.gyroX ?? 0,
        gyroY: data.gyroY ?? 0,
        gyroZ: data.gyroZ ?? 0,
        servoRollAngle: data.servoRollAngle ?? 0,
        servoYawAngle: data.servoYawAngle ?? 0,
        diskRollRPM: data.diskRollRPM ?? 0,
        diskYawRPM: data.diskYawRPM ?? 0,
      };
      latestTimestamp = Date.now();
      console.log(`📨 Received telemetry: t=${latestTelemetry.t.toFixed(2)}s, roll=${latestTelemetry.roll.toFixed(2)}°`);
    } else {
      console.warn('⚠️ Invalid telemetry frame (missing t field):', data);
    }
  } catch (error) {
    console.error('❌ Error parsing MQTT message:', error);
    console.error('Raw message:', message.toString().substring(0, 200));
  }
});

mqttClient.on('error', (error) => {
  console.error('❌ MQTT error:', error);
});

mqttClient.on('close', () => {
  console.log('⚠️ MQTT connection closed');
});

mqttClient.on('offline', () => {
  console.log('⚠️ MQTT client offline');
});

// HTTP endpoint for polling latest telemetry
app.get('/api/telemetry', (req, res) => {
  if (latestTelemetry) {
    res.json({
      ...latestTelemetry,
      serverTimestamp: latestTimestamp,
    });
  } else {
    res.status(204).json({ message: 'No data received yet' });
  }
});

// HTTP endpoint to get connection status
app.get('/api/status', (req, res) => {
  res.json({
    connected: mqttClient.connected,
    topic: MQTT_TOPIC,
    hasData: latestTelemetry !== null,
    lastUpdate: latestTimestamp,
  });
});

// HTTP endpoint to publish commands (optional, for future use)
app.post('/api/publish', (req, res) => {
  const { topic, payload } = req.body;
  
  if (!topic || payload === undefined) {
    return res.status(400).json({ error: 'topic and payload required' });
  }

  mqttClient.publish(topic, JSON.stringify(payload), (err) => {
    if (err) {
      console.error('❌ MQTT publish failed:', err);
      return res.status(500).json({ error: 'MQTT publish failed' });
    }
    res.json({ ok: true });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 HTTP API server listening on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /api/telemetry - Get latest telemetry data`);
  console.log(`   GET  /api/status - Get connection status`);
  console.log(`   POST /api/publish - Publish MQTT message`);
});

