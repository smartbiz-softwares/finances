#!/bin/bash
# Script de Instalación y Configuración del Servidor de Transcripción de Voz Whisper (setup-whisper.sh)
# Ejecución en VPS: sudo bash setup-whisper.sh

set -e

echo "🎙️ Iniciando la instalación del Servidor Whisper C++ (Puerto 8080)..."

# 1. Instalar dependencias de compilación y audio
echo "📦 Instalando dependencias de C++ y FFmpeg..."
sudo apt update
sudo apt install -y build-essential cmake git ffmpeg wget

# 2. Clonar whisper.cpp en /opt/whisper.cpp
echo "📥 Clonando repositorio whisper.cpp..."
if [ -d "/opt/whisper.cpp" ]; then
  sudo rm -rf /opt/whisper.cpp
fi
sudo git clone https://github.com/ggerganov/whisper.cpp.git /opt/whisper.cpp
sudo chown -R $USER:$USER /opt/whisper.cpp
cd /opt/whisper.cpp

# 3. Descargar el modelo Multilingüe Whisper (Modelo base en español ~140MB)
echo "🧠 Descargando el modelo Whisper (ggml-base.bin)..."
bash ./models/download-ggml-model.sh base

# 4. Compilar el servidor HTTP whisper-server
echo "🔨 Compilando whisper-server con C++..."
cmake -B build
cmake --build build --config Release --target whisper-server

# 5. Iniciar y registrar el servicio en PM2 (Escuchando en 127.0.0.1:8080)
echo "🚀 Arrancando servicio Whisper en PM2 (Puerto 8080)..."
pm2 delete whisper-api || true
pm2 start "/opt/whisper.cpp/build/bin/whisper-server -m /opt/whisper.cpp/models/ggml-base.bin --port 8080 --host 127.0.0.1" --name "whisper-api"
pm2 save

echo "✅ Servidor Whisper instalado y activo en http://127.0.0.1:8080/inference."
