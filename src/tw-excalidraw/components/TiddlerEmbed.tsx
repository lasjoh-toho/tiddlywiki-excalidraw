import type { JSX } from 'react';
import { useState } from 'react';
import { TiddlerCard } from './TiddlerCard.js';
import { TiddlerEditModal } from './TiddlerEditModal.js';
import { TiddlerViewModal } from './TiddlerViewModal.js';

type ModalState = 'none' | 'view' | 'edit';

export function TiddlerEmbed({ title }: { title: string }): JSX.Element {
  const [modal, setModal] = useState<ModalState>('none');

  return (
    <>
      <TiddlerCard
        title={title}
        onClick={() => setModal('view')}
        onDoubleClick={() => setModal('edit')}
      />

      {modal === 'view' && (
        <TiddlerViewModal
          title={title}
          onClose={() => setModal('none')}
          onEdit={() => setModal('edit')}
        />
      )}

      {modal === 'edit' && (
        <TiddlerEditModal
          title={title}
          onClose={() => setModal('none')}
        />
      )}
    </>
  );
}
