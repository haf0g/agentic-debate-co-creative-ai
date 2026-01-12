#!/bin/bash

echo "=========================================="
echo "   🚀 CoCreate AI - WSL Launcher"
echo "=========================================="

# Fonction de nettoyage pour tuer les processus en quittant
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    if [ ! -z "$PYTHON_PID" ]; then kill $PYTHON_PID 2>/dev/null; fi
    if [ ! -z "$NODE_PID" ]; then kill $NODE_PID 2>/dev/null; fi
    exit
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

echo "1. 🐍 Setting up Python Backend (Port 8000)..."
cd agents

# Vérifier/Créer venv pour Linux (le venv Windows ne marche pas sous WSL)
if [ ! -d "venv_wsl" ]; then
    echo "Creating new virtual environment for WSL..."
    python3 -m venv venv_wsl
fi

source venv_wsl/bin/activate

echo "Installing requirements..."
pip install -r requirements.txt > /dev/null 2>&1

echo "Starting Python Server..."
python3 main.py &
PYTHON_PID=$!
echo "✅ Python Backend running (PID: $PYTHON_PID)"

cd ..

echo "2. 📦 Setting up Node Frontend (Port 5173/3001)..."
# Pas besoin de réinstaller node_modules à chaque fois si ça marche, 
# mais npm ci est plus sûr sous WSL si les modules sont win32
# On suppose que l'utilisateur a node installé sous WSL
echo "Starting Node Server..."
npm run dev &
NODE_PID=$!
echo "✅ Frontend running (PID: $NODE_PID)"

echo "=========================================="
echo "   🎉 All systems operational!"
echo "   Press Ctrl+C to stop."
echo "=========================================="

wait
