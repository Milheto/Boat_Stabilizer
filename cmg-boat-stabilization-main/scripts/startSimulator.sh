#!/bin/bash

# Script helper para iniciar o simulador de Arduino
# Uso: ./startSimulator.sh

echo "=== Simulador de Arduino ==="
echo ""

# Verificar se serialport está instalado
if ! node -e "require('serialport')" 2>/dev/null; then
    echo "❌ Biblioteca serialport não encontrada."
    echo "Instalando..."
    npm install serialport
fi

echo ""
echo "Escolha uma opção:"
echo "1. Listar portas disponíveis"
echo "2. Usar porta específica"
echo "3. Criar portas virtuais (requer socat)"
echo "4. Usar servidor TCP virtual (não requer portas Serial)"
echo ""
read -p "Opção (1-4): " option

case $option in
    1)
        echo ""
        node scripts/simulateArduino.js
        ;;
    2)
        echo ""
        read -p "Digite o caminho da porta (ex: /dev/ttyUSB0 ou COM3): " port
        echo ""
        node scripts/simulateArduino.js "$port"
        ;;
    3)
        echo ""
        echo "⚠️  Abra outro terminal e execute:"
        echo "   ./scripts/setupVirtualPorts.sh"
        echo ""
        echo "Depois, use uma das portas retornadas neste script."
        echo ""
        read -p "Digite o caminho da porta virtual (ex: /dev/pts/2): " port
        echo ""
        node scripts/simulateArduino.js "$port"
        ;;
    4)
        echo ""
        echo "Iniciando servidor TCP virtual na porta 9999..."
        echo "⚠️  Nota: Este servidor TCP não funciona diretamente com SerialTelemetrySource."
        echo "   Use WebSocket ou MQTT para conectar ao servidor TCP."
        echo ""
        node scripts/simulateArduinoVirtual.js
        ;;
    *)
        echo "Opção inválida"
        exit 1
        ;;
esac

