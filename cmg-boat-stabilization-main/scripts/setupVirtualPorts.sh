#!/bin/bash

# Script para criar portas virtuais no macOS/Linux
# Uso: ./setupVirtualPorts.sh

echo "=== Setup de Portas Virtuais ==="
echo ""

# Verificar se socat está instalado
if ! command -v socat &> /dev/null; then
    echo "❌ socat não está instalado."
    echo ""
    echo "Para instalar:"
    echo "  macOS: brew install socat"
    echo "  Linux: sudo apt-get install socat"
    echo ""
    read -p "Deseja instalar agora? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install socat
            else
                echo "❌ Homebrew não encontrado. Instale manualmente: brew install socat"
                exit 1
            fi
        else
            echo "Execute: sudo apt-get install socat"
            exit 1
        fi
    else
        echo "Você pode usar o servidor TCP virtual como alternativa:"
        echo "  node scripts/simulateArduinoVirtual.js"
        exit 1
    fi
fi

echo "✅ socat encontrado"
echo ""
echo "Criando par de portas virtuais..."
echo "Pressione Ctrl+C para parar quando terminar de usar."
echo ""

# Criar portas virtuais
socat -d -d pty,raw,echo=0 pty,raw,echo=0

