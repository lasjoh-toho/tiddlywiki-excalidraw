import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface TiddlerEditModalProps {
  title: string;
  onClose: () => void;
}

export function TiddlerEditModal({ title, onClose }: TiddlerEditModalProps): JSX.Element {
  const tiddler = $tw.wiki.getTiddler(title)?.fields ?? {};
  const [synopsis, setSynopsis] = useState<string>((tiddler['synopsis'] as string | undefined) ?? '');

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function save(): void {
    $tw.wiki.addTiddler(
      new $tw.Tiddler(tiddler, { synopsis }),
    );
    onClose();
  }

  return ReactDOM.createPortal(
    <div
      className="tw-exc-modal-overlay"
      onClick={onClose}
    >
      <div
        className="tw-exc-modal tw-exc-modal--edit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw-exc-modal__header">
          <h3 className="tw-exc-modal__title">{title}</h3>
          <button
            className="tw-exc-modal__btn-close"
            onClick={onClose}
            title="Abbrechen (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="tw-exc-modal__body tw-exc-modal__body--edit">
          <label className="tw-exc-edit__label">
            Synopsis
            <span className="tw-exc-edit__hint">Kurze Zusammenfassung – wird auf der Canvas-Karte angezeigt</span>
            <textarea
              className="tw-exc-edit__textarea"
              value={synopsis}
              rows={4}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onChange={(e) => setSynopsis(e.target.value)}
              onKeyDown={(e) => {
                // Ctrl+Enter or Cmd+Enter saves
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
              }}
            />
          </label>
          <p className="tw-exc-edit__hint-key">Ctrl+Enter zum Speichern</p>
        </div>

        <div className="tw-exc-modal__footer">
          <button className="tw-exc-modal__btn-cancel" onClick={onClose}>Abbrechen</button>
          <button className="tw-exc-modal__btn-save" onClick={save}>Speichern</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
