import express from 'express';
import axios from 'axios';
import { renderMermaid } from './utils/mermaidRenderer.js';
import { geminiGenerateContent } from './utils/geminiClient.js';

const router = express.Router();

// Route pour générer un diagramme à partir d'une description
router.post('/generate', async (req, res) => {
  try {
    const { description, diagramType = 'flowchart' } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description du diagramme requise' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Clé API Gemini non configurée',
        message: 'Veuillez configurer GEMINI_API_KEY dans les variables d\'environnement'
      });
    }

    // Prompt système pour générer du Mermaid
    const systemPrompt = `
    Tu es un expert en architecture logicielle. Ta tâche est de convertir la demande de l'utilisateur en un **diagramme Mermaid** valide.
    Tu ne dois répondre *que* avec le code Mermaid, sans aucun autre texte explicatif, excuses, ou commentaires.
    N'utilise PAS de markdown (pas de \`\`\`mermaid ou \`\`\`) dans ta réponse.
    Réponds *uniquement* avec le code du diagramme.

    Types de diagrammes supportés:
    - flowchart : graph TD, graph LR
    - sequence : sequenceDiagram
    - class : classDiagram
    - state : stateDiagram
    - er : erDiagram
    - journey : journey
    - gitgraph : gitgraph
    - pie : pie
    `;

    // Construire le prompt complet
    const fullPrompt = `${systemPrompt}\n\nDemande utilisateur : "${description}"\nType souhaité : ${diagramType}`;

    console.log(`Génération de diagramme Mermaid pour: "${description}"`);

    // Générer le code Mermaid avec Gemini (via client avec file d'attente + retry)
    const mermaidCode = (await geminiGenerateContent(fullPrompt)).trim();

    // Valider que le code commence par un type de diagramme Mermaid valide
    const validMermaidStart = /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gitgraph|pie)\s/i;
    if (!validMermaidStart.test(mermaidCode)) {
      throw new Error('Le code généré ne semble pas être un diagramme Mermaid valide');
    }

    // Rendre le diagramme en image
    const imageBuffer = await renderMermaid(mermaidCode, {
      theme: 'default',
      backgroundColor: 'white'
    });

    // Construire la réponse (avec ou sans image)
    const response = {
      success: true,
      mermaidCode,
      metadata: {
        provider: 'gemini',
        description,
        diagramType,
        codeLength: mermaidCode.length
      },
      timestamp: new Date().toISOString()
    };

    // Ajouter l'image si le rendu a réussi
    if (imageBuffer) {
      response.image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } else {
      response.renderWarning = 'Le rendu image a échoué, utilisez le code Mermaid directement';
    }

    res.json(response);

  } catch (error) {
    console.error('Erreur génération diagramme:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération du diagramme',
      message: error.message
    });
  }
});

// Route pour régénérer un diagramme avec un code Mermaid personnalisé
router.post('/render-custom', async (req, res) => {
  try {
    const { mermaidCode } = req.body;

    if (!mermaidCode) {
      return res.status(400).json({ error: 'Code Mermaid requis' });
    }

    // Valider le code Mermaid
    const validMermaidStart = /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gitgraph|pie)\s/i;
    if (!validMermaidStart.test(mermaidCode)) {
      return res.status(400).json({
        error: 'Code Mermaid invalide',
        message: 'Le code doit commencer par un type de diagramme Mermaid valide'
      });
    }

    console.log('Rendu de diagramme Mermaid personnalisé');

    // Rendre le diagramme en image
    const imageBuffer = await renderMermaid(mermaidCode, {
      theme: 'default',
      backgroundColor: 'white'
    });

    const response = {
      success: true,
      mermaidCode,
      metadata: {
        type: 'custom',
        codeLength: mermaidCode.length
      },
      timestamp: new Date().toISOString()
    };

    if (imageBuffer) {
      response.image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } else {
      response.renderWarning = 'Le rendu image a échoué';
    }

    res.json(response);

  } catch (error) {
    console.error('Erreur rendu custom:', error);
    res.status(500).json({
      error: 'Erreur lors du rendu du diagramme personnalisé',
      message: error.message
    });
  }
});

// Route pour valider un code Mermaid
router.post('/validate', async (req, res) => {
  try {
    const { mermaidCode } = req.body;

    if (!mermaidCode) {
      return res.status(400).json({ error: 'Code Mermaid requis' });
    }

    // Validation basique du code Mermaid
    const validMermaidStart = /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gitgraph|pie)\s/i;
    const hasValidStart = validMermaidStart.test(mermaidCode);

    // Vérifier la syntaxe de base
    const hasMatchingBraces = (mermaidCode.match(/[{}]/g) || []).length % 2 === 0;
    const hasMatchingParens = (mermaidCode.match(/[()]/g) || []).length % 2 === 0;

    // Tester le rendu
    let canRender = false;
    try {
      await renderMermaid(mermaidCode, { theme: 'default', backgroundColor: 'white' });
      canRender = true;
    } catch (renderError) {
      console.warn('Échec du rendu pour validation:', renderError.message);
    }

    res.json({
      isValid: hasValidStart && hasMatchingBraces && hasMatchingParens && canRender,
      checks: {
        hasValidStart,
        hasMatchingBraces,
        hasMatchingParens,
        canRender
      },
      suggestions: [
        ...(!hasValidStart ? ['Le code doit commencer par un type de diagramme Mermaid valide'] : []),
        ...(!hasMatchingBraces ? ['Vérifiez l\'équilibre des accolades {}'] : []),
        ...(!hasMatchingParens ? ['Vérifiez l\'équilibre des parenthèses ()'] : []),
        ...(!canRender ? ['Le code Mermaid contient des erreurs de syntaxe'] : [])
      ]
    });

  } catch (error) {
    console.error('Erreur validation:', error);
    res.status(500).json({
      error: 'Erreur lors de la validation du code Mermaid',
      message: error.message
    });
  }
});

// Route pour obtenir les types de diagrammes supportés
router.get('/types', (req, res) => {
  res.json({
    types: [
      {
        id: 'flowchart',
        name: 'Organigramme',
        description: 'Diagrammes de flux et processus',
        examples: ['Flowchart', 'Process Flow', 'Decision Tree']
      },
      {
        id: 'sequence',
        name: 'Séquence',
        description: 'Diagrammes de séquence temporelle',
        examples: ['API Flow', 'User Interaction', 'System Process']
      },
      {
        id: 'class',
        name: 'Classes',
        description: 'Diagrammes de classes UML',
        examples: ['System Architecture', 'Data Model', 'Software Design']
      },
      {
        id: 'state',
        name: 'États',
        description: 'Diagrammes d\'états',
        examples: ['State Machine', 'Workflow', 'Process States']
      },
      {
        id: 'er',
        name: 'Entité-Relation',
        description: 'Diagrammes de base de données',
        examples: ['Database Schema', 'Entity Relationships', 'Data Model']
      }
    ]
  });
});

export default router;