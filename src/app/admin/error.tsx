'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Algo correu mal</h2>
      <p>A página será atualizada automaticamente.</p>
      <button onClick={() => window.location.reload()}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
        Recarregar página
      </button>
    </div>
  );
}
