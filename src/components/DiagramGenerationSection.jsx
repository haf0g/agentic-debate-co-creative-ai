import React, { useState } from 'react';
import { GitBranch, Sparkles, Download, Code, CheckCircle, AlertCircle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { buildDebateAdviceText } from '../utils/debateAdvice';

const DiagramGenerationSection = () => {
  const [description, setDescription] = useState('');
  const [diagramType, setDiagramType] = useState('flowchart');
  const [generatedDiagram, setGeneratedDiagram] = useState(null);
  const [customCode, setCustomCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [error, setError] = useState(null);
  const [useDebateAdvice, setUseDebateAdvice] = useState(true);

  const { currentProject } = useProject();
  const debateAdvice = buildDebateAdviceText(currentProject?.debateInsights);
  const hasDebateConsensus = !!currentProject?.debateInsights?.consensus;
  const hasApprovedDebateAdvice = !!debateAdvice;

  const diagramTypes = [
    {
      id: 'flowchart',
      name: 'Organigramme',
      description: 'Flux de processus et décisions',
      examples: ['Processus métier', 'Workflow utilisateur', 'Algorithme']
    },
    {
      id: 'sequence',
      name: 'Séquence',
      description: 'Interactions temporelles',
      examples: ['API calls', 'Scénarios utilisateur', 'Systèmes distribués']
    },
    {
      id: 'class',
      name: 'Classes',
      description: 'Architecture logicielle',
      examples: ['Système UML', 'Modèle de données', 'Architecture']
    },
    {
      id: 'state',
      name: 'États',
      description: 'Machine à états',
      examples: ['Workflow', 'Cycle de vie', 'États système']
    },
    {
      id: 'er',
      name: 'Entité-Relation',
      description: 'Modèle de base de données',
      examples: ['Schema DB', 'Relations', 'Entités']
    }
  ];

  const examples = [
    {
      type: 'flowchart',
      description: "Architecture d'un projet cloud d'ingestion de données avec Kafka et Spark streaming jusqu'au Datawarehousing sur Snowflake et le traitement avec dbt"
    },
    {
      type: 'sequence',
      description: "Flux d'authentification utilisateur avec JWT, incluant la connexion, la validation du token et le rafraîchissement"
    },
    {
      type: 'class',
      description: "Architecture d'une application e-commerce avec les classes Produit, Commande, Utilisateur et Paiement"
    },
    {
      type: 'state',
      description: "États d'une commande en e-commerce : En attente, Confirmée, En préparation, Expédiée, Livrée, Annulée"
    }
  ];

  const generateDiagram = async () => {
    if (!description.trim()) {
      setError('Veuillez saisir une description du diagramme');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedDiagram(null);

    try {
      const finalDescription = (useDebateAdvice && debateAdvice)
        ? `${description}\n\n${debateAdvice}`
        : description;

      const response = await fetch('/api/diagram-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: finalDescription,
          diagramType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération');
      }

      setGeneratedDiagram(data);
      setCustomCode(data.mermaidCode);
    } catch (err) {
      console.error('Erreur de génération:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderCustomCode = async () => {
    if (!customCode.trim()) {
      setError('Veuillez saisir du code Mermaid');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedDiagram(null);

    try {
      const response = await fetch('/api/diagram-generation/render-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mermaidCode: customCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du rendu');
      }

      setGeneratedDiagram(data);
    } catch (err) {
      console.error('Erreur de rendu:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const validateCode = async () => {
    if (!customCode.trim()) {
      setError('Veuillez saisir du code Mermaid à valider');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/diagram-generation/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mermaidCode: customCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la validation');
      }

      setValidationResult(data);
    } catch (err) {
      console.error('Erreur de validation:', err);
      setError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const downloadDiagram = () => {
    if (!generatedDiagram?.image) return;

    const link = document.createElement('a');
    link.href = generatedDiagram.image;
    link.download = `diagram-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const useExample = (example) => {
    setDescription(example.description);
    setDiagramType(example.type);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Feedback visuel optionnel
    });
  };

  return (
    <div className="section-container">
      <div className="section-header">
        <h1 className="section-title">
          <GitBranch className="section-icon" />
          Génération de Diagrammes
        </h1>
        <p className="section-description">
          Créez des diagrammes techniques en décrivant simplement ce que vous souhaitez représenter. 
          L'IA génère le code Mermaid et le convertit en image.
        </p>
      </div>

      {/* Sélection du type de diagramme */}
      <div className="diagram-type-selector">
        <h3 className="selector-title">Type de diagramme</h3>
        <div className="diagram-types-grid">
          {diagramTypes.map((type) => (
            <button
              key={type.id}
              className={`diagram-type-card ${diagramType === type.id ? 'active' : ''}`}
              onClick={() => setDiagramType(type.id)}
            >
              <div className="type-header">
                <span className="type-name">{type.name}</span>
              </div>
              <div className="type-description">{type.description}</div>
              <div className="type-examples">
                {type.examples.map((example, index) => (
                  <span key={index} className="type-example">{example}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de description */}
      <div className="description-section">
        <label className="description-label">
          Décrivez votre diagramme
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
              Utiliser les conseils du débat pour la description
            </label>
            {!hasApprovedDebateAdvice && (
              <div className="hint-text">
                Le débat doit être approuvé (sidebar → « Revoir / approuver ») avant utilisation.
              </div>
            )}
          </div>
        )}

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Exemple: Architecture d'un projet cloud avec Kafka, Spark, Snowflake et dbt..."
          className="prompt-input"
          rows={4}
        />
        
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={generateDiagram}
            disabled={isGenerating || !description.trim()}
          >
            <Sparkles className="btn-icon" />
            {isGenerating ? 'Génération...' : 'Générer le diagramme'}
          </button>
        </div>
      </div>

      {/* Exemples */}
      <div className="examples-section">
        <h4 className="examples-title">Exemples de descriptions</h4>
        <div className="examples-grid">
          {examples.map((example, index) => (
            <button
              key={index}
              className="example-card"
              onClick={() => useExample(example)}
            >
              <div className="example-type">{diagramTypes.find(t => t.id === example.type)?.name}</div>
              <div className="example-description">{example.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Éditeur de code Mermaid personnalisé */}
      <div className="custom-code-section">
        <h3 className="custom-code-title">
          <Code className="code-icon" />
          Code Mermaid personnalisé
        </h3>
        <p className="custom-code-description">
          Vous pouvez également saisir directement du code Mermaid ou modifier le code généré.
        </p>
        
        <textarea
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
          placeholder="graph TD
    A[Début] --> B{Vérifier Stock}
    B -->|Oui| C[Ajouter au Panier]
    B -->|Non| D[Afficher 'Rupture']
    C --> E[Fin]
    D --> E"
          className="code-input"
          rows={8}
        />
        
        <div className="code-actions">
          <button
            className="btn btn-outline"
            onClick={validateCode}
            disabled={isValidating || !customCode.trim()}
          >
            <CheckCircle className="btn-icon" />
            {isValidating ? 'Validation...' : 'Valider le code'}
          </button>
          
          <button
            className="btn btn-primary"
            onClick={renderCustomCode}
            disabled={isGenerating || !customCode.trim()}
          >
            <Sparkles className="btn-icon" />
            {isGenerating ? 'Rendu...' : 'Rendre le diagramme'}
          </button>
          
          <button
            className="btn btn-outline"
            onClick={() => copyToClipboard(customCode)}
            disabled={!customCode.trim()}
          >
            Copier le code
          </button>
        </div>
      </div>

      {/* Résultat de validation */}
      {validationResult && (
        <div className="validation-result">
          <div className={`validation-status ${validationResult.isValid ? 'valid' : 'invalid'}`}>
            {validationResult.isValid ? (
              <CheckCircle className="validation-icon" />
            ) : (
              <AlertCircle className="validation-icon" />
            )}
            <span className="validation-text">
              {validationResult.isValid ? 'Code Mermaid valide' : 'Code Mermaid invalide'}
            </span>
          </div>
          
          {!validationResult.isValid && validationResult.suggestions.length > 0 && (
            <div className="validation-suggestions">
              <h5>Suggestions d'amélioration :</h5>
              <ul>
                {validationResult.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Barre de progression */}
      {isGenerating && (
        <div className="generation-progress">
          <div className="loading-bar"></div>
          <div className="status-indicator processing">
            <Sparkles className="spinner" />
            {customCode.trim() ? 'Rendu du diagramme...' : 'Génération du diagramme par l\'IA...'}
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

      {/* Diagramme généré */}
      {generatedDiagram && !isGenerating && (
        <div className="result-card">
          <div className="result-header">
            <h3 className="result-title">Diagramme Généré</h3>
            <span className="ai-badge">Gemini + Mermaid</span>
          </div>
          
          <div className="diagram-container">
            <img
              src={generatedDiagram.image}
              alt="Diagramme généré"
              className="result-image"
            />
          </div>
          
          <div className="result-details">
            <div className="code-display">
              <h5>Code Mermaid généré :</h5>
              <pre className="code-block">
                <code>{generatedDiagram.mermaidCode}</code>
              </pre>
            </div>
            
            <div className="result-actions">
              <div className="action-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={downloadDiagram}
                >
                  <Download className="btn-icon" />
                  Télécharger l'image
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setCustomCode(generatedDiagram.mermaidCode)}
                >
                  <Code className="btn-icon" />
                  Éditer le code
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => copyToClipboard(generatedDiagram.mermaidCode)}
                >
                  Copier le code
                </button>
              </div>
              
              <div className="result-meta">
                <small className="text-muted">
                  Type: {diagramTypes.find(t => t.id === diagramType)?.name}
                </small>
                <small className="text-muted">
                  Lignes de code: {generatedDiagram.mermaidCode.split('\n').length}
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conseils */}
      {!generatedDiagram && !isGenerating && (
        <div className="tips-section">
          <h4 className="tips-title">Conseils pour de meilleurs diagrammes</h4>
          <ul className="tips-list">
            <li>📊 Soyez précis sur le type de diagramme souhaité</li>
            <li>🔄 Décrivez clairement les relations entre les éléments</li>
            <li>📝 Mentionnez les acteurs, processus et données impliqués</li>
            <li>🎯 Utilisez des termes techniques appropriés au domaine</li>
            <li>📐 Précisez l'échelle et le niveau de détail souhaité</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiagramGenerationSection;