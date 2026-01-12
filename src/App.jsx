import React, { useState } from 'react';
import { 
  Settings, 
  Sparkles, 
  PanelLeftClose, 
  PanelLeftOpen,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';

// Context
import { ProjectProvider } from './context/ProjectContext';

// Composants V2
import ProjectSidebar from './components/ProjectSidebar';
import ChatInterface from './components/ChatInterface';
import ImageCanvas from './components/ImageCanvas';
import ImageGallery from './components/ImageGallery';

// Composants legacy (mode avancé)
import DesignAnalysisSection from './components/DesignAnalysisSection';
import AssetGenerationSection from './components/AssetGenerationSection';
import ImageEditingSection from './components/ImageEditingSection';
import DiagramGenerationSection from './components/DiagramGenerationSection';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleGallery = () => {
    setGalleryOpen(!galleryOpen);
  };

  const toggleAdvancedMode = () => {
    setShowAdvancedMode(!showAdvancedMode);
  };

  if (showAdvancedMode) {
    return (
      <ProjectProvider>
        <div className="app-advanced">
          {/* Header mode avancé */}
          <div className="advanced-header">
            <div className="header-left">
              <button 
                className="back-to-v2-btn"
                onClick={toggleAdvancedMode}
              >
                ← Retour à CoCreate V2
              </button>
              <h1>Mode Avancé - CoCreate V1</h1>
            </div>
            <div className="header-info">
              <span>Accès direct aux fonctionnalités individuelles</span>
            </div>
          </div>

          {/* Layout mode avancé */}
          <div className="advanced-content">
            <div className="advanced-sections">
              <div className="advanced-section">
                <h2>🔍 Analyse UX/UI</h2>
                <DesignAnalysisSection />
              </div>
              <div className="advanced-section">
                <h2>🎨 Génération d'Assets</h2>
                <AssetGenerationSection />
              </div>
              <div className="advanced-section">
                <h2>✏️ Édition d'Images</h2>
                <ImageEditingSection />
              </div>
              <div className="advanced-section">
                <h2>📊 Génération de Diagrammes</h2>
                <DiagramGenerationSection />
              </div>
            </div>
          </div>
        </div>
      </ProjectProvider>
    );
  }

  return (
    <ProjectProvider>
      <div className="app-v2">
        {/* En-tête principal */}
        <header className="app-header">
          <div className="header-left">
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              title={sidebarOpen ? 'Masquer la sidebar' : 'Afficher la sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            
            <div className="app-logo">
              <Sparkles className="logo-icon" size={24} />
              <h1 className="app-title">CoCreate V2</h1>
            </div>
            
            <div className="version-badge">
              <span>AI Design Assistant</span>
            </div>
          </div>

          <div className="header-right">
            <button 
              className="gallery-toggle"
              onClick={toggleGallery}
              title={galleryOpen ? 'Masquer la galerie' : 'Afficher la galerie'}
            >
              <ImageIcon size={18} />
              <span>Galerie</span>
            </button>
            
            <button 
              className="advanced-mode-toggle"
              onClick={toggleAdvancedMode}
              title="Mode avancé - Accès direct aux fonctionnalités"
            >
              <Settings size={18} />
              <span>Mode Avancé</span>
            </button>
          </div>
        </header>

        {/* Layout principal */}
        <div className="app-layout">
          {/* Sidebar projets */}
          <aside className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <ProjectSidebar />
          </aside>

          {/* Zone principale */}
          <main className="app-main">
            <div className="main-content">
              {/* Chat Interface */}
              <div className="chat-section">
                <ChatInterface />
              </div>

              {/* Canvas */}
              <div className="canvas-section">
                <ImageCanvas />
              </div>
            </div>

            {/* Galerie d'images */}
            {galleryOpen && (
              <div className="gallery-section">
                <ImageGallery />
              </div>
            )}
          </main>
        </div>

        {/* Indicateur de version */}
        <div className="version-indicator">
          <div className="version-tooltip">
            CoCreate V2 - Interface de chat unifiée avec agent intelligent
            <br />
            💡 <strong>Nouveautés :</strong> Chat IA, Canvas interactif, Gestion de projets
            <br />
            🔧 <strong>Mode Avancé :</strong> Accès direct aux fonctionnalités individuelles
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
};

export default App;