'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

/** Mapa serviceId → preço (string) a partir de settings/servicos no Supabase */
export function useServicosPrecos(): Record<string, string> {
  const [precos, setPrecos] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'servicos')
      .maybeSingle()
      .then(({ data }) => {
        const lista = (data?.value as { lista?: Array<{ id?: string; preco?: string }> } | null)?.lista
        if (!Array.isArray(lista)) return
        const map: Record<string, string> = {}
        for (const s of lista) {
          if (s.id && s.preco) map[s.id] = s.preco
        }
        setPrecos(map)
      })
  }, [])

  return precos
}
