import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(req: NextRequest) {
  try {
    const { nome, email, telefone } = await req.json()

    if (!nome || !email || !telefone) {
      return NextResponse.json(
        { error: 'nome, email e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Base de dados não configurada' },
        { status: 503 }
      )
    }

    await addDoc(collection(db, 'fiberbrows-waitlist'), {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone: telefone.trim(),
      criadoEm: serverTimestamp(),
      contactada: false,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Erro ao guardar waitlist:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
