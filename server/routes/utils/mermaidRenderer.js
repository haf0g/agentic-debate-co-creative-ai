import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Configuration du rendu Mermaid
export async function renderMermaid(mermaidCode, options = {}) {
  const {
    theme = 'default',
    backgroundColor = 'white',
    width = 800,
    height = 600,
    format = 'png'
  } = options;

  // Créer un fichier temporaire pour le code Mermaid
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mermaid-'));
  const inputFile = path.join(tempDir, 'diagram.mmd');
  const outputFile = path.join(tempDir, `diagram.${format}`);

  try {
    // Écrire le code Mermaid dans un fichier temporaire
    await fs.writeFile(inputFile, mermaidCode);

    // Commande pour générer l'image avec Mermaid CLI
    // Note: Cette approche nécessite que Mermaid CLI soit installé
    // npm install -g @mermaid-js/mermaid-cli
    const command = `mmdc -i "${inputFile}" -o "${outputFile}" -t ${theme} -b ${backgroundColor} -w ${width} -h ${height}`;

    try {
      await execAsync(command);
    } catch (cliError) {
      // Si Mermaid CLI n'est pas installé, on utilise une approche alternative
      console.warn('Mermaid CLI non disponible, utilisation de l\'API mermaid.ink');
      return await renderWithMermaidInk(mermaidCode, options);
    }

    // Lire le fichier de sortie
    const imageBuffer = await fs.readFile(outputFile);

    return imageBuffer;

  } finally {
    // Nettoyer les fichiers temporaires
    try {
      await fs.unlink(inputFile);
      await fs.unlink(outputFile);
      await fs.rmdir(tempDir);
    } catch (cleanupError) {
      // Ignorer les erreurs de nettoyage
    }
  }
}

// Alternative avec l'API mermaid.ink
async function renderWithMermaidInk(mermaidCode, options = {}) {
  const { theme = 'default' } = options;

  try {
    // Encoder le code Mermaid en base64url (sans padding)
    const base64 = Buffer.from(mermaidCode, 'utf8').toString('base64');
    // Convertir base64 en base64url
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    // Construire l'URL de l'API mermaid.ink
    // Format: https://mermaid.ink/img/{base64url_encoded_mermaid}
    const url = `https://mermaid.ink/img/${base64url}`;

    console.log('Fetching mermaid diagram from:', url.substring(0, 80) + '...');

    // Télécharger l'image générée
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/png'
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Mermaid.ink error:', response.status, text.substring(0, 200));
      throw new Error(`Erreur mermaid.ink: ${response.status}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    return imageBuffer;
  } catch (error) {
    console.error('Erreur rendu mermaid.ink:', error);
    // Retourner null pour permettre un fallback vers le code brut
    return null;
  }
}

// Fonction pour vérifier si Mermaid CLI est disponible
export async function checkMermaidCLI() {
  try {
    await execAsync('mmdc --version');
    return true;
  } catch {
    return false;
  }
}