# 🚀 CoCreate V2 - Documentation Technique Complète

## Vue d'ensemble

CoCreate V2 représente une refonte complète de l'application avec une approche centrée sur la collaboration humain-IA via une interface de chat unifiée. Cette version introduit un agent intelligent capable de détecter les intentions utilisateur et d'orchestrer les différentes fonctionnalités IA.

## 🏗️ Architecture V2

### Architecture Générale
```
┌─────────────────────────────────────────────────────────────┐
│                    CoCreate V2 Architecture                  │
├─────────────────────────────────────────────────────────────┤
│ Frontend (React)                                            │
│ ┌─────────────────┬───────────────────┬───────────────────┐ │
│ │   Sidebar       │   Chat Interface  │    Image Canvas   │ │
│ │   Projects      │   + Agent Chat    │   + Konva.js      │ │
│ └─────────────────┴───────────────────┴───────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │            Image Gallery (Bottom Panel)                 │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Backend (Node.js + Express)                                │
│ ┌─────────────────┬───────────────────┬───────────────────┐ │
│ │   Agent Router  │   Existing APIs   │   SQLite Database │ │
│ │   (Intelligence)│   (Functions)     │   (Persistence)   │ │
│ └─────────────────┴───────────────────┴───────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Nouveaux Concepts Clés

#### 1. Agent Intelligent
- **Détection d'intention** : Analyse les messages pour comprendre l'action souhaitée
- **Orchestration** : Route vers les APIs appropriées selon l'intention
- **Contexte persistant** : Maintient l'historique de conversation
- **Suggestions intelligentes** : Propose des actions suivantes

#### 2. Gestion de Projets
- **Multi-projets** : Création et gestion de projets multiples
- **Persistance** : localStorage + SQLite pour la robustesse
- **Isolation** : Chaque projet a son propre contexte
- **Collaboration** : Partage facile entre utilisateurs

#### 3. Canvas Interactif
- **Drag & Drop** : Manipulation libre des éléments
- **Sélection multiple** : Opérations sur plusieurs éléments
- **Outils professionnels** : Redimensionnement, rotation, z-order
- **Export** : Sauvegarde des compositions

## 🔧 Nouvelles Technologies

### Frontend
- **react-konva** : Canvas interactif haute performance
- **use-image** : Chargement optimisé des images
- **uuid** : Génération d'identifiants uniques
- **Context API** : Gestion d'état globale optimisée

### Backend
- **better-sqlite3** : Base de données SQLite pour la persistance
- **Agent Router** : Nouveau routeur pour l'intelligence artificielle
- **Streaming** : Réponses en temps réel (préparé)

### Architecture de Données
```javascript
// Structure d'un projet
{
  id: "uuid",
  name: "Mon Projet",
  description: "Description du projet",
  createdAt: "2025-01-14T10:30:00.000Z",
  updatedAt: "2025-01-14T10:30:00.000Z",
  messages: [
    {
      id: "uuid",
      type: "user|ai",
      content: "Message content",
      action: "generate|edit|analyze|chat",
      result: {...},
      suggestions: [...],
      timestamp: "2025-01-14T10:30:00.000Z"
    }
  ],
  images: [
    {
      id: "uuid",
      url: "data:image/png;base64,...",
      type: "generate|edit|analyze",
      prompt: "Original prompt",
      metadata: {...},
      timestamp: "2025-01-14T10:30:00.000Z"
    }
  ],
  canvas: {
    elements: [
      {
        id: "uuid",
        type: "image|text|rect",
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        // ... autres propriétés
      }
    ],
    settings: {
      backgroundColor: "#ffffff",
      gridEnabled: false,
      snapToGrid: false
    }
  }
}
```

## 🧠 Agent Intelligent

### Détection d'Intention
L'agent utilise Gemini AI pour analyser les messages et déterminer l'intention :

```javascript
const intention = await detectIntention(message, context);
```

**Types d'intentions détectées :**
- `generate_image` : "Génère un logo", "Crée une image"
- `edit_image` : "Modifie cette image", "Change les couleurs"
- `analyze_image` : "Analyse ce design", "Évalue l'interface"
- `generate_diagram` : "Crée un diagramme", "Schéma d'architecture"
- `chat` : Questions générales, demandes d'aide

### Orchestration des Actions
```javascript
const result = await executeAction(intention, message, context);
```

L'agent route automatiquement vers :
- **Génération d'images** : Reve API ou Hugging Face
- **Analyse d'images** : Gemini Vision
- **Génération de diagrammes** : Gemini + Mermaid
- **Édition d'images** : Reve API (à venir)

## 💾 Base de Données SQLite

### Schéma
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  data TEXT
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE images (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  url TEXT NOT NULL,
  type TEXT,
  prompt TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
```

### Avantages
- **Persistance robuste** : Données sauvegardées côté serveur
- **Performance** : Requêtes SQL optimisées
- **Intégrité** : Contraintes et relations entre tables
- **Backup facile** : Fichier unique exportable

## 🎨 Canvas Interactif

### Fonctionnalités
- **Drag & Drop** : Déplacement libre des éléments
- **Sélection** : Simple clic ou Ctrl+clic pour multi-sélection
- **Transformation** : Redimensionnement, rotation, opacité
- **Z-order** : Gestion de l'ordre d'empilement
- **Grille** : Affichage et snap-to-grid optionnels
- **Export** : Sauvegarde en PNG haute qualité

### Structure des Éléments
```javascript
// Image
{
  type: 'image',
  url: 'data:image/png;base64,...',
  x: 100, y: 100,
  width: 200, height: 200,
  rotation: 0,
  scaleX: 1, scaleY: 1,
  opacity: 1,
  visible: true,
  locked: false
}

// Texte
{
  type: 'text',
  text: 'Mon texte',
  x: 100, y: 100,
  width: 200, height: 50,
  fontSize: 16,
  fontFamily: 'Arial',
  fill: '#000000',
  align: 'left'
}
```

## 💬 Interface de Chat

### Caractéristiques
- **Messages multimodaux** : Texte + images
- **Streaming** : Réponses en temps réel (préparé)
- **Contexte persistant** : Historique maintained
- **Actions inline** : Régénérer, télécharger, éditer
- **Suggestions IA** : Propositions intelligentes
- **Typing indicators** : Feedback visuel

### Workflow
1. **Utilisateur tape** un message
2. **Agent détecte** l'intention
3. **Action exécutée** via les APIs
4. **Résultat affiché** avec options
5. **Suggestions proposées** pour la suite

## 🔄 Migration depuis V1

### Préservation des Fonctionnalités
Toutes les fonctionnalités V1 sont conservées dans le **Mode Avancé** :
- Analyse UX/UI directe
- Génération d'assets
- Édition d'images
- Génération de diagrammes

### Améliorations V2
- **Interface unifiée** : Plus besoin de naviguer entre onglets
- **Contexte intelligent** : L'IA se souvient de la conversation
- **Gestion de projets** : Organisation et collaboration
- **Canvas professionnel** : Outils de design avancés
- **Persistance robuste** : Sauvegarde fiable des données

## 🚀 Installation et Lancement

### Prérequis
```bash
Node.js 18+
npm 8+
```

### Installation
```bash
cd cocreate-app
npm install
```

### Configuration
```bash
# Copier et configurer les variables d'environnement
cp .env.example .env

# Éditer .env avec vos clés API
GEMINI_API_KEY=your_gemini_key
REVE_API_KEY=your_reve_key
HF_TOKEN=your_hf_token
```

### Lancement
```bash
# Développement (recommandé)
npm run dev

# Frontend uniquement
npm run dev:client

# Backend uniquement
npm run dev:server
```

### Accès
- **Application V2** : http://localhost:5173
- **Mode Avancé** : Bouton "Mode Avancé" dans l'interface
- **API Backend** : http://localhost:3001

## 🔧 API Endpoints

### Agent Chat (Nouveau)
```
POST /api/agent/chat
{
  "message": "Génère un logo pour ma startup",
  "projectId": "uuid",
  "context": [...],
  "images": [...]
}

Response:
{
  "success": true,
  "response": "Je vais créer un logo pour votre startup...",
  "action": "generate",
  "result": {
    "image": "data:image/png;base64,...",
    "metadata": {...}
  },
  "suggestions": ["Voulez-vous modifier les couleurs?"],
  "intention": {...}
}
```

### APIs Existantes (Conservées)
```
# Analyse d'images
POST /api/design-analysis/analyze

# Génération d'assets
POST /api/asset-generation/generate-reve
POST /api/asset-generation/generate-huggingface

# Édition d'images
POST /api/image-editing/edit-reve

# Génération de diagrammes
POST /api/diagram-generation/generate
```

## 🧪 Tests et Validation

### Tests Fonctionnels
- ✅ Création et gestion de projets
- ✅ Chat avec agent intelligent
- ✅ Génération d'images via chat
- ✅ Canvas interactif
- ✅ Drag & drop d'images
- ✅ Galerie d'images
- ✅ Persistance des données
- ✅ Mode avancé fonctionnel

### Tests de Performance
- Temps de chargement < 3 secondes
- Réponses de l'agent < 10 secondes
- Canvas fluide à 60 FPS
- Recherche de projets instantanée

### Tests de Compatibilité
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🔮 Évolutions Futures

### Court terme
- **Streaming en temps réel** : Réponses en direct
- **Partage de projets** : Collaboration équipe
- **Templates** : Projets pré-configurés
- **Export avancé** : PDF, SVG, formats professionnels

### Moyen terme
- **WebSocket** : Collaboration temps réel
- **Versioning** : Historique des modifications
- **Plugins** : Extensions tierces
- **API publique** : Intégrations externes

### Long terme
- **IA multi-modale** : Vidéo, audio, 3D
- **Collaboration globale** : Projets distribués
- **IA avancée** : GPT-4, Claude, etc.
- **Mobile** : Application native

## 📊 Métriques et Monitoring

### KPIs
- **Utilisateurs actifs** : Projets créés/utilisés
- **Messages traités** : Volume de conversation
- **Images générées** : Taux de création
- **Temps de réponse** : Performance des APIs

### Logs
- **Conversations** : Historique complet
- **Erreurs** : Journalisation détaillée
- **Performance** : Temps de réponse
- **Usage** : Statistiques d'utilisation

## 🤝 Contribution

### Structure du Code
```
src/
├── components/           # Composants React
│   ├── ChatInterface.jsx
│   ├── ImageCanvas.jsx
│   ├── ProjectSidebar.jsx
│   └── ...
├── hooks/               # Hooks personnalisés
│   ├── useChat.js
│   └── useCanvas.js
├── context/             # Contextes React
│   └── ProjectContext.jsx
└── styles/              # Fichiers CSS
    ├── chat.css
    ├── canvas.css
    └── app.css
```

### Guidelines
- **Hooks personnalisés** : Logique réutilisable
- **Context global** : État partagé
- **Composants modulaires** : Responsabilité unique
- **CSS modulaire** : Styles par composant
- **Tests unitaires** : Couverture > 80%

---

**CoCreate V2** représente l'évolution naturelle vers une véritable collaboration humain-IA, où l'intelligence artificielle devient un partenaire créatif plutôt qu'un simple outil. Cette architecture pave la voie pour des fonctionnalités encore plus avancées tout en maintenant une expérience utilisateur fluide et intuitive.