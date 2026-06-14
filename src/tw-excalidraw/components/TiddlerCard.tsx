import type { JSX } from 'react';

export type DisplayMode = 'title' | 'title-caption' | 'caption' | 'text';

interface TiddlerCardProps {
  title: string;
  onClick: () => void;
  onDoubleClick: () => void;
}

function getBorderColor(fields: Record<string, unknown>): string {
  const type = fields['cc-type'] as string | undefined;
  const side = fields['cc-discussion-side'] as string | undefined;

  if (type === 'discussion') {
    return side === 'pro' ? '#2E7D32' : side === 'contra' ? '#C62828' : '#555555';
  }
  const map: Record<string, string> = {
    question: '#2E6DA4',
    comment:  '#555555',
    answer:   '#6A1B9A',
  };
  return map[type ?? ''] ?? '#2E6DA4';
}

export function TiddlerCard({ title, onClick, onDoubleClick }: TiddlerCardProps): JSX.Element {
  const fields = $tw.wiki.getTiddler(title)?.fields ?? {};
  const display = (fields['cc-canvas-display'] as DisplayMode | undefined) ?? 'title';
  const caption = (fields['caption'] as string | undefined) ?? '';
  const text    = (fields['text']    as string | undefined) ?? '';
  const borderColor = getBorderColor(fields as Record<string, unknown>);

  return (
    <div
      className="tiddler-card"
      style={{ borderLeft: `4px solid ${borderColor}` }}
      onClick={onClick}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(); }}
      title="Klick: Details · Doppelklick: Bearbeiten"
    >
      {(display === 'title' || display === 'title-caption') && (
        <div className="tiddler-card__title">{title}</div>
      )}
      {(display === 'title-caption' || display === 'caption') && caption && (
        <div className="tiddler-card__caption">{caption}</div>
      )}
      {display === 'caption' && !caption && (
        <div className="tiddler-card__caption tiddler-card__caption--empty">Keine Caption</div>
      )}
      {display === 'text' && (
        <div className="tiddler-card__text">{text || <em style={{ opacity: 0.4 }}>Kein Text</em>}</div>
      )}
    </div>
  );
}
