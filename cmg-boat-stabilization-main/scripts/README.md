# Scripts de Simulação

Scripts para simular um Arduino enviando dados de telemetria via Serial.

## Instalação

```bash
npm install serialport
```

## Scripts Disponíveis

### 1. `simulateArduino.js` - Simulador com Porta Serial Real

Simula um Arduino enviando dados via uma porta Serial física ou virtual.

**Uso:**
```bash
# Listar portas disponíveis
node scripts/simulateArduino.js

# Usar porta específica
node scripts/simulateArduino.js /dev/ttyUSB0  # Linux/Mac
node scripts/simulateArduino.js COM3          # Windows
```

**Requisitos:**
- Porta Serial disponível (física ou virtual)
- Biblioteca `serialport` instalada

**Criar Portas Virtuais (Linux/Mac):**
```bash
# Instalar socat
sudo apt-get install socat  # Linux
brew install socat          # Mac

# Criar par de portas virtuais
socat -d -d pty,raw,echo=0 pty,raw,echo=0

# Use uma das portas retornadas (ex: /dev/pts/2)
node scripts/simulateArduino.js /dev/pts/2
```

**Criar Portas Virtuais (Windows):**
- Use `com0com` ou `Virtual Serial Port Driver`
- Crie um par de portas virtuais (ex: COM3 <-> COM4)
- Use uma das portas no script

### 2. `simulateArduinoVirtual.js` - Servidor TCP Virtual

Cria um servidor TCP que simula Serial. Útil para testes sem portas Serial.

**Uso:**
```bash
node scripts/simulateArduinoVirtual.js
```

O servidor ficará escutando na porta **9999** e enviará dados JSON no formato esperado.

**Nota:** Este script cria um servidor TCP, não Serial. Para usar com `SerialTelemetrySource`, você precisaria adaptar o código ou usar uma ponte TCP->Serial.

## Formato de Dados

Ambos os scripts enviam dados JSON no formato:

```json
{
  "t": 0.123,
  "roll": 5.2,
  "pitch": 0.1,
  "yaw": -3.5,
  "gyroX": 2.1,
  "gyroY": 0.0,
  "gyroZ": -1.5,
  "servoRollAngle": 10.0,
  "servoYawAngle": -8.0,
  "diskRollRPM": 6000,
  "diskYawRPM": 6000
}
```

Uma mensagem por linha, terminada com `\n`.

## Taxa de Amostragem

Por padrão, ambos os scripts enviam dados a **100 Hz** (uma mensagem a cada 10ms).

Para alterar, modifique a constante `SAMPLE_RATE_HZ` no código.

## Testando com o Aplicativo

1. **Inicie o simulador:**
   ```bash
   node scripts/simulateArduino.js /dev/ttyUSB0
   ```

2. **No navegador:**
   - Abra o aplicativo
   - Selecione modo "Realtime"
   - Escolha "Serial" como fonte
   - Selecione a mesma porta Serial
   - Os dados devem começar a aparecer nos gráficos!

## Troubleshooting

### Erro: "Cannot find module 'serialport'"
```bash
npm install serialport
```

### Erro: "Port is busy"
- Feche outros programas que possam estar usando a porta
- Verifique se o aplicativo web não está conectado à mesma porta

### Erro: "Permission denied" (Linux)
```bash
sudo usermod -a -G dialout $USER
# Faça logout e login novamente
```

### Dados não aparecem no gráfico
1. Verifique se a porta está correta
2. Verifique se o formato JSON está correto (use `console.log` no código)
3. Verifique se o aplicativo está no modo "Realtime" e conectado à Serial

## Adaptando para Hardware Real

Para usar com um Arduino real, você só precisa modificar as funções de leitura de sensores:

```javascript
// Substitua estas funções por leituras reais do Arduino
function readRoll(t) {
  // return analogRead(ROLL_PIN) * SCALE_FACTOR;
  return 5.0 * Math.sin(2 * Math.PI * 0.25 * t);
}
```

Ou use o código Arduino fornecido no guia de integração (`REAL_DATA_INTEGRATION.md`).

