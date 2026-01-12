import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { geminiGenerateContent, shouldBypassGemini } from './utils/geminiClient.js';
import { groqGenerateContent, isGroqAvailable } from './utils/groqClient.js';

const router = express.Router();

// Configuration de la base de données SQLite
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cocreate.db');
const db = new Database(dbPath);

// Créer les tables si elles n'existent pas
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );

    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      url TEXT NOT NULL,
      type TEXT,
      prompt TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    );
  `);

  console.log('Base de données SQLite initialisée');
}

// Initialiser la base de données
initDatabase();

// Détecter l'intention avec Gemini
async function detectIntention(message, context = [], debateInsights = null, images = []) {
  const debateSummary = debateInsights?.approved
    ? String(
        debateInsights?.approvedText ||
        debateInsights?.consensus?.summary ||
        debateInsights?.consensus?.direction ||
        ''
      ).trim()
    : '';

  const trimmedContext = (context || []).slice(-8).map(m => ({
    type: m?.type,
    content: String(m?.content || '').slice(0, 280)
  }));

  // Vérifier si des images sont jointes
  const hasImages = images && images.length > 0;
  const imageInfo = hasImages 
    ? `\n\nIMAGES JOINTES: ${images.length} image(s) fournie(s) par l'utilisateur - ${images.map(img => img.name || 'image').join(', ')}`
    : '';

  const systemPrompt = `
  Tu es un assistant expert en design et IA. Analyse le message de l'utilisateur et détermine quelle action il souhaite effectuer.
  
  Types d'actions possibles :
  1. "generate_image" - Générer une NOUVELLE image (logo, icône, illustration) - UNIQUEMENT si aucune image n'est fournie
  2. "edit_image" - Modifier une image existante (fournie par l'utilisateur)
  3. "analyze_image" - Analyser/critiquer/évaluer une image (UX/UI) - TOUJOURS si image fournie + mots comme "analyse", "critique", "évalue", "vérifie", "avis"
  4. "generate_diagram" - Créer un diagramme (flowchart, séquence, etc.)
  5. "chat" - Conversation générale ou demande d'aide

  Contexte précédent (résumé, derniers messages seulement) :
  ${trimmedContext.map(m => `${m.type}: ${m.content}`).join('\n')}

  Guide design (issu d'un débat multi-agents, optionnel) :
  ${debateSummary ? debateSummary.slice(0, 900) : 'N/A'}
  ${imageInfo}

  Message utilisateur : "${message}"

  ⚠️ RÈGLES CRITIQUES:
  - Si une image EST FOURNIE et le message contient "analys", "critique", "évalue", "vérifie", "regarde", "avis" → TOUJOURS "analyze_image"
  - Si une image EST FOURNIE et le message parle de "logo", "design" SANS mentionner "créer/générer" → "analyze_image" par défaut
  - "generate_image" UNIQUEMENT si AUCUNE image fournie ET demande explicite de création

  Réponds uniquement avec un JSON de la forme :
  {
    "action": "type_d_action",
    "confidence": 0.95,
    "parameters": {
      "prompt": "prompt optimisé pour l'API",
      "imageUrl": "${hasImages ? images[0].url : 'null'}",
      "diagramType": "type de diagramme si applicable"
    },
    "explanation": "explication courte de ta décision"
  }
  `;

  try {
    // Utiliser Groq si disponible (plus rapide, pas de quota quotidien)
    if (isGroqAvailable()) {
      console.log('[DEBUG] Utilisation Groq pour détection intention (rapide)');
      try {
        const groqResponse = await groqGenerateContent(systemPrompt, {
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          temperature: 0.3,
          maxTokens: 500
        });
        
        console.log('[DEBUG] Réponse Groq reçue');
        const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (groqError) {
        console.error('[DEBUG] Erreur Groq:', groqError.message);
        console.log('[DEBUG] Fallback vers mots-clés');
      }
    }
    
    // Fallback mots-clés si Groq non disponible ou échec
    console.log('[DEBUG] Utilisation fallback mots-clés');
    return detectIntentionFallback(message, images);
    
    /* Code Gemini désactivé temporairement
    if (shouldBypassGemini()) {
      console.log('[DEBUG] Bypass Gemini activé, utilisation fallback');
      return detectIntentionFallback(message);
    }

    console.log('[DEBUG] Appel Gemini pour détection intention...');
    
    // Ajouter un timeout de 10 secondes
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout Gemini (10s)')), 10000)
    );
    
    const geminiPromise = geminiGenerateContent(systemPrompt);
    
    const response = await Promise.race([geminiPromise, timeoutPromise]);
    console.log('[DEBUG] Réponse Gemini reçue');

    // Parser la réponse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback en cas d'échec de parsing
    console.log('[DEBUG] Parsing JSON échoué, fallback');
    return detectIntentionFallback(message);
    */
  } catch (error) {
    console.error('[DEBUG] Erreur détection intention:', error.message);
    return detectIntentionFallback(message, images);
  }
}

// Détection d'intention de fallback (basée sur des mots-clés)
function detectIntentionFallback(message, images = []) {
  const lowerMessage = message.toLowerCase();
  const hasImages = images && images.length > 0;

  const keywords = {
    generate_image: ['génère', 'crée', 'logo', 'illustration', 'générer', 'créer', 'faire', 'design'],
    edit_image: ['modifie', 'change', 'transforme', 'améliore', 'éditer', 'modifier'],
    analyze_image: ['analyse', 'évalue', 'critique', 'examine', 'vérifie', 'regarde', 'avis', 'feedback'],
    generate_diagram: ['diagramme', 'graphique', 'schéma', 'flowchart', 'architecture']
  };

  // Si une image est jointe, prioriser l'analyse
  if (hasImages) {
    const isAnalyze = keywords.analyze_image.some(word => lowerMessage.includes(word));
    const isGenerate = keywords.generate_image.some(word => lowerMessage.includes(word));
    
    if (isAnalyze || (!isGenerate && (lowerMessage.includes('logo') || lowerMessage.includes('design')))) {
      return {
        action: 'analyze_image',
        confidence: 0.8,
        parameters: { 
          prompt: message,
          imageUrl: images[0].url
        },
        explanation: 'Image fournie + mots-clés analyse'
      };
    }
  }

  // Détection normale par mots-clés
  for (const [action, words] of Object.entries(keywords)) {
    if (words.some(word => lowerMessage.includes(word))) {
      return {
        action,
        confidence: 0.7,
        parameters: { 
          prompt: message,
          imageUrl: hasImages ? images[0].url : null
        },
        explanation: `Détecté via mots-clés: ${action}`
      };
    }
  }

  return {
    action: 'chat',
    confidence: 0.5,
    parameters: { prompt: message },
    explanation: 'Conversation générale détectée'
  };
}

// Orchestrer l'action avec les APIs appropriées
async function executeAction(intention, message, context = [], extras = {}) {
  const { action, parameters } = intention;
  const debateInsights = extras?.debateInsights || null;

  switch (action) {
    case 'generate_image':
      return await generateImage(parameters, debateInsights);

    case 'edit_image':
      return await editImage(parameters);

    case 'analyze_image':
      return await analyzeImage(parameters);

    case 'generate_diagram':
      return await generateDiagram(parameters);

    case 'chat':
      return await handleChat(message, context, debateInsights);

    default:
      throw new Error(`Action non supportée: ${action}`);
  }
}

// Génération d'image via Reve (si configuré) ou fallback concept via Gemini
async function generateImage(params, debateInsights = null) {
  try {
    const truncate = (s, max) => {
      if (!s) return '';
      const str = String(s);
      return str.length <= max ? str : str.slice(0, max).trim() + '\n[TRUNCATED]';
    };

    const REVE_API_KEY = process.env.REVE_API_KEY;

    const debateSummary = debateInsights?.approved
      ? String(
          debateInsights?.approvedText ||
          debateInsights?.consensus?.summary ||
          debateInsights?.consensus?.direction ||
          ''
        ).trim()
      : '';

    const svgPrototype = debateInsights?.approved && Array.isArray(debateInsights?.svgArtifacts) && debateInsights.svgArtifacts.length > 0
      ? String(debateInsights.svgArtifacts[0])
      : '';

    const baseBrief = String(params?.prompt || '').trim();
    const composedPrompt = [
      baseBrief,
      debateSummary ? `\n\n---\nGuide design (débat):\n${truncate(debateSummary, 1200)}\n---` : '',
      svgPrototype ? `\n\nPrototype SVG (référence):\n${truncate(svgPrototype, 1600)}` : ''
    ].filter(Boolean).join('\n');

    // If Reve is configured, generate an actual image.
    if (REVE_API_KEY) {
      const aspect_ratio = params?.aspect_ratio || '3:2';
      const version = params?.version || 'latest';

      const resp = await fetch('https://api.reve.com/v1/image/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REVE_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: truncate(composedPrompt, 2200),
          aspect_ratio,
          version
        })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Erreur API Reve: ${resp.status} - ${errorText}`);
      }

      const result = await resp.json();

      if (result?.content_violation) {
        return {
          action: 'generate',
          result: {
            content: "Le prompt a été refusé par Reve (content violation). Reformulez le brief plus sobrement.",
            type: 'error'
          },
          suggestions: [
            "Simplifier le prompt",
            "Retirer tout contenu sensible/marque"
          ]
        };
      }

      return {
        action: 'generate',
        result: {
          image: result?.image ? `data:image/png;base64,${result.image}` : null,
          metadata: {
            provider: 'reve',
            prompt: baseBrief,
            usedDebateGuidance: !!debateSummary,
            usedSvgPrototype: !!svgPrototype,
            aspect_ratio,
            version,
            requestId: result?.request_id,
            creditsUsed: result?.credits_used,
            creditsRemaining: result?.credits_remaining
          },
          message: 'Image générée via Reve.'
        },
        suggestions: [
          "Voulez-vous une variation plus minimaliste ?",
          "Changer la palette de couleurs ?",
          "Version plus 3D / plus flat ?"
        ]
      };
    }

    // Otherwise: Gemini concept fallback.
    const imagePrompt = `
    Tu es un directeur artistique expert. Pour le brief suivant, génère une description détaillée
    de l'image qui devrait être créée, incluant:
    - Style visuel (moderne, minimaliste, vintage, etc.)
    - Palette de couleurs recommandée
    - Composition et éléments visuels
    - Suggestions de variations

    Brief: "${truncate(composedPrompt, 2000)}"

    Réponds avec une description créative et inspirante.
    `;

    const description = await geminiGenerateContent(imagePrompt);

    return {
      action: 'generate',
      result: {
        content: description,
        type: 'concept',
        message: "Voici le concept créatif pour votre image. Pour générer l'image réelle, configurez REVE_API_KEY ou utilisez le mode avancé."
      },
      suggestions: [
        "Voulez-vous affiner ce concept ?",
        "Souhaitez-vous explorer des variations ?",
        "Voulez-vous une palette de couleurs différente ?"
      ]
    };
  } catch (error) {
    console.error('Erreur génération concept (Gemini):', error);
    // Fallback: si l'erreur mentionne le modèle, essayer avec gemini-pro
    return {
      action: 'generate',
      result: {
        content: `Désolé, je n'ai pas pu générer le concept. Erreur technique: ${error.message}. Veuillez vérifier votre clé API Gemini.`
      },
      error: error.message,
      suggestions: [
        "Essayez avec un prompt plus simple",
        "Vérifiez votre connexion internet"
      ]
    };
  }
}

// Édition d'image
async function editImage(params) {
  // TODO: Implémenter l'édition d'image via l'API d'édition
  return {
    action: 'edit',
    result: null,
    error: "Fonctionnalité d'édition en cours de développement",
    suggestions: []
  };
}

// Analyse d'image avec Gemini
async function analyzeImage(params) {
  try {
    const imageUrl = params.imageUrl;
    
    // Si une image est fournie, l'analyser via l'endpoint dédié
    if (imageUrl && imageUrl !== 'null' && imageUrl !== '[IMAGE_TOO_LARGE]') {
      console.log('[analyzeImage] Analyse réelle de l\'image via /api/design-analysis/analyze-base64');
      console.log('[analyzeImage] Demande utilisateur:', params.prompt);
      
      try {
        // Construire le prompt en combinant la demande utilisateur avec les instructions système
        const userQuery = params.prompt || 'Analyse cette image';
        const customPrompt = `
DEMANDE DE L'UTILISATEUR:
"${userQuery}"

En tant qu'expert en Design UX/UI, analyse cette image en répondant à la demande de l'utilisateur ci-dessus.

Fournis une analyse structurée et adaptée à sa question, incluant selon le contexte:
- **Description:** Que représente cette image ? (type de design, éléments principaux)
- **Réponse à la demande:** Réponds spécifiquement à ce que l'utilisateur demande
- **Points Forts:** Ce qui fonctionne bien visuellement
- **Points Faibles:** Ce qui pourrait être amélioré
- **Recommandations:** Suggestions concrètes et actionnables

Sois précis, constructif et réponds directement à la question posée.
`;

        console.log('[analyzeImage] Prompt envoyé:', customPrompt.substring(0, 200) + '...');
        
        // Appel de l'endpoint d'analyse d'image
        const analysisResponse = await fetch('http://localhost:3001/api/design-analysis/analyze-base64', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: imageUrl,
            mimeType: imageUrl.match(/data:([^;]+);/)?.[1] || 'image/png',
            customPrompt: customPrompt
          })
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          console.log('[analyzeImage] Analyse reçue avec succès');
          
          return {
            action: 'analyze',
            result: {
              content: analysisData.analysis,
              analysis: analysisData.analysis,
              imageAnalyzed: true
            },
            suggestions: [
              "Voulez-vous des recommandations plus spécifiques ?",
              "Souhaitez-vous une analyse d'accessibilité approfondie ?",
              "Voulez-vous que je propose des variations ?"
            ]
          };
        } else {
          console.error('[analyzeImage] Erreur endpoint analyse:', analysisResponse.status);
        }
      } catch (fetchError) {
        console.error('[analyzeImage] Erreur lors de l\'appel à l\'endpoint:', fetchError);
      }
    }

    // Fallback: analyse textuelle si pas d'image ou erreur
    console.log('[analyzeImage] Fallback: analyse textuelle sans image réelle');
    const analysisPrompt = `
    Tu es un expert en analyse UX/UI et design. Analyse la demande suivante et fournis une critique constructive:
    
    Demande: "${params.prompt || 'Analyser un design'}"
    ${params.imageUrl && params.imageUrl !== 'null' ? 'Note: Une image était censée être fournie mais n\'a pas pu être chargée.' : 'Note: Aucune image fournie.'}
    
    Fournis une analyse structurée incluant:
    1. Points forts potentiels
    2. Axes d'amélioration
    3. Recommandations UX
    4. Accessibilité
    5. Suggestions créatives
    `;

    const analysis = await geminiGenerateContent(analysisPrompt);

    return {
      action: 'analyze',
      result: {
        content: analysis,
        analysis: analysis,
        imageAnalyzed: false
      },
      suggestions: [
        "Voulez-vous des recommandations plus spécifiques ?",
        "Souhaitez-vous une analyse d'accessibilité approfondie ?",
        "Voulez-vous que je propose des variations ?"
      ]
    };
  } catch (error) {
    console.error('Erreur analyse:', error);
    return {
      action: 'analyze',
      result: {
        content: "Désolé, l'analyse a échoué. Veuillez réessayer."
      },
      error: error.message,
      suggestions: []
    };
  }
}

// Génération de diagramme avec Gemini (code Mermaid)
async function generateDiagram(params) {
  try {
    const diagramPrompt = `
    Tu es un expert en diagrammes et visualisation. Génère un diagramme Mermaid pour la demande suivante:
    
    Description: "${params.prompt}"
    Type de diagramme préféré: ${params.diagramType || 'flowchart'}
    
    Règles:
    - Utilise la syntaxe Mermaid valide
    - Crée un diagramme clair et lisible
    - Ajoute des descriptions sur les éléments clés
    
    Réponds UNIQUEMENT avec le code Mermaid, sans explication.
    `;

    const mermaidCode = await geminiGenerateContent(diagramPrompt);

    // Nettoyer le code (enlever les balises markdown si présentes)
    const cleanCode = mermaidCode
      .replace(/```mermaid\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    return {
      action: 'generate',
      result: {
        content: `Voici le diagramme généré:\n\n\`\`\`mermaid\n${cleanCode}\n\`\`\``,
        mermaidCode: cleanCode,
        type: 'diagram'
      },
      suggestions: [
        "Voulez-vous modifier le style du diagramme ?",
        "Souhaitez-vous ajouter d'autres éléments ?",
        "Voulez-vous exporter le code Mermaid ?"
      ]
    };
  } catch (error) {
    console.error('Erreur génération diagramme:', error);
    return {
      action: 'generate',
      result: {
        content: "Désolé, la génération du diagramme a échoué. Veuillez réessayer."
      },
      error: error.message,
      suggestions: []
    };
  }
}

// Gestion du chat général
async function handleChat(message, context, debateInsights = null) {
  try {
    const chatHistory = context.slice(-5); // Garder les 5 derniers messages

    const debateSummary = debateInsights?.approved
      ? String(
          debateInsights?.approvedText ||
          debateInsights?.consensus?.summary ||
          debateInsights?.consensus?.direction ||
          ''
        ).trim()
      : '';

    const chatPrompt = `
    Tu es un assistant expert en design et IA. Tu aides les utilisateurs avec leurs projets créatifs.
    
    Historique de conversation :
    ${chatHistory.map(m => `${m.type}: ${m.content}`).join('\n')}

    Guide design (issu d'un débat multi-agents, optionnel) :
    ${debateSummary ? debateSummary.slice(0, 900) : 'N/A'}
    
    Question de l'utilisateur : "${message}"
    
    Réponds de manière utile et bienveillante. Si l'utilisateur demande quelque chose que tu ne peux pas faire directement, propose-lui des alternatives ou guide-le vers les bonnes actions.
    `;

    const response = await geminiGenerateContent(chatPrompt);

    return {
      action: 'chat',
      result: {
        content: response
      },
      suggestions: [
        "Pouvez-vous m'aider à générer un logo ?",
        "Comment analyser une interface utilisateur ?",
        "Créer un diagramme d'architecture"
      ]
    };
  } catch (error) {
    console.error('Erreur chat:', error);
    return {
      action: 'chat',
      result: {
        content: "Désolé, je rencontre des difficultés techniques. Pouvez-vous réessayer ?"
      },
      suggestions: []
    };
  }
}

// Route principale pour l'agent
router.post('/chat', async (req, res) => {
  try {
    const { message, projectId, context, images, timestamp, debateInsights, forceAction, forceParameters } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    console.log(`Agent - Message reçu: "${message}" pour le projet ${projectId}`);
    if (images && images.length > 0) {
      console.log(`  -> ${images.length} image(s) jointe(s):`, images.map(img => ({ name: img.name, url: img.url?.substring(0, 50) + '...' })));
    }

    // Détecter l'intention (ou forcer une action depuis l'UI HITL)
    let intention;
    
    try {
      if (forceAction) {
        console.log('[DEBUG] Action forcée:', forceAction);
        intention = {
          action: String(forceAction),
          confidence: 1,
          parameters: {
            ...(forceParameters && typeof forceParameters === 'object' ? forceParameters : {}),
            prompt: (forceParameters && typeof forceParameters === 'object' && forceParameters.prompt)
              ? forceParameters.prompt
              : message,
            // Si des images sont jointes et pas d'imageUrl dans forceParameters, utiliser la première image
            imageUrl: (forceParameters && forceParameters.imageUrl) 
              ? forceParameters.imageUrl 
              : (images && images.length > 0 ? images[0].url : null)
          },
          explanation: 'Forced by UI'
        };
      } else {
        console.log('[DEBUG] Détection de l\'intention en cours...');
        intention = await detectIntention(message, context || [], debateInsights || null, images || []);
        console.log('[DEBUG] Intention brute reçue:', intention);
        
        // CORRECTION CRITIQUE: Si une image est jointe, vérifier si c'est vraiment une analyse
        if (images && images.length > 0) {
          const messageLC = message.toLowerCase();
          
          // Mots-clés CLAIRS pour l'analyse
          const analyzeKeywords = ['analys', 'critique', 'évalue', 'vérifie', 'regarde', 'examine', 'commente', 'avis', 'feedback', 'retour', 'opinion', 'est-il', 'est-ce', 'comment', 'pourquoi'];
          const isAnalyze = analyzeKeywords.some(kw => messageLC.includes(kw));
          
          // Mots-clés CLAIRS pour la génération (même avec image, l'utilisateur peut vouloir une nouvelle image inspirée)
          const generateKeywords = ['génère', 'crée', 'créer', 'générer', 'faire', 'nouveau', 'nouvelle', 'autre', 'similaire', 'inspiré', 'basé sur'];
          const isGenerate = generateKeywords.some(kw => messageLC.includes(kw));
          
          // Si mots de génération ET image jointe → L'utilisateur veut une image INSPIRÉE de celle fournie
          if (isGenerate && intention.action === 'generate_image') {
            console.log('[INFO] Image jointe + mots de génération → Génération inspirée de l\'image');
            // Garder generate_image mais mentionner l'image comme référence dans le prompt
            intention.parameters.prompt = `${message} (Référence fournie: ${images[0].name || 'image'})`;
          }
          // Si mots d'analyse ET intention = generate_image → CORRIGER vers analyze
          else if (isAnalyze && intention.action === 'generate_image') {
            console.log('[CORRECTION] Image jointe + mots d\'analyse détectés → Forcer analyze_image');
            intention = {
              action: 'analyze_image',
              confidence: 0.95,
              parameters: {
                prompt: message,
                imageUrl: images[0].url
              },
              explanation: 'Image jointe + analyse demandée - correction auto'
            };
          }
          // Si AUCUN mot-clé clair mais image jointe et "logo" ou "design" mentionné → Analyse par défaut
          else if (!isGenerate && (messageLC.includes('logo') || messageLC.includes('design') || messageLC.includes('image')) && intention.action === 'generate_image') {
            console.log('[CLARIFICATION] Image jointe + mention logo/design sans verbe clair → Assumer analyse');
            intention = {
              action: 'analyze_image',
              confidence: 0.85,
              parameters: {
                prompt: message,
                imageUrl: images[0].url
              },
              explanation: 'Image fournie avec mention logo/design - analyse assumée'
            };
          }
          // S'assurer que imageUrl est présent pour analyze_image
          else if (intention.action === 'analyze_image' && !intention.parameters.imageUrl) {
            intention.parameters.imageUrl = images[0].url;
          }
        }
      }
      
      console.log('Intention détectée:', intention);
    } catch (intentionError) {
      console.error('[ERREUR] Détection d\'intention échouée:', intentionError);
      // Fallback simple
      intention = {
        action: 'chat',
        confidence: 0.5,
        parameters: { prompt: message },
        explanation: 'Erreur détection, fallback chat'
      };
    }

    // Exécuter l'action
    console.log('[DEBUG] Exécution de l\'action:', intention.action);
    const actionResult = await executeAction(intention, message, context || [], { debateInsights: debateInsights || null });
    console.log('[DEBUG] Résultat de l\'action reçu:', { action: actionResult.action, hasResult: !!actionResult.result });

    // Construire la réponse
    const response = {
      success: true,
      response: actionResult.result?.content ||
        (actionResult.result?.analysis ? actionResult.result.analysis :
          `J'ai ${actionResult.action === 'generate' ? 'généré' : actionResult.action === 'analyze' ? 'analysé' : 'traité'} votre demande.`),
      action: actionResult.action,
      result: actionResult.result,
      suggestions: actionResult.suggestions || [],
      intention: intention,
      timestamp: new Date().toISOString()
    };
    
    console.log('[DEBUG] Réponse construite, envoi au client...');

    // If the UI explicitly requested an image, make failure obvious.
    if (forceAction === 'generate_image' && !actionResult?.result?.image) {
      response.success = false;
      response.error = 'Image not generated';
      response.response = actionResult?.result?.message || actionResult?.result?.content ||
        "Impossible de générer l'image. Vérifiez REVE_API_KEY (backend Node) et les logs serveur.";
    }

    // Sauvegarder dans la base de données si projectId fourni
    if (projectId) {
      try {
        // Sauvegarder le message utilisateur
        const userMessageId = `msg_${Date.now()}_user`;
        db.prepare(`
          INSERT INTO messages (id, project_id, type, content, metadata)
          VALUES (?, ?, ?, ?, ?)
        `).run(userMessageId, projectId, 'user', message, JSON.stringify({ timestamp }));

        // Sauvegarder la réponse IA
        const aiMessageId = `msg_${Date.now()}_ai`;
        db.prepare(`
          INSERT INTO messages (id, project_id, type, content, metadata)
          VALUES (?, ?, ?, ?, ?)
        `).run(aiMessageId, projectId, 'ai', response.response, JSON.stringify({
          action: actionResult.action,
          intention: intention,
          suggestions: actionResult.suggestions
        }));

        // Sauvegarder les images générées
        if (actionResult.result?.image) {
          const imageId = `img_${Date.now()}`;
          db.prepare(`
            INSERT INTO images (id, project_id, url, type, prompt, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            imageId,
            projectId,
            actionResult.result.image,
            actionResult.action,
            message,
            JSON.stringify(actionResult.result.metadata || {})
          );
        }
      } catch (dbError) {
        console.error('Erreur sauvegarde base de données:', dbError);
        // Ne pas échouer la requête pour une erreur de sauvegarde
      }
    }

    res.json(response);

  } catch (error) {
    console.error('=== ERREUR AGENT ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Requête:', { message, projectId, hasImages: !!images, hasContext: !!context });
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      message: error.message,
      details: error.stack?.split('\n').slice(0, 3).join('\n') // Première ligne du stack
    });
  }
});

// Route pour obtenir l'historique d'un projet
router.get('/history/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;

    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE project_id = ? 
      ORDER BY created_at ASC
    `).all(projectId);

    const images = db.prepare(`
      SELECT * FROM images 
      WHERE project_id = ? 
      ORDER BY created_at ASC
    `).all(projectId);

    res.json({
      success: true,
      messages: messages.map(m => ({
        ...m,
        metadata: m.metadata ? JSON.parse(m.metadata) : null
      })),
      images: images.map(img => ({
        ...img,
        metadata: img.metadata ? JSON.parse(img.metadata) : null
      }))
    });

  } catch (error) {
    console.error('Erreur historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

// Route pour statistiques
router.get('/stats', (req, res) => {
  try {
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get();
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').get();
    const imageCount = db.prepare('SELECT COUNT(*) as count FROM images').get();

    res.json({
      success: true,
      stats: {
        projects: projectCount.count,
        messages: messageCount.count,
        images: imageCount.count
      }
    });

  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
});

export default router;