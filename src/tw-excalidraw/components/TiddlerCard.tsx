import type { JSX } from 'react';

interface TiddlerCardProps {
  title: string;
  onClick: () => void;
  onDoubleClick: () => void;
}

export function TiddlerCard({ title, onClick, onDoubleClick }: TiddlerCardProps): JSX.Element {
  const fields = $tw.wiki.getTiddler(title)?.fields ?? {};
  const synopsis = (fields['synopsis'] as string | undefined) ?? '';

  return (
    <div
      className="tw-exc-card"
      onClick={onClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick();
      }}
      title="Klick: Volltext anzeigen · Doppelklick: Synopsis bearbeiten"
    >
      <div className="tw-exc-card__title">{title}</div>
      {synopsis
        ? <div className="tw-exc-card__synopsis">{synopsis}</div>
        : <div className="tw-exc-card__synopsis tw-exc-card__synopsis--empty">Keine Synopsis</div>
      }
    </div>
  );
}
