import type { JSX } from 'react';
import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Transclude } from './Transclude.js';

interface TiddlerViewModalProps {
  title: string;
  onClose: () => void;
  onEdit: () => void;
}

export function TiddlerViewModal({ title, onClose, onEdit }: TiddlerViewModalProps): JSX.Element {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="tw-exc-modal-overlay"
      onClick={onClose}
    >
      <div
        className="tw-exc-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw-exc-modal__header">
          <h3 className="tw-exc-modal__title">{title}</h3>
          <div className="tw-exc-modal__header-actions">
            <button
              className="tw-exc-modal__btn-edit"
              onClick={onEdit}
              title="Synopsis bearbeiten"
            >
              ✏️
            </button>
            <button
              className="tw-exc-modal__btn-close"
              onClick={onClose}
              title="Schließen (Esc)"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="tw-exc-modal__body">
          <Transclude title={title} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
