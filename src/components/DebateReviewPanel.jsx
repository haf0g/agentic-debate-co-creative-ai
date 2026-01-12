import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, RefreshCw, Send, Trash2, Upload, MessageSquare } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import SvgPreview from './SvgPreview';
import { extractSvgStrings } from '../utils/svgArtifacts';

function getDefaultGuidanceText(debateInsights) {
  const consensus = debateInsights?.consensus || debateInsights?.result?.consensus || null;
  return String(
    debateInsights?.approvedText ||
      consensus?.summary ||
      consensus?.direction ||
      ''
  ).trim();
}

export default function DebateReviewPanel() {
  const {
    currentProject,
    updateDebateInsights,
    approveDebate,
    clearDebateApproval,
    clearDebateInsights,
    sharedMemory,
    getUnifiedContext
  } = useProject();

  const debate = currentProject?.debateInsights || null;

  const svgArtifacts = useMemo(() => {
    if (!debate?.svgArtifacts) return [];
    return Array.isArray(debate.svgArtifacts) ? debate.svgArtifacts : [];
  }, [debate]);

  const [draftText, setDraftText] = useState('');
  const [imageBrief, setImageBrief] = useState('');
  const [svgPaste, setSvgPaste] = useState('');
  const [svgImportError, setSvgImportError] = useState('');
  const svgFileInputRef = useRef(null);

  useEffect(() => {
    setDraftText(getDefaultGuidanceText(debate));
    setImageBrief(String(debate?.prompt || currentProject?.description || '').trim());
    setSvgImportError('');
  }, [debate, currentProject?.description]);

  const hasDebate = !!debate?.consensus;
  const isApproved = !!debate?.approved;
  const hasSvgPrototype = svgArtifacts.length > 0;

  const addSvgArtifacts = (incomingSvgs) => {
    const merged = [...(incomingSvgs || []), ...svgArtifacts]
      .map((s) => String(s || '').trim())
      .filter(Boolean);
    const unique = [...new Set(merged)];
    updateDebateInsights({ svgArtifacts: unique });
  };

  const importSvgFromText = (text) => {
    const svgs = extractSvgStrings(text);
    if (!svgs.length) {
      setSvgImportError('Aucun SVG détecté');
      return false;
    }
    addSvgArtifacts(svgs);
    setSvgImportError('');
    setSvgPaste('');
    return true;
  };

  const dispatchUiEvent = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  if (!currentProject) {
    return <div className="review-empty">Aucun projet sélectionné</div>;
  }

  if (!hasDebate) {
    return (
      <div className="empty-tab">
        <div className="empty-tab-content">
          <CheckCircle size={48} className="empty-icon" />
          <h3>Revue & Approbation</h3>
          <p>Aucun débat terminé. Lancez d'abord un débat pour obtenir une recommandation à approuver.</p>
          <button className="primary-btn" onClick={() => dispatchUiEvent('cocreate:open-debate', {})}>
            Lancer un débat
          </button>
        </div>
      </div>
    );
  }

  // Contexte partagé avec le chat
  const unifiedContext = getUnifiedContext();
  const chatHistoryCount = sharedMemory?.chatHistory?.length || 0;

  return (
    <div className="review-panel">
      {/* Contexte partagé */}
      {chatHistoryCount > 0 && (
        <div className="review-context-box">
          <MessageSquare size={14} />
          <span>Ce débat a été influencé par {chatHistoryCount} message(s) du chat</span>
        </div>
      )}

      {/* Status */}
      <div className="review-status">
        <span className={`status-pill ${isApproved ? 'approved' : 'pending'}`}>
          {isApproved ? '✓ Approuvé' : '● À approuver'}
        </span>
        {debate?.completedAt && (
          <span className="review-date">
            {new Date(debate.completedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {/* Section 1: Guidance */}
      <section className="review-section">
        <h4>Recommandation</h4>
        <textarea
          className="review-textarea"
          rows={5}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="La recommandation du débat apparaîtra ici..."
        />
        <div className="review-actions">
          <button className="secondary-btn" onClick={() => updateDebateInsights({ approvedText: draftText })}>
            Sauvegarder
          </button>
          <button
            className="primary-btn"
            onClick={() => approveDebate(draftText)}
            disabled={!draftText.trim()}
          >
            <CheckCircle size={16} /> Approuver
          </button>
          {isApproved && (
            <button className="ghost-btn" onClick={() => clearDebateApproval()}>
              Retirer approbation
            </button>
          )}
        </div>
      </section>

      {/* Section 2: SVG */}
      <section className="review-section">
        <h4>Prototypes SVG</h4>
        
        {svgArtifacts.length > 0 ? (
          <div className="svg-grid">
            {svgArtifacts.slice(0, 3).map((svg, idx) => (
              <SvgPreview key={idx} svg={svg} title={`SVG ${idx + 1}`} />
            ))}
          </div>
        ) : (
          <p className="review-hint">Aucun SVG. Importez-en un ou relancez le débat.</p>
        )}

        <input
          ref={svgFileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              importSvgFromText(text);
            } catch (err) {
              setSvgImportError('Erreur lecture fichier');
            }
            e.target.value = '';
          }}
        />

        <div className="review-actions">
          <button className="secondary-btn" onClick={() => svgFileInputRef.current?.click()}>
            <Upload size={16} /> Importer SVG
          </button>
        </div>

        <textarea
          className="review-textarea small"
          rows={2}
          value={svgPaste}
          onChange={(e) => setSvgPaste(e.target.value)}
          placeholder="Ou collez un SVG ici..."
        />
        {svgPaste.trim() && (
          <button className="ghost-btn" onClick={() => importSvgFromText(svgPaste)}>
            Ajouter SVG collé
          </button>
        )}
        {svgImportError && <p className="review-error">{svgImportError}</p>}
      </section>

      {/* Section 3: Generate */}
      <section className="review-section">
        <h4>Générer l'image</h4>
        <textarea
          className="review-textarea small"
          rows={2}
          value={imageBrief}
          onChange={(e) => setImageBrief(e.target.value)}
          placeholder="Brief pour la génération (optionnel)"
        />
        <div className="review-actions">
          <button
            className="primary-btn"
            disabled={!isApproved || !hasSvgPrototype}
            onClick={() => {
              const brief = String(imageBrief || debate?.prompt || '').trim();
              dispatchUiEvent('cocreate:send-agent-message', {
                message: `Génère une image robuste: ${brief}`,
                forceAction: 'generate_image',
                forceParameters: { prompt: brief, aspect_ratio: '3:2' }
              });
            }}
          >
            <Send size={16} /> Générer
          </button>
          {(!isApproved || !hasSvgPrototype) && (
            <span className="review-hint">
              {!isApproved ? 'Approuvez d\'abord' : 'SVG requis'}
            </span>
          )}
        </div>
      </section>

      {/* Section 4: Actions */}
      <section className="review-section">
        <div className="review-actions">
          <button
            className="secondary-btn"
            onClick={() => dispatchUiEvent('cocreate:rerun-debate', { prompt: debate?.prompt || '' })}
          >
            <RefreshCw size={16} /> Relancer débat
          </button>
          <button
            className="danger-btn"
            onClick={() => {
              if (window.confirm('Supprimer ce débat ?')) clearDebateInsights();
            }}
          >
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      </section>
    </div>
  );
}
