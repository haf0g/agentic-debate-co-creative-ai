import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Text, Rect, Transformer, Line, Circle } from 'react-konva';
import useImage from 'use-image';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Download,
  Trash2,
  Copy,
  Move,
  Square,
  Type,
  Layers,
  Eye,
  EyeOff,
  Circle as CircleIcon,
  Image as ImageIcon
} from 'lucide-react';
import { useCanvas, CANVAS_LAYERS } from '../hooks/useCanvas.jsx';

// Composant pour afficher une image Konva (car les hooks ne peuvent pas être appelés conditionnellement)
const CanvasImage = ({ element, commonProps, onTransformEnd }) => {
  const [image] = useImage(element.url, 'anonymous');
  
  if (!image) return null;
  
  return (
    <KonvaImage
      {...commonProps}
      image={image}
      width={element.width}
      height={element.height}
      onTransformEnd={(e) => onTransformEnd(e, element.id)}
    />
  );
};

const ImageCanvas = () => {
  const [dragOver, setDragOver] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const transformerRef = useRef(null);
  const elementRefs = useRef({});

  const {
    selectedElements,
    isDragging,
    zoom,
    stagePosition,
    canvasSize,
    gridEnabled,
    snapToGrid,
    canvasElements,
    selectedCanvasElements,
    stageRef,
    addImage,
    addImageFromGallery,
    addText,
    addShape,
    updateElement,
    deleteElements,
    duplicateElements,
    selectElements,
    clearSelection,
    moveElements,
    resizeElement,
    reorderElements,
    handleWheel,
    resetView,
    getGridLines,
    handleDrop,
    snapToGridPosition,
    exportCanvas,
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
    moveToLayer
  } = useCanvas();

  // Écouter l'événement d'ajout depuis la galerie
  useEffect(() => {
    const handleAddFromGallery = (e) => {
      const { imageUrl } = e.detail || {};
      if (imageUrl) {
        addImageFromGallery(imageUrl);
      }
    };

    window.addEventListener('cocreate:add-to-canvas', handleAddFromGallery);
    return () => {
      window.removeEventListener('cocreate:add-to-canvas', handleAddFromGallery);
    };
  }, [addImageFromGallery]);

  // Attacher le Transformer aux éléments sélectionnés
  useEffect(() => {
    if (transformerRef.current && selectedElements.length > 0) {
      const nodes = selectedElements
        .map(id => elementRefs.current[id])
        .filter(Boolean);
      
      if (nodes.length > 0) {
        transformerRef.current.nodes(nodes);
        transformerRef.current.getLayer()?.batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedElements, canvasElements]);

  // Gérer la sélection d'éléments
  const handleElementSelect = useCallback((elementId, isShiftKey) => {
    if (isShiftKey) {
      selectElements([elementId], true);
    } else {
      selectElements([elementId], false);
    }
  }, [selectElements]);

  // Gérer le clic sur le stage (désélection)
  const handleStageClick = useCallback((e) => {
    // Cliquer sur le stage pour désélectionner
    if (e.target === e.target.getStage()) {
      clearSelection();
    }
  }, [clearSelection]);

  // Gérer le drag des éléments
  const handleElementDragStart = useCallback(() => {
    setIsDragging(true);
  }, [setIsDragging]);

  const handleElementDragEnd = useCallback((e, elementId) => {
    setIsDragging(false);

    const newPos = {
      x: e.target.x(),
      y: e.target.y()
    };

    // Snap to grid si activé
    const snappedPos = snapToGridPosition(newPos.x, newPos.y);

    updateElement(elementId, snappedPos);
  }, [updateElement, snapToGridPosition, setIsDragging]);

  // Gérer le redimensionnement
  const handleTransformEnd = useCallback((e, elementId) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale et appliquer les nouvelles dimensions
    node.scaleX(1);
    node.scaleY(1);

    const newAttrs = {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation()
    };

    updateElement(elementId, newAttrs);
  }, [updateElement]);

  // Rendu d'un élément
  const renderElement = (element) => {
    const isSelected = selectedElements.includes(element.id);
    
    const commonProps = {
      key: element.id,
      id: element.id,
      ref: (node) => {
        if (node) {
          elementRefs.current[element.id] = node;
        }
      },
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      opacity: element.opacity ?? 1,
      visible: element.visible !== false,
      draggable: !element.locked,
      onClick: (e) => handleElementSelect(element.id, e.evt.shiftKey),
      onTap: (e) => handleElementSelect(element.id, false),
      onDragStart: handleElementDragStart,
      onDragEnd: (e) => handleElementDragEnd(e, element.id)
    };

    switch (element.type) {
      case 'image':
        return (
          <CanvasImage
            key={element.id}
            element={element}
            commonProps={commonProps}
            onTransformEnd={handleTransformEnd}
          />
        );

      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text}
            fontSize={element.fontSize || 16}
            fontFamily={element.fontFamily || 'Arial'}
            fill={element.fill || '#000000'}
            width={element.width}
            height={element.height}
            align={element.align || 'left'}
            onTransformEnd={(e) => handleTransformEnd(e, element.id)}
          />
        );

      case 'rect':
        return (
          <Rect
            {...commonProps}
            width={element.width}
            height={element.height}
            fill={element.fill || '#3b82f6'}
            stroke={element.stroke || 'transparent'}
            strokeWidth={element.strokeWidth || 0}
            cornerRadius={element.cornerRadius || 0}
            onTransformEnd={(e) => handleTransformEnd(e, element.id)}
          />
        );

      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={element.width / 2 || 50}
            fill={element.fill || '#3b82f6'}
            stroke={element.stroke || 'transparent'}
            strokeWidth={element.strokeWidth || 0}
            onTransformEnd={(e) => handleTransformEnd(e, element.id)}
          />
        );

      default:
        return null;
    }
  };

  // Filtrer les éléments par layer et visibilité
  const getVisibleElementsByLayer = (layer) => {
    if (!layerVisibility[layer]) return [];
    return getElementsByLayer(layer).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  };

  // Actions du toolbar
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    if (stageRef.current) {
      stageRef.current.scale({ x: newZoom, y: newZoom });
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.1);
    if (stageRef.current) {
      stageRef.current.scale({ x: newZoom, y: newZoom });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedElements.length > 0) {
      deleteElements(selectedElements);
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedElements.length > 0) {
      duplicateElements(selectedElements);
    }
  };

  const handleExport = () => {
    const dataURL = exportCanvas('png', 1);
    if (dataURL) {
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `canvas-export-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  return (
    <div className="image-canvas">
      {/* Toolbar */}
      <div className="canvas-toolbar">
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={handleZoomIn}
            title="Zoomer"
          >
            <ZoomIn size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={handleZoomOut}
            title="Dézoomer"
          >
            <ZoomOut size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={resetView}
            title="Réinitialiser la vue"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${gridEnabled ? 'active' : ''}`}
            onClick={() => setGridEnabled(!gridEnabled)}
            title="Afficher la grille"
          >
            <Grid size={16} />
          </button>
          <button
            className={`toolbar-btn ${snapToGrid ? 'active' : ''}`}
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Aligner sur la grille"
          >
            <Square size={16} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={handleDuplicateSelected}
            disabled={selectedElements.length === 0}
            title="Dupliquer"
          >
            <Copy size={16} />
          </button>
          <button
            className="toolbar-btn danger"
            onClick={handleDeleteSelected}
            disabled={selectedElements.length === 0}
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={handleExport}
            title="Exporter"
          >
            <Download size={16} />
          </button>
        </div>

        {/* Outils de forme */}
        <div className="toolbar-group">
          <button
            className="toolbar-btn"
            onClick={() => addShape('rect', { width: 100, height: 80, fill: '#3b82f6' })}
            title="Ajouter rectangle"
          >
            <Square size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => addShape('circle', { radius: 50, fill: '#10b981' })}
            title="Ajouter cercle"
          >
            <CircleIcon size={16} />
          </button>
          <button
            className="toolbar-btn"
            onClick={() => addText('Nouveau texte')}
            title="Ajouter texte"
          >
            <Type size={16} />
          </button>
        </div>

        {/* Layer Panel Toggle */}
        <div className="toolbar-group">
          <button
            className={`toolbar-btn ${showLayerPanel ? 'active' : ''}`}
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            title="Panneau des calques"
          >
            <Layers size={16} />
          </button>
        </div>

        <div className="toolbar-info">
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <span className="layer-indicator">
            Calque: {activeLayer === CANVAS_LAYERS.BACKGROUND ? 'Fond' : 
                    activeLayer === CANVAS_LAYERS.FOREGROUND ? 'Premier plan' : 'Principal'}
          </span>
          <span className="elements-count">
            {canvasElements.length} élément{canvasElements.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Layer Panel */}
      {showLayerPanel && (
        <div className="layer-panel">
          <div className="layer-panel-header">
            <h4>Calques</h4>
          </div>
          <div className="layer-list">
            {[
              { key: CANVAS_LAYERS.FOREGROUND, name: 'Premier plan', icon: '🔝' },
              { key: CANVAS_LAYERS.ELEMENTS, name: 'Éléments', icon: '📦' },
              { key: CANVAS_LAYERS.BACKGROUND, name: 'Arrière-plan', icon: '🖼️' }
            ].map(layer => (
              <div 
                key={layer.key}
                className={`layer-item ${activeLayer === layer.key ? 'active' : ''}`}
                onClick={() => setActiveLayer(layer.key)}
              >
                <button
                  className="layer-visibility-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayerVisibility(layer.key);
                  }}
                  title={layerVisibility[layer.key] ? 'Masquer' : 'Afficher'}
                >
                  {layerVisibility[layer.key] ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <span className="layer-icon">{layer.icon}</span>
                <span className="layer-name">{layer.name}</span>
                <span className="layer-count">
                  ({getElementsByLayer(layer.key).length})
                </span>
              </div>
            ))}
          </div>
          
          {selectedElements.length > 0 && (
            <div className="layer-actions">
              <p className="layer-actions-title">Déplacer vers:</p>
              <div className="layer-action-buttons">
                <button 
                  onClick={() => selectedElements.forEach(id => moveToLayer(id, CANVAS_LAYERS.FOREGROUND))}
                  className="layer-action-btn"
                >
                  Premier plan
                </button>
                <button 
                  onClick={() => selectedElements.forEach(id => moveToLayer(id, CANVAS_LAYERS.ELEMENTS))}
                  className="layer-action-btn"
                >
                  Éléments
                </button>
                <button 
                  onClick={() => selectedElements.forEach(id => moveToLayer(id, CANVAS_LAYERS.BACKGROUND))}
                  className="layer-action-btn"
                >
                  Arrière-plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        className={`canvas-container ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          scaleX={zoom}
          scaleY={zoom}
          x={stagePosition.x}
          y={stagePosition.y}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onTap={handleStageClick}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
        >
          {/* Grille */}
          <Layer listening={false}>
            {getGridLines().map(line => (
              <Line
                key={line.id}
                points={line.points}
                stroke="#e0e0e0"
                strokeWidth={1}
              />
            ))}
          </Layer>

          {/* Calque Arrière-plan */}
          {layerVisibility[CANVAS_LAYERS.BACKGROUND] && (
            <Layer opacity={activeLayer !== CANVAS_LAYERS.BACKGROUND ? 0.7 : 1}>
              {getVisibleElementsByLayer(CANVAS_LAYERS.BACKGROUND).map(renderElement)}
            </Layer>
          )}

          {/* Calque Éléments (principal) */}
          {layerVisibility[CANVAS_LAYERS.ELEMENTS] && (
            <Layer opacity={activeLayer !== CANVAS_LAYERS.ELEMENTS ? 0.7 : 1}>
              {getVisibleElementsByLayer(CANVAS_LAYERS.ELEMENTS).map(renderElement)}
            </Layer>
          )}

          {/* Calque Premier plan */}
          {layerVisibility[CANVAS_LAYERS.FOREGROUND] && (
            <Layer opacity={activeLayer !== CANVAS_LAYERS.FOREGROUND ? 0.7 : 1}>
              {getVisibleElementsByLayer(CANVAS_LAYERS.FOREGROUND).map(renderElement)}
            </Layer>
          )}

          {/* Transformer pour la sélection */}
          <Layer>
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Limiter la taille minimale
                if (newBox.width < 5 || newBox.height < 5) {
                  return oldBox;
                }
                return newBox;
              }}
              rotateEnabled={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            />
          </Layer>
        </Stage>

        {/* Zone de drop */}
        {dragOver && (
          <div className="drop-overlay">
            <div className="drop-message">
              <Move size={32} />
              <p>Déposez vos images ici</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      {selectedElements.length > 0 && (
        <div className="selection-actions">
          <div className="selection-info">
            <span>{selectedElements.length} élément{selectedElements.length !== 1 ? 's' : ''} sélectionné{selectedElements.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="selection-buttons">
            <button
              className="action-btn"
              onClick={() => reorderElements(selectedElements, 'forward')}
              title="Mettre au premier plan"
            >
              Premier plan
            </button>
            <button
              className="action-btn"
              onClick={() => reorderElements(selectedElements, 'backward')}
              title="Mettre en arrière-plan"
            >
              Arrière-plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;