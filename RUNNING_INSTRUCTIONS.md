# CoCreate - Instructions d'Exécution

## Ports Utilisés

| Service | Port | Description |
|---------|------|-------------|
| React Frontend (Vite) | 5173 | Interface utilisateur |
| Node.js Backend | 3001 | API principale + Proxy |
| Python AutoGen Backend | 8000 | Agents de débat IA |

---

## 🚀 Démarrage du Système Complet

### Terminal 1 - Backend Python (Agents de Débat)

```bash
cd agents
pip install -r requirements.txt  # Première fois uniquement
python main.py
```

**Output attendu:**
```
🚀 Starting CoCreate Agentic API...
📡 Server: http://127.0.0.1:8000
🤖 Agents: DesignCritic, DesignArtist, UXResearcher, BrandStrategist, Orchestrator
```

### Terminal 2 - Frontend React + Node.js Backend

```bash
npm run dev
```

**Output attendu:**
```
╔══════════════════════════════════════════════════════╗
║       🚀 CoCreate AI Design Server v2.0              ║
╠══════════════════════════════════════════════════════╣
║  📡 Server:    http://localhost:3001                  ║
╚══════════════════════════════════════════════════════╝

  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## ⚠️ Éviter les Collisions de Ports

### Vérifier les ports occupés (Windows PowerShell)
```powershell
netstat -ano | findstr :8000
netstat -ano | findstr :3001
netstat -ano | findstr :5173
```

### Vérifier les ports occupés (WSL/Linux)
```bash
lsof -i :8000
lsof -i :3001
lsof -i :5173
```

### Libérer un port (Windows)
```powershell
# Trouver le PID
netstat -ano | findstr :8000
# Tuer le processus
taskkill /PID <PID> /F
```

### Libérer un port (WSL/Linux)
```bash
# Tuer le processus sur le port 8000
kill -9 $(lsof -t -i:8000)
```

---

## 🔧 Variables d'Environnement

Créer un fichier `.env` à la racine du projet :

```env
# Obligatoire
GEMINI_API_KEY=votre_clé_gemini_api

# Optionnel - Génération d'images
REVE_API_KEY=votre_clé_reve_api

# Backend
PORT=3001
CLIENT_URL=http://localhost:5173
```

---

## 📋 Ordre de Démarrage Recommandé

1. **D'abord**: Backend Python (`python main.py`)
2. **Ensuite**: Frontend + Node.js (`npm run dev`)

Cet ordre garantit que:
- Les agents de débat sont prêts avant le frontend
- Le proxy Node.js peut vérifier la disponibilité du backend Python

---

## 🧪 Tester la Configuration

### Test Backend Python
```bash
curl http://127.0.0.1:8000/health
```
Réponse: `{"status":"healthy","agents":"ready"}`

### Test Backend Node.js
```bash
curl http://localhost:3001/api/health
```
Réponse: `{"status":"OK","message":"CoCreate AI Design Server is running",...}`

### Test Proxy Débat
```bash
curl http://localhost:3001/api/debate/health
```
Réponse: `{"status":"healthy","agents":"ready"}`

---

## 🤖 Modèle IA Utilisé

Le système utilise **gemini-2.5-flash** pour tous les agents de débat.
Configuration dans `agents/config.py`.
