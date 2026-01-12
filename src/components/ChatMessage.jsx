import React from 'react';
import { User, Bot, Image as ImageIcon, Download, Edit3, RefreshCw, Sparkles, Users, Code } from 'lucide-react';

// Utilitaire pour extraire et nettoyer les SVG du contenu
const extractSvgFromContent = (content) => {
  if (!content || typeof content !== 'string') return { text: content, svgs: [] };
  
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
  const svgs = content.match(svgRegex) || [];
  const text = content.replace(svgRegex, '').trim();
  
  return { text, svgs };
};

// Composant pour afficher un SVG inline de manière sécurisée
const InlineSvg = ({ svg, index }) => {
  const [showCode, setShowCode] = React.useState(false);
  
  // Nettoyer le SVG pour éviter les scripts malicieux
  const cleanSvg = (svgString) => {
    // Supprimer les scripts et événements
    return svgString
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  };

  const handleDownload = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-${index + 1}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(svg);
  };

  const handleAddToCanvas = () => {
    // Convertir le SVG en data URL pour l'ajouter au canvas
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    window.dispatchEvent(new CustomEvent('cocreate:add-to-canvas', { detail: { imageUrl: url } }));
  };

  return (
    <div className="inline-svg-container">
      <div className="svg-toolbar">
        <span className="svg-label">SVG #{index + 1}</span>
        <div className="svg-actions">
          <button onClick={() => setShowCode(!showCode)} title="Voir le code">
            <Code size={14} />
          </button>
          <button onClick={handleCopy} title="Copier">
            📋
          </button>
          <button onClick={handleDownload} title="Télécharger">
            <Download size={14} />
          </button>
          <button onClick={handleAddToCanvas} title="Ajouter au canvas">
            ➕
          </button>
        </div>
      </div>
      
      {showCode ? (
        <pre className="svg-code">
          <code>{svg}</code>
        </pre>
      ) : (
        <div 
          className="svg-render"
          dangerouslySetInnerHTML={{ __html: cleanSvg(svg) }}
        />
      )}
    </div>
  );
};

const ChatMessage = ({ message, onRegenerate, onEdit, onDownload }) => {
  const isUser = message.type === 'user';
  const isAI = message.type === 'ai';

  const renderContent = () => {
    if (isUser) {
      return (
        <div className="user-message-content">
          <p>{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="message-attachments">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="attachment-preview">
                  <ImageIcon size={16} />
                  <span>{attachment.name}</span>
                </div>
              ))}
            </div>
          )}
          {message.isDebateRequest && (
            <span className="debate-badge">
              <Users size={12} /> Débat
            </span>
          )}
        </div>
      );
    }

    if (isAI) {
      // Extraire les SVG du contenu
      const { text, svgs } = extractSvgFromContent(message.content);

      return (
        <div className="ai-message-content">
          {message.isError ? (
            <div className="error-message">
              <p>{message.content}</p>
            </div>
          ) : (
            <>
              {/* Texte de la réponse */}
              {text && (
                <div className="ai-response">
                  <p>{text}</p>
                </div>
              )}

              {/* SVG inline extraits du contenu */}
              {svgs.length > 0 && (
                <div className="inline-svgs">
                  {svgs.map((svg, index) => (
                    <InlineSvg key={index} svg={svg} index={index} />
                  ))}
                </div>
              )}

              {/* Badge résultat de débat */}
              {message.isDebateResult && (
                <div className="debate-result-badge">
                  <Users size={14} />
                  <span>Résultat du débat multi-agents</span>
                </div>
              )}
              
              {/* Résultat d'image générée */}
              {message.result?.image && (
                <div className="generated-image-result">
                  <img 
                    src={message.result.image} 
                    alt="Résultat généré"
                    className="result-image"
                  />
                  <div className="result-actions">
                    <button 
                      className="action-btn"
                      onClick={() => onDownload?.(message.result, 'generated')}
                      title="Télécharger"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => onEdit?.(message.id, message.content)}
                      title="Modifier le prompt"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => onRegenerate?.(message.id)}
                      title="Régénérer"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Résultat de diagramme */}
              {message.result?.mermaidCode && (
                <div className="diagram-result">
                  <div className="diagram-actions">
                    <button 
                      className="action-btn"
                      onClick={() => onDownload?.(message.result, 'diagram')}
                      title="Télécharger l'image"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      className="action-btn secondary"
                      onClick={() => navigator.clipboard.writeText(message.result.mermaidCode)}
                      title="Copier le code Mermaid"
                    >
                      Code
                    </button>
                  </div>
                </div>
              )}

              {/* SVG des insights de débat */}
              {message.debateInsights?.svgArtifacts?.length > 0 && (
                <div className="debate-svgs">
                  <div className="debate-svgs-header">
                    <Sparkles size={14} />
                    <span>Prototypes SVG du débat</span>
                  </div>
                  <div className="inline-svgs">
                    {message.debateInsights.svgArtifacts.map((svg, index) => (
                      <InlineSvg key={index} svg={svg} index={index} />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions de l'IA */}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="ai-suggestions">
                  <div className="suggestions-header">
                    <Sparkles size={14} />
                    <span>Suggestions</span>
                  </div>
                  <div className="suggestions-list">
                    {message.suggestions.map((suggestion, index) => (
                      <button 
                        key={index}
                        className="suggestion-chip"
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('cocreate:send-agent-message', {
                            detail: { message: suggestion }
                          }));
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`chat-message ${isUser ? 'user' : 'ai'} ${message.isError ? 'error' : ''}`}>
      <div className="message-avatar">
        {isUser ? (
          <User size={20} />
        ) : (
          <Bot size={20} />
        )}
      </div>
      
      <div className="message-bubble">
        {isAI && message.action && (
          <div className="message-action-badge">
            {message.action}
          </div>
        )}
        
        {renderContent()}
        
        <div className="message-timestamp">
          {new Date(message.timestamp || Date.now()).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
