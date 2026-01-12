import express from 'express';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Configuration
const getReveApiKey = () => process.env.REVE_API_KEY;

// Fonction utilitaire pour convertir image en base64
const imageToBase64 = (imageBuffer) => {
  return imageBuffer.toString('base64');
};

// Route pour éditer une image avec Reve API
router.post('/edit-reve', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const { editInstruction, version = "latest" } = req.body;

    if (!editInstruction) {
      return res.status(400).json({ error: 'Instruction d\'édition requise' });
    }

    const REVE_API_KEY = getReveApiKey();
    if (!REVE_API_KEY) {
      return res.status(500).json({ 
        error: 'Clé API Reve non configurée',
        message: 'Veuillez configurer REVE_API_KEY dans les variables d\'environnement'
      });
    }

    // Lire et convertir l'image en base64
    const imageBuffer = await fs.readFile(req.file.path);
    const imageBase64 = imageToBase64(imageBuffer);

    // Configuration des en-têtes
    const headers = {
      "Authorization": `Bearer ${REVE_API_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    // Payload de la requête
    const payload = {
      edit_instruction: editInstruction,
      reference_image: imageBase64,
      version: version
    };

    console.log(`Édition d'image Reve avec l'instruction: "${editInstruction}"`);

    // Appel à l'API Reve pour l'édition
    const response = await axios.post(
      "https://api.reve.com/v1/image/edit",
      payload,
      { headers }
    );

    if (response.status === 200) {
      const result = response.data;
      
      // Extraire l'image éditée base64
      const editedImageBase64 = result.image;
      if (editedImageBase64) {
        // Convertir en base64 pour le frontend
        const base64Image = `data:image/png;base64,${editedImageBase64}`;

        res.json({
          success: true,
          originalImage: `data:${req.file.mimetype};base64,${imageBase64}`,
          editedImage: base64Image,
          metadata: {
            provider: 'reve',
            editInstruction,
            originalImage: {
              filename: req.file.originalname,
              size: req.file.size,
              mimeType: req.file.mimetype
            },
            requestId: result.request_id,
            creditsUsed: result.credits_used,
            creditsRemaining: result.credits_remaining,
            contentViolation: result.content_violation
          },
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Aucune image éditée dans la réponse de l\'API Reve');
      }
    } else {
      throw new Error(`Erreur API Reve: ${response.status} - ${response.statusText}`);
    }

  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message = data?.message || error?.message;
    console.error('Erreur édition Reve:', {
      status,
      message,
      data
    });
    
    // Nettoyer le fichier en cas d'erreur
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    if (error.response) {
      res.status(error.response.status).json({
        error: 'Erreur de l\'API Reve',
        message,
        details: data
      });
    } else {
      res.status(500).json({
        error: 'Erreur lors de l\'édition d\'image',
        message: error?.message || 'Erreur inconnue'
      });
    }
  }
});

// Route pour éditer une image via URL
router.post('/edit-url', async (req, res) => {
  try {
    const { imageUrl, editInstruction, version = "latest" } = req.body;

    if (!imageUrl || !editInstruction) {
      return res.status(400).json({ 
        error: 'URL de l\'image et instruction d\'édition requises' 
      });
    }

    const REVE_API_KEY = getReveApiKey();
    if (!REVE_API_KEY) {
      return res.status(500).json({ 
        error: 'Clé API Reve non configurée' 
      });
    }

    // Récupérer l'image depuis l'URL
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    const imageBase64 = imageToBase64(imageBuffer);
    const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';

    // Configuration des en-têtes
    const headers = {
      "Authorization": `Bearer ${REVE_API_KEY}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    // Payload de la requête
    const payload = {
      edit_instruction: editInstruction,
      reference_image: imageBase64,
      version: version
    };

    console.log(`Édition d'image URL Reve avec l'instruction: "${editInstruction}"`);

    // Appel à l'API Reve pour l'édition
    const response = await axios.post(
      "https://api.reve.com/v1/image/edit",
      payload,
      { headers }
    );

    if (response.status === 200) {
      const result = response.data;
      
      // Extraire l'image éditée base64
      const editedImageBase64 = result.image;
      if (editedImageBase64) {
        // Convertir en base64 pour le frontend
        const base64Image = `data:image/png;base64,${editedImageBase64}`;

        res.json({
          success: true,
          originalImage: `data:${mimeType};base64,${imageBase64}`,
          editedImage: base64Image,
          metadata: {
            provider: 'reve',
            editInstruction,
            originalImage: {
              url: imageUrl,
              size: imageBuffer.length,
              mimeType
            },
            requestId: result.request_id,
            creditsUsed: result.credits_used,
            creditsRemaining: result.credits_remaining,
            contentViolation: result.content_violation
          },
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('Aucune image éditée dans la réponse de l\'API Reve');
      }
    } else {
      throw new Error(`Erreur API Reve: ${response.status} - ${response.statusText}`);
    }

  } catch (error) {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const message = data?.message || error?.message;
    console.error('Erreur édition URL Reve:', {
      status,
      message,
      data
    });
    res.status(status || 500).json({
      error: 'Erreur lors de l\'édition d\'image via URL',
      message,
      details: data
    });
  }
});

// Route pour obtenir les versions disponibles
router.get('/versions', (req, res) => {
  res.json({
    available: [
      {
        id: "latest",
        name: "Dernière version",
        description: "Version la plus récente et performante"
      },
      {
        id: "latest-fast",
        name: "Version rapide",
        description: "Génération plus rapide avec qualité légèrement réduite"
      }
    ]
  });
});

export default router;