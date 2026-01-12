import { useState, useCallback, useRef } from 'react';
import useImage from 'use-image';
import { useProject } from '../context/ProjectContext';

// Constantes pour les layers
export const CANVAS_LAYERS = {
  BACKGROUND: 'background',
  ELEMENTS: 'elements',
  FOREGROUND: 'foreground'
};

export function useCanvas() {
  const [selectedElements, setSelectedElements] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [gridEnabled, setGridEnabled] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [activeLayer, setActiveLayer] = useState(CANVAS_LAYERS.ELEMENTS);
  const [layerVisibility, setLayerVisibility] = useState({
    [CANVAS_LAYERS.BACKGROUND]: true,
    [CANVAS_LAYERS.ELEMENTS]: true,
    [CANVAS_LAYERS.FOREGROUND]: true
  });
  
  const stageRef = useRef(null);
  const { currentProject, updateCanvas } = useProject();

  // Toggle visibility d'un layer
  const toggleLayerVisibility = useCallback((layer) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  // Obtenir les éléments par layer
  const getElementsByLayer = useCallback((layer) => {
    if (!currentProject?.canvas?.elements) return [];
    return currentProject.canvas.elements.filter(el => (el.layer || CANVAS_LAYERS.ELEMENTS) === layer);
  }, [currentProject]);

  // Ajouter une image au canvas
  const addImage = useCallback((imageUrl, position = { x: 100, y: 100 }, layer = null) => {
    if (!currentProject) return;

    const targetLayer = layer || activeLayer;
    
    const newElement = {
      id: `element_${Date.now()}_${Math.random()}`,
      type: 'image',
      url: imageUrl,
      x: position.x,
      y: position.y,
      width: 200,
      height: 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      layer: targetLayer,
      zIndex: currentProject.canvas.elements.length
    };

    const updatedElements = [...currentProject.canvas.elements, newElement];
    updateCanvas({ elements: updatedElements });
    
    return newElement.id;
  }, [currentProject, updateCanvas, activeLayer]);

  // Ajouter du texte au canvas
  const addText = useCallback((text = 'Nouveau texte', position = { x: 100, y: 100 }, layer = null) => {
    if (!currentProject) return;

    const targetLayer = layer || activeLayer;

    const newElement = {
      id: `element_${Date.now()}_${Math.random()}`,
      type: 'text',
      text,
      x: position.x,
      y: position.y,
      width: 200,
      height: 50,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      layer: targetLayer,
      zIndex: currentProject.canvas.elements.length,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
      align: 'left'
    };

    const updatedElements = [...currentProject.canvas.elements, newElement];
    updateCanvas({ elements: updatedElements });
    
    return newElement.id;
  }, [currentProject, updateCanvas, activeLayer]);

  // Ajouter une forme (rectangle, cercle, etc.)
  const addShape = useCallback((shapeType = 'rect', position = { x: 100, y: 100 }, options = {}) => {
    if (!currentProject) return;

    const targetLayer = options.layer || activeLayer;

    const newElement = {
      id: `element_${Date.now()}_${Math.random()}`,
      type: shapeType,
      x: position.x,
      y: position.y,
      width: options.width || 100,
      height: options.height || 100,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: options.opacity ?? 1,
      visible: true,
      locked: false,
      layer: targetLayer,
      zIndex: currentProject.canvas.elements.length,
      fill: options.fill || '#3b82f6',
      stroke: options.stroke || 'transparent',
      strokeWidth: options.strokeWidth || 0,
      cornerRadius: options.cornerRadius || 0
    };

    const updatedElements = [...currentProject.canvas.elements, newElement];
    updateCanvas({ elements: updatedElements });
    
    return newElement.id;
  }, [currentProject, updateCanvas, activeLayer]);

  // Déplacer un élément vers un autre layer
  const moveToLayer = useCallback((elementIds, targetLayer) => {
    if (!currentProject) return;

    const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
    const updatedElements = currentProject.canvas.elements.map(element =>
      ids.includes(element.id) ? { ...element, layer: targetLayer } : element
    );
    
    updateCanvas({ elements: updatedElements });
  }, [currentProject, updateCanvas]);

  // Mettre à jour un élément
  const updateElement = useCallback((elementId, updates) => {
    if (!currentProject) return;

    const updatedElements = currentProject.canvas.elements.map(element =>
      element.id === elementId 
        ? { ...element, ...updates }
        : element
    );
    
    updateCanvas({ elements: updatedElements });
  }, [currentProject, updateCanvas]);

  // Supprimer des éléments
  const deleteElements = useCallback((elementIds) => {
    if (!currentProject) return;

    const updatedElements = currentProject.canvas.elements.filter(
      element => !elementIds.includes(element.id)
    );
    
    updateCanvas({ elements: updatedElements });
    setSelectedElements([]);
  }, [currentProject, updateCanvas]);

  // Dupliquer des éléments
  const duplicateElements = useCallback((elementIds) => {
    if (!currentProject) return;

    const elementsToDuplicate = currentProject.canvas.elements.filter(
      element => elementIds.includes(element.id)
    );

    const newElements = elementsToDuplicate.map(element => ({
      ...element,
      id: `element_${Date.now()}_${Math.random()}`,
      x: element.x + 20,
      y: element.y + 20,
      zIndex: currentProject.canvas.elements.length
    }));

    const updatedElements = [...currentProject.canvas.elements, ...newElements];
    updateCanvas({ elements: updatedElements });
    
    return newElements.map(el => el.id);
  }, [currentProject, updateCanvas]);

  // Sélection d'éléments
  const selectElements = useCallback((elementIds, addToSelection = false) => {
    if (addToSelection) {
      setSelectedElements(prev => {
        const newSelection = [...prev];
        elementIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    } else {
      setSelectedElements(elementIds);
    }
  }, []);

  // Désélectionner tous les éléments
  const clearSelection = useCallback(() => {
    setSelectedElements([]);
  }, []);

  // Déplacer des éléments
  const moveElements = useCallback((elementIds, deltaX, deltaY) => {
    if (!currentProject) return;

    const updatedElements = currentProject.canvas.elements.map(element =>
      elementIds.includes(element.id)
        ? { 
            ...element, 
            x: element.x + deltaX, 
            y: element.y + deltaY 
          }
        : element
    );
    
    updateCanvas({ elements: updatedElements });
  }, [currentProject, updateCanvas]);

  // Redimensionner des éléments
  const resizeElement = useCallback((elementId, newAttrs) => {
    if (!currentProject) return;

    const updatedElements = currentProject.canvas.elements.map(element =>
      element.id === elementId
        ? { ...element, ...newAttrs }
        : element
    );
    
    updateCanvas({ elements: updatedElements });
  }, [currentProject, updateCanvas]);

  // Changer l'ordre des éléments (z-index)
  const reorderElements = useCallback((elementIds, direction) => {
    if (!currentProject) return;

    const elementsMap = new Map(
      currentProject.canvas.elements.map(el => [el.id, el])
    );

    const updatedElements = [...currentProject.canvas.elements];

    elementIds.forEach(id => {
      const element = elementsMap.get(id);
      if (element) {
        const currentIndex = updatedElements.findIndex(el => el.id === id);
        let newIndex = currentIndex;

        if (direction === 'forward') {
          newIndex = Math.min(currentIndex + 1, updatedElements.length - 1);
        } else if (direction === 'backward') {
          newIndex = Math.max(currentIndex - 1, 0);
        } else if (direction === 'to-front') {
          newIndex = updatedElements.length - 1;
        } else if (direction === 'to-back') {
          newIndex = 0;
        }

        if (newIndex !== currentIndex) {
          updatedElements.splice(currentIndex, 1);
          updatedElements.splice(newIndex, 0, element);
        }
      }
    });

    updateCanvas({ elements: updatedElements });
  }, [currentProject, updateCanvas]);

  // Zoom et pan
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.2;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const newPos = {
      x: pointer.x - ((pointer.x - stage.x()) / oldScale) * newScale,
      y: pointer.y - ((pointer.y - stage.y()) / oldScale) * newScale
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    
    setZoom(newScale);
    setStagePosition(newPos);
  }, []);

  // Reset du zoom et position
  const resetView = useCallback(() => {
    setZoom(1);
    setStagePosition({ x: 0, y: 0 });
    
    if (stageRef.current) {
      stageRef.current.scale({ x: 1, y: 1 });
      stageRef.current.position({ x: 0, y: 0 });
    }
  }, []);

  // Export du canvas
  const exportCanvas = useCallback((format = 'png', quality = 1) => {
    if (!stageRef.current) return null;

    const stage = stageRef.current;
    const dataURL = stage.toDataURL({
      mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      quality: quality,
      pixelRatio: 2 // Pour une meilleure qualité
    });

    return dataURL;
  }, []);

  // Grille - retourne les données pour dessiner la grille
  const getGridLines = useCallback(() => {
    if (!gridEnabled) return [];

    const gridSize = 20;
    const lines = [];

    // Lignes verticales
    for (let i = 0; i <= canvasSize.width / gridSize; i++) {
      lines.push({
        id: `v-${i}`,
        points: [i * gridSize, 0, i * gridSize, canvasSize.height]
      });
    }

    // Lignes horizontales
    for (let i = 0; i <= canvasSize.height / gridSize; i++) {
      lines.push({
        id: `h-${i}`,
        points: [0, i * gridSize, canvasSize.width, i * gridSize]
      });
    }

    return lines;
  }, [gridEnabled, canvasSize]);

  // Gestion du drag & drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    
    // Calculer la position relative au canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom
    };

    // Vérifier si c'est une URL d'image (drag depuis la galerie)
    const imageUrl = e.dataTransfer.getData('text/plain');
    if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:') || imageUrl.startsWith('blob:'))) {
      addImage(imageUrl, position);
      return;
    }

    // Sinon, vérifier les fichiers droppés
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          addImage(reader.result, position);
        };
        reader.readAsDataURL(file);
      }
    }
  }, [addImage, zoom]);

  // Snap to grid
  const snapToGridPosition = useCallback((x, y) => {
    if (!snapToGrid) return { x, y };

    const gridSize = 20;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, [snapToGrid]);

  // Écouter l'événement global pour ajouter des images depuis la galerie
  const addImageFromGallery = useCallback((imageUrl) => {
    // Ajouter au centre du canvas visible
    const centerPosition = {
      x: (canvasSize.width / 2 - stagePosition.x) / zoom - 100,
      y: (canvasSize.height / 2 - stagePosition.y) / zoom - 100
    };
    addImage(imageUrl, centerPosition);
  }, [addImage, canvasSize, stagePosition, zoom]);

  // Propriétés calculées
  const canvasElements = currentProject?.canvas.elements || [];
  const selectedCanvasElements = canvasElements.filter(el => 
    selectedElements.includes(el.id)
  );

  return {
    // État
    selectedElements,
    isDragging,
    zoom,
    stagePosition,
    canvasSize,
    gridEnabled,
    snapToGrid,
    canvasElements,
    selectedCanvasElements,
    
    // Refs
    stageRef,
    
    // Actions
    addImage,
    addImageFromGallery,
    addText,
    updateElement,
    deleteElements,
    duplicateElements,
    selectElements,
    clearSelection,
    moveElements,
    resizeElement,
    reorderElements,
    
    // View
    handleWheel,
    resetView,
    getGridLines,
    
    // Utils
    handleDrop,
    snapToGridPosition,
    exportCanvas,
    
    // Settings
    setGridEnabled,
    setSnapToGrid,
    setCanvasSize,
    setIsDragging,

    // Layers
    activeLayer,
    setActiveLayer,
    layerVisibility,
    toggleLayerVisibility,
    getElementsByLayer,
    moveToLayer,
    addShape,
    CANVAS_LAYERS
  };
}

// Hook pour charger une image avec Konva
export function useKonvaImage(url) {
  const [image] = useImage(url);
  return image;
}