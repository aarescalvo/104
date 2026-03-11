'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  BoxSelect, RefreshCw, Link2, Hash, Search, ScanLine,
  CheckCircle, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface AnimalLista {
  id: string
  codigo: string
  tropaCodigo: string
  tipoAnimal: string
  pesoVivo: number | null
  numero: number
  garronAsignado: number | null
}

interface GarronAsignado {
  garron: number
  animalId: string | null
  animalCodigo: string | null
  tropaCodigo: string | null
  tipoAnimal: string | null
  pesoVivo: number | null
  completado: boolean
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function IngresoCajonModule({ operador }: { operador: Operador }) {
  // Datos
  const [animalesLista, setAnimalesLista] = useState<AnimalLista[]>([])
  const [garronesAsignados, setGarronesAsignados] = useState<GarronAsignado[]>([])
  
  // Estado
  const [proximoGarron, setProximoGarron] = useState(1)
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [inputManual, setInputManual] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  
  // UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Obtener animales de la lista de faena del día
      const listaRes = await fetch('/api/lista-faena/animales-hoy')
      const listaData = await listaRes.json()
      
      // Obtener garrones ya asignados
      const garronesRes = await fetch('/api/garrones-asignados')
      const garronesData = await garronesRes.json()
      
      if (listaData.success) {
        setAnimalesLista(listaData.data)
      }
      
      if (garronesData.success) {
        setGarronesAsignados(garronesData.data)
        
        // Calcular próximo garrón disponible
        const garronesUsados = garronesData.data.map((g: GarronAsignado) => g.garron)
        const maxGarron = garronesUsados.length > 0 ? Math.max(...garronesUsados) : 0
        setProximoGarron(maxGarron + 1)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAsignarGarron = async (animalId: string | null, garronManual?: number) => {
    const garron = garronManual || proximoGarron
    
    setSaving(true)
    try {
      const res = await fetch('/api/garrones-asignados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          garron,
          animalId,
          operadorId: operador.id
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Garrón ${garron} asignado correctamente`)
        fetchData()
        setSelectedAnimalId(null)
        setInputManual('')
        setCodigoBarras('')
      } else {
        toast.error(data.error || 'Error al asignar garrón')
      }
      
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleAsignarGarronCero = () => {
    // Asignar garrón sin animal identificado
    handleAsignarGarron(null)
  }

  const handleLeerCodigo = useCallback(() => {
    if (!codigoBarras.trim()) {
      toast.error('Ingrese un código de animal')
      return
    }
    
    // Buscar animal por código
    const animal = animalesLista.find(a => 
      a.codigo.toLowerCase().includes(codigoBarras.toLowerCase()) ||
      a.codigo.toLowerCase() === codigoBarras.toLowerCase()
    )
    
    if (animal) {
      setSelectedAnimalId(animal.id)
      toast.success(`Animal encontrado: ${animal.codigo}`)
    } else {
      toast.error('Animal no encontrado en la lista de faena')
    }
  }, [codigoBarras, animalesLista])

  const getAnimalesPendientes = () => {
    return animalesLista.filter(a => !a.garronAsignado)
  }

  const getAnimalSeleccionado = () => {
    return animalesLista.find(a => a.id === selectedAnimalId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <BoxSelect className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Ingreso a Cajón</h1>
            <p className="text-stone-500">Asignación de garrones a animales de faena</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              Próximo garrón: <span className="font-bold text-amber-600 ml-1">#{proximoGarron}</span>
            </Badge>
          </div>
        </div>

        {/* Resumen */}
        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-600" />
                <strong>Lista de Faena:</strong> {animalesLista.length} animales
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Asignados: {garronesAsignados.filter(g => g.animalId).length}
              </span>
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Sin identificar: {garronesAsignados.filter(g => !g.animalId).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Panel izquierdo - Garrones */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-stone-50 py-3">
              <CardTitle className="text-base">Garrones Asignados ({garronesAsignados.length})</CardTitle>
              <CardDescription>
                Últimos garrones asignados hoy
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {garronesAsignados.length === 0 ? (
                  <div className="p-4 text-center text-stone-400">
                    <BoxSelect className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay garrones asignados</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {garronesAsignados.map((g) => (
                      <div 
                        key={g.garron}
                        className={`p-3 flex items-center justify-between ${
                          !g.animalId ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-amber-600 w-12">#{g.garron}</span>
                          {g.animalId ? (
                            <div>
                              <p className="font-medium">{g.animalCodigo}</p>
                              <p className="text-xs text-stone-500">{g.tropaCodigo} • {g.tipoAnimal}</p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              Sin identificar
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {g.completado ? (
                            <Badge className="bg-green-100 text-green-700">Completado</Badge>
                          ) : (
                            <span className="text-sm text-stone-500">
                              {g.pesoVivo?.toFixed(0) || '-'} kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Panel derecho - Asignación */}
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-amber-50 py-3">
              <CardTitle className="text-base">Asignación de Garrón</CardTitle>
              <CardDescription>
                Seleccione un animal o asigne sin identificar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Número de garrón */}
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setProximoGarron(Math.max(1, proximoGarron - 1))}>
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <div className="text-center">
                  <Label className="text-sm">Garrón</Label>
                  <div className="text-4xl font-bold text-amber-600">#{proximoGarron}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setProximoGarron(proximoGarron + 1)}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              <Separator />

              {/* Búsqueda de animal */}
              <div className="space-y-2">
                <Label>Código de Animal</Label>
                <div className="flex gap-2">
                  <Input
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    placeholder="Escanear o ingresar código..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleLeerCodigo()}
                  />
                  <Button onClick={handleLeerCodigo}>
                    <ScanLine className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Animal seleccionado */}
              {selectedAnimalId && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-600 font-medium">Animal seleccionado</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedAnimalId(null)}
                    >
                      Cambiar
                    </Button>
                  </div>
                  {(() => {
                    const animal = getAnimalSeleccionado()
                    return animal ? (
                      <div className="space-y-1">
                        <p className="font-bold text-lg">{animal.codigo}</p>
                        <p className="text-sm text-stone-600">{animal.tropaCodigo} • {animal.tipoAnimal}</p>
                        <p className="text-sm">Peso vivo: <strong>{animal.pesoVivo?.toFixed(0) || '-'} kg</strong></p>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              <Separator />

              {/* Animales pendientes */}
              <div className="space-y-2">
                <Label>Animales Pendientes ({getAnimalesPendientes().length})</Label>
                <ScrollArea className="h-48 border rounded-lg">
                  {getAnimalesPendientes().length === 0 ? (
                    <div className="p-4 text-center text-stone-400">
                      No hay animales pendientes
                    </div>
                  ) : (
                    <div className="divide-y">
                      {getAnimalesPendientes().slice(0, 20).map((animal) => (
                        <button
                          key={animal.id}
                          onClick={() => setSelectedAnimalId(animal.id)}
                          className={`w-full p-2 text-left hover:bg-stone-50 transition-colors ${
                            selectedAnimalId === animal.id ? 'bg-amber-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{animal.codigo}</span>
                              <span className="text-xs text-stone-500 ml-2">{animal.tropaCodigo}</span>
                            </div>
                            <Badge variant="outline">{animal.tipoAnimal}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <Separator />

              {/* Botones de acción */}
              <div className="space-y-2">
                <Button
                  onClick={() => selectedAnimalId && handleAsignarGarron(selectedAnimalId)}
                  disabled={saving || !selectedAnimalId}
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                >
                  <Link2 className="w-5 h-5 mr-2" />
                  ASIGNAR GARRÓN #{proximoGarron}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleAsignarGarronCero}
                  disabled={saving}
                  className="w-full h-12"
                >
                  <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                  ASIGNAR SIN IDENTIFICAR
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default IngresoCajonModule
