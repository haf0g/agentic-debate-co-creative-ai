import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Sparkles, Loader2, Users, X, CheckCircle2, Info, ToggleLeft, ToggleRight, Image, Layers, ChevronDown, ImagePlus } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { useProject } from '../context/ProjectContext';
import ChatMessage from './ChatMessage';
import DebateReviewPanel from './DebateReviewPanel';

const ChatInterface = () => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [debateModeEnabled, setDebateModeEnabled] = useState(false);
  const [isDebating, setIsDebating] = useState(false);
  const [debateMessages, setDebateMessages] = useState([]);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imagePickerRef = useRef(null);
  const chatContainerRef = useRef(null);

  const { 
    currentProject, 
    setDebateInsights,
    addMessage,
    addImage,
    sharedMemory,
    syncDebateToChat,
    getUnifiedContext
  } = useProject();
  
  const {
    isTyping,
    streamingMessage,
    sendMessage,
    regenerateMessage,
    editPrompt,
    downloadResult,
    cancelRequest,
    getContextualSuggestions
  } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentProject?.messages, streamingMessage, debateMessages]);

  // Fermer le picker quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (imagePickerRef.current && !imagePickerRef.current.contains(e.target)) {
        setShowImagePicker(false);
      }
    };
    if (showImagePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImagePicker]);

  // Écouter les événements externes
  useEffect(() => {
    const onOpenDebate = () => {
      setDebateModeEnabled(true);
    };

    const onOpenReview = () => {
      setShowReviewPanel(true);
    };

    const onSendAgentMessage = async (e) => {
      const text = String(e?.detail?.message || '').trim();
      if (!text) return;
      setDebateModeEnabled(false);
      await sendMessage(text, []);
    };

    window.addEventListener('cocreate:open-debate', onOpenDebate);
    window.addEventListener('cocreate:open-debate-review', onOpenReview);
    window.addEventListener('cocreate:send-agent-message', onSendAgentMessage);

    return () => {
      window.removeEventListener('cocreate:open-debate', onOpenDebate);
      window.removeEventListener('cocreate:open-debate-review', onOpenReview);
      window.removeEventListener('cocreate:send-agent-message', onSendAgentMessage);
    };
  }, [sendMessage]);

  // Envoyer un message (normal ou débat)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() && attachments.length === 0) return;
    
    const messageToSend = message.trim();
    const currentAttachments = [...attachments]; // Copie pour le débat
    setMessage('');
    setAttachments([]);

    if (debateModeEnabled) {
      // Mode débat activé - lancer le débat multi-agents avec les images
      await startDebate(messageToSend, currentAttachments);
    } else {
      // Mode normal
      await sendMessage(messageToSend, attachments);
    }
  };

  // Convertir une URL d'image en base64
  const imageUrlToBase64 = async (url) => {
    return new Promise((resolve, reject) => {
      // Si c'est déjà du base64, le retourner directement
      if (url.startsWith('data:')) {
        resolve(url);
        return;
      }

      // Pour les blob: URLs, on doit utiliser fetch
      if (url.startsWith('blob:')) {
        fetch(url)
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(reader.result);
            };
            reader.onerror = () => {
              reject(new Error('Erreur lecture blob'));
            };
            reader.readAsDataURL(blob);
          })
          .catch(err => {
            console.error('Erreur fetch blob:', err);
            reject(err);
          });
        return;
      }

      // Pour les URLs HTTP(S), créer une image
      const img = new window.Image();
      // Essayer avec crossOrigin pour les URLs externes
      if (url.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      }
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/png');
          resolve(base64);
        } catch (err) {
          console.error('Erreur canvas toDataURL:', err);
          // Fallback: essayer sans crossOrigin via un proxy ou en rechargeant
          reject(err);
        }
      };
      
      img.onerror = (e) => {
        console.error('Erreur chargement image:', e);
        reject(new Error('Impossible de charger l\'image'));
      };
      
      img.src = url;
    });
  };

  // Analyser une image avec Gemini (pour le débat)
  const analyzeImageForDebate = async (imageUrl, imageName) => {
    try {
      console.log(`[DEBUG] Analyse image: ${imageName}, URL type: ${imageUrl.substring(0, 30)}...`);
      
      // Convertir l'image en base64
      const base64 = await imageUrlToBase64(imageUrl);
      console.log(`[DEBUG] Base64 converti, longueur: ${base64.length}, début: ${base64.substring(0, 50)}`);
      
      // Extraire le mimeType du base64
      const mimeType = base64.match(/data:([^;]+);/)?.[1] || 'image/png';
      console.log(`[DEBUG] MimeType détecté: ${mimeType}`);
      
      const response = await fetch('http://localhost:3001/api/design-analysis/analyze-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageBase64: base64,
          mimeType,
          customPrompt: `
          Analyse cette image en détail pour aider une équipe de designers à débattre dessus.
          
          Fournis :
          1. **Description complète:** Que montre exactement cette image ? (type: logo, interface, illustration, etc.)
          2. **Éléments visuels:** Couleurs principales, formes, typographie, style graphique
          3. **Points positifs:** Ce qui fonctionne bien
          4. **Points à améliorer:** Les faiblesses ou incohérences
          5. **Contexte d'utilisation:** Pour quel usage cette image semble conçue ?
          
          Sois précis et descriptif pour que les designers puissent débattre sans voir l'image.
          `
        })
      });
      
      console.log(`[DEBUG] Réponse serveur: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[DEBUG] Erreur serveur:', errorData);
        throw new Error(errorData.message || `Erreur serveur ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`[DEBUG] Analyse reçue, longueur: ${data.analysis?.length || 0}`);
      return data.analysis;
    } catch (error) {
      console.error('[DEBUG] Erreur analyse image complète:', error);
      return `[Erreur d'analyse: ${error.message}]`;
    }
  };

  // Lancer un débat multi-agents
  const startDebate = async (prompt, debateAttachments = []) => {
    setIsDebating(true);
    setDebateMessages([]);
    
    // Ajouter le message utilisateur avec les images
    addMessage({
      type: 'user',
      content: prompt,
      isDebateRequest: true,
      images: debateAttachments.map(a => ({ url: a.url, name: a.name }))
    });

    // Message de début
    const systemMessages = [{
      id: 'debate-start',
      type: 'system',
      content: '🎯 Débat multi-agents lancé...',
      timestamp: new Date().toISOString()
    }];
    setDebateMessages(systemMessages);

    try {
      let enrichedPrompt = prompt;
      let imageAnalyses = [];

      // Si des images sont jointes, les analyser d'abord avec Gemini
      if (debateAttachments.length > 0) {
        setDebateMessages(prev => [...prev, {
          id: 'analyzing-images',
          type: 'system',
          content: `🔍 Analyse de ${debateAttachments.length} image(s) avec Gemini...`,
          timestamp: new Date().toISOString()
        }]);

        // Analyser chaque image
        for (let i = 0; i < debateAttachments.length; i++) {
          const attachment = debateAttachments[i];
          
          setDebateMessages(prev => prev.map(m => 
            m.id === 'analyzing-images' 
              ? { ...m, content: `🔍 Analyse de l'image ${i + 1}/${debateAttachments.length}: ${attachment.name}...` }
              : m
          ));

          const analysis = await analyzeImageForDebate(attachment.url, attachment.name);
          
          if (analysis) {
            imageAnalyses.push({
              name: attachment.name,
              analysis
            });
          }
        }

        // Enrichir le prompt avec les analyses d'images
        if (imageAnalyses.length > 0) {
          enrichedPrompt = `${prompt}

---
📎 IMAGES JOINTES - ANALYSES PRÉLIMINAIRES (générées par Gemini):

${imageAnalyses.map((img, idx) => `### Image ${idx + 1}: ${img.name}
${img.analysis}
`).join('\n')}
---

Prenez en compte ces analyses d'images dans votre débat. Les utilisateurs ont fourni ces images comme contexte visuel pour leur demande.`;

          setDebateMessages(prev => prev.map(m => 
            m.id === 'analyzing-images' 
              ? { ...m, content: `✅ ${imageAnalyses.length} image(s) analysée(s) - contexte enrichi pour les débatteurs` }
              : m
          ));
        }
      }

      // Lancer le débat avec le prompt enrichi
      const response = await fetch('http://localhost:8000/debate/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enrichedPrompt,
          project_id: currentProject?.id,
          chat_context: sharedMemory?.chatHistory || [],
          image_analyses: imageAnalyses // Optionnel: aussi passer les analyses séparément
        })
      });

      if (!response.ok) throw new Error('Erreur lors du débat');

      // Lire le stream SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentAgentMessage = null;
      let finalResult = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'agent_start') {
                currentAgentMessage = {
                  id: `agent-${data.agent}-${Date.now()}`,
                  type: 'agent',
                  agent: data.agent,
                  content: '',
                  timestamp: new Date().toISOString()
                };
                setDebateMessages(prev => [...prev, currentAgentMessage]);
              } 
              else if (data.type === 'agent_message' && currentAgentMessage) {
                currentAgentMessage.content = data.content;
                setDebateMessages(prev => 
                  prev.map(m => m.id === currentAgentMessage.id ? { ...currentAgentMessage } : m)
                );
              }
              else if (data.type === 'svg_artifact') {
                setDebateMessages(prev => [...prev, {
                  id: `svg-${Date.now()}`,
                  type: 'svg',
                  content: data.svg,
                  timestamp: new Date().toISOString()
                }]);
              }
              else if (data.type === 'consensus' || data.type === 'complete') {
                finalResult = data;
              }
              else if (data.type === 'error') {
                setDebateMessages(prev => [...prev, {
                  id: `error-${Date.now()}`,
                  type: 'error',
                  content: data.message,
                  timestamp: new Date().toISOString()
                }]);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }

      // Finaliser le débat
      if (finalResult) {
        const insights = {
          prompt,
          enrichedPrompt: enrichedPrompt !== prompt ? enrichedPrompt : null,
          imageAnalyses: imageAnalyses.length > 0 ? imageAnalyses : null,
          consensus: finalResult.consensus || null,
          svgArtifacts: finalResult.svgArtifacts || finalResult.svg_artifacts || [],
          sessionId: finalResult.session_id || null,
          completedAt: new Date().toISOString(),
          result: finalResult
        };
        
        setDebateInsights(insights);
        syncDebateToChat();

        // Ajouter le message de résumé
        addMessage({
          type: 'ai',
          content: finalResult.consensus?.summary || 'Débat terminé. Consultez la revue pour les détails.',
          isDebateResult: true,
          debateInsights: insights
        });

        setDebateMessages(prev => [...prev, {
          id: 'debate-complete',
          type: 'system',
          content: '✅ Débat terminé ! Cliquez sur "Voir la revue" pour approuver.',
          timestamp: new Date().toISOString()
        }]);
      }

    } catch (error) {
      console.error('Debate error:', error);
      setDebateMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        type: 'error',
        content: `Erreur: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsDebating(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    if (validFiles.length > 0) {
      const newAttachments = validFiles.map(file => ({
        id: `att_${Date.now()}_${Math.random()}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        source: 'upload'
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  // Ajouter une image depuis la galerie du projet
  const addGalleryImage = (image) => {
    const alreadyAdded = attachments.some(a => a.sourceId === image.id);
    if (alreadyAdded) return;

    const newAttachment = {
      id: `att_gallery_${Date.now()}_${Math.random()}`,
      name: image.name || image.prompt || 'Image galerie',
      type: 'image/png',
      url: image.url || image.imageUrl,
      source: 'gallery',
      sourceId: image.id
    };
    setAttachments(prev => [...prev, newAttachment]);
    setShowImagePicker(false);
  };

  // Ajouter une image depuis le canvas
  const addCanvasImage = (element) => {
    const alreadyAdded = attachments.some(a => a.sourceId === element.id);
    if (alreadyAdded) return;

    const newAttachment = {
      id: `att_canvas_${Date.now()}_${Math.random()}`,
      name: element.name || `Canvas: ${element.type}`,
      type: 'image/png',
      url: element.src || element.url,
      source: 'canvas',
      sourceId: element.id
    };
    setAttachments(prev => [...prev, newAttachment]);
    setShowImagePicker(false);
  };

  // Récupérer les images de la galerie
  const getGalleryImages = () => {
    if (!currentProject?.messages) return [];
    return currentProject.messages
      .filter(m => m.result?.imageUrl || m.images?.length > 0)
      .flatMap(m => {
        if (m.result?.imageUrl) {
          return [{
            id: m.id,
            url: m.result.imageUrl,
            name: m.content?.substring(0, 30) || 'Image générée',
            prompt: m.content
          }];
        }
        return (m.images || []).map((img, idx) => ({
          id: `${m.id}_img_${idx}`,
          url: img.url || img,
          name: img.name || `Image ${idx + 1}`
        }));
      });
  };

  // Récupérer les images du canvas
  const getCanvasImages = () => {
    const elements = currentProject?.canvas?.elements || [];
    return elements.filter(el => el.type === 'image' && el.src);
  };

  const removeAttachment = (attachmentId) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === attachmentId);
      if (attachment?.url && attachment.source === 'upload') {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter(a => a.id !== attachmentId);
    });
  };

  // === Drag & Drop depuis la galerie ===
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Vérifier si c'est une image de la galerie
    const hasGalleryImage = e.dataTransfer.types.includes('application/json');
    if (hasGalleryImage) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Vérifier qu'on quitte vraiment le container
    if (!chatContainerRef.current?.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // Essayer de récupérer les données JSON (image de galerie)
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const imageData = JSON.parse(jsonData);
        if (imageData.type === 'gallery-image') {
          // Vérifier si pas déjà ajouté
          const alreadyAdded = attachments.some(a => a.sourceId === imageData.id);
          if (!alreadyAdded) {
            const newAttachment = {
              id: `att_drop_${Date.now()}_${Math.random()}`,
              name: imageData.name || 'Image galerie',
              type: 'image/png',
              url: imageData.url,
              source: 'gallery',
              sourceId: imageData.id
            };
            setAttachments(prev => [...prev, newAttachment]);
          }
          return;
        }
      } catch (err) {
        console.error('Erreur parsing drop data:', err);
      }
    }

    // Fallback: fichiers classiques
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const newAttachments = imageFiles.map(file => ({
        id: `att_${Date.now()}_${Math.random()}`,
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        url: URL.createObjectURL(file),
        source: 'upload'
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const sendSuggestion = (suggestion) => {
    setMessage(suggestion);
    setShowSuggestions(false);
  };

  if (!currentProject) {
    return (
      <div className="chat-interface empty">
        <div className="empty-state">
          <Sparkles size={48} />
          <h3>Bienvenue dans CoCreate</h3>
          <p>Créez un nouveau projet pour commencer</p>
        </div>
      </div>
    );
  }

  const suggestions = getContextualSuggestions();
  const debateStatus = currentProject?.debateInsights;
  const hasDebate = !!debateStatus?.consensus;
  const isApproved = !!debateStatus?.approved;
  const unifiedContext = getUnifiedContext();

  // Afficher le panneau de revue si demandé
  if (showReviewPanel) {
    return (
      <div className="chat-interface">
        <div className="chat-header">
          <div className="chat-header-left">
            <h3 className="chat-title">Revue du Débat</h3>
            {hasDebate && (
              <span className={`status-pill ${isApproved ? 'approved' : 'pending'}`}>
                {isApproved ? '✓ Approuvé' : '● À approuver'}
              </span>
            )}
          </div>
          <button className="icon-btn" onClick={() => setShowReviewPanel(false)}>
            <X size={20} />
          </button>
        </div>
        <div className="chat-body">
          <DebateReviewPanel onClose={() => setShowReviewPanel(false)} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`chat-interface ${isDragOver ? 'drag-over' : ''}`}
      ref={chatContainerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragOver && (
        <div className="chat-drop-overlay">
          <div className="drop-content">
            <ImagePlus size={48} />
            <p>Déposez l'image ici pour l'ajouter au message</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <h3 className="chat-title">{currentProject.name}</h3>
          {hasDebate && (
            <button 
              className={`status-pill clickable ${isApproved ? 'approved' : 'pending'}`}
              onClick={() => setShowReviewPanel(true)}
            >
              {isApproved ? '✓ Débat approuvé' : '● Débat à revoir'}
            </button>
          )}
        </div>

        {/* Toggle Mode Débat */}
        <div className="mode-toggle">
          <button
            className={`toggle-btn ${debateModeEnabled ? 'active' : ''}`}
            onClick={() => setDebateModeEnabled(!debateModeEnabled)}
            disabled={isDebating || isTyping}
            title={debateModeEnabled ? 'Désactiver le mode débat' : 'Activer le mode débat'}
          >
            {debateModeEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <Users size={16} />
            <span>Débat</span>
          </button>
        </div>

        {(isTyping || isDebating) && (
          <div className="typing-indicator">
            <Loader2 size={16} className="spinner" />
            <span>{isDebating ? 'Débat en cours...' : "L'IA réfléchit..."}</span>
          </div>
        )}
      </div>

      {/* Bannière mode débat */}
      {debateModeEnabled && !isDebating && (
        <div className="debate-mode-banner">
          <Users size={16} />
          <span>Mode débat activé — 5 agents IA vont collaborer sur votre demande</span>
          <button className="banner-close" onClick={() => setDebateModeEnabled(false)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Barre de contexte */}
      {unifiedContext && (unifiedContext.messageCount > 0 || unifiedContext.hasDebate) && (
        <div className="context-bar">
          <Info size={14} />
          <span className="context-items">
            {unifiedContext.messageCount > 0 && `💬 ${unifiedContext.messageCount} messages`}
            {unifiedContext.hasDebate && ` • ${unifiedContext.debateApproved ? '✅ Approuvé' : '⏳ En attente'}`}
            {unifiedContext.hasSvgArtifacts && ' • 🎨 SVG'}
          </span>
          {hasDebate && (
            <button className="context-link" onClick={() => setShowReviewPanel(true)}>
              Voir la revue →
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="chat-body">
        <div className="chat-messages">
          {currentProject.messages.length === 0 && debateMessages.length === 0 ? (
            <div className="empty-tab">
              <div className="empty-tab-content">
                <Sparkles size={48} className="empty-icon" />
                <h3>Assistant Design IA</h3>
                <p>
                  Générez des images, analysez vos designs, créez des diagrammes.
                  <br />
                  <strong>Activez le mode "Débat"</strong> pour une collaboration multi-agents.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Messages normaux */}
              {currentProject.messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onRegenerate={regenerateMessage}
                  onEdit={editPrompt}
                  onDownload={downloadResult}
                />
              ))}

              {/* Messages du débat en cours */}
              {debateMessages.map((msg) => (
                <DebateMessage key={msg.id} message={msg} addImage={addImage} />
              ))}

              {/* Message en streaming */}
              {streamingMessage && (
                <ChatMessage
                  message={{
                    type: 'ai',
                    content: streamingMessage,
                    timestamp: new Date().toISOString(),
                    isStreaming: true
                  }}
                />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && !isDebating && (
        <div className="chat-suggestions">
          {suggestions.slice(0, 3).map((suggestion, index) => (
            <button key={index} className="suggestion-chip" onClick={() => sendSuggestion(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="chat-input-area">
        {attachments.length > 0 && (
          <div className="attachments-row">
            {attachments.map((att) => (
              <div key={att.id} className={`attachment-chip ${att.source || 'upload'}`}>
                <img src={att.url} alt="" />
                <span>{att.name}</span>
                {att.source && att.source !== 'upload' && (
                  <span className="source-badge">{att.source === 'gallery' ? '📷' : '🎨'}</span>
                )}
                <button onClick={() => removeAttachment(att.id)}>×</button>
              </div>
            ))}
          </div>
        )}
        <form className="input-row" onSubmit={handleSendMessage}>
          {/* Bouton upload fichier */}
          <button type="button" className="icon-btn" onClick={() => fileInputRef.current?.click()} title="Télécharger une image">
            <Paperclip size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            hidden
          />
          
          {/* Bouton sélecteur d'images (gallery/canvas) */}
          <div className="image-picker-container" ref={imagePickerRef}>
            <button 
              type="button" 
              className={`icon-btn ${showImagePicker ? 'active' : ''}`}
              onClick={() => setShowImagePicker(!showImagePicker)}
              title="Ajouter depuis galerie/canvas"
            >
              <Image size={20} />
              <ChevronDown size={12} className="chevron" />
            </button>
            
            {showImagePicker && (
              <ImagePickerDropdown
                galleryImages={getGalleryImages()}
                canvasImages={getCanvasImages()}
                onSelectGallery={addGalleryImage}
                onSelectCanvas={addCanvasImage}
                onClose={() => setShowImagePicker(false)}
              />
            )}
          </div>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={debateModeEnabled ? "Décrivez votre défi design pour le débat..." : "Décrivez ce que vous souhaitez créer..."}
            className={`text-input ${debateModeEnabled ? 'debate-mode' : ''}`}
            disabled={isDebating}
          />
          <button
            type="submit"
            className={`send-btn ${debateModeEnabled ? 'debate-mode' : ''}`}
            disabled={(!message.trim() && attachments.length === 0) || isTyping || isDebating}
          >
            {debateModeEnabled ? <Users size={20} /> : <Send size={20} />}
          </button>
        </form>
        {(isTyping || isDebating) && (
          <button className="cancel-btn" onClick={cancelRequest}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
};

// Composant Dropdown pour sélectionner des images
const ImagePickerDropdown = ({ galleryImages, canvasImages, onSelectGallery, onSelectCanvas, onClose }) => {
  const [activeTab, setActiveTab] = useState('gallery');
  
  const hasGallery = galleryImages.length > 0;
  const hasCanvas = canvasImages.length > 0;
  const isEmpty = !hasGallery && !hasCanvas;

  return (
    <div className="image-picker-dropdown">
      <div className="picker-header">
        <span className="picker-title">Ajouter une image</span>
        <button className="picker-close" onClick={onClose}>×</button>
      </div>

      {isEmpty ? (
        <div className="picker-empty">
          <Image size={32} />
          <p>Aucune image disponible</p>
          <span>Générez des images ou ajoutez-en au canvas</span>
        </div>
      ) : (
        <>
          <div className="picker-tabs">
            <button 
              className={`picker-tab ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              📷 Galerie ({galleryImages.length})
            </button>
            <button 
              className={`picker-tab ${activeTab === 'canvas' ? 'active' : ''}`}
              onClick={() => setActiveTab('canvas')}
            >
              🎨 Canvas ({canvasImages.length})
            </button>
          </div>

          <div className="picker-content">
            {activeTab === 'gallery' && (
              <div className="picker-grid">
                {galleryImages.length > 0 ? (
                  galleryImages.map((img) => (
                    <div 
                      key={img.id} 
                      className="picker-item"
                      onClick={() => onSelectGallery(img)}
                      title={img.name || img.prompt}
                    >
                      <img src={img.url} alt={img.name} />
                      <span className="item-name">{img.name?.substring(0, 20) || 'Image'}</span>
                    </div>
                  ))
                ) : (
                  <div className="picker-section-empty">
                    <p>Aucune image dans la galerie</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'canvas' && (
              <div className="picker-grid">
                {canvasImages.length > 0 ? (
                  canvasImages.map((el) => (
                    <div 
                      key={el.id} 
                      className="picker-item"
                      onClick={() => onSelectCanvas(el)}
                      title={el.name || 'Image canvas'}
                    >
                      <img src={el.src} alt={el.name} />
                      <span className="item-name">{el.name?.substring(0, 20) || 'Canvas'}</span>
                    </div>
                  ))
                ) : (
                  <div className="picker-section-empty">
                    <p>Aucune image sur le canvas</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Utilitaire pour extraire les SVG du contenu
const extractSvgsFromContent = (content) => {
  if (!content) return { text: '', svgs: [] };
  
  const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
  const svgs = content.match(svgRegex) || [];
  const text = content.replace(svgRegex, '___SVG_PLACEHOLDER___').trim();
  
  return { text, svgs };
};

// Utilitaire pour formater le Markdown simple
const formatMarkdown = (text) => {
  if (!text) return '';
  
  let formatted = text
    // Échapper le HTML sauf les balises autorisées
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold: **text** ou __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic: *text* ou _text_
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    // Liste à puces
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    // Liste numérotée
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Liens
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Sauts de ligne
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  
  // Envelopper les listes
  formatted = formatted.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');
  
  // Envelopper dans un paragraphe
  if (!formatted.startsWith('<h') && !formatted.startsWith('<ul')) {
    formatted = `<p>${formatted}</p>`;
  }
  
  return formatted;
};

// Composant SVG inline pour les messages de débat
const DebateSvgPreview = ({ svg, index, addImage }) => {
  const [showCode, setShowCode] = useState(false);
  const [added, setAdded] = useState({ canvas: false, gallery: false });
  
  // Sanitize SVG
  const sanitizeSvg = (svgContent) => {
    return svgContent
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  };
  
  const sanitizedSvg = sanitizeSvg(svg);
  
  // Convertir SVG en data URL
  const svgToDataUrl = () => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
    return URL.createObjectURL(svgBlob);
  };
  
  // Convertir SVG en PNG base64 pour la galerie
  const svgToPngBase64 = () => {
    return new Promise((resolve) => {
      const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200;
        canvas.height = img.height || 200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngDataUrl = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(pngDataUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback: utiliser le SVG data URL directement
        resolve(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`);
      };
      img.src = url;
    });
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(svg);
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
  
  const handleAddToCanvas = () => {
    const url = svgToDataUrl();
    window.dispatchEvent(new CustomEvent('cocreate:add-to-canvas', { 
      detail: { imageUrl: url, name: `SVG Design ${index + 1}` }
    }));
    setAdded(prev => ({ ...prev, canvas: true }));
  };
  
  const handleAddToGallery = async () => {
    if (addImage) {
      const pngUrl = await svgToPngBase64();
      addImage({
        url: pngUrl,
        prompt: `SVG Design ${index + 1} (généré par débat)`,
        source: 'debate',
        svgCode: svg // Garder le code SVG original
      });
      setAdded(prev => ({ ...prev, gallery: true }));
    }
  };
  
  const handleAddToBoth = async () => {
    handleAddToCanvas();
    await handleAddToGallery();
  };
  
  return (
    <div className="debate-svg-container">
      <div className="debate-svg-toolbar">
        <span className="svg-label">🎨 SVG #{index + 1}</span>
        <div className="svg-actions">
          <button onClick={() => setShowCode(!showCode)} title="Voir le code">
            {showCode ? '👁️' : '< >'}
          </button>
          <button onClick={handleCopy} title="Copier le code SVG">📋</button>
          <button onClick={handleDownload} title="Télécharger SVG">⬇️</button>
          <button 
            onClick={handleAddToCanvas} 
            title="Ajouter au canvas"
            className={added.canvas ? 'added' : ''}
          >
            🖼️ {added.canvas && '✓'}
          </button>
          <button 
            onClick={handleAddToGallery} 
            title="Ajouter à la galerie"
            className={added.gallery ? 'added' : ''}
          >
            📷 {added.gallery && '✓'}
          </button>
          <button 
            onClick={handleAddToBoth} 
            title="Ajouter au canvas ET à la galerie"
            className={(added.canvas && added.gallery) ? 'added' : ''}
          >
            ✨ {(added.canvas && added.gallery) && '✓'}
          </button>
        </div>
      </div>
      {showCode ? (
        <pre className="svg-code-preview">{svg}</pre>
      ) : (
        <div 
          className="debate-svg-render"
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      )}
    </div>
  );
};

// Composant pour les messages du débat
const DebateMessage = ({ message, addImage }) => {
  const getAgentColor = (agent) => {
    const colors = {
      'UX_Designer': '#3b82f6',
      'UI_Designer': '#8b5cf6',
      'Accessibility_Expert': '#10b981',
      'Technical_Lead': '#f59e0b',
      'Creative_Director': '#ef4444',
      'DesignCritic': '#3b82f6',
      'DesignArtist': '#8b5cf6',
      'UXResearcher': '#10b981',
      'BrandStrategist': '#f59e0b',
      'Orchestrator': '#ef4444'
    };
    return colors[agent] || '#64748b';
  };

  const getAgentEmoji = (agent) => {
    const emojis = {
      'UX_Designer': '🎯',
      'UI_Designer': '🎨',
      'Accessibility_Expert': '♿',
      'Technical_Lead': '⚙️',
      'Creative_Director': '✨',
      'DesignCritic': '🔍',
      'DesignArtist': '🎨',
      'UXResearcher': '📊',
      'BrandStrategist': '💡',
      'Orchestrator': '🎭'
    };
    return emojis[agent] || '🤖';
  };

  if (message.type === 'system') {
    return (
      <div className="debate-message system">
        <span>{message.content}</span>
      </div>
    );
  }

  if (message.type === 'error') {
    return (
      <div className="debate-message error">
        <span>❌ {message.content}</span>
      </div>
    );
  }

  if (message.type === 'svg') {
    return (
      <div className="debate-message svg-message">
        <DebateSvgPreview svg={message.content} index={0} addImage={addImage} />
      </div>
    );
  }

  if (message.type === 'agent') {
    // Extraire les SVG du contenu
    const { text, svgs } = extractSvgsFromContent(message.content);
    
    // Formater le texte en Markdown
    const formattedText = formatMarkdown(text.replace(/___SVG_PLACEHOLDER___/g, ''));
    
    return (
      <div className="debate-message agent">
        <div 
          className="agent-header"
          style={{ borderLeftColor: getAgentColor(message.agent) }}
        >
          <span className="agent-emoji">{getAgentEmoji(message.agent)}</span>
          <span className="agent-name">{message.agent?.replace(/_/g, ' ')}</span>
        </div>
        <div className="agent-content">
          {message.content ? (
            <>
              <div 
                className="agent-text formatted-content"
                dangerouslySetInnerHTML={{ __html: formattedText }}
              />
              {svgs.length > 0 && (
                <div className="agent-svgs">
                  {svgs.map((svg, idx) => (
                    <DebateSvgPreview key={idx} svg={svg} index={idx} addImage={addImage} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <Loader2 size={14} className="spinner" />
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ChatInterface;
