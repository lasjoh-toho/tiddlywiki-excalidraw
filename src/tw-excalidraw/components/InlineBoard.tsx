import type { JSX } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { IProps } from './App.js';
import { App } from './App.js';
import type { IDefaultWidgetProps } from '$:/plugins/linonetwo/tw-react/index.js';
import { lingo } from '../utils/lingo.js';

export function InlineBoard(props: IProps & IDefaultWidgetProps): JSX.Element {
  const [fullscreen, setFullscreen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fullscreen) return;
    function handleKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setFullscreen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

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
          <button
            className="inline-board__close-btn"
            onClick={() => setFullscreen(false)}
            title={lingo('modal/close')}
          >
            ✕
          </button>
          <App {...props} width="100%" height="100%" viewMode={undefined} />
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
