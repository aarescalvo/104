import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Close lista de faena
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listaFaenaId, supervisorId } = body

    if (!listaFaenaId) {
      return NextResponse.json(
        { success: false, error: 'ID de lista requerido' },
        { status: 400 }
      )
    }

    // Update lista
    const lista = await db.listaFaena.update({
      where: { id: listaFaenaId },
      data: {
        estado: 'CERRADA',
        supervisorId,
        fechaCierre: new Date()
      },
      include: {
        tropas: {
          include: { tropa: true }
        }
      }
    })

    // Update tropas status
    for (const lt of lista.tropas) {
      await db.tropa.update({
        where: { id: lt.tropaId },
        data: { estado: 'EN_FAENA' }
      })
    }

    return NextResponse.json({ success: true, data: lista })
  } catch (error) {
    console.error('Error closing lista:', error)
    return NextResponse.json(
      { success: false, error: 'Error al cerrar lista' },
      { status: 500 }
    )
  }
}
