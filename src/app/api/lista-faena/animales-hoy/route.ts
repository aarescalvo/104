import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Obtener animales de la lista de faena del día
export async function GET(request: NextRequest) {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Buscar lista de faena abierta de hoy
    const listaFaena = await db.listaFaena.findFirst({
      where: {
        fecha: {
          gte: hoy,
          lt: new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
        },
        estado: { in: ['ABIERTA', 'EN_PROCESO'] }
      },
      include: {
        tropas: {
          include: {
            tropa: {
              include: {
                animales: {
                  include: {
                    pesajeIndividual: true,
                    asignacionGarron: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!listaFaena) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Obtener todos los animales de las tropas en la lista
    const animales: Array<{
      id: string
      codigo: string
      tropaCodigo: string | null
      tipoAnimal: string | null
      pesoVivo: number | null
      numero: number
      garronAsignado: number | null
    }> = []

    for (const lt of listaFaena.tropas) {
      const tropa = lt.tropa
      for (const animal of tropa.animales) {
        animales.push({
          id: animal.id,
          codigo: animal.codigo,
          tropaCodigo: tropa.codigo,
          tipoAnimal: animal.tipoAnimal?.toString() || null,
          pesoVivo: animal.pesoVivo || animal.pesajeIndividual?.peso || null,
          numero: animal.numero,
          garronAsignado: animal.asignacionGarron?.garron || null
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: animales
    })

  } catch (error) {
    console.error('Error obteniendo animales de lista de faena:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener animales' },
      { status: 500 }
    )
  }
}
