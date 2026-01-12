# 🚀 Guide de Démarrage Rapide - CoCreate

## Installation Express (5 minutes)

### 1. Prérequis
Assurez-vous d'avoir installé :
- **Node.js 18+** : [Télécharger ici](https://nodejs.org/)
- **npm** (inclus avec Node.js)

### 2. Clonage et Installation
```bash
# Cloner le projet
git clone <url-du-repo>
cd cocreate-app

# Installer les dépendances
npm install
```

### 3. Configuration des Clés API

**Option A : Configuration rapide (pour tests)**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer le fichier .env avec vos clés API
# minimum requis : GEMINI_API_KEY pour commencer
```

**Option B : Test sans clés API (fonctionnalités limitées)**
```bash
# Créer un .env minimal
echo "NODE_ENV=development\nPORT=3001" > .env
```

### 4. Lancement
```bash
# Développement (recommandé)
npm run dev

# L'application sera disponible sur http://localhost:5173
```

## 🎯 Premier Test (Sans clés API)

Même sans clés API, vous pouvez tester l'interface :

1. **Ouvrir** http://localhost:5173
2. **Naviguer** entre les 4 sections (Analyse, Génération, Édition, Diagrammes)
3. **Tester** l'upload d'images (zone drag & drop)
4. **Explorer** les exemples et interfaces

## 🔑 Configuration des Clés API

### Google Gemini (Essentiel - Analyse + Diagrammes)
1. Aller sur [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créer une nouvelle clé API
3. Ajouter dans `.env` : `GEMINI_API_KEY=your_key_here`

### Reve API (Optionnel - Génération + Édition d'images)
1. Créer un compte sur [Reve](https://reve.com)
2. Récupérer la clé API depuis le dashboard
3. Ajouter dans `.env` : `REVE_API_KEY=your_key_here`

### Hugging Face (Optionnel - Alternative gratuite)
1. Créer un compte sur [Hugging Face](https://huggingface.co)
2. Générer un token dans les paramètres
3. Ajouter dans `.env` : `HF_TOKEN=your_token_here`

## 🎨 Première Utilisation

### Test 1 : Analyse UX/UI
```bash
# Avec Gemini configuré
1. Section "Analyse UX/UI"
2. Glisser une capture d'écran de site web
3. Voir l'analyse automatique par l'IA
```

### Test 2 : Génération d'Assets
```bash
# Avec Reve ou HF configuré
1. Section "Génération d'Assets"
2. Choisir le provider (Reve recommandé)
3. Saisir : "Un logo moderne pour une startup tech"
4. Cliquer "Générer"
```

### Test 3 : Édition d'Images
```bash
# Avec Reve configuré
1. Section "Édition d'Images"
2. Uploader une image
3. Instruction : "Ajouter un effet de dégradé bleu"
4. Voir la comparaison avant/après
```

### Test 4 : Diagrammes
```bash
# Avec Gemini configuré
1. Section "Diagrammes"
2. Type : "Organigramme"
3. Description : "Architecture d'une app e-commerce"
4. Voir le diagramme Mermaid généré
```

## 🛠️ Commandes Utiles

```bash
# Développement
npm run dev          # Frontend + Backend
npm run dev:client   # Frontend uniquement (port 5173)
npm run dev:server   # Backend uniquement (port 3001)

# Production
npm run build        # Build du frontend
npm run preview      # Prévisualisation du build
npm start            # Serveur de production

# Utilitaires
npm run lint         # Vérification du code
npm test             # Tests (si configurés)
```

## 🐛 Dépannage Rapide

### Erreur "Module not found"
```bash
# Solution
rm -rf node_modules package-lock.json
npm install
```

### Port déjà utilisé
```bash
# Solution 1 : Changer le port
PORT=3002 npm run dev

# Solution 2 : Tuer le processus
lsof -ti:3001 | xargs kill -9
```

### Clé API invalide
```bash
# Vérifier le fichier .env
cat .env

# Tester la clé manuellement
curl -H "Authorization: Bearer YOUR_KEY" https://generativelanguage.googleapis.com/v1/models
```

### Erreur CORS
```bash
# Vérifier CLIENT_URL dans .env
echo "CLIENT_URL=http://localhost:5173" >> .env
```

## 📊 Fonctionnalités par Clé API

| Fonctionnalité | Clé Requise | Provider | Limites |
|---|---|---|---|
| Analyse UX/UI | GEMINI_API_KEY | Google | 15 req/min (gratuit) |
| Génération Assets | REVE_API_KEY | Reve | Payant |
| Génération Assets | HF_TOKEN | Hugging Face | Gratuit, plus lent |
| Édition Images | REVE_API_KEY | Reve | Payant |
| Diagrammes | GEMINI_API_KEY | Google | 15 req/min (gratuit) |

## 🎯 Workflow Recommandé

### Pour les Designers
1. **Analyse** : Uploadez vos maquettes pour obtenir des retours IA
2. **Génération** : Créez des variations et explorations créatives
3. **Édition** : Affinez vos créations existantes

### Pour les Développeurs
1. **Diagrammes** : Générez des schémas d'architecture automatiquement
2. **Assets** : Créez des icônes et illustrations pour vos apps
3. **Documentation** : Visualisez vos processus et workflows

### Pour les Product Managers
1. **Analyse** : Évaluez la qualité UX de vos produits
2. **Diagrammes** : Créez des flux utilisateur et processus métier
3. **Génération** : Créez des mockups et prototypes visuels

## 💡 Conseils d'Optimisation

### Prompts Efficaces
- **Spécifiques** : "Logo minimaliste bleu et blanc pour app mobile"
- **Contextuels** : "Interface e-commerce moderne avec panier"
- **Techniques** : "Diagramme séquence API REST authentification"

### Gestion des Quotas
- **Gemini** : Utiliser en mode développement, monitorer l'usage
- **Reve** : Optimiser les prompts pour réduire les regenerate
- **HF** : Réserver aux tests et explorations créatives

### Performance
- **Images** : Optimiser la taille avant upload (< 2MB recommandé)
- **Cache** : Le navigateur met en cache les images générées
- **Réseau** : Connexion stable recommandée pour les gros fichiers

## 🎉 Félicitations !

Vous avez maintenant une application complète de collaboration humain-IA pour le design ! 

### Prochaines Étapes
1. **Explorez** toutes les fonctionnalités avec vos propres contenus
2. **Experiment** avec différents types de prompts
3. **Intégrez** dans votre workflow de design existant
4. **Partagez** vos créations avec votre équipe

### Support
- **Documentation** : Consultez `README.md` et `TECHNICAL_DOCS.md`
- **Issues** : Utilisez le système d'issues du repository
- **Community** : Rejoignez les discussions sur les améliorations

**Bon design avec CoCreate !** 🎨✨