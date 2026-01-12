import React from 'react';
import DebateReviewPanel from './DebateReviewPanel';

export default function DebateReviewModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="debate-modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target.classList.contains('debate-modal-overlay')) onClose?.();
      }}
    >
      <div className="debate-modal debate-review-modal">
        <DebateReviewPanel onClose={onClose} />
      </div>
    </div>
  );
}
