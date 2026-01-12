import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Folder, 
  Edit3, 
  Trash2, 
  Calendar, 
  MessageSquare,
  Image,
  MoreVertical,
  Search
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const ProjectSidebar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const { 
    projects, 
    currentProject, 
    createProject, 
    setCurrentProject, 
    updateProject, 
    deleteProject 
  } = useProject();

  const debate = currentProject?.debateInsights || null;
  const debateHasConsensus = !!debate?.consensus;
  const debateApproved = !!debate?.approved;

  const dispatchUiEvent = (name, detail) => {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  };

  // Filtrer les projets
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Créer un nouveau projet
  const handleCreateProject = (e) => {
    e.preventDefault();
    
    if (!newProjectName.trim()) return;

    createProject({
      name: newProjectName.trim(),
      description: newProjectDescription.trim()
    });

    setNewProjectName('');
    setNewProjectDescription('');
    setShowNewProjectForm(false);
  };

  // Modifier un projet
  const handleUpdateProject = (e) => {
    e.preventDefault();
    
    if (!editingProject || !newProjectName.trim()) return;

    updateProject({
      id: editingProject.id,
      name: newProjectName.trim(),
      description: newProjectDescription.trim()
    });

    setEditingProject(null);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  // Supprimer un projet
  const handleDeleteProject = (projectId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.')) {
      deleteProject(projectId);
    }
  };

  // Commencer l'édition
  const startEditing = (project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description || '');
  };

  // Annuler l'édition
  const cancelEditing = () => {
    setEditingProject(null);
    setNewProjectName('');
    setNewProjectDescription('');
    setShowNewProjectForm(false);
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculer les statistiques du projet
  const getProjectStats = (project) => {
    const messages = project.messages?.length || 0;
    const images = project.images?.length || 0;
    const elements = project.canvas?.elements?.length || 0;
    
    return { messages, images, elements };
  };

  return (
    <div className="project-sidebar">
      {/* En-tête */}
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <Folder size={20} />
          Projets
        </h2>
        <button
          className="new-project-btn"
          onClick={() => setShowNewProjectForm(true)}
          title="Nouveau projet"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Rechercher un projet..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Liste des projets */}
      <div className="projects-list">
        {filteredProjects.length === 0 ? (
          <div className="empty-projects">
            {projects.length === 0 ? (
              <>
                <Folder size={48} className="empty-icon" />
                <h3>Aucun projet</h3>
                <p>Créez votre premier projet pour commencer</p>
                <button
                  className="create-first-project-btn"
                  onClick={() => setShowNewProjectForm(true)}
                >
                  <Plus size={16} />
                  Créer un projet
                </button>
              </>
            ) : (
              <>
                <Search size={48} className="empty-icon" />
                <h3>Aucun résultat</h3>
                <p>Aucun projet ne correspond à votre recherche</p>
              </>
            )}
          </div>
        ) : (
          filteredProjects.map((project) => {
            const stats = getProjectStats(project);
            const isActive = currentProject?.id === project.id;

            return (
              <div
                key={project.id}
                className={`project-item ${isActive ? 'active' : ''}`}
                onClick={() => setCurrentProject(project.id)}
              >
                <div className="project-content">
                  {editingProject?.id === project.id ? (
                    <form 
                      className="project-edit-form"
                      onSubmit={handleUpdateProject}
                    >
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="project-name-input"
                        placeholder="Nom du projet"
                        autoFocus
                        onBlur={(e) => {
                          // Sauvegarder automatiquement si le nom n'est pas vide
                          if (newProjectName.trim() && newProjectName !== project.name) {
                            handleUpdateProject(e);
                          } else {
                            cancelEditing();
                          }
                        }}
                      />
                      <textarea
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        className="project-description-input"
                        placeholder="Description (optionnel)"
                        rows={2}
                      />
                      <div className="edit-actions">
                        <button type="submit" className="save-btn">
                          Sauvegarder
                        </button>
                        <button type="button" onClick={cancelEditing}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="project-header">
                        <h4 className="project-name">{project.name}</h4>
                        <div className="project-actions">
                          <button
                            className="project-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(project);
                            }}
                            title="Modifier"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="project-action-btn danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {project.description && (
                        <p className="project-description">{project.description}</p>
                      )}
                      
                      <div className="project-meta">
                        <div className="project-stats">
                          <div className="stat">
                            <MessageSquare size={12} />
                            <span>{stats.messages}</span>
                          </div>
                          <div className="stat">
                            <Image size={12} />
                            <span>{stats.images}</span>
                          </div>
                        </div>
                        <div className="project-date">
                          <Calendar size={12} />
                          <span>{formatDate(project.updatedAt)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Human-in-the-loop Debate Panel */}
                {currentProject && (
                  <div className="debate-hitl-panel">
                    <div className="debate-hitl-header">
                      <div className="debate-hitl-title">🤖 Débat (Human-in-the-loop)</div>
                      {debateHasConsensus && (
                        <span className={`debate-hitl-badge ${debateApproved ? 'approved' : 'pending'}`}>
                          {debateApproved ? 'Approved' : 'Review'}
                        </span>
                      )}
                    </div>

                    {!debateHasConsensus ? (
                      <button
                        className="debate-hitl-btn primary"
                        onClick={() => dispatchUiEvent('cocreate:open-debate', {})}
                      >
                        Lancer un débat
                      </button>
                    ) : (
                      <div className="debate-hitl-actions">
                        <button
                          className="debate-hitl-btn primary"
                          onClick={() => dispatchUiEvent('cocreate:open-debate-review', {})}
                        >
                          Revoir / approuver
                        </button>
                        <button
                          className="debate-hitl-btn"
                          onClick={() => dispatchUiEvent('cocreate:rerun-debate', { prompt: debate?.prompt || '' })}
                        >
                          Relancer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Formulaire nouveau projet */}
      {showNewProjectForm && (
        <div className="new-project-modal">
          <div className="modal-content">
            <h3>Nouveau Projet</h3>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="project-name">Nom du projet *</label>
                <input
                  id="project-name"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Mon nouveau projet"
                  className="form-input"
                  autoFocus
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="project-description">Description (optionnel)</label>
                <textarea
                  id="project-description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Décrivez votre projet..."
                  className="form-textarea"
                  rows={3}
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Créer le projet
                </button>
                <button 
                  type="button" 
                  onClick={cancelEditing}
                  className="btn btn-outline"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistiques globales */}
      {projects.length > 0 && (
        <div className="sidebar-stats">
          <h4>Statistiques</h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">{projects.length}</span>
              <span className="stat-label">Projet{projects.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {projects.reduce((sum, p) => sum + (p.messages?.length || 0), 0)}
              </span>
              <span className="stat-label">Message{projects.reduce((sum, p) => sum + (p.messages?.length || 0), 0) !== 1 ? 's' : ''}</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {projects.reduce((sum, p) => sum + (p.images?.length || 0), 0)}
              </span>
              <span className="stat-label">Image{projects.reduce((sum, p) => sum + (p.images?.length || 0), 0) !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;