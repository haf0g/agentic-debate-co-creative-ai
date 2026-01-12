import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { geminiGenerateContent } from './utils/geminiClient.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Fonction utilitaire pour convertir le fichier en format utilisable par Gemini
const fileToGenerativePart = async (mimeType, data) => {
  return {
    inlineData: {
      data: data.toString('base64'),
      mimeType
    }
  };
};

// Route pour analyser un design uploadé
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Clé API Gemini non configurée',
        message: 'Veuillez configurer GEMINI_API_KEY dans les variables d\'environnement'
      });
    }

    // Lire le fichier image
    const imageData = await fs.readFile(req.file.path);
    const mimeType = req.file.mimetype;

    // Convertir en format Generative Part
    const imagePart = await fileToGenerativePart(mimeType, imageData);

    // Prompt d'analyse UX/UI
    const prompt = `
    En tant qu'expert en Design UX/UI, analyse l'image fournie.
    Fournis une critique concise et exploitable (actionable) basée sur les 5 points suivants :

    1. **Hiérarchie Visuelle:** Les éléments les plus importants sont-ils mis en avant ?
    2. **Cohérence Graphique:** Les polices, couleurs et espacements sont-ils cohérents ?
    3. **Ergonomie (Lisibilité):** Le texte est-il facile à lire ? Les zones de clic sont-elles claires ?
    4. **Alignement et Espacement:** Les "negative space" et les grilles sont-ils bien utilisés ?
    5. **Suggestion d'Amélioration (1):** Quelle est la *seule* chose la plus importante à améliorer ?

    Réponds de manière structurée et pratique, en te concentrant sur les améliorations concrètes.
    `;

    // Générer l'analyse (via client avec file d'attente + retry)
    const analysis = await geminiGenerateContent([prompt, imagePart], { cache: false });

    // Nettoyer le fichier temporaire
    await fs.unlink(req.file.path).catch(() => { });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      imageInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse:', error);

    // Nettoyer le fichier en cas d'erreur
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => { });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'analyse de l\'image',
      message: error.message
    });
  }
});

// Route pour analyser une image via URL
router.post('/analyze-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'URL de l\'image requise' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Clé API Gemini non configurée'
      });
    }

    // Récupérer l'image depuis l'URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return res.status(400).json({ error: 'Impossible de récupérer l\'image depuis l\'URL' });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/jpeg';

    // Convertir en format Generative Part
    const imagePart = await fileToGenerativePart(mimeType, buffer);

    // Prompt d'analyse UX/UI
    const prompt = `
    En tant qu'expert en Design UX/UI, analyse l'image fournie.
    Fournis une critique concise et exploitable (actionable) basée sur les 5 points suivants :

    1. **Hiérarchie Visuelle:** Les éléments les plus importants sont-ils mis en avant ?
    2. **Cohérence Graphique:** Les polices, couleurs et espacements sont-ils cohérents ?
    3. **Ergonomie (Lisibilité):** Le texte est-il facile à lire ? Les zones de clic sont-elles claires ?
    4. **Alignement et Espacement:** Les "negative space" et les grilles sont-ils bien utilisés ?
    5. **Suggestion d'Amélioration (1):** Quelle est la *seule* chose la plus importante à améliorer ?

    Réponds de manière structurée et pratique, en te concentrant sur les améliorations concrètes.
    `;

    // Générer l'analyse (via client avec file d'attente + retry)
    const analysis = await geminiGenerateContent([prompt, imagePart], { cache: false });

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
      imageInfo: {
        url: imageUrl,
        size: buffer.length,
        mimeType
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'analyse URL:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse de l\'image',
      message: error.message
    });
  }
});

// Route pour analyser une image via base64 (pour les images blob: ou locales)
router.post('/analyze-base64', async (req, res) => {
  try {
    console.log('[ANALYZE-BASE64] Requête reçue');
    const { imageBase64, mimeType = 'image/png', customPrompt } = req.body;

    if (!imageBase64) {
      console.log('[ANALYZE-BASE64] Erreur: pas de base64');
      return res.status(400).json({ error: 'Données image base64 requises' });
    }

    console.log(`[ANALYZE-BASE64] Base64 reçu, longueur: ${imageBase64.length}, mimeType: ${mimeType}`);

    if (!process.env.GEMINI_API_KEY) {
      console.log('[ANALYZE-BASE64] Erreur: GEMINI_API_KEY manquante');
      return res.status(500).json({
        error: 'Clé API Gemini non configurée'
      });
    }

    // Nettoyer le base64 (enlever le préfixe data:image/...;base64, si présent)
    let cleanBase64 = imageBase64;
    if (imageBase64.includes(',')) {
      cleanBase64 = imageBase64.split(',')[1];
    }
    console.log(`[ANALYZE-BASE64] Base64 nettoyé, longueur: ${cleanBase64.length}`);

    // Créer le part pour Gemini
    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType
      }
    };

    // Prompt d'analyse - personnalisable ou par défaut
    const prompt = customPrompt || `
    En tant qu'expert en Design UX/UI, analyse l'image fournie.
    Fournis une description détaillée et une critique constructive :

    1. **Description:** Que représente cette image ? (type de design, éléments principaux)
    2. **Points Forts:** Qu'est-ce qui fonctionne bien visuellement ?
    3. **Cohérence:** Les couleurs, typographies et espacements sont-ils harmonieux ?
    4. **Utilisabilité:** Si c'est une interface, est-elle intuitive et accessible ?
    5. **Suggestion Principale:** Quelle amélioration aurait le plus d'impact ?

    Sois concis mais précis dans ton analyse.
    `;

    console.log('[ANALYZE-BASE64] Appel Gemini...');
    // Analyse d'images - UNIQUEMENT via Gemini Vision (requis)
    const analysis = await geminiGenerateContent([prompt, imagePart], { cache: false });
    console.log(`[ANALYZE-BASE64] Analyse Gemini reçue, longueur: ${analysis?.length || 0}`);

    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ANALYZE-BASE64] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'analyse de l\'image',
      message: error.message
    });
  }
});

export default router;