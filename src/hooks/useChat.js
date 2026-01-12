import { useState, useCallback, useRef } from 'react';
import { useProject } from '../context/ProjectContext';

export function useChat() {
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const abortControllerRef = useRef(null);
  const { currentProject, addMessage, addImage, setLoading, setError } = useProject();

  const buildCompactContext = (messages, maxMessages = 12) => {
    const arr = Array.isArray(messages) ? messages : [];
    if (arr.length <= maxMessages) return arr;
    return arr.slice(-maxMessages);
  };

  // Détection d'intention côté client (fallback)
  const detectIntention = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    // Mots-clés pour la génération d'images
    const generationKeywords = [
      'génère', 'crée', 'crée un', 'génère un', 'logo', 'image', 'illustration',
      'générer', 'créer', 'créer un', 'générer un', 'design', 'créatif'
    ];
    
    // Mots-clés pour l'édition d'images
    const editingKeywords = [
      'modifie', 'change', 'transforme', 'améliore', 'éditer', 'transformer',
      'modifier', 'ajoute', 'supprime', 'remplace', 'met à jour'
    ];
    
    // Mots-clés pour l'analyse
    const analysisKeywords = [
      'analyse', 'évalue', 'critique', 'examine', 'analyse ce', 'analyse cette',
      'analyse l\'', 'évalue cette', 'critique ce', 'regarde cette'
    ];
    
    // Mots-clés pour les diagrammes
    const diagramKeywords = [
      'diagramme', 'graphique', 'schéma', 'organigramme', 'flowchart', 'mermaid',
      'architecture', 'flux', 'processus', 'workflow', 'sequence'
    ];

    // Vérifier la présence de mots-clés avec les images uploadées
    const hasUploadedImages = false; // TODO: vérifier les images dans le message

    if (generationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'generate', confidence: 0.8, subtype: 'image' };
    }
    
    if (editingKeywords.some(keyword => lowerMessage.includes(keyword)) && hasUploadedImages) {
      return { type: 'edit', confidence: 0.9, subtype: 'image' };
    }
    
    if (analysisKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'analyze', confidence: 0.8, subtype: 'image' };
    }
    
    if (diagramKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { type: 'generate', confidence: 0.7, subtype: 'diagram' };
    }

    // Détection de conversation générale
    return { type: 'chat', confidence: 0.6 };
  }, []);

  // Envoyer un message à l'agent
  // options:
  //  - forceAction: e.g. 'generate_image'
  //  - forceParameters: passed through to backend action parameters
  const sendMessage = useCallback(async (message, attachments = [], options = {}) => {
    if (!currentProject) {
      setError('Aucun projet sélectionné');
      return;
    }

    // Ajouter le message utilisateur
    const userMessage = {
      type: 'user',
      content: message,
      attachments: attachments
    };
    addMessage(userMessage);

    setIsTyping(true);
    setStreamingMessage('');
    setLoading(true);

    try {
      // Créer un AbortController pour annuler la requête si nécessaire
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          projectId: currentProject.id,
          context: buildCompactContext(currentProject.messages, 12),
          debateInsights: currentProject.debateInsights || null,
          forceAction: options?.forceAction || null,
          forceParameters: options?.forceParameters || null,
          images: attachments,
          timestamp: new Date().toISOString()
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      // Streaming de la réponse
      if (data.streaming) {
        await handleStreamingResponse(data, message);
      } else {
        // Réponse directe
        const aiMessage = {
          type: 'ai',
          content: data.response,
          action: data.action,
          result: data.result,
          suggestions: data.suggestions || []
        };
        addMessage(aiMessage);

        // Ajouter les images générées
        if (data.result?.image) {
          addImage({
            url: data.result.image,
            type: data.action,
            prompt: message,
            metadata: data.result.metadata || {}
          });
        }
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      if (error.name !== 'AbortError') {
        const errorMessage = {
          type: 'ai',
          content: `Désolé, une erreur s'est produite: ${error.message}`,
          isError: true
        };
        addMessage(errorMessage);
        setError(error.message);
      }
    } finally {
      setIsTyping(false);
      setStreamingMessage('');
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [currentProject, addMessage, addImage, setLoading, setError]);

  // Gérer le streaming des réponses
  const handleStreamingResponse = useCallback(async (data, originalMessage) => {
    return new Promise((resolve) => {
      let fullResponse = '';
      
      // Simuler le streaming (à remplacer par le vrai streaming)
      const words = data.response.split(' ');
      let wordIndex = 0;
      
      const streamInterval = setInterval(() => {
        if (wordIndex < words.length) {
          fullResponse += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
          setStreamingMessage(fullResponse);
          wordIndex++;
        } else {
          clearInterval(streamInterval);
          setIsTyping(false);
          setStreamingMessage('');
          
          const aiMessage = {
            type: 'ai',
            content: fullResponse,
            action: data.action,
            result: data.result,
            suggestions: data.suggestions || []
          };
          addMessage(aiMessage);

          // Ajouter les images générées
          if (data.result?.image) {
            addImage({
              url: data.result.image,
              type: data.action,
              prompt: originalMessage,
              metadata: data.result.metadata || {}
            });
          }
          
          resolve();
        }
      }, 100); // Vitesse du streaming
    });
  }, [addMessage, addImage]);

  // Régénérer une réponse
  const regenerateMessage = useCallback(async (messageId) => {
    if (!currentProject) return;

    const message = currentProject.messages.find(m => m.id === messageId);
    if (!message || message.type !== 'user') return;

    // Retirer le message et sa réponse
    const userMessageIndex = currentProject.messages.findIndex(m => m.id === messageId);
    if (userMessageIndex === -1) return;

    const messagesToRemove = currentProject.messages.slice(userMessageIndex, userMessageIndex + 2);
    // TODO: Implémenter la suppression de messages

    // Envoyer à nouveau le message
    await sendMessage(message.content, message.attachments);
  }, [currentProject, sendMessage]);

  // Modifier un prompt
  const editPrompt = useCallback((messageId, newPrompt) => {
    if (!currentProject) return;

    const message = currentProject.messages.find(m => m.id === messageId);
    if (!message || message.type !== 'user') return;

    // TODO: Implémenter la modification du prompt
    console.log('Modifier prompt:', messageId, newPrompt);
  }, [currentProject]);

  // Télécharger un résultat
  const downloadResult = useCallback(async (result, filename = 'result') => {
    try {
      if (result.image) {
        // Télécharger une image
        const link = document.createElement('a');
        link.href = result.image;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (result.content) {
        // Télécharger du texte
        const blob = new Blob([result.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      setError('Erreur lors du téléchargement');
    }
  }, [setError]);

  // Annuler une requête en cours
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      setStreamingMessage('');
      setLoading(false);
    }
  }, [setLoading]);

  // Obtenir les suggestions basées sur le contexte
  const getContextualSuggestions = useCallback(() => {
    if (!currentProject || currentProject.messages.length === 0) {
      return [
        "Génère un logo pour ma startup",
        "Analyse cette interface utilisateur", 
        "Crée un diagramme d'architecture",
        "Modifie cette image"
      ];
    }

    const recentMessages = currentProject.messages.slice(-3);
    const hasImages = currentProject.images.length > 0;
    const lastAction = recentMessages.find(m => m.action)?.action;

    const suggestions = [];

    if (lastAction === 'generate') {
      suggestions.push(
        "Génère une variation avec des couleurs différentes",
        "Améliore ce design",
        "Crée une version en format carré"
      );
    }

    if (lastAction === 'analyze') {
      suggestions.push(
        "Propose des améliorations pour ce design",
        "Analyse d'autres aspects de l'interface"
      );
    }

    if (hasImages) {
      suggestions.push(
        "Modifie cette image",
        "Ajoute cette image au canvas",
        "Crée une composition avec ces images"
      );
    }

    // Suggestions génériques si pas de contexte spécifique
    if (suggestions.length === 0) {
      suggestions.push(
        "Génère un logo moderne",
        "Analyse cette interface",
        "Crée un diagramme de flux",
        "Modifie cette image"
      );
    }

    return suggestions.slice(0, 4);
  }, [currentProject]);

  return {
    isTyping,
    streamingMessage,
    sendMessage,
    regenerateMessage,
    editPrompt,
    downloadResult,
    cancelRequest,
    detectIntention,
    getContextualSuggestions
  };
}