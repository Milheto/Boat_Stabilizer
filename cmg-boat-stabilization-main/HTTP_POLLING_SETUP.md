# HTTP Polling Setup - Sem WebSocket

## Arquitetura

```
ESP32  →  MQTT Broker (TCP)  →  Backend Node.js (MQTT TCP)  →  HTTP API  →  React (HTTP Polling)
```

**Sem WebSocket em nenhum lugar!**

## Como Funciona

1. **ESP32**: Conecta ao MQTT broker via TCP (`mqtt://mqtt.janks.dev.br:8883`)
2. **Backend**: Conecta ao mesmo broker via MQTT TCP, recebe mensagens
3. **Backend**: Expõe endpoint HTTP `/api/telemetry` com os dados mais recentes
4. **React**: Faz polling HTTP a cada 100ms (10 Hz) no endpoint

## Instalação

### 1. Instalar dependências do backend

```bash
npm install express cors mqtt
npm install --save-dev @types/express @types/cors concurrently
```

### 2. Iniciar o servidor backend

```bash
npm run server
```

O servidor vai:
- Conectar ao MQTT broker (`mqtt://mqtt.janks.dev.br:1883`)
- Subscrever ao tópico `teste_guilherme`
- Escutar na porta `3001` para requisições HTTP

### 3. Iniciar o frontend

Em outro terminal:

```bash
npm run dev
```

Ou iniciar ambos juntos:

```bash
npm run dev:all
```

## Endpoints da API

### GET `/api/telemetry`

Retorna o último frame de telemetria recebido do MQTT.

**Resposta:**
```json
{
  "t": 1.23,
  "roll": 5.2,
  "pitch": 0.1,
  "yaw": -3.5,
  "gyroX": 2.1,
  "gyroY": 0.0,
  "gyroZ": -1.5,
  "servoRollAngle": 10.0,
  "servoYawAngle": -8.0,
  "diskRollRPM": 6000,
  "diskYawRPM": 6000,
  "serverTimestamp": 1234567890
}
```

**Status 204**: Nenhum dado recebido ainda.

### GET `/api/status`

Retorna status da conexão MQTT.

**Resposta:**
```json
{
  "connected": true,
  "topic": "teste_guilherme",
  "hasData": true,
  "lastUpdate": 1234567890
}
```

### POST `/api/publish`

Publica mensagem no MQTT (opcional, para comandos).

**Request:**
```json
{
  "topic": "device/command",
  "payload": "ON"
}
```

## Configuração

### Backend (`server.js`)

Edite as constantes no topo do arquivo:

```javascript
const MQTT_BROKER = 'mqtt://mqtt.janks.dev.br:1883';
const MQTT_TOPIC = 'teste_guilherme';
const MQTT_USERNAME = 'aula';
const MQTT_PASSWORD = 'zowmad-tavQev';
const PORT = 3001;
```

### Frontend (`App.tsx`)

A configuração está no estado `apiConfig`:

```typescript
const [apiConfig, setApiConfig] = useState({
  apiUrl: 'http://localhost:3001/api',
  pollingInterval: 100, // 100ms = 10 Hz
});
```

Você pode ajustar:
- **apiUrl**: URL do backend
- **pollingInterval**: Intervalo de polling em milissegundos

## Vantagens

✅ **Sem WebSocket**: Apenas HTTP simples
✅ **Compatível**: Funciona em qualquer navegador
✅ **Simples**: Fácil de debugar (requisições HTTP visíveis no DevTools)
✅ **Flexível**: Pode ajustar frequência de polling facilmente

## Desvantagens

⚠️ **Latência**: Polling adiciona latência (100ms mínimo)
⚠️ **Overhead**: Múltiplas requisições HTTP
⚠️ **Backend necessário**: Precisa rodar servidor Node.js

## Troubleshooting

### Backend não conecta ao MQTT

- Verifique se o broker está acessível
- Verifique credenciais (username/password)
- Verifique se a porta 1883 está aberta

### Frontend não recebe dados

- Verifique se o backend está rodando (`npm run server`)
- Verifique se o backend está conectado ao MQTT (veja logs do servidor)
- Verifique a URL da API no frontend
- Abra DevTools → Network e veja as requisições HTTP

### CORS errors

- O backend já tem CORS habilitado
- Se ainda tiver problemas, verifique se o backend está na mesma origem ou ajuste CORS no `server.js`

## Exemplo de Código ESP32

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  // Conectar WiFi
  WiFi.begin("SSID", "PASSWORD");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  // Conectar MQTT
  client.setServer("mqtt.janks.dev.br", 1883);
  client.connect("ESP32_Client", "aula", "zowmad-tavQev");
}

void loop() {
  // Publicar telemetria
  String json = "{";
  json += "\"t\":" + String(millis() / 1000.0) + ",";
  json += "\"roll\":" + String(roll) + ",";
  json += "\"yaw\":" + String(yaw);
  json += "}";
  
  client.publish("teste_guilherme", json.c_str());
  delay(100); // 10 Hz
}
```

