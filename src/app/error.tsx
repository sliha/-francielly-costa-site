'use client';
import { useEffect } from 'react';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      window.location.reload();
    }
  }, [error]);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', padding:'2rem' }}>
      <h2>A página precisa de ser atualizada</h2>
      <button onClick={() => window.location.reload()} style={{ marginTop:'1rem', padding:'0.75rem 2rem', background:'#b5838d', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'1rem' }}>Recarregar</button>
    </div>
  );
}
