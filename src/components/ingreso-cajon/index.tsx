'use client'

import { useState, useEffect } from 'react'
import { 
  BoxSelect, RefreshCw, Warehouse, CheckCircle, Printer, 
  ArrowRight, Scale, Beef, History, ChevronRight, Hash,
  AlertTriangle, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

const SIGLAS = [
  { id: 'A', label: 'Asado' },
  { id: 'T', label: 'Trasero' },
  { id: 'D', label: 'Delantero' },
]

interface AnimalIngreso {
  id: string
  codigo: string
  garron: number
  tipoAnimal: string
  pesoVivo: number | null
  estado: string
  tieneRomaneo: boolean
  enCamara: boolean
  romaneoData: {
    id: string
    pesoMediaIzq: number | null
    pesoMediaDer: number | null
    pesoTotal: number | null
    rinde: number | null
    denticion: string | null
    raza: string | null
  } | null
}

interface TropaIngreso {
  tropaId: string
  tropaCodigo: string
  especie: string
  usuarioFaena: string
  animales: AnimalIngreso[]
}

interface Camara {
  id: string
  nombre: string
  tipo: string
  capacidad: number
  stockGanchos: number
}

interface HistorialItem {
  id: string
  codigo: string
  lado: string
  sigla: string
  peso: number
  estado: string
  camara: string
  garron: number
  tropaCodigo: string
  tipoAnimal: string
  fecha: string
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function IngresoCajonModule({ operador }: { operador: Operador }) {
  const [tropas, setTropas] = useState<TropaIngreso[]>([])
  const [camaras, setCamaras] = useState<Camara[]>([])
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState('pendientes')
  const [selectedTropa, setSelectedTropa] = useState<TropaIngreso | null>(null)
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalIngreso | null>(null)

  // Form state
  const [selectedCamara, setSelectedCamara] = useState<string>('')
  const [siglaIzq, setSiglaIzq] = useState('A')
  const [siglaDer, setSiglaDer] = useState('A')

  // Dialogs
  const [ingresoDialogOpen, setIngresoDialogOpen] = useState(false)
  const [detalleDialogOpen, setDetalleDialogOpen] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [mediasToPrint, setMediasToPrint] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tropasRes, camarasRes, historialRes] = await Promise.all([
        fetch('/api/ingreso-cajon'),
        fetch('/api/camaras'),
        fetch('/api/ingreso-cajon?tipo=historial')
      ])

      const tropasData = await tropasRes.json()
      const camarasData = await camarasRes.json()
      const historialData = await historialRes.json()

      if (tropasData.success) {
        setTropas(tropasData.data)
        if (tropasData.data.length > 0 && !selectedTropa) {
          setSelectedTropa(tropasData.data[0])
        }
      }

      if (camarasData.success) {
        // Filter only FAENA cameras
        const camarasFaena = camarasData.data.filter((c: Camara) => c.tipo === 'FAENA')
        setCamaras(camarasFaena)
        if (camarasFaena.length > 0) {
          setSelectedCamara(camarasFaena[0].id)
        }
      }

      if (historialData.success) {
        setHistorial(historialData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenIngresoDialog = (animal: AnimalIngreso) => {
    if (!animal.romaneoData) {
      toast.error('El animal no tiene romaneo registrado')
      return
    }
    setSelectedAnimal(animal)
    setSiglaIzq('A')
    setSiglaDer('A')
    setIngresoDialogOpen(true)
  }

  const handleConfirmarIngreso = async () => {
    if (!selectedAnimal?.romaneoData || !selectedCamara) {
      toast.error('Faltan datos para el ingreso')
      return
    }

    const camara = camaras.find(c => c.id === selectedCamara)
    if (!camara) {
      toast.error('Cámara no encontrada')
      return
    }

    // Check capacity
    const disponible = camara.capacidad - camara.stockGanchos
    if (disponible < 2) {
      toast.error(`La cámara ${camara.nombre} no tiene capacidad suficiente (${disponible} ganchos disponibles)`)
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/ingreso-cajon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          romaneoId: selectedAnimal.romaneoData.id,
          camaraId: selectedCamara,
          operadorId: operador.id,
          siglas: {
            izquierda: siglaIzq,
            derecha: siglaDer
          }
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Ingreso registrado en ${data.data.camara}`)
        setIngresoDialogOpen(false)
        setSelectedAnimal(null)
        
        // Generate print data
        const medias = data.data.medias
        if (medias && medias.length > 0) {
          setMediasToPrint(medias.map((m: any) => ({
            codigo: m.codigo,
            garron: selectedAnimal.garron,
            tropa: selectedTropa?.tropaCodigo,
            tipoAnimal: selectedAnimal.tipoAnimal,
            peso: m.peso,
            lado: m.lado,
            sigla: m.sigla,
            camara: data.data.camara
          })))
          setPrintDialogOpen(true)
        }
        
        fetchData()
      } else {
        toast.error(data.error || 'Error al registrar ingreso')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = (medias: any[]) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rótulos de Medias</title>
          <style>
            @page { size: 100mm 150mm; margin: 5mm; }
            body { font-family: Arial, sans-serif; padding: 5px; margin: 0; }
            .rotulo { 
              border: 2px solid black; 
              padding: 8px; 
              margin-bottom: 8px;
              page-break-after: always;
            }
            .header { text-align: center; border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 5px; }
            .empresa { font-size: 14px; font-weight: bold; }
            .campo { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
            .sigla { font-size: 20px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 4px; margin: 5px 0; }
            .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 20px; text-align: center; margin-top: 5px; }
            .lado { font-size: 12px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          ${medias.map(m => `
            <div class="rotulo">
              <div class="header">
                <div class="empresa">SOLEMAR ALIMENTARIA</div>
                <div style="font-size: 9px;">Media Res - Faena</div>
              </div>
              <div class="lado">${m.lado === 'IZQUIERDA' ? 'MEDIA IZQUIERDA' : 'MEDIA DERECHA'}</div>
              <div class="campo"><span>Garrón:</span><span style="font-weight: bold;">${m.garron}</span></div>
              <div class="campo"><span>Tropa:</span><span>${m.tropa || '-'}</span></div>
              <div class="campo"><span>Tipo:</span><span>${m.tipoAnimal || '-'}</span></div>
              <div class="campo"><span>Peso:</span><span style="font-weight: bold;">${m.peso?.toLocaleString()} kg</span></div>
              <div class="campo"><span>Cámara:</span><span>${m.camara}</span></div>
              <div class="sigla">${m.sigla}</div>
              <div style="text-align: center; font-size: 10px;">${SIGLAS.find(s => s.id === m.sigla)?.label || ''}</div>
              <div class="barcode">*${m.codigo}*</div>
            </div>
          `).join('')}
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const getTotalPendientes = () => {
    return tropas.reduce((acc, t) => acc + t.animales.length, 0)
  }

  const getCamaraDisponible = (camaraId: string) => {
    const camara = camaras.find(c => c.id === camaraId)
    if (!camara) return 0
    return camara.capacidad - camara.stockGanchos
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <BoxSelect className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Ingreso a Cajón</h1>
            <p className="text-stone-500">Registro de ingreso de medias reses a cámaras de faena</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Warehouse className="w-4 h-4 mr-2 text-amber-500" />
              {getTotalPendientes()} pendientes
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pendientes">Pendientes de Ingreso</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* PENDIENTES */}
          <TabsContent value="pendientes" className="space-y-6">
            {tropas.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                  <p className="text-lg text-stone-600 mb-2">No hay animales pendientes de ingreso</p>
                  <p className="text-stone-400">Todos los animales con romaneo han sido ingresados a cámara</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Lista de Tropas */}
                <Card className="border-0 shadow-md lg:col-span-1">
                  <CardHeader className="bg-stone-50 rounded-t-lg py-4">
                    <CardTitle className="text-base">Tropas con Pendientes</CardTitle>
                    <CardDescription>{tropas.length} tropas</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px]">
                      <div className="divide-y">
                        {tropas.map((tropa) => (
                          <button
                            key={tropa.tropaId}
                            onClick={() => setSelectedTropa(tropa)}
                            className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${
                              selectedTropa?.tropaId === tropa.tropaId ? 'bg-amber-50 border-l-4 border-amber-500' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold">{tropa.tropaCodigo}</span>
                              <Badge variant="outline" className="text-xs">{tropa.animales.length}</Badge>
                            </div>
                            <p className="text-sm text-stone-500">{tropa.usuarioFaena}</p>
                            <p className="text-xs text-stone-400">{tropa.especie}</p>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Main Content - Detalle de Tropa */}
                <Card className="border-0 shadow-md lg:col-span-3">
                  <CardHeader className="bg-amber-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Beef className="w-5 h-5 text-amber-600" />
                          {selectedTropa?.tropaCodigo || 'Seleccione una tropa'}
                        </CardTitle>
                        <CardDescription>
                          {selectedTropa?.usuarioFaena} • {selectedTropa?.animales.length || 0} animales
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Cámara destino:</Label>
                        <Select value={selectedCamara} onValueChange={setSelectedCamara}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Seleccionar cámara" />
                          </SelectTrigger>
                          <SelectContent>
                            {camaras.map((camara) => {
                              const disponible = camara.capacidad - camara.stockGanchos
                              return (
                                <SelectItem key={camara.id} value={camara.id} disabled={disponible < 2}>
                                  {camara.nombre} ({disponible} disp.)
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {selectedTropa ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20">Garrón</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Peso Vivo</TableHead>
                              <TableHead className="text-right">P. Total</TableHead>
                              <TableHead className="text-right">Rinde</TableHead>
                              <TableHead className="text-center">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedTropa.animales.map((animal) => (
                              <TableRow key={animal.id}>
                                <TableCell className="font-bold text-lg">{animal.garron}</TableCell>
                                <TableCell className="font-mono">{animal.codigo}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{animal.tipoAnimal}</Badge>
                                </TableCell>
                                <TableCell className="text-right">{animal.pesoVivo?.toLocaleString() || '-'} kg</TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                  {animal.romaneoData?.pesoTotal?.toLocaleString() || '-'} kg
                                </TableCell>
                                <TableCell className="text-right">{animal.romaneoData?.rinde?.toFixed(1) || '-'}%</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAnimal(animal)
                                        setDetalleDialogOpen(true)
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleOpenIngresoDialog(animal)}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <ArrowRight className="w-4 h-4 mr-1" />
                                      Ingresar
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-stone-400">
                        <ChevronRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Seleccione una tropa para ver los animales</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="historial">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historial de Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {historial.length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay ingresos registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Garrón</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Lado</TableHead>
                        <TableHead>Sigla</TableHead>
                        <TableHead className="text-right">Peso</TableHead>
                        <TableHead>Cámara</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historial.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{new Date(item.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                          <TableCell className="font-bold">{item.garron}</TableCell>
                          <TableCell className="font-mono">{item.tropaCodigo}</TableCell>
                          <TableCell>
                            <Badge variant={item.lado === 'IZQUIERDA' ? 'default' : 'secondary'}>
                              {item.lado === 'IZQUIERDA' ? 'Izq' : 'Der'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.sigla}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold">{item.peso?.toLocaleString()} kg</TableCell>
                          <TableCell>{item.camara}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Ingreso */}
        <Dialog open={ingresoDialogOpen} onOpenChange={setIngresoDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-amber-500" />
                Confirmar Ingreso a Cámara
              </DialogTitle>
              <DialogDescription>
                Revise los datos y confirme el ingreso
              </DialogDescription>
            </DialogHeader>
            
            {selectedAnimal && (
              <div className="space-y-4 py-4">
                {/* Datos del animal */}
                <div className="p-4 bg-stone-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-stone-500">Garrón</span>
                      <p className="text-xl font-bold">{selectedAnimal.garron}</p>
                    </div>
                    <div>
                      <span className="text-stone-500">Código</span>
                      <p className="font-mono">{selectedAnimal.codigo}</p>
                    </div>
                    <div>
                      <span className="text-stone-500">Tipo</span>
                      <p className="font-medium">{selectedAnimal.tipoAnimal}</p>
                    </div>
                    <div>
                      <span className="text-stone-500">Tropa</span>
                      <p className="font-mono">{selectedTropa?.tropaCodigo}</p>
                    </div>
                  </div>
                </div>

                {/* Pesos */}
                {selectedAnimal.romaneoData && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <span className="text-xs text-blue-600">Media Izquierda</span>
                      <p className="text-xl font-bold text-blue-700">
                        {selectedAnimal.romaneoData.pesoMediaIzq?.toLocaleString() || '-'} kg
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <span className="text-xs text-purple-600">Media Derecha</span>
                      <p className="text-xl font-bold text-purple-700">
                        {selectedAnimal.romaneoData.pesoMediaDer?.toLocaleString() || '-'} kg
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Cámara destino */}
                <div className="space-y-2">
                  <Label>Cámara Destino</Label>
                  <Select value={selectedCamara} onValueChange={setSelectedCamara}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cámara" />
                    </SelectTrigger>
                    <SelectContent>
                      {camaras.map((camara) => {
                        const disponible = camara.capacidad - camara.stockGanchos
                        return (
                          <SelectItem key={camara.id} value={camara.id} disabled={disponible < 2}>
                            {camara.nombre} ({disponible} ganchos disponibles)
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Siglas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sigla Media Izquierda</Label>
                    <Select value={siglaIzq} onValueChange={setSiglaIzq}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGLAS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.id} - {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sigla Media Derecha</Label>
                    <Select value={siglaDer} onValueChange={setSiglaDer}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SIGLAS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.id} - {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Capacidad warning */}
                {getCamaraDisponible(selectedCamara) < 2 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Capacidad insuficiente</p>
                      <p className="text-xs text-red-600">
                        La cámara seleccionada no tiene suficiente capacidad
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIngresoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarIngreso}
                disabled={saving || !selectedCamara || getCamaraDisponible(selectedCamara) < 2}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Guardando...' : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Ingreso
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalle */}
        <Dialog open={detalleDialogOpen} onOpenChange={setDetalleDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalle del Animal
              </DialogTitle>
            </DialogHeader>
            
            {selectedAnimal && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-stone-50 rounded-lg">
                    <span className="text-xs text-stone-500">Garrón</span>
                    <p className="text-2xl font-bold">{selectedAnimal.garron}</p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg">
                    <span className="text-xs text-stone-500">Código</span>
                    <p className="font-mono">{selectedAnimal.codigo}</p>
                  </div>
                </div>

                {selectedAnimal.romaneoData && (
                  <>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <span className="text-xs text-green-600">P. Izquierda</span>
                          <p className="text-xl font-bold text-green-700">
                            {selectedAnimal.romaneoData.pesoMediaIzq?.toLocaleString() || '-'} kg
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-green-600">P. Derecha</span>
                          <p className="text-xl font-bold text-green-700">
                            {selectedAnimal.romaneoData.pesoMediaDer?.toLocaleString() || '-'} kg
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-green-600">Total</span>
                          <p className="text-xl font-bold text-green-700">
                            {selectedAnimal.romaneoData.pesoTotal?.toLocaleString() || '-'} kg
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-stone-50 rounded-lg">
                        <span className="text-xs text-stone-500">Rinde</span>
                        <p className="text-lg font-bold">{selectedAnimal.romaneoData.rinde?.toFixed(1) || '-'}%</p>
                      </div>
                      <div className="p-3 bg-stone-50 rounded-lg">
                        <span className="text-xs text-stone-500">Dentición</span>
                        <p className="text-lg font-bold">{selectedAnimal.romaneoData.denticion || '-'} dientes</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetalleDialogOpen(false)}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setDetalleDialogOpen(false)
                  handleOpenIngresoDialog(selectedAnimal!)
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Ingresar a Cámara
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Impresión */}
        <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Rótulos Generados
              </DialogTitle>
              <DialogDescription>
                Se generaron {mediasToPrint.length} rótulos. ¿Desea imprimirlos?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {mediasToPrint.map((m, i) => (
                  <div key={i} className="p-2 bg-stone-50 rounded flex items-center justify-between">
                    <div>
                      <p className="font-bold">{m.codigo}</p>
                      <p className="text-xs text-stone-500">
                        {m.lado === 'IZQUIERDA' ? 'Izquierda' : 'Derecha'} - {m.sigla}
                      </p>
                    </div>
                    <Badge variant="outline">{m.peso?.toLocaleString()} kg</Badge>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
                Omitir
              </Button>
              <Button onClick={() => handlePrint(mediasToPrint)} className="bg-amber-500 hover:bg-amber-600">
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Rótulos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default IngresoCajonModule
