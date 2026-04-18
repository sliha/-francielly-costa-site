'use client'
import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, getDoc } from 'firebase/firestore'

/** Returns a map of serviceId → preco string from Firestore settings/servicos */
export function useServicosPrecos(): Record<string, string> {
  const [precos, setPrecos] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!db) return
    getDoc(doc(db, 'settings', 'servicos')).then((snap) => {
      if (!snap.exists()) return
      const lista = snap.data().lista
      if (!Array.isArray(lista)) return
      const map: Record<string, string> = {}
      for (const s of lista) {
        if (s.id && s.preco) map[s.id] = s.preco
      }
      setPrecos(map)
    }).catch(() => {})
  }, [])

  return precos
}
