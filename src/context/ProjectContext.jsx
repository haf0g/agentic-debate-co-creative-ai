import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const ProjectContext = createContext();

const initialState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  // Mémoire partagée entre Chat/Débat/Revue
  sharedMemory: {
    lastContext: null,      // Dernier contexte utilisé (prompt, images, etc.)
    debateSummary: null,    // Résumé du débat pour le chat
    chatHistory: [],        // Historique condensé pour le débat
    activeWorkflow: null,   // Workflow actif: 'chat' | 'debate' | 'review'
    pendingActions: []      // Actions en attente cross-tab
  }
};

function projectReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'LOAD_PROJECTS':
      return { ...state, projects: action.payload, isLoading: false };
    
    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };
    
    case 'CREATE_PROJECT':
      const newProject = {
        id: uuidv4(),
        name: action.payload.name || 'Nouveau Projet',
        description: action.payload.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
        images: [],
        debateInsights: null,
        canvas: {
          elements: [],
          settings: {
            backgroundColor: '#ffffff',
            gridEnabled: false,
            snapToGrid: false
          }
        }
      };
      return {
        ...state,
        projects: [...state.projects, newProject],
        currentProject: newProject
      };
    
    case 'UPDATE_PROJECT':
      const updatedProject = {
        ...state.currentProject,
        ...action.payload,
        updatedAt: new Date().toISOString()
      };
      return {
        ...state,
        currentProject: updatedProject,
        projects: state.projects.map(p => 
          p.id === updatedProject.id ? updatedProject : p
        )
      };

    case 'SET_DEBATE_INSIGHTS':
      if (!state.currentProject) return state;
      {
        const incoming = action.payload || null;
        const normalized = incoming
          ? {
              approved: false,
              approvedText: '',
              approvedAt: null,
              ...incoming
            }
          : null;

        const projectWithDebate = {
          ...state.currentProject,
          debateInsights: normalized,
          updatedAt: new Date().toISOString()
        };
        return {
          ...state,
          currentProject: projectWithDebate,
          projects: state.projects.map(p =>
            p.id === projectWithDebate.id ? projectWithDebate : p
          )
        };
      }

    case 'UPDATE_DEBATE_INSIGHTS':
      if (!state.currentProject) return state;
      if (!state.currentProject.debateInsights) return state;
      {
        const merged = {
          ...state.currentProject.debateInsights,
          ...action.payload
        };
        const projectWithDebateUpdate = {
          ...state.currentProject,
          debateInsights: merged,
          updatedAt: new Date().toISOString()
        };
        return {
          ...state,
          currentProject: projectWithDebateUpdate,
          projects: state.projects.map(p =>
            p.id === projectWithDebateUpdate.id ? projectWithDebateUpdate : p
          )
        };
      }

    case 'CLEAR_DEBATE_INSIGHTS':
      if (!state.currentProject) return state;
      {
        const cleared = {
          ...state.currentProject,
          debateInsights: null,
          updatedAt: new Date().toISOString()
        };
        return {
          ...state,
          currentProject: cleared,
          projects: state.projects.map(p => (p.id === cleared.id ? cleared : p)),
          sharedMemory: {
            ...state.sharedMemory,
            debateSummary: null
          }
        };
      }

    // === MÉMOIRE PARTAGÉE ===
    case 'UPDATE_SHARED_MEMORY':
      return {
        ...state,
        sharedMemory: {
          ...state.sharedMemory,
          ...action.payload
        }
      };

    case 'SET_ACTIVE_WORKFLOW':
      return {
        ...state,
        sharedMemory: {
          ...state.sharedMemory,
          activeWorkflow: action.payload
        }
      };

    case 'SYNC_DEBATE_TO_CHAT':
      // Quand un débat termine, préparer un résumé pour le chat
      if (!state.currentProject?.debateInsights) return state;
      const debateData = state.currentProject.debateInsights;
      return {
        ...state,
        sharedMemory: {
          ...state.sharedMemory,
          debateSummary: {
            prompt: debateData.prompt,
            consensus: debateData.consensus,
            approved: debateData.approved,
            approvedText: debateData.approvedText,
            hasSvg: (debateData.svgArtifacts?.length || 0) > 0,
            syncedAt: new Date().toISOString()
          },
          lastContext: {
            type: 'debate',
            prompt: debateData.prompt,
            timestamp: new Date().toISOString()
          }
        }
      };

    case 'SYNC_CHAT_TO_DEBATE':
      // Préparer l'historique chat pour le débat
      if (!state.currentProject?.messages) return state;
      const recentMessages = state.currentProject.messages.slice(-10).map(m => ({
        role: m.type,
        content: m.content?.substring(0, 500),
        hasImage: !!(m.images?.length || m.result?.imageUrl)
      }));
      return {
        ...state,
        sharedMemory: {
          ...state.sharedMemory,
          chatHistory: recentMessages,
          lastContext: {
            type: 'chat',
            messageCount: state.currentProject.messages.length,
            timestamp: new Date().toISOString()
          }
        }
      };

    case 'ADD_PENDING_ACTION':
      return {
        ...state,
        sharedMemory: {
          ...state.sharedMemory,
          pendingActions: [...state.sharedMemory.pendingActions, action.payload]
        }
      };

    case 'CLEAR_PENDING_ACTIONS':
      return {
        ...state,
        sharedMemory: {
          ...state.sharedMemory,
          pendingActions: []
        }
      };
    
    case 'DELETE_PROJECT':
      const remainingProjects = state.projects.filter(p => p.id !== action.payload);
      return {
        ...state,
        projects: remainingProjects,
        currentProject: state.currentProject?.id === action.payload ? null : state.currentProject
      };
    
    case 'ADD_MESSAGE':
      if (!state.currentProject) return state;
      const newMessage = {
        id: uuidv4(),
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      const projectWithMessage = {
        ...state.currentProject,
        messages: [...state.currentProject.messages, newMessage],
        updatedAt: new Date().toISOString()
      };
      return {
        ...state,
        currentProject: projectWithMessage,
        projects: state.projects.map(p => 
          p.id === projectWithMessage.id ? projectWithMessage : p
        )
      };
    
    case 'ADD_IMAGE':
      if (!state.currentProject) return state;
      const newImage = {
        id: uuidv4(),
        ...action.payload,
        timestamp: new Date().toISOString()
      };
      const projectWithImage = {
        ...state.currentProject,
        images: [...state.currentProject.images, newImage],
        updatedAt: new Date().toISOString()
      };
      return {
        ...state,
        currentProject: projectWithImage,
        projects: state.projects.map(p => 
          p.id === projectWithImage.id ? projectWithImage : p
        )
      };
    
    case 'UPDATE_CANVAS':
      if (!state.currentProject) return state;
      const projectWithCanvas = {
        ...state.currentProject,
        canvas: {
          ...state.currentProject.canvas,
          ...action.payload
        },
        updatedAt: new Date().toISOString()
      };
      return {
        ...state,
        currentProject: projectWithCanvas,
        projects: state.projects.map(p => 
          p.id === projectWithCanvas.id ? projectWithCanvas : p
        )
      };
    
    default:
      return state;
  }
}

const STORAGE_KEY = 'cocreate_projects_v2';

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Charger les projets depuis localStorage au démarrage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const projects = JSON.parse(stored);
        dispatch({ type: 'LOAD_PROJECTS', payload: projects });
        
        // Sélectionner le dernier projet actif
        if (projects.length > 0) {
          const lastProject = projects[projects.length - 1];
          dispatch({ type: 'SET_CURRENT_PROJECT', payload: lastProject });
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erreur lors du chargement des projets' });
    }
  }, []);

  // Sauvegarder les projets dans localStorage à chaque changement
  useEffect(() => {
    if (state.projects.length > 0) {
      try {
        // Nettoyer les données volumineuses avant sauvegarde (images base64 > 50KB)
        const cleanedProjects = state.projects.map(project => ({
          ...project,
          images: (project.images || []).map(img => ({
            ...img,
            // Ne pas stocker les images base64 volumineuses dans localStorage
            url: img.url?.startsWith('data:') && img.url.length > 50000 
              ? '[IMAGE_TOO_LARGE]' 
              : img.url
          })),
          messages: (project.messages || []).map(msg => ({
            ...msg,
            // Nettoyer les images dans les messages aussi
            images: (msg.images || []).map(img => ({
              ...img,
              url: img.url?.startsWith('data:') && img.url.length > 50000 
                ? '[IMAGE_TOO_LARGE]' 
                : img.url
            })),
            result: msg.result ? {
              ...msg.result,
              imageUrl: msg.result.imageUrl?.startsWith('data:') && msg.result.imageUrl.length > 50000
                ? '[IMAGE_TOO_LARGE]'
                : msg.result.imageUrl
            } : msg.result
          })),
          canvas: project.canvas ? {
            ...project.canvas,
            elements: (project.canvas.elements || []).map(el => ({
              ...el,
              // Ne pas stocker les images canvas base64 volumineuses
              src: el.src?.startsWith('data:') && el.src.length > 50000 
                ? '[IMAGE_TOO_LARGE]' 
                : el.src
            }))
          } : project.canvas
        }));

        const dataToSave = JSON.stringify(cleanedProjects);
        
        // Vérifier la taille avant de sauvegarder (limite ~4MB pour être safe)
        if (dataToSave.length > 4 * 1024 * 1024) {
          console.warn('Données trop volumineuses, nettoyage supplémentaire...');
          // Garder seulement les 10 derniers messages par projet
          const reducedProjects = cleanedProjects.map(project => ({
            ...project,
            messages: (project.messages || []).slice(-10)
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedProjects));
        } else {
          localStorage.setItem(STORAGE_KEY, dataToSave);
        }
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.error('localStorage plein! Nettoyage en cours...');
          // Nettoyer et réessayer avec données minimales
          try {
            const minimalProjects = state.projects.map(project => ({
              id: project.id,
              name: project.name,
              description: project.description,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              messages: (project.messages || []).slice(-5).map(m => ({
                id: m.id,
                type: m.type,
                content: m.content?.substring(0, 500),
                timestamp: m.timestamp
              })),
              images: [],
              debateInsights: project.debateInsights,
              canvas: { elements: [], settings: project.canvas?.settings || {} }
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalProjects));
            console.log('Sauvegarde minimale effectuée');
          } catch (e) {
            // En dernier recours, vider le storage
            console.error('Impossible de sauvegarder, vidage du localStorage');
            localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          console.error('Erreur lors de la sauvegarde des projets:', error);
        }
        dispatch({ type: 'SET_ERROR', payload: 'Erreur lors de la sauvegarde' });
      }
    }
  }, [state.projects]);

  const actions = {
    createProject: (projectData) => {
      dispatch({ type: 'CREATE_PROJECT', payload: projectData });
    },
    
    setCurrentProject: (projectId) => {
      const project = state.projects.find(p => p.id === projectId);
      if (project) {
        dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });
      }
    },
    
    updateProject: (updates) => {
      dispatch({ type: 'UPDATE_PROJECT', payload: updates });
    },

    setDebateInsights: (debateInsights) => {
      dispatch({ type: 'SET_DEBATE_INSIGHTS', payload: debateInsights });
    },

    updateDebateInsights: (updates) => {
      dispatch({ type: 'UPDATE_DEBATE_INSIGHTS', payload: updates });
    },

    approveDebate: (approvedText) => {
      dispatch({
        type: 'UPDATE_DEBATE_INSIGHTS',
        payload: {
          approved: true,
          approvedText: String(approvedText || '').trim(),
          approvedAt: new Date().toISOString()
        }
      });
    },

    clearDebateApproval: () => {
      dispatch({
        type: 'UPDATE_DEBATE_INSIGHTS',
        payload: {
          approved: false,
          approvedAt: null
        }
      });
    },

    clearDebateInsights: () => {
      dispatch({ type: 'CLEAR_DEBATE_INSIGHTS' });
    },
    
    deleteProject: (projectId) => {
      dispatch({ type: 'DELETE_PROJECT', payload: projectId });
    },
    
    addMessage: (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    },
    
    addImage: (image) => {
      dispatch({ type: 'ADD_IMAGE', payload: image });
    },
    
    updateCanvas: (canvasData) => {
      dispatch({ type: 'UPDATE_CANVAS', payload: canvasData });
    },
    
    setLoading: (loading) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },
    
    setError: (error) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    },

    // === MÉMOIRE PARTAGÉE ===
    updateSharedMemory: (updates) => {
      dispatch({ type: 'UPDATE_SHARED_MEMORY', payload: updates });
    },

    setActiveWorkflow: (workflow) => {
      dispatch({ type: 'SET_ACTIVE_WORKFLOW', payload: workflow });
    },

    syncDebateToChat: () => {
      dispatch({ type: 'SYNC_DEBATE_TO_CHAT' });
    },

    syncChatToDebate: () => {
      dispatch({ type: 'SYNC_CHAT_TO_DEBATE' });
    },

    addPendingAction: (action) => {
      dispatch({ type: 'ADD_PENDING_ACTION', payload: action });
    },

    clearPendingActions: () => {
      dispatch({ type: 'CLEAR_PENDING_ACTIONS' });
    },

    // Obtenir le contexte unifié pour l'IA
    getUnifiedContext: () => {
      const project = state.currentProject;
      if (!project) return null;

      return {
        projectName: project.name,
        projectDescription: project.description,
        // Débat
        hasDebate: !!project.debateInsights?.consensus,
        debateApproved: !!project.debateInsights?.approved,
        debateConsensus: project.debateInsights?.consensus || null,
        debatePrompt: project.debateInsights?.prompt || null,
        approvedText: project.debateInsights?.approvedText || null,
        hasSvgArtifacts: (project.debateInsights?.svgArtifacts?.length || 0) > 0,
        // Chat
        messageCount: project.messages?.length || 0,
        lastMessage: project.messages?.slice(-1)[0] || null,
        hasImages: (project.images?.length || 0) > 0,
        // Mémoire partagée
        ...state.sharedMemory
      };
    }
  };

  return (
    <ProjectContext.Provider value={{ ...state, ...actions }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Utilitaires pour l'export
export function exportProject(project) {
  return {
    ...project,
    exportedAt: new Date().toISOString(),
    version: '2.0'
  };
}

export function exportAllProjects(projects) {
  return {
    projects: projects.map(exportProject),
    exportedAt: new Date().toISOString(),
    version: '2.0',
    totalProjects: projects.length
  };
}