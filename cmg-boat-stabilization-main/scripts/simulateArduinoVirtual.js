/**
 * Simulador de Arduino Virtual - Cria um servidor TCP que simula Serial
 * 
 * Este script cria um servidor TCP que simula uma porta Serial virtual.
 * Útil para testar sem hardware real ou portas Serial físicas.
 * 
 * Uso:
 * 1. Execute: node scripts/simulateArduinoVirtual.js
 * 2. O servidor ficará escutando na porta 9999
 * 3. Use um cliente TCP para conectar (ou adapte o SerialTelemetrySource)
 * 
 * Alternativa: Use socat para criar portas virtuais:
 *   socat -d -d pty,raw,echo=0 pty,raw,echo=0
 */

const net = require('net');

// Configuração
const PORT = 9999;
const SAMPLE_RATE_HZ = 100; // 100 Hz = 10ms entre amostras
const DELAY_MS = 1000 / SAMPLE_RATE_HZ; // 10ms

// Simulação de leitura de sensores
let startTime = Date.now();

function readRoll(t) {
  return 5.0 * Math.sin(2 * Math.PI * 0.25 * t) + (Math.random() - 0.5) * 0.5;
}

function readPitch(t) {
  return 0.5 * Math.sin(2 * Math.PI * 0.1 * t) + (Math.random() - 0.5) * 0.3;
}

function readYaw(t) {
  return 3.0 * Math.sin(2 * Math.PI * 0.2 * t + Math.PI / 4) + (Math.random() - 0.5) * 0.4;
}

function readGyroX(t) {
  return 2 * Math.PI * 0.25 * 5.0 * Math.cos(2 * Math.PI * 0.25 * t) + (Math.random() - 0.5) * 2;
}

function readGyroY(t) {
  return 2 * Math.PI * 0.1 * 0.5 * Math.cos(2 * Math.PI * 0.1 * t) + (Math.random() - 0.5) * 1;
}

function readGyroZ(t) {
  return 2 * Math.PI * 0.2 * 3.0 * Math.cos(2 * Math.PI * 0.2 * t + Math.PI / 4) + (Math.random() - 0.5) * 1.5;
}

function readServoRoll(t, roll) {
  return -roll * 0.8 + (Math.random() - 0.5) * 1;
}

function readServoYaw(t, yaw) {
  return -yaw * 0.8 + (Math.random() - 0.5) * 1;
}

function readDiskRollRPM() {
  return 6000 + (Math.random() - 0.5) * 50;
}

function readDiskYawRPM() {
  return 6000 + (Math.random() - 0.5) * 50;
}

function createTelemetryFrame(t) {
  const roll = readRoll(t);
  const pitch = readPitch(t);
  const yaw = readYaw(t);
  
  return {
    t: t,
    roll: roll,
    pitch: pitch,
    yaw: yaw,
    gyroX: readGyroX(t),
    gyroY: readGyroY(t),
    gyroZ: readGyroZ(t),
    servoRollAngle: readServoRoll(t, roll),
    servoYawAngle: readServoYaw(t, yaw),
    diskRollRPM: readDiskRollRPM(),
    diskYawRPM: readDiskYawRPM(),
  };
}

// Criar servidor TCP
const server = net.createServer((socket) => {
  console.log('Cliente conectado:', socket.remoteAddress);
  
  let frameCount = 0;
  const clientStartTime = Date.now();
  let lastLogTime = Date.now();

  // Loop de envio de dados
  const interval = setInterval(() => {
    const elapsedSeconds = (Date.now() - clientStartTime) / 1000;
    const frame = createTelemetryFrame(elapsedSeconds);

    // Converter para JSON e enviar
    const jsonString = JSON.stringify(frame) + '\n';
    socket.write(jsonString);

    frameCount++;
    
    // Log a cada segundo
    const now = Date.now();
    if (now - lastLogTime >= 1000) {
      console.log(`[${elapsedSeconds.toFixed(1)}s] Frame #${frameCount} - Roll: ${frame.roll.toFixed(2)}°, Yaw: ${frame.yaw.toFixed(2)}°`);
      lastLogTime = now;
    }
  }, DELAY_MS);

  socket.on('close', () => {
    console.log('Cliente desconectado');
    clearInterval(interval);
  });

  socket.on('error', (err) => {
    console.error('Erro no socket:', err);
    clearInterval(interval);
  });
});

server.listen(PORT, () => {
  console.log(`\nSimulador de Arduino Virtual`);
  console.log(`Servidor TCP escutando na porta ${PORT}`);
  console.log(`Taxa de amostragem: ${SAMPLE_RATE_HZ} Hz (${DELAY_MS}ms entre amostras)`);
  console.log('\nAguardando conexões...');
  console.log('(Use Ctrl+C para parar)\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nParando simulador...');
  server.close();
  process.exit(0);
});

