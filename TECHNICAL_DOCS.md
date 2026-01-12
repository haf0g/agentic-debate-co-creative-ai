# Documentation Technique - CoCreate AI Design App

## Vue d'ensemble

CoCreate est une application web full-stack qui implémente une collaboration humain-IA orientée design. L'application utilise plusieurs APIs d'IA pour fournir des fonctionnalités d'analyse, génération et édition de contenus visuels.

## Architecture du Système

### Frontend (React + Vite)
- **Framework**: React 18 avec hooks
- **Build Tool**: Vite pour le développement rapide
- **Styling**: CSS custom avec variables et design system
- **Routing**: Navigation par état (pas de router externe)
- **State Management**: État local avec useState/useEffect

### Backend (Node.js + Express)
- **Framework**: Express.js avec middleware personnalisé
- **APIs IA**: Intégration de multiples services (Gemini, Reve, Hugging Face)
- **File Handling**: Multer pour l'upload d'images
- **Validation**: Validation côté serveur des fichiers et données
- **Error Handling**: Gestion centralisée des erreurs

### Services IA Intégrés

#### 1. Google Generative AI (Gemini)
```javascript
// Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// Utilisation
const result = await model.generateContent([prompt, imagePart]);
const analysis = result.response.text();
```
- **Usage**: Analyse d'images UX/UI, génération de diagrammes Mermaid
- **Avantages**: Multimodal, rapide, précis
- **Limites**: Quotas API, coût par requête

#### 2. Reve API
```javascript
// Génération d'images
const response = await axios.post('https://api.reve.com/v1/image/create', {
  prompt: userPrompt,
  width: 1024,
  height: 768
}, { headers });

// Édition d'images
const response = await axios.post('https://api.reve.com/v1/image/edit', {
  edit_instruction: editInstruction,
  reference_image: imageBase64,
  version: 'latest'
}, { headers });
```
- **Usage**: Génération et édition d'images créatives
- **Avantages**: Haute qualité, instruction-based editing
- **Limites**: Clé API payante, quotas

#### 3. Hugging Face Inference
```javascript
const hfClient = new InferenceClient({
  provider: "replicate",
  apiKey: HF_TOKEN
});

const image = await hfClient.textToImage(prompt, {
  model: "tencent/HunyuanImage-3.0",
  height: 512,
  width: 512
});
```
- **Usage**: Génération d'images avec modèles open source
- **Avantages**: Gratuité, modèles variés
- **Limites**: Qualité variable,速度 plus lente

## Structure des Données

### Format des Réponses API

```json
{
  "success": true,
  "image": "data:image/png;base64,...",
  "metadata": {
    "provider": "reve",
    "prompt": "Description de la requête",
    "dimensions": {"width": 1024, "height": 768},
    "timestamp": "2025-01-14T10:30:00.000Z"
  },
  "timestamp": "2025-01-14T10:30:00.000Z"
}
```

### États des Composants React

```javascript
// État typique d'un composant
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [settings, setSettings] = useState(defaultSettings);
```

## APIs Endpoints

### Design Analysis
```
POST /api/design-analysis/analyze
- Body: multipart/form-data avec 'image'
- Response: Analyse UX/UI détaillée
- Error: 400 (fichier manquant), 500 (erreur API)

POST /api/design-analysis/analyze-url
- Body: JSON { "imageUrl": "..." }
- Response: Analyse UX/UI depuis URL
```

### Asset Generation
```
POST /api/asset-generation/generate-reve
- Body: JSON { "prompt": "...", "width": 1024, "height": 768 }
- Response: Image générée par Reve API

POST /api/asset-generation/generate-huggingface
- Body: JSON { "prompt": "...", "modelId": "...", "width": 512, "height": 512 }
- Response: Image générée par Hugging Face

GET /api/asset-generation/models
- Response: Liste des modèles disponibles
```

### Image Editing
```
POST /api/image-editing/edit-reve
- Body: multipart/form-data avec 'image', 'editInstruction', 'version'
- Response: Image éditée avec comparaison avant/après

POST /api/image-editing/edit-url
- Body: JSON { "imageUrl": "...", "editInstruction": "...", "version": "..." }
- Response: Image éditée depuis URL
```

### Diagram Generation
```
POST /api/diagram-generation/generate
- Body: JSON { "description": "...", "diagramType": "flowchart" }
- Response: Code Mermaid et image générée

POST /api/diagram-generation/render-custom
- Body: JSON { "mermaidCode": "..." }
- Response: Rendu d'un code Mermaid personnalisé

POST /api/diagram-generation/validate
- Body: JSON { "mermaidCode": "..." }
- Response: Validation du code avec suggestions
```

## Gestion des Fichiers

### Upload et Validation
```javascript
// Configuration Multer
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images JPEG, PNG, GIF et WebP sont acceptées'));
    }
  }
});
```

### Conversion en Base64
```javascript
const fileToGenerativePart = async (mimeType, data) => {
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType
    }
  };
};
```

## Gestion des Erreurs

### Stratégie de Gestion
```javascript
// Middleware global
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'Fichier trop volumineux. Taille maximale: 10MB' 
      });
    }
  }
  
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
  });
});
```

### Gestion des Erreurs Frontend
```javascript
try {
  const response = await fetch('/api/endpoint');
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Erreur lors de la requête');
  }
  
  setData(data);
} catch (error) {
  console.error('Erreur:', error);
  setError(error.message);
}
```

## Sécurité

### Validation des Entrées
- **Files**: Type MIME et extension vérifiés
- **Size**: Limite à 10MB par fichier
- **Content**: Sanitisation des prompts utilisateur
- **API Keys**: Variables d'environnement sécurisées

### CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Headers de Sécurité
- Validation des Content-Type
- Limitation des tailles de requêtes
- Nettoyage automatique des fichiers temporaires

## Performance

### Optimisations Frontend
- **Code Splitting**: Lazy loading des composants
- **Image Optimization**: Redimensionnement et compression
- **Caching**: Cache navigateur pour les assets statiques
- **Bundle**: Vite pour un build optimisé

### Optimisations Backend
- **Streaming**: Traitement des fichiers en streaming
- **Compression**: Compression gzip des réponses
- **Caching**: Cache des réponses API (si applicable)
- **Connection Pooling**: Pool de connexions DB (si utilisé)

## Déploiement

### Variables d'Environnement Production
```env
NODE_ENV=production
PORT=3001
CLIENT_URL=https://your-domain.com
GEMINI_API_KEY=your_production_key
REVE_API_KEY=your_production_key
HF_TOKEN=your_production_token
```

### Build et Déploiement
```bash
# Build de production
npm run build

# Démarrage du serveur de production
npm start

# Avec PM2 (recommandé)
pm2 start npm --name "cocreate" -- start
```

### Monitoring
- **Health Check**: GET /api/health
- **Logs**: Console + fichiers de log
- **Metrics**: Temps de réponse, taux d'erreur
- **Alerts**: Surveillance des quotas API

## Tests et Qualité

### Structure de Test Recommandée
```
tests/
├── unit/
│   ├── components/
│   ├── utils/
│   └── api/
├── integration/
│   ├── api-endpoints/
│   └── workflow/
└── e2e/
    └── user-journeys/
```

### Outils Recommandés
- **Frontend**: Jest + React Testing Library
- **Backend**: Jest + Supertest
- **E2E**: Playwright ou Cypress
- **Linting**: ESLint + Prettier
- **Type Safety**: TypeScript (migration progressive)

## Maintenance

### Logs et Debugging
```javascript
// Logging structuré
console.log('API Call:', {
  endpoint: req.path,
  method: req.method,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});
```

### Monitoring des APIs Externes
- Surveillance des quotas Gemini API
- Monitoring de la disponibilité Reve API
- Fallback vers Hugging Face en cas de problème

### Mise à Jour des Dépendances
- Vérification régulière des vulnérabilités
- Tests de régression après mise à jour
- Documentation des breaking changes

## Extensions Futures

### Fonctionnalités Prévues
- **Collaboration en temps réel**: WebSockets pour travail collaboratif
- **Historique des créations**: Base de données pour sauvegarder les projets
- **Templates**: Bibliothèque de prompts et styles prédéfinis
- **Export avancé**: PDF, SVG, formats vectoriels
- **API publique**: API REST pour intégrations tierces

### Améliorations Techniques
- **Migration TypeScript**: Typage statique complet
- **State Management**: Redux ou Zustand pour état global
- **Tests E2E**: Couverture complète des parcours utilisateur
- **CI/CD**: Pipeline automatisé de déploiement
- **Monitoring**: Solutions comme Sentry ou DataDog

Cette documentation technique fournit une base solide pour comprendre, maintenir et étendre l'application CoCreate.