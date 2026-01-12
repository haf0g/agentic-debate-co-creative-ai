import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Sparkles, Download, RefreshCw, Settings } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { buildDebateAdviceText } from '../utils/debateAdvice';

const AssetGenerationSection = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('reve');
  const [useDebateAdvice, setUseDebateAdvice] = useState(true);
  const [settings, setSettings] = useState({
    width: 1024,
    height: 768,
    model: 'tencent/HunyuanImage-3.0'
  });
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const { currentProject } = useProject();
  const debateAdvice = buildDebateAdviceText(currentProject?.debateInsights);
  const hasDebateConsensus = !!currentProject?.debateInsights?.consensus;
  const hasApprovedDebateAdvice = !!debateAdvice;

  const examples = [
    "Un logo minimaliste pour une startup tech appelée 'CoCreate' avec des couleurs bleu foncé et turquoise",
    "Une icône simple et colorée de fusée qui décolle, centrée, sur fond transparent",
    "Un pictogramme flat design d'une ampoule avec des rayons de lumière",
    "Une illustration moderne de ordinateur portable avec interface utilisateur"
  ];

  const providers = [
    {
      id: 'reve',
      name: 'Reve API',
      description: 'Génération rapide et créative',
      available: true
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      description: 'Modèles open source avancés',
      available: true
    }
  ];

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError('Veuillez saisir un prompt de description');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const finalPrompt = (useDebateAdvice && debateAdvice)
        ? `${prompt}\n\n${debateAdvice}`
        : prompt;

      const endpoint = selectedProvider === 'reve' 
        ? '/api/asset-generation/generate-reve'
        : '/api/asset-generation/generate-huggingface';

      const requestData = selectedProvider === 'reve'
        ? { prompt: finalPrompt, width: settings.width, height: settings.height }
        : { 
            prompt: finalPrompt,
            modelId: settings.model,
            width: settings.width,
            height: settings.height
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        const details = data?.details ? `\n${JSON.stringify(data.details, null, 2)}` : '';
        const msg = data?.message || data?.error || `Erreur lors de la génération (HTTP ${response.status})`;
        throw new Error(`${msg}${details}`);
      }

      setGeneratedImage(data);
    } catch (err) {
      console.error('Erreur de génération:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage?.image) return;

    const link = document.createElement('a');
    link.href = generatedImage.image;
    link.download = `generated-asset-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const useExample = (example) => {
    setPrompt(example);
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h1 className="section-title">
          <ImageIcon className="section-icon" />
          Génération d'Assets
        </h1>
        <p className="section-description">
          Créez des logos, icônes et images personnalisées en décrivant simplement 
          ce que vous souhaitez obtenir.
        </p>
      </div>

      {/* Sélection du provider */}
      <div className="provider-selector">
        <h3 className="selector-title">Choisir le moteur IA</h3>
        <div className="provider-options">
          {providers.map((provider) => (
            <button
              key={provider.id}
              className={`provider-option ${selectedProvider === provider.id ? 'active' : ''}`}
              onClick={() => setSelectedProvider(provider.id)}
              disabled={!provider.available}
            >
              <div className="provider-info">
                <span className="provider-name">{provider.name}</span>
                <span className="provider-description">{provider.description}</span>
              </div>
              {!provider.available && (
                <span className="provider-unavailable">Non disponible</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Paramètres */}
      <div className="settings-section">
        <h3 className="settings-title">
          <Settings className="settings-icon" />
          Paramètres
        </h3>
        <div className="settings-grid">
          <div className="setting-group">
            <label className="setting-label">Largeur</label>
            <input
              type="number"
              value={settings.width}
              onChange={(e) => setSettings({...settings, width: parseInt(e.target.value)})}
              className="setting-input"
              min="256"
              max="2048"
              step="64"
            />
          </div>
          <div className="setting-group">
            <label className="setting-label">Hauteur</label>
            <input
              type="number"
              value={settings.height}
              onChange={(e) => setSettings({...settings, height: parseInt(e.target.value)})}
              className="setting-input"
              min="256"
              max="2048"
              step="64"
            />
          </div>
          {selectedProvider === 'huggingface' && (
            <div className="setting-group full-width">
              <label className="setting-label">Modèle</label>
              <select
                value={settings.model}
                onChange={(e) => setSettings({...settings, model: e.target.value})}
                className="setting-select"
              >
                <option value="tencent/HunyuanImage-3.0">HunyuanImage 3.0</option>
                <option value="runwayml/stable-diffusion-v1-5">Stable Diffusion v1.5</option>
                <option value="CompVis/stable-diffusion-v1-4">Stable Diffusion v1.4</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Zone de prompt */}
      <div className="prompt-section">
        <label className="prompt-label">
          Décrivez votre création
        </label>

        {hasDebateConsensus && (
          <div className="debate-guidance-toggle">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useDebateAdvice}
                onChange={(e) => setUseDebateAdvice(e.target.checked)}
                disabled={!hasApprovedDebateAdvice}
              />
              Utiliser les conseils du débat pour ce prompt
            </label>
            {!hasApprovedDebateAdvice && (
              <div className="hint-text">
                Le débat doit être approuvé (sidebar → « Revoir / approuver ») avant utilisation.
              </div>
            )}
          </div>
        )}

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Exemple: Un logo minimaliste pour une startup tech avec des couleurs modernes..."
          className="prompt-input"
          rows={4}
        />
        
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
          >
            <Sparkles className="btn-icon" />
            {isGenerating ? 'Génération...' : 'Générer'}
          </button>
        </div>
      </div>

      {/* Exemples */}
      <div className="examples-section">
        <h4 className="examples-title">Exemples de prompts</h4>
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

      {/* Barre de progression */}
      {isGenerating && (
        <div className="generation-progress">
          <div className="loading-bar"></div>
          <div className="status-indicator processing">
            <Sparkles className="spinner" />
            Génération en cours par {providers.find(p => p.id === selectedProvider)?.name}...
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
        </div>
      )}

      {/* Résultat généré */}
      {generatedImage && !isGenerating && (
        <div className="result-card">
          <div className="result-header">
            <h3 className="result-title">Asset Généré</h3>
            <span className="ai-badge">
              {providers.find(p => p.id === selectedProvider)?.name}
            </span>
          </div>
          
          <div className="result-image-container">
            <img
              src={generatedImage.image}
              alt="Asset généré"
              className="result-image"
            />
          </div>
          
          <div className="result-actions">
            <div className="result-meta">
              <small className="text-muted">
                Prompt: "{generatedImage.metadata?.prompt || prompt}"
              </small>
              <small className="text-muted">
                Dimensions: {generatedImage.metadata?.dimensions?.width}x{generatedImage.metadata?.dimensions?.height}
              </small>
            </div>
            <div className="action-buttons">
              <button
                className="btn btn-secondary"
                onClick={downloadImage}
              >
                <Download className="btn-icon" />
                Télécharger
              </button>
              <button
                className="btn btn-outline"
                onClick={generateImage}
                disabled={isGenerating}
              >
                <RefreshCw className="btn-icon" />
                Régénérer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conseils */}
      {!generatedImage && !isGenerating && (
        <div className="tips-section">
          <h4 className="tips-title">Conseils pour de meilleurs résultats</h4>
          <ul className="tips-list">
            <li>🎨 Soyez spécifique sur le style (minimaliste, moderne, flat design...)</li>
            <li>🎯 Mentionnez les couleurs souhaitées</li>
            <li>📐 Précisez l'usage prévu (logo, icône, illustration...)</li>
            <li>✨ Utilisez des termes techniques comme "flat design", "vectoriel", "minimaliste"</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AssetGenerationSection;