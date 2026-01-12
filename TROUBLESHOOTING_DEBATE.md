# Guide de Dépannage - Fonctionnalité Débat

## Problème Identifié

La fonctionnalité de débat ne marche pas car le serveur Python et le serveur Node.js tournent dans des environnements réseau différents (WSL vs Windows).

## Solution Immédiate

### Option 1 : Démarrer TOUT dans Windows (Recommandé)

1. **Arrêter tous les processus en cours**
   - Fermez toutes les fenêtres de terminal
   - Vérifiez qu'aucun processus ne tourne :
     ```powershell
     netstat -ano | findstr :8000
     netstat -ano | findstr :3001
     netstat -ano | findstr :5173
     ```
   - Si des processus tournent, tuez-les :
     ```powershell
     taskkill /PID <PID> /F
     ```

2. **Démarrer le système avec start_all.bat**
   
   **IMPORTANT** : Exécutez directement depuis Windows PowerShell (PAS WSL) :
   ```powershell
   cd C:\Users\hp\Downloads\cocreate-app
   .\start_all.bat
     ```

   Cela va :
   - Activer l'environnement virtuel Python Windows (`cocreatevenv`)
   - Démarrer le serveur Python sur port 8000 (dans Windows)
   - Démarrer le serveur Node.js sur port 3001 (dans Windows)
   - Démarrer le frontend React sur port 5173 (dans Windows)

3. **Vérifier que tout fonctionne**
   
   Dans un nouveau PowerShell :
   ```powershell
   # Test serveur Python
   Invoke-RestMethod -Uri http://127.0.0.1:8000/health
   
   # Test serveur Node.js
   Invoke-RestMethod -Uri http://localhost:3001/api/health
   
   # Test proxy débat (IMPORTANT!)
   Invoke-RestMethod -Uri http://localhost:3001/api/debate/health
   ```
   
   Tous devraient retourner un statut "healthy" ou "OK".

### Option 2 : Démarrer TOUT dans WSL

Si vous préférez WSL, alors **tout** doit tourner dans WSL :

1. **Ouvrir WSL**
   ```powershell
   wsl
   ```

2. **Aller dans le dossier du projet**
   ```bash
   cd /mnt/c/Users/hp/Downloads/cocreate-app
   ```

3. **Utiliser le script Linux**
   ```bash
   chmod +x start_all.sh
   ./start_all.sh
   ```

4. **Accéder depuis Windows**
   - Frontend : `http://localhost:5173`
   - Les services WSL sont accessibles via localhost depuis Windows

### Option 3 : Configuration Hybride (Avancé)

Si le serveur Python DOIT tourner dans WSL mais Node.js dans Windows :

1. **Trouver l'IP de WSL**
   Dans WSL :
   ```bash
   hostname -I
   ```
   Cela donne une adresse comme `172.x.x.x`

2. **Modifier server/index.js**
   Remplacer :
   ```javascript
   const PYTHON_BACKEND = {
     host: '127.0.0.1',
     port: 8000
   };
   ```
   
   Par :
   ```javascript
   const PYTHON_BACKEND = {
     host: '172.x.x.x',  // Remplacer par l'IP WSL
     port: 8000
   };
   ```

3. **Redémarrer le serveur Node.js**

## Vérification Finale

Une fois que vous avez choisi une option et démarré les serveurs :

1. **Ouvrir http://localhost:5173**
2. **Créer un projet** (cliquez sur le bouton + dans la sidebar)
3. **Cliquer sur "🤖 Essayez le Débat Multi-Agents"**
4. **Entrer un prompt de test** :
   ```
   Créer un logo moderne pour une startup de technologie verte
   ```
5. **Cliquer sur "🚀 Lancer le Débat"**

Si tout est configuré correctement, vous devriez voir :
- ✅ Les 5 agents apparaître (Orchestrator, Design Critic, Design Artist, UX Researcher, Brand Strategist)
- ✅ Les messages s'afficher en temps réel
- ✅ Le débat progresser à travers les 3 rounds

## Résolution de Problèmes

### "Failed to start debate (503)"
➡️ Le serveur Python n'est pas accessible. Vérifiez qu'il tourne dans le même environnement (Windows ou WSL) que Node.js.

### "ECONNREFUSED 127.0.0.1:8000"
➡️ Problème de connectivité réseau entre Node.js et Python. Utilisez Option 1 ou 3.

### "WebSocket connection failed"
➡️ Le serveur Python répond mais WebSocket ne peut pas se connecter. Vérifiez le pare-feu Windows.

### Le bouton ne fait rien
➡️ Ouvrez la console du navigateur (F12) pour voir les erreurs JavaScript.

## Logs Utiles

### Serveur Python (agents)
Le terminal devrait afficher :
```
🚀 Starting CoCreate Agentic API...
📡 Server: http://127.0.0.1:8000
🤖 Agents: DesignCritic, DesignArtist, UXResearcher, BrandStrategist, Orchestrator
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Serveur Node.js
Le terminal devrait afficher :
```
╔══════════════════════════════════════════════════════╗
║       🚀 CoCreate AI Design Server v2.0              ║
║  🤖 Debate:    /api/debate/start                     ║
╚══════════════════════════════════════════════════════╝
```

### Frontend React (Vite)
Le terminal devrait afficher :
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Environnement Virtuel Python

Assurez-vous d'utiliser le bon environnement virtuel :
- **Windows** : `cocreatevenv\Scripts\activate`
- **WSL/Linux** : `source venv_wsl/bin/activate`

Le script `start_all.bat` (Windows) utilise automatiquement `cocreatevenv`.
Le script `start_all.sh` (WSL) crée et utilise automatiquement `venv_wsl`.
