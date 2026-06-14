import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { IProps } from './App.js';
import { App } from './App.js';
import type { IDefaultWidgetProps } from '$:/plugins/linonetwo/tw-react/index.js';
import { lingo } from '../utils/lingo.js';
import { TiddlerEditModal } from './TiddlerEditModal.js';
import { TiddlerViewModal } from './TiddlerViewModal.js';

type ModalState =
  | { type: 'none' }
  | { type: 'view'; title: string }
  | { type: 'edit'; title: string };

/**
 * Extracts a tiddler title from a {{title}} transclusion link.
 */
function matchTransclusion(link: string): string | undefined {
  return link.match(/^{{(.+)}}$/)?.[1];
}

export function InlineBoard(props: IProps & IDefaultWidgetProps): JSX.Element {
  const [fullscreen, setFullscreen] = useState(false);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Escape closes fullscreen (only when no modal is open)
  useEffect(() => {
    if (!fullscreen) return;
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape' && modal.type === 'none') setFullscreen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [fullscreen, modal]);

  // Intercept Excalidraw's native link open → show our modal instead
  function handleLinkOpen(element: { link?: string | null }, event: Event): boolean | void {
    const link = element.link;
    if (!link) return;
    const title = matchTransclusion(link);
    if (title) {
      event.preventDefault();
      setModal({ type: 'view', title });
      return true; // suppress Excalidraw default handling
    }
  }

  if (fullscreen) {
    return (
      <div
        ref={overlayRef}
        className="inline-board__overlay"
        onClick={(e) => {
          if (e.target === overlayRef.current) setFullscreen(false);
        }}
      >
        <div className="inline-board__fullscreen">
          {/* Our close button replaces Excalidraw native UI */}
          <button
            className="inline-board__close-btn"
            onClick={() => setFullscreen(false)}
            title={lingo('modal/close')}
          >
            ✕
          </button>

          {/* Canvas in zenMode: removes toolbar.
              CSS in widget.css hides hyperlinkContainer. */}
          <div className="inline-board__canvas-wrap">
            <App
              {...props}
              width="100%"
              height="100%"
              viewMode={undefined}
              zenMode="yes"
              onLinkOpenOverride={handleLinkOpen}
            />
          </div>

          {/* Our own modals */}
          {modal.type === 'view' && (
            <TiddlerViewModal
              title={modal.title}
              onClose={() => setModal({ type: 'none' })}
              onEdit={() => setModal({ type: 'edit', title: modal.title })}
            />
          )}
          {modal.type === 'edit' && (
            <TiddlerEditModal
              title={modal.title}
              onClose={() => setModal({ type: 'none' })}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="inline-board__preview"
      onClick={() => setFullscreen(true)}
      title={lingo('board/open-hint')}
    >
      <div className="inline-board__preview-inner" style={{ pointerEvents: 'none' }}>
        <App {...props} viewMode="yes" />
      </div>
      <div className="inline-board__preview-hint">
        <span>{lingo('board/open-hint')}</span>
      </div>
    </div>
  );
}
