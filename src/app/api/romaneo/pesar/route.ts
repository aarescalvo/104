import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST - Registrar pesaje de media res
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      garron, 
      lado, 
      peso, 
      siglas, 
      denticion, 
      tipificadorId, 
      camaraId, 
      operadorId
    } = body

    if (!garron || !lado || !peso || !camaraId) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Buscar o crear romaneo para este garrón
    let romaneo = await db.romaneo.findFirst({
      where: { garron },
      include: { mediasRes: true }
    })

    if (!romaneo) {
      // Buscar datos del animal asignado a este garrón
      const asignacion = await db.asignacionGarron.findFirst({
        where: { garron },
        include: {
          animal: {
            include: {
              tropa: true,
              pesajeIndividual: true
            }
          }
        }
      })

      const animal = asignacion?.animal
      
      romaneo = await db.romaneo.create({
        data: {
          garron,
          tropaCodigo: animal?.tropa?.codigo || null,
          numeroAnimal: animal?.numero || null,
          tipoAnimal: animal?.tipoAnimal || null,
          pesoVivo: animal?.pesoVivo || animal?.pesajeIndividual?.peso || null,
          raza: animal?.raza || null,
          denticion: denticion || null,
          tipificadorId: tipificadorId || null,
          operadorId: operadorId || null,
          estado: 'PENDIENTE'
        },
        include: { mediasRes: true }
      })
    }

    // Actualizar dentición si se proporciona
    if (denticion) {
      await db.romaneo.update({
        where: { id: romaneo.id },
        data: { denticion, tipificadorId }
      })
    }

    // Verificar si ya existe esta media
    const mediaExistente = await db.mediaRes.findFirst({
      where: {
        romaneoId: romaneo.id,
        lado: lado as 'IZQUIERDA' | 'DERECHA'
      }
    })

    if (mediaExistente) {
      return NextResponse.json(
        { success: false, error: `Ya existe media ${lado.toLowerCase()} para este garrón` },
        { status: 400 }
      )
    }

    // Generar código para la media
    const fecha = new Date()
    const codigoBase = `${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${garron.toString().padStart(4, '0')}-${lado.charAt(0)}`

    // Crear la media res con código único
    const mediaRes = await db.mediaRes.create({
      data: {
        romaneoId: romaneo.id,
        lado: lado as 'IZQUIERDA' | 'DERECHA',
        sigla: 'A', // Por defecto A (se usa para identificar)
        peso,
        codigo: `${codigoBase}-A`,
        estado: 'EN_CAMARA',
        camaraId
      }
    })

    // Actualizar stock de la cámara
    const stockExistente = await db.stockMediaRes.findFirst({
      where: {
        camaraId,
        tropaCodigo: romaneo.tropaCodigo || 'SIN-TROPA'
      }
    })

    if (stockExistente) {
      await db.stockMediaRes.update({
        where: { id: stockExistente.id },
        data: {
          cantidad: { increment: 1 },
          pesoTotal: { increment: peso }
        }
      })
    } else {
      await db.stockMediaRes.create({
        data: {
          camaraId,
          tropaCodigo: romaneo.tropaCodigo || 'SIN-TROPA',
          especie: 'BOVINO',
          cantidad: 1,
          pesoTotal: peso
        }
      })
    }

    // Registrar movimiento de cámara
    await db.movimientoCamara.create({
      data: {
        camaraDestinoId: camaraId,
        producto: 'Media Res',
        cantidad: 1,
        peso,
        tropaCodigo: romaneo.tropaCodigo,
        garron,
        operadorId,
        observaciones: `Ingreso garrón ${garron} - ${lado}`
      }
    })

    // Actualizar asignación del garrón si existe
    if (lado === 'DERECHA') {
      await db.asignacionGarron.updateMany({
        where: { garron },
        data: { tieneMediaDer: true }
      })
    } else {
      await db.asignacionGarron.updateMany({
        where: { garron },
        data: { tieneMediaIzq: true }
      })
    }

    // Verificar si ya tiene ambas medias para calcular totales
    const todasLasMedias = await db.mediaRes.findMany({
      where: { romaneoId: romaneo.id }
    })

    // Si tiene ambas medias, actualizar romaneo con totales y rinde
    if (todasLasMedias.length === 2) {
      const mediaIzq = todasLasMedias.find(m => m.lado === 'IZQUIERDA')
      const mediaDer = todasLasMedias.find(m => m.lado === 'DERECHA')
      
      if (mediaIzq && mediaDer) {
        const pesoTotal = mediaIzq.peso + mediaDer.peso
        const rinde = romaneo.pesoVivo ? (pesoTotal / romaneo.pesoVivo) * 100 : null

        await db.romaneo.update({
          where: { id: romaneo.id },
          data: {
            pesoMediaIzq: mediaIzq.peso,
            pesoMediaDer: mediaDer.peso,
            pesoTotal,
            rinde,
            estado: 'CONFIRMADO'
          }
        })

        // Marcar asignación como completada
        await db.asignacionGarron.updateMany({
          where: { garron },
          data: { completado: true }
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: mediaRes.id,
        garron,
        lado,
        peso,
        siglas
      }
    })

  } catch (error) {
    console.error('Error en pesaje:', error)
    return NextResponse.json(
      { success: false, error: 'Error al registrar pesaje' },
      { status: 500 }
    )
  }
}
