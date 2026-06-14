import type { JSX } from 'react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import type { DisplayMode } from './TiddlerCard.js';
import { lingo } from '../utils/lingo.js';

interface TiddlerEditModalProps {
  title: string;
  onClose: () => void;
}

export function TiddlerEditModal({ title, onClose }: TiddlerEditModalProps): JSX.Element {
  const tiddler = $tw.wiki.getTiddler(title)?.fields ?? {};

  const [caption, setCaption] = useState<string>((tiddler['caption'] as string | undefined) ?? '');
  const [text,    setText]    = useState<string>((tiddler['text']    as string | undefined) ?? '');
  const [display, setDisplay] = useState<DisplayMode>(
    ((tiddler['cc-canvas-display'] as DisplayMode | undefined) ?? 'title')
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [caption, text, display]);

  function save(): void {
    $tw.wiki.addTiddler(new $tw.Tiddler(tiddler, {
      caption,
      text,
      'cc-canvas-display': display,
    }));
    onClose();
  }

  const displayOptions: Array<[DisplayMode, string]> = [
    ['title',         lingo('modal/display-title')],
    ['title-caption', lingo('modal/display-title-caption')],
    ['caption',       lingo('modal/display-caption')],
    ['text',          lingo('modal/display-text')],
  ];

  return ReactDOM.createPortal(
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>

        <h3 className="edit-modal__heading">{title}</h3>

        <label className="edit-modal__label">
          {lingo('modal/caption-label')}
          <input
            className="edit-modal__input"
            value={caption}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onChange={(e) => setCaption(e.target.value)}
          />
        </label>

        <label className="edit-modal__label">
          {lingo('modal/text-label')}
          <textarea
            className="edit-modal__textarea"
            value={text}
            rows={6}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <fieldset className="edit-modal__fieldset">
          <legend>{lingo('modal/display-label')}</legend>
          {displayOptions.map(([value, label]) => (
            <label key={value} className="edit-modal__radio">
              <input
                type="radio"
                name="display"
                value={value}
                checked={display === value}
                onChange={() => setDisplay(value)}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <div className="edit-modal__actions">
          <span className="edit-modal__hint">{lingo('modal/save-hint')}</span>
          <button onClick={onClose}>{lingo('modal/cancel')}</button>
          <button onClick={save} className="edit-modal__save">{lingo('modal/save')}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
