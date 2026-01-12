# CoCreate V2 - Collaboration Humain-IA pour le Design

![CoCreate V2](https://img.shields.io/badge/CoCreate-V2.0%20AI%20Design-14B8A6?style=for-the-badge&logo=sparkles&logoColor=white)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3.x-003B57?style=flat-square&logo=sqlite&logoColor=white)

## 🎯 Qu'est-ce que CoCreate V2 ?

CoCreate V2 est une **révolution dans la collaboration humain-IA pour le design**.不同于传统的工具栏和单独功能，V2通过**智能聊天界面**将所有设计能力统一到一个自然对话中。

### 🌟 Principales Innovations

- **🤖 Agent Intelligent** : Détection automatique d'intention et orchestration des APIs
- **💬 Chat Unifié** : Plus d'onglets, tout dans une conversation naturelle
- **🎨 Canvas Interactif** : Manipulation professionnelle des éléments avec Konva.js
- **📁 Gestion de Projets** : Multi-projets avec persistance robuste (localStorage + SQLite)
- **🔧 Mode Avancé** : Conservation de toutes les fonctionnalités V1 pour les utilisateurs avancés

## 🚀 Démarrage Rapide

### Installation Express (3 minutes)

```bash
# 1. Cloner et installer
git clone <repository-url>
cd cocreate-app
npm install

# 2. Configuration
cp .env.example .env
# Éditer .env avec vos clés API

# 3. Lancement
npm run dev
# Application sur http://localhost:5173
```

### Premier Test
1. **Créez un projet** en cliquant "+" dans la sidebar
2. **Discutez avec l'IA** : `"Bonjour ! Crée un logo moderne pour ma startup"`
3. **Explorez le canvas** et la galerie d'images

## 🎨 Fonctionnalités V2

### 1. Agent Intelligent de Design
```javascript
// L'IA comprend automatiquement vos intentions
"Génère un logo pour mon app fitness" 
→ Détection: generate_image + Orchestration: Reve API

"Analyse cette interface utilisateur"
→ Détection: analyze_image + Orchestration: Gemini Vision

"Crée un diagramme d'architecture cloud"
→ Détection: generate_diagram + Orchestration: Gemini + Mermaid
```

### 2. Interface de Chat Unifiée
- **Conversation naturelle** : Discutez comme avec un designer expert
- **Actions contextuelles** : Régénérer, télécharger, modifier en un clic
- **Suggestions intelligentes** : L'IA propose les prochaines étapes
- **Contexte persistant** : L'IA se souvient de votre projet

### 3. Canvas Interactif Professionnel
- **Drag & Drop** : Manipulation libre des éléments
- **Sélection multiple** : Opérations sur plusieurs éléments
- **Outils avancés** : Redimensionnement, rotation, z-order
- **Grille et alignement** : Alignement précis des éléments
- **Export haute qualité** : PNG résolution professionnelle

### 4. Gestion de Projets
- **Multi-projets** : Organisation claire et isolée
- **Persistance robuste** : localStorage + base de données SQLite
- **Recherche rapide** : Trouvez vos projets instantanément
- **Collaboration prête** : Structure préparée pour le partage d'équipe

## 🏗️ Architecture Technique

### Frontend React Moderne
```
src/
├── components/          # Composants modulaires
│   ├── ChatInterface.jsx      # Interface de chat unifiée
│   ├── ImageCanvas.jsx        # Canvas interactif avec Konva
│   ├── ProjectSidebar.jsx     # Gestion de projets
│   └── ImageGallery.jsx       # Galerie d'images
├── hooks/               # Hooks personnalisés
│   ├── useChat.js              # Logique de chat intelligente
│   └── useCanvas.js            # Gestion du canvas
├── context/             # État global
│   └── ProjectContext.jsx      # Contexte des projets
└── styles/              # Design system
    ├── chat.css              # Styles chat
    ├── canvas.css            # Styles canvas
    └── app.css               # Layout principal
```

### Backend Intelligent
```
server/
├── routes/
│   ├── agent.js              # Agent intelligent (NOUVEAU)
│   ├── designAnalysis.js     # Analyse d'images
│   ├── assetGeneration.js    # Génération d'assets
│   ├── imageEditing.js       # Édition d'images
│   └── diagramGeneration.js  # Génération de diagrammes
├── data/
│   └── cocreate.db           # Base SQLite (NOUVEAU)
└── index.js                  # Serveur Express
```

### APIs Intégrées
- **Google Gemini AI** : Analyse d'images, génération de diagrammes, détection d'intention
- **Reve API** : Génération et édition d'images créatives
- **Hugging Face** : Modèles open source alternatifs
- **SQLite** : Persistance robuste des données

## 📊 Comparaison V1 vs V2

| Aspect | V1 (Ancienne) | V2 (Nouvelle) |
|--------|---------------|---------------|
| **Interface** | Onglets séparés | Chat unifié |
| **Intelligence** | Fonctions statiques | Agent intelligent |
| **Contexte** | Perdu entre sections | Conversation persistante |
| **Projets** | Un seul projet | Multi-projets |
| **Canvas** | Simple affichage | Interactif professionnel |
| **Persistance** | localStorage uniquement | localStorage + SQLite |
| **Collaboration** | Non supportée | Prête pour équipe |
| **Mode avancé** | - | Conservation V1 |

## 🎯 Workflows Optimaux

### Designer
```
1. "Créons un logo pour mon studio de design"
2. "Modifie les couleurs pour un style plus minimaliste"
3. "Analyse ce design et propose des améliorations"
4. Ajuste sur le canvas et exporte
```

### Développeur
```
1. "Crée un diagramme d'architecture pour mon app e-commerce"
2. "Génère des icônes pour mon interface utilisateur"
3. "Analyse l'UX de cette maquette"
4. Assemble le tout sur le canvas pour la présentation
```

### Product Manager
```
1. "Brainstormons des concepts pour une app de fitness"
2. "Crée un flowchart du processus utilisateur"
3. "Analyse cette landing page et donne-moi des retours"
4. Utilise le canvas pour présenter aux parties prenantes
```

## 🛠️ Configuration Avancée

### Variables d'Environnement
```env
# Essentiel pour commencer
GEMINI_API_KEY=your_gemini_key_here

# Pour la génération d'images
REVE_API_KEY=your_reve_key_here
HF_TOKEN=your_huggingface_token_here

# Configuration serveur
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### APIs Requis
- **Google Gemini** : [Obtenir une clé](https://makersuite.google.com/app/apikey)
- **Reve API** : [S'inscrire](https://reve.com) (payant)
- **Hugging Face** : [Token gratuit](https://huggingface.co/settings/tokens) (optionnel)

## 🚀 Déploiement

### Build de Production
```bash
# Frontend
npm run build

# Backend
npm start

# Avec PM2 (recommandé)
pm2 start npm --name "cocreate-v2" -- start
```

### Docker (Optionnel)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 🧪 Tests et Qualité

### Tests Automatisés
```bash
# Tests unitaires (à venir)
npm test

# Tests E2E (à venir)
npm run test:e2e

# Linting
npm run lint
```

### Validation Manuelle
- ✅ Chat avec agent intelligent
- ✅ Génération d'images via conversation
- ✅ Canvas interactif complet
- ✅ Gestion multi-projets
- ✅ Persistance des données
- ✅ Mode avancé fonctionnel
- ✅ Responsive design
- ✅ Performance optimisée

## 📚 Documentation

- **[Guide Utilisateur](GUIDE_UTILISATEUR.md)** : Tutorial complet
- **[Documentation Technique](V2_DOCUMENTATION.md)** : Architecture et APIs
- **[README Original](README.md)** : Spécifications V1 conservées

## 🤝 Contribution

### Structure de Développement
```bash
# Développement local
npm run dev          # Frontend + Backend
npm run dev:client   # Frontend uniquement
npm run dev:server   # Backend uniquement

# Qualité
npm run lint         # ESLint
npm run format       # Prettier (à venir)
```

### Guidelines
- **Hooks personnalisés** : Logique réutilisable
- **Composants modulaires** : Responsabilité unique
- **CSS modulaire** : Styles par composant
- **Tests** : Couverture > 80% (objectif)

## 🔮 Roadmap

### V2.1 (Court terme)
- [ ] **Streaming temps réel** : Réponses de l'IA en direct
- [ ] **Partage de projets** : Collaboration d'équipe
- [ ] **Templates** : Projets pré-configurés
- [ ] **Export avancé** : PDF, SVG, formats professionnels

### V2.2 (Moyen terme)
- [ ] **WebSocket** : Collaboration temps réel
- [ ] **Versioning** : Historique des modifications
- [ ] **Plugins** : Extensions tierces
- [ ] **API publique** : Intégrations externes

### V3.0 (Long terme)
- [ ] **IA multi-modale** : Vidéo, audio, 3D
- [ ] **Collaboration globale** : Projets distribués
- [ ] **IA de nouvelle génération** : GPT-4, Claude, etc.
- [ ] **Application mobile** : iOS et Android natifs

## 📊 Métriques

### KPIs de Performance
- **Temps de chargement** : < 3 secondes
- **Réponses IA** : < 10 secondes
- **Canvas FPS** : 60 FPS stable
- **Recherche projets** : Instantanée

### Statistiques d'Usage
- **Projets créés** : Tracking automatique
- **Messages traités** : Volume conversation
- **Images générées** : Taux création
- **Satisfaction utilisateur** : Feedback intégré

## 🆘 Support

### Troubleshooting
1. **Consultez** [Guide Utilisateur](GUIDE_UTILISATEUR.md)
2. **Vérifiez** la [Documentation Technique](V2_DOCUMENTATION.md)
3. **Utilisez** le Mode Avancé pour le debugging
4. **Ouvrez** une issue GitHub pour les bugs

### Communauté
- **GitHub Issues** : Bugs et fonctionnalités
- **Discussions** : Idées et feedback
- **Wiki** : Documentation communautaire

## 📄 Licence

MIT License - Voir [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Google AI** : Gemini pour l'intelligence artificielle
- **Reve** : API de génération d'images créative
- **Hugging Face** : Modèles open source
- **Konva.js** : Canvas interactif haute performance
- **React Team** : Framework frontend exceptionnel

---

**CoCreate V2** - Où l'intelligence artificielle rencontre la créativité humaine dans une expérience révolutionnaire 🤝✨

> *La révolution du design collaboratif commence ici. Rejoignez la transformation.*