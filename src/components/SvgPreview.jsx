import React from 'react';
import { downloadSvg, openSvgInNewTab, svgToDataUrl } from '../utils/svgArtifacts';

const SvgPreview = ({ svg, title }) => {
  const dataUrl = svgToDataUrl(svg);

  return (
    <div className="svg-preview">
      <div className="svg-preview-toolbar">
        <div className="svg-preview-title">{title || 'SVG'}</div>
        <div className="svg-preview-actions">
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => openSvgInNewTab(svg, title || 'SVG Preview')}
          >
            Ouvrir
          </button>
          <button
            className="btn btn-outline btn-sm"
            type="button"
            onClick={() => downloadSvg(svg, `${(title || 'artifact').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.svg`)}
          >
            Télécharger
          </button>
        </div>
      </div>

      <div className="svg-preview-canvas">
        <img className="svg-preview-image" src={dataUrl} alt={title || 'svg'} />
      </div>
    </div>
  );
};

export default SvgPreview;
