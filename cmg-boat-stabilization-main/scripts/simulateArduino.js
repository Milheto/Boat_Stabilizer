/**
 * Simulador de Arduino - Envia dados de telemetria via Serial
 * 
 * Este script simula um Arduino enviando dados JSON via porta Serial.
 * 
 * Uso:
 * 1. Instale dependências: npm install serialport
 * 2. Execute: node scripts/simulateArduino.js
 * 
 * Para usar com hardware real, conecte o Arduino e ajuste o path da porta.
 */

const { SerialPort } = require('serialport');

// Configuração
const BAUD_RATE = 115200;
const SAMPLE_RATE_HZ = 100; // 100 Hz = 10ms entre amostras
const DELAY_MS = 1000 / SAMPLE_RATE_HZ; // 10ms

// Simulação de leitura de sensores
let startTime = Date.now();

function readRoll(t) {
  // Simula oscilação de roll (período ~4 segundos)
  return 5.0 * Math.sin(2 * Math.PI * 0.25 * t) + (Math.random() - 0.5) * 0.5;
}

function readPitch(t) {
  // Simula pitch pequeno com ruído
  return 0.5 * Math.sin(2 * Math.PI * 0.1 * t) + (Math.random() - 0.5) * 0.3;
}

function readYaw(t) {
  // Simula oscilação de yaw (período ~5 segundos)
  return 3.0 * Math.sin(2 * Math.PI * 0.2 * t + Math.PI / 4) + (Math.random() - 0.5) * 0.4;
}

function readGyroX(t) {
  // Derivada do roll + ruído
  return 2 * Math.PI * 0.25 * 5.0 * Math.cos(2 * Math.PI * 0.25 * t) + (Math.random() - 0.5) * 2;
}

function readGyroY(t) {
  // Derivada do pitch + ruído
  return 2 * Math.PI * 0.1 * 0.5 * Math.cos(2 * Math.PI * 0.1 * t) + (Math.random() - 0.5) * 1;
}

function readGyroZ(t) {
  // Derivada do yaw + ruído
  return 2 * Math.PI * 0.2 * 3.0 * Math.cos(2 * Math.PI * 0.2 * t + Math.PI / 4) + (Math.random() - 0.5) * 1.5;
}

function readServoRoll(t, roll) {
  // Servo tenta compensar roll (controle proporcional)
  return -roll * 0.8 + (Math.random() - 0.5) * 1;
}

function readServoYaw(t, yaw) {
  // Servo tenta compensar yaw (controle proporcional)
  return -yaw * 0.8 + (Math.random() - 0.5) * 1;
}

function readDiskRollRPM() {
  // RPM constante com pequeno ruído
  return 6000 + (Math.random() - 0.5) * 50;
}

function readDiskYawRPM() {
  // RPM constante com pequeno ruído
  return 6000 + (Math.random() - 0.5) * 50;
}

// Função para criar frame de telemetria
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

// Função principal
function simulateArduino(portPath) {
  console.log(`Conectando à porta Serial: ${portPath}`);
  console.log(`Baud rate: ${BAUD_RATE}`);
  console.log(`Taxa de amostragem: ${SAMPLE_RATE_HZ} Hz (${DELAY_MS}ms entre amostras)`);
  console.log('Enviando dados de telemetria simulados...\n');

  const port = new SerialPort({
    path: portPath,
    baudRate: BAUD_RATE,
  });

  port.on('open', () => {
    console.log('Porta Serial aberta!');
    console.log('Enviando dados... (Ctrl+C para parar)\n');

    let frameCount = 0;
    const startTime = Date.now();

    // Loop de envio de dados
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      const frame = createTelemetryFrame(elapsedSeconds);

      // Converter para JSON e enviar
      const jsonString = JSON.stringify(frame) + '\n';
      port.write(jsonString);

      frameCount++;
      
      // Log a cada segundo
      if (frameCount % SAMPLE_RATE_HZ === 0) {
        console.log(`[${elapsedSeconds.toFixed(1)}s] Frame #${frameCount} - Roll: ${frame.roll.toFixed(2)}°, Yaw: ${frame.yaw.toFixed(2)}°`);
      }
    }, DELAY_MS);

    // Cleanup on close
    port.on('close', () => {
      clearInterval(interval);
      console.log('\nPorta Serial fechada.');
    });

    // Handle errors
    port.on('error', (err) => {
      console.error('Erro na porta Serial:', err);
      clearInterval(interval);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nParando simulador...');
      clearInterval(interval);
      port.close();
      process.exit(0);
    });
  });

  port.on('error', (err) => {
    console.error('Erro ao abrir porta Serial:', err);
    console.error('\nDica: Verifique se a porta está correta e não está sendo usada por outro programa.');
    process.exit(1);
  });
}

// Listar portas disponíveis
function listPorts() {
  SerialPort.list()
    .then((ports) => {
      console.log('\nPortas Serial disponíveis:');
      if (ports.length === 0) {
        console.log('Nenhuma porta encontrada.');
        console.log('\nPara simular sem hardware real, você pode:');
        console.log('1. Usar um par de portas virtuais (socat, com0com, etc.)');
        console.log('2. Usar um Arduino real conectado via USB');
        console.log('3. Usar o modo WebSocket/MQTT ao invés de Serial\n');
      } else {
        ports.forEach((port, index) => {
          console.log(`${index + 1}. ${port.path} - ${port.manufacturer || 'Unknown'}`);
        });
        console.log('\nUse: node scripts/simulateArduino.js <porta>');
        console.log('Exemplo: node scripts/simulateArduino.js /dev/ttyUSB0');
        console.log('         node scripts/simulateArduino.js COM3\n');
      }
    })
    .catch((err) => {
      console.error('Erro ao listar portas:', err);
    });
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Simulador de Arduino - Envio de Telemetria via Serial\n');
  console.log('Uso: node scripts/simulateArduino.js <porta>');
  console.log('Exemplo: node scripts/simulateArduino.js /dev/ttyUSB0');
  console.log('         node scripts/simulateArduino.js COM3\n');
  listPorts();
} else {
  const portPath = args[0];
  simulateArduino(portPath);
}

