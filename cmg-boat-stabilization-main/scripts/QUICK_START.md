# Quick Start: Simular Arduino

## Opção 1: Usar Script Helper (Mais Fácil)

```bash
./scripts/startSimulator.sh
```

O script irá guiá-lo através das opções disponíveis.

## Opção 2: Criar Portas Virtuais Manualmente

### Passo 1: Instalar socat (se necessário)

**macOS:**
```bash
brew install socat
```

**Linux:**
```bash
sudo apt-get install socat
```

### Passo 2: Criar portas virtuais

```bash
./scripts/setupVirtualPorts.sh
```

Ou manualmente:
```bash
socat -d -d pty,raw,echo=0 pty,raw,echo=0
```

Você verá algo como:
```
2024/01/01 12:00:00 socat[12345] N PTY is /dev/pts/2
2024/01/01 12:00:01 socat[12346] N PTY is /dev/pts/3
```

### Passo 3: Usar uma das portas

Em outro terminal:
```bash
node scripts/simulateArduino.js /dev/pts/2
```

## Opção 3: Usar Porta Serial Real

Se você tem um Arduino ou dispositivo Serial conectado:

```bash
# Listar portas disponíveis
node scripts/simulateArduino.js

# Usar porta específica
node scripts/simulateArduino.js /dev/ttyUSB0  # Linux
node scripts/simulateArduino.js /dev/tty.usbserial-*  # macOS
node scripts/simulateArduino.js COM3          # Windows
```

## Opção 4: Usar WebSocket (Recomendado para Testes)

Se você não quer lidar com portas Serial, use WebSocket:

1. **Criar bridge Serial → WebSocket:**
   ```bash
   # Em um terminal
   node scripts/simulateArduino.js /dev/pts/2 | node scripts/serialToWebSocket.js
   ```

2. **Ou usar o servidor TCP virtual:**
   ```bash
   node scripts/simulateArduinoVirtual.js
   ```

3. **Conectar no app via WebSocket** (veja `REAL_DATA_INTEGRATION.md`)

## Troubleshooting

### Erro: "No such file or directory"
- A porta não existe. Crie portas virtuais primeiro ou use uma porta real.

### Erro: "Permission denied"
- No Linux, adicione seu usuário ao grupo dialout:
  ```bash
  sudo usermod -a -G dialout $USER
  # Faça logout e login novamente
  ```

### Erro: "Port is busy"
- Outro programa está usando a porta. Feche outros programas ou use outra porta.

### macOS: Portas não aparecem
- No macOS, portas USB aparecem como `/dev/tty.usbserial-*` ou `/dev/cu.usbserial-*`
- Portas Bluetooth aparecem como `/dev/tty.*`

## Próximos Passos

1. Inicie o simulador em um terminal
2. Abra o app web (`npm run dev`)
3. Selecione modo "Realtime" → "Serial"
4. Escolha a mesma porta
5. Veja os dados aparecendo!

