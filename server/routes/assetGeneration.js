import express from 'express';
import axios from 'axios';
import { InferenceClient } from '@huggingface/inference';

const router = express.Router();

// Configuration des clients API
const getReveApiKey = () => process.env.REVE_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;

let hfClient = null;
if (HF_TOKEN) {
  hfClient = new InferenceClient({
    provider: "replicate",
    apiKey: HF_TOKEN
  });
}

// Route pour générer une image avec Reve API
router.post('/generate-reve', async (req, res) => {
  try {
    const { prompt, aspect_ratio = '3:2', version = 'latest' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    const REVE_API_KEY = getReveApiKey();
    if (!REVE_API_KEY) {
      return res.status(500).json({
        error: 'Clé API Reve non configurée',
        message: 'Veuillez configurer REVE_API_KEY dans les variables d\'environnement'
      });
    }

    console.log(`🎨 Génération d'image Reve pour le prompt: "${prompt.substring(0, 50)}..."`);

    // Appel à l'API Reve selon la documentation officielle
    const response = await fetch('https://api.reve.com/v1/image/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REVE_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio,
        version
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur API Reve:', response.status, errorText);
      throw new Error(`Erreur API Reve: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log(`✅ Image générée - Request ID: ${result.request_id}`);
    console.log(`   Credits utilisés: ${result.credits_used}, restants: ${result.credits_remaining}`);

    if (result.content_violation) {
      return res.status(400).json({
        error: 'Violation de politique de contenu',
        message: 'Le prompt viole les politiques de contenu de Reve'
      });
    }

    // Retourner l'image en base64
    res.json({
      success: true,
      image: `data:image/png;base64,${result.image}`,
      metadata: {
        provider: 'reve',
        prompt,
        aspect_ratio,
        requestId: result.request_id,
        creditsUsed: result.credits_used,
        creditsRemaining: result.credits_remaining
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur génération Reve:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération d\'image',
      message: error.message
    });
  }
});

// Route pour éditer une image avec Reve API
router.post('/edit-reve', async (req, res) => {
  try {
    const { edit_instruction, reference_image, aspect_ratio = '16:9', version = 'latest' } = req.body;

    if (!edit_instruction) {
      return res.status(400).json({ error: 'Instructions d\'édition requises' });
    }

    if (!reference_image) {
      return res.status(400).json({ error: 'Image de référence requise (base64)' });
    }

    const REVE_API_KEY = getReveApiKey();
    if (!REVE_API_KEY) {
      return res.status(500).json({
        error: 'Clé API Reve non configurée'
      });
    }

    console.log(`✏️ Édition d'image Reve: "${edit_instruction.substring(0, 50)}..."`);

    // Nettoyer le base64
    const cleanBase64 = reference_image.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch('https://api.reve.com/v1/image/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${REVE_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        edit_instruction,
        reference_image: cleanBase64,
        aspect_ratio,
        version
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API Reve: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.content_violation) {
      return res.status(400).json({ error: 'Violation de politique de contenu' });
    }

    res.json({
      success: true,
      image: `data:image/png;base64,${result.image}`,
      metadata: {
        provider: 'reve',
        edit_instruction,
        aspect_ratio,
        requestId: result.request_id,
        creditsUsed: result.credits_used,
        creditsRemaining: result.credits_remaining
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur édition Reve:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'édition d\'image',
      message: error.message
    });
  }
});

// Route pour générer une image avec Hugging Face
router.post('/generate-huggingface', async (req, res) => {
  try {
    const { prompt, modelId = "tencent/HunyuanImage-3.0", width = 512, height = 512 } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    if (!hfClient) {
      return res.status(500).json({
        error: 'Client Hugging Face non configuré',
        message: 'Veuillez configurer HF_TOKEN dans les variables d\'environnement'
      });
    }

    console.log(`Génération d'image HF pour le prompt: "${prompt}" avec le modèle: ${modelId}`);

    // Générer l'image avec Hugging Face
    const image = await hfClient.textToImage(prompt, {
      model: modelId,
      height,
      width
    });

    // Convertir l'image PIL en base64
    const buffer = await imageToBuffer(image);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    res.json({
      success: true,
      image: base64Image,
      metadata: {
        provider: 'huggingface',
        model: modelId,
        prompt,
        dimensions: { width, height }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur génération Hugging Face:', error);
    res.status(500).json({
      error: 'Erreur lors de la génération d\'image avec Hugging Face',
      message: error.message
    });
  }
});

// Route pour lister les modèles disponibles
router.get('/models', (req, res) => {
  res.json({
    reveal: {
      available: !!getReveApiKey(),
      endpoint: 'https://api.reve.com/v1/image/create'
    },
    huggingface: {
      available: !!hfClient,
      models: [
        "tencent/HunyuanImage-3.0",
        "runwayml/stable-diffusion-v1-5",
        "CompVis/stable-diffusion-v1-4"
      ]
    }
  });
});

// Fonction utilitaire pour convertir PIL Image en buffer
async function imageToBuffer(image) {
  const { default: sharp } = await import('sharp');
  const buffer = await image.toBuffer();
  return buffer;
}

export default router;