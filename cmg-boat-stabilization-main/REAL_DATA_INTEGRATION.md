# Guia de Integração: Dados Reais de Comunicação

Este guia explica como adaptar o sistema para receber dados reais de comunicação (WebSocket, Serial, etc.) ao invés de dados mock/simulados.

---

## 1. Arquitetura Atual

O sistema já está preparado para diferentes fontes de dados através da interface `TelemetrySource`:

```typescript
interface TelemetrySource {
  getInitialData(): Promise<TelemetryFrame[]>;
  onUpdate?: (callback: (frame: TelemetryFrame) => void) => void;
}
```

**Arquivos criados:**
- `src/data/websocketTelemetrySource.ts` - Implementação para WebSocket
- `src/data/serialTelemetrySource.ts` - Implementação para Serial (Web Serial API)
- `src/data/mqttTelemetrySource.ts` - Implementação para MQTT

---

## 2. Opção 1: WebSocket (Recomendado)

### 2.1. Quando Usar

- **Servidor intermediário** (Node.js, Python, etc.) que recebe dados do hardware
- **Comunicação via rede** (WiFi, Ethernet)
- **Múltiplos clientes** podem conectar simultaneamente
- **Mais flexível** para desenvolvimento e produção

### 2.2. Estrutura do Servidor

Você precisa de um servidor WebSocket que:
1. Recebe dados do hardware (Arduino, STM32, etc.) via Serial/USB
2. Converte para formato JSON
3. Envia para clientes WebSocket

**Exemplo de servidor Node.js:**

```javascript
// server.js
const WebSocket = require('ws');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const wss = new WebSocket.Server({ port: 8080 });
const port = new SerialPort('/dev/ttyUSB0', { baudRate: 115200 });
const parser = port.pipe(new Readline({ delimiter: '\n' }));

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Forward serial data to WebSocket clients
  parser.on('data', (line) => {
    try {
      const data = JSON.parse(line);
      ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Error parsing serial data:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

### 2.3. Formato de Mensagem Esperado

O servidor deve enviar mensagens JSON no formato:

```json
{
  "t": 0.123,              // tempo em segundos
  "roll": 5.2,            // graus
  "pitch": 0.1,           // graus
  "yaw": -3.5,            // graus
  "gyroX": 2.1,           // deg/s
  "gyroY": 0.0,           // deg/s
  "gyroZ": -1.5,          // deg/s
  "servoRollAngle": 10.0, // graus
  "servoYawAngle": -8.0,  // graus
  "diskRollRPM": 6000,    // RPM
  "diskYawRPM": 6000      // RPM
}
```

### 2.4. Integração no App.tsx

Modifique `src/App.tsx` para usar WebSocket:

```typescript
import { WebSocketTelemetrySource } from './data/websocketTelemetrySource';

// Adicione um novo modo
type Mode = 'playback' | 'simulation' | 'realtime';

function App() {
  const [mode, setMode] = useState<Mode>('playback');
  const [wsSource, setWsSource] = useState<WebSocketTelemetrySource | null>(null);
  
  // ... outros estados ...

  // Inicializar WebSocket quando mudar para modo realtime
  useEffect(() => {
    if (mode === 'realtime') {
      const source = new WebSocketTelemetrySource('ws://localhost:8080');
      
      source.connect().then(() => {
        setWsSource(source);
        
        // Subscribe to updates
        source.onUpdate((frame) => {
          // Adiciona ponto ao buffer em tempo real
          setTelemetry(prev => {
            const newData = [...prev, frame];
            // Limita tamanho do buffer
            if (newData.length > 3000) {
              return newData.slice(-3000);
            }
            return newData;
          });
          
          // Atualiza frame atual
          setCurrentFrame(frame);
          setCurrentTime(frame.t);
        });
      }).catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
      });
    } else {
      // Cleanup
      if (wsSource) {
        wsSource.disconnect();
        setWsSource(null);
      }
    }
    
    return () => {
      if (wsSource) {
        wsSource.disconnect();
      }
    };
  }, [mode]);
  
  // ... resto do código ...
}
```

---

## 3. Opção 2: Serial Direto (Web Serial API)

### 3.1. Quando Usar

- **Comunicação direta** com Arduino/STM32 via USB
- **Sem servidor intermediário** necessário
- **Apenas Chrome/Edge** (Web Serial API não suportado em Firefox/Safari)
- **Mais simples** para prototipagem

### 3.2. Requisitos do Hardware

O dispositivo deve enviar dados em formato JSON, uma linha por vez:

```
{"t":0.123,"roll":5.2,"yaw":-3.5,...}\n
{"t":0.133,"roll":5.1,"yaw":-3.4,...}\n
```

**Exemplo de código Arduino:**

```cpp
#include <ArduinoJson.h>

void setup() {
  Serial.begin(115200);
}

void loop() {
  // Ler sensores
  float roll = readRoll();
  float yaw = readYaw();
  // ... outros sensores ...
  
  // Criar JSON
  StaticJsonDocument<200> doc;
  doc["t"] = millis() / 1000.0;  // tempo em segundos
  doc["roll"] = roll;
  doc["yaw"] = yaw;
  doc["gyroX"] = readGyroX();
  doc["servoRollAngle"] = readServoRoll();
  doc["diskRollRPM"] = readDiskRollRPM();
  // ... outros campos ...
  
  // Enviar JSON
  serializeJson(doc, Serial);
  Serial.println();  // Nova linha
  
  delay(10);  // 100 Hz = 10ms
}
```

### 3.3. Integração no App.tsx

```typescript
import { SerialTelemetrySource } from './data/serialTelemetrySource';

function App() {
  const [serialSource, setSerialSource] = useState<SerialTelemetrySource | null>(null);
  
  // Botão para conectar Serial
  const handleConnectSerial = async () => {
    try {
      const source = new SerialTelemetrySource();
      await source.connect();
      
      setSerialSource(source);
      
      // Subscribe to updates
      source.onUpdate((frame) => {
        setTelemetry(prev => {
          const newData = [...prev, frame];
          if (newData.length > 3000) {
            return newData.slice(-3000);
          }
          return newData;
        });
        
        setCurrentFrame(frame);
        setCurrentTime(frame.t);
      });
    } catch (error) {
      console.error('Failed to connect to serial:', error);
      alert('Failed to connect to serial port. Make sure you selected the correct port.');
    }
  };
  
  // ... resto do código ...
}
```

---

## 4. Opção 3: MQTT (Ideal para IoT)

### 4.1. Quando Usar

- **Sistemas IoT distribuídos** com múltiplos dispositivos
- **Comunicação via rede** (WiFi, Ethernet, LoRaWAN gateway)
- **Broker MQTT** (Mosquitto, HiveMQ, AWS IoT Core, etc.)
- **Múltiplos clientes** podem se inscrever no mesmo tópico
- **QoS e persistência** de mensagens
- **Padrão da indústria** para IoT

### 4.2. Instalação

Primeiro, instale a biblioteca MQTT:

```bash
npm install mqtt
```

### 4.3. Configuração do Broker MQTT

Você precisa de um broker MQTT. Opções populares:

**Opção A: Mosquitto (Local)**
```bash
# Linux/Mac
brew install mosquitto  # Mac
sudo apt-get install mosquitto mosquitto-clients  # Linux

# Iniciar broker
mosquitto -p 1883

# Com WebSocket (para browser)
mosquitto -p 1883 -c mosquitto.conf
```

**mosquitto.conf:**
```
listener 1883
listener 9001
protocol websockets
```

**Opção B: HiveMQ Cloud (Gratuito)**
- Acesse https://www.hivemq.com/mqtt-cloud-broker/
- Crie uma conta gratuita
- Obtenha URL do broker (ex: `wss://your-broker.hivemq.cloud:8884`)

**Opção C: AWS IoT Core**
- Configure no AWS Console
- Use endpoint WebSocket (wss://)

### 4.4. Estrutura do Sistema

```
[Arduino/ESP32] --Serial/USB--> [Bridge Node.js] --MQTT--> [Broker MQTT] <--MQTT/WS--> [Browser App]
```

**Exemplo de Bridge Node.js (Serial → MQTT):**

```javascript
// mqtt-bridge.js
const mqtt = require('mqtt');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// Conectar ao broker MQTT
const mqttClient = mqtt.connect('mqtt://localhost:1883', {
  clientId: 'boat-bridge',
  clean: true,
});

const mqttTopic = 'boat/telemetry';

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Conectar ao Serial
  const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  
  // Forward serial data to MQTT
  parser.on('data', (line) => {
    try {
      const data = JSON.parse(line);
      mqttClient.publish(mqttTopic, JSON.stringify(data), { qos: 0 });
    } catch (error) {
      console.error('Error parsing serial data:', error);
    }
  });
  
  port.on('error', (error) => {
    console.error('Serial port error:', error);
  });
});

mqttClient.on('error', (error) => {
  console.error('MQTT error:', error);
});
```

**Instalar dependências:**
```bash
npm install mqtt serialport @serialport/parser-readline
```

### 4.5. Formato de Mensagem Esperado

O dispositivo/bridge deve publicar mensagens JSON no tópico MQTT:

```json
{
  "t": 0.123,              // tempo em segundos
  "roll": 5.2,            // graus
  "pitch": 0.1,           // graus
  "yaw": -3.5,            // graus
  "gyroX": 2.1,           // deg/s
  "gyroY": 0.0,           // deg/s
  "gyroZ": -1.5,          // deg/s
  "servoRollAngle": 10.0, // graus
  "servoYawAngle": -8.0,  // graus
  "diskRollRPM": 6000,    // RPM
  "diskYawRPM": 6000      // RPM
}
```

### 4.6. Integração no App.tsx

```typescript
import { MQTTTelemetrySource } from './data/mqttTelemetrySource';

function App() {
  const [mqttSource, setMqttSource] = useState<MQTTTelemetrySource | null>(null);
  
  // Inicializar MQTT quando mudar para modo realtime
  useEffect(() => {
    if (mode === 'realtime') {
      // Para broker local com WebSocket
      const source = new MQTTTelemetrySource(
        'ws://localhost:9001',  // WebSocket endpoint do broker
        'boat/telemetry',       // Tópico MQTT
        {
          // Opções opcionais
          username: 'user',     // Se broker requer autenticação
          password: 'pass',
          clientId: 'boat-visualizer',
        }
      );
      
      // Para HiveMQ Cloud (usar wss://)
      // const source = new MQTTTelemetrySource(
      //   'wss://your-broker.hivemq.cloud:8884',
      //   'boat/telemetry',
      //   {
      //     username: 'your-username',
      //     password: 'your-password',
      //   }
      // );
      
      source.connect().then(() => {
        setMqttSource(source);
        setIsConnected(true);
        
        // Subscribe to updates
        source.onUpdate?.((frame) => {
          // Adiciona ponto ao buffer em tempo real
          setTelemetry(prev => {
            const newData = [...prev, frame];
            if (newData.length > 3000) {
              return newData.slice(-3000);
            }
            return newData;
          });
          
          // Atualiza frame atual
          setCurrentFrame(frame);
          setCurrentTime(frame.t);
        });
      }).catch((error) => {
        console.error('Failed to connect to MQTT:', error);
        setIsConnected(false);
      });
    } else {
      // Cleanup
      if (mqttSource) {
        mqttSource.disconnect();
        setMqttSource(null);
      }
    }
    
    return () => {
      if (mqttSource) {
        mqttSource.disconnect();
      }
    };
  }, [mode]);
  
  // ... resto do código ...
}
```

### 4.7. Exemplo de Código ESP32 (Publicando direto no MQTT)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* mqtt_server = "your-broker.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "boat/telemetry";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Conectar WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  
  // Conectar MQTT
  client.setServer(mqtt_server, mqtt_port);
  while (!client.connected()) {
    if (client.connect("ESP32Boat")) {
      Serial.println("MQTT connected");
    } else {
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    client.connect("ESP32Boat");
  }
  client.loop();
  
  // Ler sensores
  float roll = readRoll();
  float yaw = readYaw();
  // ... outros sensores ...
  
  // Criar JSON
  StaticJsonDocument<256> doc;
  doc["t"] = millis() / 1000.0;
  doc["roll"] = roll;
  doc["pitch"] = 0.0;
  doc["yaw"] = yaw;
  doc["gyroX"] = readGyroX();
  doc["gyroY"] = 0.0;
  doc["gyroZ"] = readGyroZ();
  doc["servoRollAngle"] = readServoRoll();
  doc["servoYawAngle"] = readServoYaw();
  doc["diskRollRPM"] = readDiskRollRPM();
  doc["diskYawRPM"] = readDiskYawRPM();
  
  // Publicar no MQTT
  char buffer[256];
  serializeJson(doc, buffer);
  client.publish(mqtt_topic, buffer);
  
  delay(10);  // 100 Hz
}
```

### 4.8. Vantagens do MQTT

- ✅ **Padrão da indústria** para IoT
- ✅ **QoS levels** (0, 1, 2) para garantir entrega
- ✅ **Retained messages** (última mensagem mantida no broker)
- ✅ **Wildcards** de tópicos (`boat/+/telemetry`)
- ✅ **Last Will and Testament** (notifica quando cliente desconecta)
- ✅ **Escalável** (múltiplos clientes, múltiplos tópicos)
- ✅ **Suporte a TLS/SSL** (wss://)

### 4.9. Configuração de Broker com WebSocket

Para usar MQTT no browser, o broker precisa suportar WebSocket. Exemplo com Mosquitto:

**mosquitto.conf:**
```
# Porta padrão MQTT
listener 1883

# Porta WebSocket para browser
listener 9001
protocol websockets

# Permitir conexões anônimas (ou configurar autenticação)
allow_anonymous true
```

**Iniciar:**
```bash
mosquitto -c mosquitto.conf
```

**URL no código:**
```typescript
const source = new MQTTTelemetrySource('ws://localhost:9001', 'boat/telemetry');
```

---

## 5. Implementação Completa: Modo Realtime

Vou criar uma versão completa do App.tsx com suporte a dados reais:

### 4.1. Adicionar Modo Realtime

```typescript
type Mode = 'playback' | 'simulation' | 'realtime';
```

### 4.2. Gerenciar Conexão WebSocket/Serial

```typescript
// Estado para fonte de dados realtime
const [realtimeSource, setRealtimeSource] = useState<TelemetrySource | null>(null);
const [isConnected, setIsConnected] = useState(false);

// Inicializar fonte de dados realtime
useEffect(() => {
  if (mode === 'realtime') {
    // Escolha entre WebSocket ou Serial
    const source = new WebSocketTelemetrySource('ws://localhost:8080');
    // OU: const source = new SerialTelemetrySource();
    
    source.connect().then(() => {
      setRealtimeSource(source);
      setIsConnected(true);
      
      // Subscribe to updates
      source.onUpdate?.((frame) => {
        // Adiciona ponto ao buffer
        setTelemetry(prev => {
          const newData = [...prev, frame];
          return newData.length > 3000 ? newData.slice(-3000) : newData;
        });
        
        // Atualiza frame atual
        setCurrentFrame(frame);
        setCurrentTime(frame.t);
      });
    }).catch((error) => {
      console.error('Connection failed:', error);
      setIsConnected(false);
    });
  } else {
    // Cleanup
    if (realtimeSource) {
      if (realtimeSource instanceof WebSocketTelemetrySource) {
        realtimeSource.disconnect();
      } else if (realtimeSource instanceof SerialTelemetrySource) {
        realtimeSource.disconnect();
      }
      setRealtimeSource(null);
      setIsConnected(false);
    }
  }
  
  return () => {
    // Cleanup on unmount
    if (realtimeSource) {
      if (realtimeSource instanceof WebSocketTelemetrySource) {
        realtimeSource.disconnect();
      } else if (realtimeSource instanceof SerialTelemetrySource) {
        realtimeSource.disconnect();
      }
    }
  };
}, [mode]);
```

---

## 6. Exemplo de Servidor WebSocket Completo

**server.js (Node.js):**

```javascript
const WebSocket = require('ws');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const wss = new WebSocket.Server({ port: 8080 });
const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected');
  clients.add(ws);
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Forward serial data to all WebSocket clients
parser.on('data', (line) => {
  try {
    const data = JSON.parse(line);
    
    // Broadcast to all connected clients
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } catch (error) {
    console.error('Error parsing serial data:', error, 'Line:', line);
  }
});

port.on('error', (error) => {
  console.error('Serial port error:', error);
});

console.log('WebSocket server running on ws://localhost:8080');
```

**Instalar dependências:**
```bash
npm install ws serialport @serialport/parser-readline
```

---

## 7. Exemplo de Código Arduino

```cpp
#include <ArduinoJson.h>

// Simulação de leitura de sensores
float readRoll() { return 5.0 * sin(millis() / 1000.0); }
float readYaw() { return 3.0 * sin(millis() / 1200.0); }
float readGyroX() { return 2.0 * cos(millis() / 1000.0); }
float readServoRoll() { return -5.0 * sin(millis() / 1000.0); }
float readDiskRollRPM() { return 6000 + random(-50, 50); }

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);
}

void loop() {
  StaticJsonDocument<256> doc;
  
  float t = millis() / 1000.0;
  
  doc["t"] = t;
  doc["roll"] = readRoll();
  doc["pitch"] = 0.0;
  doc["yaw"] = readYaw();
  doc["gyroX"] = readGyroX();
  doc["gyroY"] = 0.0;
  doc["gyroZ"] = readGyroX() * 0.5;
  doc["servoRollAngle"] = readServoRoll();
  doc["servoYawAngle"] = -readYaw() * 0.8;
  doc["diskRollRPM"] = readDiskRollRPM();
  doc["diskYawRPM"] = readDiskRollRPM();
  
  serializeJson(doc, Serial);
  Serial.println();
  
  delay(10);  // 100 Hz
}
```

---

## 8. Checklist de Integração

- [ ] Escolher método: WebSocket, Serial ou MQTT
- [ ] Implementar servidor (se WebSocket) ou código Arduino (se Serial)
- [ ] Testar formato JSON de mensagens
- [ ] Integrar `WebSocketTelemetrySource`, `SerialTelemetrySource` ou `MQTTTelemetrySource` no App.tsx
- [ ] Adicionar botão de conexão na UI
- [ ] Adicionar indicador de status de conexão
- [ ] Testar recebimento de dados
- [ ] Verificar gráficos atualizando em tempo real
- [ ] Ajustar taxa de atualização se necessário

---

## 9. Troubleshooting

### Problema: Dados não aparecem no gráfico

**Soluções:**
1. Verifique se a conexão está estabelecida (`isConnected === true`)
2. Verifique formato JSON das mensagens (use `console.log` no `onUpdate`)
3. Verifique se `setTelemetry` está sendo chamado
4. Verifique se `TimeSeriesPlots` está recebendo o array `telemetry` atualizado

### Problema: WebSocket desconecta frequentemente

**Soluções:**
1. Implemente reconexão automática (já incluído em `WebSocketTelemetrySource`)
2. Verifique latência de rede
3. Adicione heartbeat/ping para manter conexão viva

### Problema: Serial não conecta

**Soluções:**
1. Verifique se está usando Chrome/Edge (Web Serial API)
2. Verifique permissões do navegador
3. Verifique se porta está correta
4. Verifique baud rate (deve ser 115200 ou o configurado no hardware)

### Problema: MQTT não conecta

**Soluções:**
1. Verifique se o broker está rodando
2. Verifique URL do broker (use `ws://` ou `wss://` para WebSocket)
3. Verifique se o broker suporta WebSocket (porta 9001 geralmente)
4. Verifique credenciais (username/password) se necessário
5. Verifique firewall/portas abertas
6. Teste conexão com cliente MQTT (MQTT.fx, mosquitto_sub)

---

## 10. Próximos Passos

1. **Implementar no App.tsx**: Adicionar modo "realtime" com botão de conexão
2. **Adicionar UI**: Indicador de conexão, botão de desconectar
3. **Adicionar tratamento de erros**: Mensagens de erro amigáveis
4. **Otimizar performance**: Throttling de atualizações se necessário
5. **Adicionar gravação**: Salvar dados recebidos para playback posterior

---

## Conclusão

O sistema já está preparado para receber dados reais! Basta:
1. Escolher WebSocket, Serial ou MQTT
2. Implementar servidor/hardware que envia JSON no formato correto
3. Integrar a fonte de dados no App.tsx
4. Testar e ajustar conforme necessário

Os arquivos `websocketTelemetrySource.ts`, `serialTelemetrySource.ts` e `mqttTelemetrySource.ts` já estão prontos para uso!

### Comparação Rápida

| Método | Quando Usar | Vantagens | Desvantagens |
|--------|-------------|-----------|--------------|
| **WebSocket** | Servidor intermediário simples | Simples, direto | Precisa servidor próprio |
| **Serial** | Prototipagem rápida | Sem servidor, direto | Apenas Chrome/Edge |
| **MQTT** | Sistemas IoT, múltiplos dispositivos | Padrão indústria, escalável, QoS | Precisa broker MQTT |



