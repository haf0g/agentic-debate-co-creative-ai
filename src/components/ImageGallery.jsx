import React, { useState } from 'react';
import { 
  Grid, 
  List, 
  Download, 
  Trash2, 
  Plus, 
  Filter,
  Calendar,
  Image as ImageIcon,
  Type,
  Workflow,
  Move
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const ImageGallery = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterType, setFilterType] = useState('all'); // 'all', 'generated', 'edited', 'uploaded'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'type', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [draggingImage, setDraggingImage] = useState(null);

  const { currentProject, updateProject } = useProject();

  // Filtrer et trier les images
  const getFilteredAndSortedImages = () => {
    if (!currentProject?.images) return [];

    let images = [...currentProject.images];

    // Filtrer par type
    if (filterType !== 'all') {
      images = images.filter(img => img.type === filterType);
    }

    // Trier
    images.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.timestamp) - new Date(b.timestamp);
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        case 'name':
          comparison = (a.prompt || '').localeCompare(b.prompt || '');
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return images;
  };

  const images = getFilteredAndSortedImages();

  // Ajouter une image au canvas via événement global
  const addToCanvas = (imageUrl) => {
    window.dispatchEvent(new CustomEvent('cocreate:add-to-canvas', { 
      detail: { imageUrl } 
    }));
  };

  // Drag start - pour drag vers le canvas ou chat
  const handleDragStart = (e, image) => {
    setDraggingImage(image.id);
    // Données pour le drop (canvas ou chat)
    const dragData = {
      type: 'gallery-image',
      id: image.id,
      url: image.url,
      name: image.prompt?.substring(0, 30) || 'Image galerie',
      prompt: image.prompt
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', image.url);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Ajouter une classe au body pour indiquer qu'on drag une image
    document.body.classList.add('dragging-gallery-image');
  };

  // Drag end
  const handleDragEnd = () => {
    setDraggingImage(null);
    document.body.classList.remove('dragging-gallery-image');
  };

  // Télécharger une image
  const downloadImage = (image, filename) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = filename || `image-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Supprimer une image
  const deleteImage = (imageId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      const updatedImages = currentProject.images.filter(img => img.id !== imageId);
      updateProject({ images: updatedImages });
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir l'icône du type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'generate':
        return <Workflow size={14} />;
      case 'edit':
        return <Type size={14} />;
      case 'analyze':
        return <ImageIcon size={14} />;
      default:
        return <ImageIcon size={14} />;
    }
  };

  // Obtenir le label du type
  const getTypeLabel = (type) => {
    switch (type) {
      case 'generate':
        return 'Générée';
      case 'edit':
        return 'Édité';
      case 'analyze':
        return 'Analysé';
      default:
        return 'Image';
    }
  };

  if (!currentProject) {
    return (
      <div className="image-gallery empty">
        <div className="empty-state">
          <ImageIcon size={48} />
          <h3>Aucun projet sélectionné</h3>
          <p>Sélectionnez un projet pour voir ses images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-gallery">
      {/* En-tête de la galerie */}
      <div className="gallery-header">
        <div className="gallery-title">
          <h3>Galerie d'images</h3>
          <span className="image-count">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="gallery-controls">
          {/* Filtres */}
          <div className="filter-group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous les types</option>
              <option value="generate">Générées</option>
              <option value="edit">Éditées</option>
              <option value="analyze">Analysées</option>
            </select>
          </div>

          {/* Tri */}
          <div className="sort-group">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="sort-select"
            >
              <option value="date-desc">Plus récentes</option>
              <option value="date-asc">Plus anciennes</option>
              <option value="type-asc">Type A-Z</option>
              <option value="type-desc">Type Z-A</option>
              <option value="name-asc">Nom A-Z</option>
              <option value="name-desc">Nom Z-A</option>
            </select>
          </div>

          {/* Mode d'affichage */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vue grille"
            >
              <Grid size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vue liste"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu de la galerie */}
      <div className="gallery-content">
        {images.length === 0 ? (
          <div className="empty-gallery">
            <ImageIcon size={64} className="empty-icon" />
            <h3>Aucune image</h3>
            <p>
              {filterType === 'all' 
                ? 'Aucune image dans ce projet. Générez des images ou uploadez-en pour les voir ici.'
                : `Aucune image de type "${getTypeLabel(filterType)}" dans ce projet.`
              }
            </p>
          </div>
        ) : (
          <div className={`gallery-items ${viewMode}`}>
            {images.map((image) => (
              <div 
                key={image.id} 
                className={`gallery-item ${draggingImage === image.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, image)}
                onDragEnd={handleDragEnd}
              >
                <div className="image-preview">
                  <img
                    src={image.url}
                    alt={image.prompt || 'Image générée'}
                    className="gallery-image"
                    loading="lazy"
                    draggable={false}
                  />
                  
                  {/* Indicateur de drag */}
                  <div className="drag-hint">
                    <Move size={16} />
                    <span>Glisser vers canvas ou chat</span>
                  </div>
                  
                  {/* Overlay avec actions */}
                  <div className="image-overlay">
                    <div className="image-actions">
                      <button
                        className="action-btn"
                        onClick={() => addToCanvas(image.url)}
                        title="Ajouter au canvas"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => downloadImage(image, image.prompt)}
                        title="Télécharger"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => deleteImage(image.id)}
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Badge du type */}
                  <div className="image-type-badge">
                    {getTypeIcon(image.type)}
                    <span>{getTypeLabel(image.type)}</span>
                  </div>
                </div>

                {/* Informations */}
                <div className="image-info">
                  {viewMode === 'grid' ? (
                    <>
                      {image.prompt && (
                        <p className="image-prompt" title={image.prompt}>
                          {image.prompt.length > 50 
                            ? `${image.prompt.substring(0, 50)}...`
                            : image.prompt
                          }
                        </p>
                      )}
                      <div className="image-meta">
                        <Calendar size={12} />
                        <span>{formatDate(image.timestamp)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="image-details">
                      <div className="detail-row">
                        <span className="detail-label">Prompt:</span>
                        <span className="detail-value">{image.prompt || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Type:</span>
                        <span className="detail-value">{getTypeLabel(image.type)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{formatDate(image.timestamp)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;