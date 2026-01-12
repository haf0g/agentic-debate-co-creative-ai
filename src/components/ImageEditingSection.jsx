import React, { useState, useRef, useCallback } from 'react';
import { Edit3, Upload, Sparkles, Download, ArrowLeftRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { buildDebateAdviceText } from '../utils/debateAdvice';

const ImageEditingSection = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [error, setError] = useState(null);
  const fileInputRef = useRef();
  const [useDebateAdvice, setUseDebateAdvice] = useState(true);

  const { currentProject } = useProject();
  const debateAdvice = buildDebateAdviceText(currentProject?.debateInsights);
  const hasDebateConsensus = !!currentProject?.debateInsights?.consensus;
  const hasApprovedDebateAdvice = !!debateAdvice;

  const examples = [
    "Ajouter un effet de dégradé subtil du bleu foncé vers le turquoise",
    "Transformer en version 3D avec des effets de réflexion et d'ombre",
    "Rendre le logo plus moderne avec des coins arrondis",
    "Ajouter un halo lumineux autour du logo",
    "Changer les couleurs pour un style plus warm (tons chauds)"
  ];

  const versions = [
    {
      id: 'latest',
      name: 'Version Standard',
      description: 'Qualité optimale, génération plus lente'
    },
    {
      id: 'latest-fast',
      name: 'Version Rapide',
      description: 'Génération rapide, qualité légèrement réduite'
    }
  ];

  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximale: 10MB');
      return;
    }

    setError(null);
    setOriginalImage({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    });
    setEditedImage(null); // Reset edited image
  }, []);

  const editImage = async () => {
    if (!originalImage?.file) {
      setError('Veuillez d\'abord uploader une image');
      return;
    }

    if (!editInstruction.trim()) {
      setError('Veuillez saisir une instruction d\'édition');
      return;
    }

    setIsEditing(true);
    setError(null);
    setEditedImage(null);

    try {
      const finalInstruction = (useDebateAdvice && debateAdvice)
        ? `${editInstruction}\n\n${debateAdvice}`
        : editInstruction;

      const formData = new FormData();
      formData.append('image', originalImage.file);
      formData.append('editInstruction', finalInstruction);
      formData.append('version', selectedVersion);

      const response = await fetch('/api/image-editing/edit-reve', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        const details = data?.details ? `\n${JSON.stringify(data.details, null, 2)}` : '';
        const msg = data?.message || data?.error || `Erreur lors de l'édition (HTTP ${response.status})`;
        throw new Error(`${msg}${details}`);
      }

      setEditedImage(data);
    } catch (err) {
      console.error('Erreur d\'édition:', err);
      setError(err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const downloadImage = (imageUrl, filename) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const useExample = (example) => {
    setEditInstruction(example);
  };

  const resetImages = () => {
    setOriginalImage(null);
    setEditedImage(null);
    setEditInstruction('');
    setError(null);
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h1 className="section-title">
          <Edit3 className="section-icon" />
          Édition d'Images
        </h1>
        <p className="section-description">
          Modifiez vos images existantes en décrivant simplement les transformations souhaitées. 
          L'IA appliquera vos instructions de manière intelligente.
        </p>
      </div>

      {/* Sélection de version */}
      <div className="version-selector">
        <h3 className="selector-title">Mode de génération</h3>
        <div className="version-options">
          {versions.map((version) => (
            <button
              key={version.id}
              className={`version-option ${selectedVersion === version.id ? 'active' : ''}`}
              onClick={() => setSelectedVersion(version.id)}
            >
              <div className="version-info">
                <span className="version-name">{version.name}</span>
                <span className="version-description">{version.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone d'upload */}
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''} ${originalImage ? 'has-image' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {!originalImage ? (
          <>
            <Upload className="upload-icon" />
            <div className="upload-text">
              Glissez votre image ici ou cliquez pour sélectionner
            </div>
            <div className="upload-subtext">
              Supports: JPEG, PNG, GIF, WebP (max 10MB)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        ) : (
          <div className="uploaded-image-container">
            <img
              src={originalImage.url}
              alt={originalImage.name}
              className="uploaded-image"
            />
            <div className="image-info">
              <div className="image-details">
                <span className="image-name">{originalImage.name}</span>
                <span className="image-size">{(originalImage.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button
                className="btn btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                Changer d'image
              </button>
            </div>
          </div>
        )}
      </div>

      {hasDebateConsensus && (
        <div className="debate-guidance-toggle" style={{ marginTop: 12 }}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useDebateAdvice}
              onChange={(e) => setUseDebateAdvice(e.target.checked)}
              disabled={!hasApprovedDebateAdvice}
            />
            Utiliser les conseils du débat pour l'instruction d'édition
          </label>
          {!hasApprovedDebateAdvice && (
            <div className="hint-text">
              Le débat doit être approuvé (sidebar → « Revoir / approuver ») avant utilisation.
            </div>
          )}
        </div>
      )}

      {/* Instructions d'édition */}
      {originalImage && (
        <div className="edit-instructions-section">
          <h3 className="instructions-title">Décrivez les modifications</h3>

          {currentProject?.debateInsights?.consensus && (
            <div className="debate-guidance-toggle">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useDebateAdvice}
                  onChange={(e) => setUseDebateAdvice(e.target.checked)}
                />
                Utiliser les conseils du débat dans l'instruction
              </label>
            </div>
          )}

          <textarea
            value={editInstruction}
            onChange={(e) => setEditInstruction(e.target.value)}
            placeholder="Exemple: Ajouter un effet de dégradé subtil du bleu foncé vers le turquoise..."
            className="prompt-input"
            rows={3}
          />
          
          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={editImage}
              disabled={isEditing || !editInstruction.trim()}
            >
              <Sparkles className="btn-icon" />
              {isEditing ? 'Édition en cours...' : 'Appliquer les modifications'}
            </button>
            
            <button
              className="btn btn-outline"
              onClick={resetImages}
              disabled={isEditing}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* Exemples d'instructions */}
      {originalImage && !editInstruction && (
        <div className="examples-section">
          <h4 className="examples-title">Exemples d'instructions</h4>
          <div className="examples-grid">
            {examples.map((example, index) => (
              <button
                key={index}
                className="example-card"
                onClick={() => useExample(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Barre de progression */}
      {isEditing && (
        <div className="editing-progress">
          <div className="loading-bar"></div>
          <div className="status-indicator processing">
            <Sparkles className="spinner" />
            Application des modifications par l'IA...
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      {/* Résultat de l'édition */}
      {editedImage && !isEditing && (
        <div className="editing-result">
          <h3 className="result-title">Résultat de l'édition</h3>
          
          <div className="comparison-container">
            <div className="image-panel">
              <h4 className="panel-title">Image Originale</h4>
              <div className="image-container">
                <img
                  src={editedImage.originalImage}
                  alt="Image originale"
                  className="panel-image"
                />
              </div>
            </div>
            
            <div className="comparison-arrow">
              <ArrowLeftRight className="arrow-icon" />
            </div>
            
            <div className="image-panel">
              <h4 className="panel-title">Image Modifiée</h4>
              <div className="image-container">
                <img
                  src={editedImage.editedImage}
                  alt="Image modifiée"
                  className="panel-image"
                />
              </div>
            </div>
          </div>
          
          <div className="result-actions">
            <div className="result-meta">
              <small className="text-muted">
                Instruction: "{editedImage.metadata?.editInstruction}"
              </small>
              <small className="text-muted">
                Mode: {versions.find(v => v.id === selectedVersion)?.name}
              </small>
            </div>
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => downloadImage(editedImage.editedImage, `edited-${Date.now()}.png`)}
              >
                <Download className="btn-icon" />
                Télécharger l'édition
              </button>
              <button
                className="btn btn-outline"
                onClick={editImage}
                disabled={isEditing || !editInstruction.trim()}
              >
                <Sparkles className="btn-icon" />
                Nouvelle édition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conseils */}
      {!originalImage && (
        <div className="tips-section">
          <h4 className="tips-title">Conseils pour de meilleures éditions</h4>
          <ul className="tips-list">
            <li>🎨 Soyez spécifique sur les transformations souhaitées</li>
            <li>🌈 Mentionnez les couleurs et effets précis</li>
            <li>📐 Parlez de style (moderne, vintage, minimaliste...)</li>
            <li>✨ Utilisez des termes comme "dégradé", "ombre", "reflet", "transparence"</li>
            <li>🔄 L'IA peut combiner plusieurs instructions en une seule requête</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageEditingSection;