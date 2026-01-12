import React, { useState, useCallback } from 'react';
import { Upload, Eye, Sparkles, AlertCircle } from 'lucide-react';

const DesignAnalysisSection = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);

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
    setUploadedImage({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    });

    // Lancer l'analyse automatiquement
    await analyzeImage(file);
  }, []);

  const analyzeImage = async (imageFile) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/design-analysis/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'analyse');
      }

      setAnalysis(data);
    } catch (err) {
      console.error('Erreur d\'analyse:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h1 className="section-title">
          <Eye className="section-icon" />
          Analyse UX/UI par IA
        </h1>
        <p className="section-description">
          Uploadez une capture d'écran de design et obtenez une analyse professionnelle 
          de l'UX/UI basée sur les meilleures pratiques.
        </p>
      </div>

      {/* Zone d'upload */}
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''} ${uploadedImage ? 'has-image' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('image-upload').click()}
      >
        {!uploadedImage ? (
          <>
            <Upload className="upload-icon" />
            <div className="upload-text">
              Glissez votre image ici ou cliquez pour sélectionner
            </div>
            <div className="upload-subtext">
              Supports: JPEG, PNG, GIF, WebP (max 10MB)
            </div>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        ) : (
          <div className="uploaded-image-container">
            <img
              src={uploadedImage.url}
              alt={uploadedImage.name}
              className="uploaded-image"
            />
            <div className="image-info">
              <div className="image-details">
                <span className="image-name">{uploadedImage.name}</span>
                <span className="image-size">{formatFileSize(uploadedImage.size)}</span>
              </div>
              <button
                className="btn btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('image-upload').click();
                }}
              >
                Changer d'image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="loading-bar"></div>
          <div className="status-indicator processing">
            <Sparkles className="spinner" />
            Analyse en cours par l'IA...
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="error-message">
          <AlertCircle className="error-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Résultats de l'analyse */}
      {analysis && !isAnalyzing && (
        <div className="result-card">
          <div className="result-header">
            <h3 className="result-title">Analyse IA</h3>
            <span className="ai-badge">Gemini Vision</span>
          </div>
          <div className="analysis-content">
            <div className="analysis-text">
              {analysis.analysis.split('\n').map((paragraph, index) => (
                paragraph.trim() && (
                  <p key={index} className="analysis-paragraph">
                    {paragraph}
                  </p>
                )
              ))}
            </div>
            <div className="analysis-meta">
              <small className="text-muted">
                Analysé le {new Date(analysis.timestamp).toLocaleString('fr-FR')}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Conseils d'utilisation */}
      {!uploadedImage && !isAnalyzing && (
        <div className="tips-section">
          <h4 className="tips-title">Conseils pour une meilleure analyse</h4>
          <ul className="tips-list">
            <li>📱 Utilisez des captures d'écran de qualité (au moins 800px de largeur)</li>
            <li>🎨 Incluez l'interface complète (header, navigation, contenu, footer)</li>
            <li>⚡ Évitez les images floues ou pixelisées</li>
            <li>📐 Les maquettes et prototypes sont également acceptés</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DesignAnalysisSection;