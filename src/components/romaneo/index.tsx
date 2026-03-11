'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, Scale, Printer, Save, Eye, CheckCircle, 
  Beef, Award, Mail, Lock, RefreshCw, AlertTriangle
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
import { toast } from 'sonner'

const SIGLAS = [
  { id: 'A', label: 'Asado' },
  { id: 'T', label: 'Trasero' },
  { id: 'D', label: 'Delantero' },
]

const DENTICIONES = ['0', '2', '4', '6', '8']

interface Tipificador {
  id: string
  nombre: string
  apellido: string
  matricula: string
}

interface RomaneoItem {
  id: string
  garron: number
  tropaCodigo?: string
  numeroAnimal?: number
  tipoAnimal?: string
  raza?: string
  pesoVivo?: number
  denticion?: string
  tipificadorId?: string
  tipificador?: Tipificador
  pesoMediaIzq?: number
  pesoMediaDer?: number
  pesoTotal?: number
  rinde?: number
  estado: string
  fecha: string
}

interface Operador {
  id: string
  nombre: string
  nivel: string
}

export function RomaneoModule({ operador }: { operador: Operador }) {
  const [romaneos, setRomaneos] = useState<RomaneoItem[]>([])
  const [tipificadores, setTipificadores] = useState<Tipificador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [activeTab, setActiveTab] = useState('pesar')
  const [romaneoActual, setRomaneoActual] = useState<RomaneoItem | null>(null)
  
  // Form
  const [garronInput, setGarronInput] = useState('')
  const [pesoIzq, setPesoIzq] = useState('')
  const [pesoDer, setPesoDer] = useState('')
  const [denticion, setDenticion] = useState('')
  const [tipificadorId, setTipificadorId] = useState('')
  
  // Dialogs
  const [confirmarOpen, setConfirmarOpen] = useState(false)
  const [claveSupervisor, setClaveSupervisor] = useState('')
  const [detalleOpen, setDetalleOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [romaneosRes, tipificadoresRes] = await Promise.all([
        fetch('/api/romaneo'),
        fetch('/api/tipificadores')
      ])
      
      const romaneosData = await romaneosRes.json()
      const tipificadoresData = await tipificadoresRes.json()
      
      if (romaneosData.success) {
        setRomaneos(romaneosData.data)
      }
      
      if (tipificadoresData.success) {
        setTipificadores(tipificadoresData.data.filter((t: Tipificador) => t.activo))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuscarGarron = async () => {
    if (!garronInput) return

    try {
      const res = await fetch(`/api/romaneo?garron=${garronInput}`)
      const data = await res.json()
      
      if (data.success && data.data) {
        setRomaneoActual(data.data)
        setPesoIzq(data.data.pesoMediaIzq?.toString() || '')
        setPesoDer(data.data.pesoMediaDer?.toString() || '')
        setDenticion(data.data.denticion || '')
        setTipificadorId(data.data.tipificadorId || '')
      } else {
        toast.error('Garrón no encontrado')
        setRomaneoActual(null)
      }
    } catch (error) {
      toast.error('Error al buscar garrón')
    }
  }

  const handleGuardarPesaje = async () => {
    if (!romaneoActual || !pesoIzq || !pesoDer) {
      toast.error('Complete los pesos de ambas medias')
      return
    }

    const pesoTotal = parseFloat(pesoIzq) + parseFloat(pesoDer)
    const rinde = romaneoActual.pesoVivo ? (pesoTotal / romaneoActual.pesoVivo) * 100 : 0

    setSaving(true)
    try {
      const res = await fetch('/api/romaneo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: romaneoActual.id,
          pesoMediaIzq: parseFloat(pesoIzq),
          pesoMediaDer: parseFloat(pesoDer),
          pesoTotal,
          rinde,
          denticion,
          tipificadorId: tipificadorId || null,
          operadorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Pesaje guardado')
        // Imprimir rótulos
        handleImprimirRotulos(data.data)
        // Limpiar y siguiente
        setRomaneoActual(null)
        setGarronInput('')
        setPesoIzq('')
        setPesoDer('')
        setDenticion('')
        setTipificadorId('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleImprimirRotulos = (romaneo: RomaneoItem) => {
    // Imprimir 6 rótulos (A, T, D × IZQ, DER)
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rótulos Garrón ${romaneo.garron}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 10px; }
            .rotulo { 
              border: 2px solid black; 
              padding: 10px; 
              margin-bottom: 10px;
              page-break-after: always;
            }
            .header { text-align: center; border-bottom: 1px solid black; padding-bottom: 5px; margin-bottom: 5px; }
            .empresa { font-size: 16px; font-weight: bold; }
            .campo { display: flex; justify-content: space-between; padding: 2px 0; font-size: 12px; }
            .sigla { font-size: 24px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 5px; }
            .barcode { font-family: 'Libre Barcode 39', cursive; font-size: 24px; text-align: center; margin-top: 5px; }
          </style>
        </head>
        <body>
          ${SIGLAS.map(sigla => `
            <div class="rotulo">
              <div class="header">
                <div class="empresa">SOLEMAR ALIMENTARIA</div>
                <div style="font-size: 10px;">Media Res - Faena</div>
              </div>
              <div class="campo"><span>Garrón:</span><span style="font-weight: bold;">${romaneo.garron}</span></div>
              <div class="campo"><span>Tropa:</span><span>${romaneo.tropaCodigo || '-'}</span></div>
              <div class="campo"><span>Tipo:</span><span>${romaneo.tipoAnimal || '-'}</span></div>
              <div class="campo"><span>Dentición:</span><span>${romaneo.denticion || '-'} dientes</span></div>
              <div class="sigla">${sigla.id}</div>
              <div style="text-align: center; font-size: 12px;">${sigla.label}</div>
              <div class="barcode">*${romaneo.garron}-${sigla.id}*</div>
            </div>
          `).join('')}
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
        </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const handleConfirmarRomaneo = async () => {
    if (!claveSupervisor) {
      toast.error('Ingrese la clave de supervisor')
      return
    }

    // Verificar clave
    try {
      const authRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: claveSupervisor })
      })
      
      const authData = await authRes.json()
      
      if (!authData.success || (authData.data.nivel !== 'SUPERVISOR' && authData.data.nivel !== 'ADMINISTRADOR')) {
        toast.error('Clave de supervisor inválida')
        return
      }
    } catch {
      toast.error('Error al verificar clave')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/romaneo/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          romaneoId: romaneoActual?.id,
          supervisorId: operador.id
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Romaneo confirmado y enviado por email')
        setConfirmarOpen(false)
        setClaveSupervisor('')
        fetchData()
      } else {
        toast.error(data.error || 'Error al confirmar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center">
        <TrendingUp className="w-8 h-8 animate-pulse text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Romaneo de Playa</h1>
            <p className="text-stone-500">Pesaje de medias reses y emisión de rótulos</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Scale className="w-4 h-4 mr-2 text-amber-500" />
              {romaneos.filter(r => r.estado === 'PENDIENTE').length} pendientes
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pesar">Pesar Medias</TabsTrigger>
            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* PESAR MEDIAS */}
          <TabsContent value="pesar" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-amber-50 rounded-t-lg">
                <CardTitle className="text-lg">Pesaje de Medias Reses</CardTitle>
                <CardDescription>
                  Ingrese el número de garrón y registre los pesos de ambas medias
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Buscar garrón */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Label>N° de Garrón</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={garronInput}
                        onChange={(e) => setGarronInput(e.target.value)}
                        placeholder="Ingrese garrón"
                        className="text-xl font-bold"
                      />
                      <Button onClick={handleBuscarGarron} className="bg-amber-500 hover:bg-amber-600">
                        Buscar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Datos del animal */}
                {romaneoActual && (
                  <div className="space-y-6">
                    <div className="p-4 bg-stone-50 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-stone-500">Garrón</span>
                          <p className="text-xl font-bold">{romaneoActual.garron}</p>
                        </div>
                        <div>
                          <span className="text-stone-500">Tropa</span>
                          <p className="font-mono">{romaneoActual.tropaCodigo}</p>
                        </div>
                        <div>
                          <span className="text-stone-500">Animal</span>
                          <p className="font-medium">{romaneoActual.numeroAnimal}</p>
                        </div>
                        <div>
                          <span className="text-stone-500">Tipo</span>
                          <p className="font-medium">{romaneoActual.tipoAnimal}</p>
                        </div>
                        <div>
                          <span className="text-stone-500">Peso Vivo</span>
                          <p className="font-bold text-green-600">{romaneoActual.pesoVivo?.toLocaleString()} kg</p>
                        </div>
                        <div>
                          <span className="text-stone-500">Raza</span>
                          <p className="font-medium">{romaneoActual.raza || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pesos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-lg">Peso Media Izquierda (kg)</Label>
                        <Input
                          type="number"
                          value={pesoIzq}
                          onChange={(e) => setPesoIzq(e.target.value)}
                          className="text-3xl font-bold text-center h-16"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-lg">Peso Media Derecha (kg)</Label>
                        <Input
                          type="number"
                          value={pesoDer}
                          onChange={(e) => setPesoDer(e.target.value)}
                          className="text-3xl font-bold text-center h-16"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Totales */}
                    {pesoIzq && pesoDer && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <span className="text-sm text-green-600">Total</span>
                            <p className="text-2xl font-bold text-green-700">
                              {(parseFloat(pesoIzq) + parseFloat(pesoDer)).toLocaleString()} kg
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-green-600">Rinde</span>
                            <p className="text-2xl font-bold text-green-700">
                              {romaneoActual.pesoVivo 
                                ? (((parseFloat(pesoIzq) + parseFloat(pesoDer)) / romaneoActual.pesoVivo) * 100).toFixed(1)
                                : '-'}%
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-green-600">Diferencia</span>
                            <p className="text-2xl font-bold">
                              {Math.abs(parseFloat(pesoIzq) - parseFloat(pesoDer)).toFixed(1)} kg
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tipificación */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dentición</Label>
                        <Select value={denticion} onValueChange={setDenticion}>
                          <SelectTrigger>
                            <SelectValue placeholder="Cantidad de dientes" />
                          </SelectTrigger>
                          <SelectContent>
                            {DENTICIONES.map((d) => (
                              <SelectItem key={d} value={d}>{d} dientes</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tipificador</Label>
                        <Select value={tipificadorId} onValueChange={setTipificadorId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent>
                            {tipificadores.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nombre} {t.apellido} - Mat. {t.matricula}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4">
                      <Button
                        onClick={handleGuardarPesaje}
                        disabled={saving || !pesoIzq || !pesoDer}
                        className="flex-1 h-14 bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Guardar e Imprimir Rótulos
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setConfirmarOpen(true)}
                        className="h-14"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirmar Romaneo
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PENDIENTES */}
          <TabsContent value="pendientes">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Romaneos Pendientes de Confirmación</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {romaneos.filter(r => r.estado === 'PENDIENTE' && r.pesoTotal).length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay romaneos pendientes</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Garrón</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Peso Vivo</TableHead>
                        <TableHead>Peso Total</TableHead>
                        <TableHead>Rinde</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {romaneos.filter(r => r.estado === 'PENDIENTE' && r.pesoTotal).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold">{r.garron}</TableCell>
                          <TableCell className="font-mono">{r.tropaCodigo}</TableCell>
                          <TableCell>{r.pesoVivo?.toLocaleString()} kg</TableCell>
                          <TableCell className="font-bold text-green-600">{r.pesoTotal?.toLocaleString()} kg</TableCell>
                          <TableCell>{r.rinde?.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-700">Pendiente</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORIAL */}
          <TabsContent value="historial">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-stone-50 rounded-t-lg">
                <CardTitle className="text-lg">Romaneos Confirmados</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {romaneos.filter(r => r.estado === 'CONFIRMADO').length === 0 ? (
                  <div className="p-8 text-center text-stone-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay romaneos confirmados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Garrón</TableHead>
                        <TableHead>Tropa</TableHead>
                        <TableHead>Peso Total</TableHead>
                        <TableHead>Rinde</TableHead>
                        <TableHead>Tipificador</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {romaneos.filter(r => r.estado === 'CONFIRMADO').map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{new Date(r.fecha).toLocaleDateString('es-AR')}</TableCell>
                          <TableCell className="font-bold">{r.garron}</TableCell>
                          <TableCell className="font-mono">{r.tropaCodigo}</TableCell>
                          <TableCell className="font-bold text-green-600">{r.pesoTotal?.toLocaleString()} kg</TableCell>
                          <TableCell>{r.rinde?.toFixed(1)}%</TableCell>
                          <TableCell>{r.tipificador ? `${r.tipificador.nombre} ${r.tipificador.apellido}` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Confirmar */}
        <Dialog open={confirmarOpen} onOpenChange={setConfirmarOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Confirmar Romaneo
              </DialogTitle>
              <DialogDescription>
                Se requiere autorización de supervisor para confirmar el romaneo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-sm text-blue-700">
                  Al confirmar, se enviará automáticamente el romaneo por email al usuario de faena.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Clave de Supervisor</Label>
                <Input
                  type="password"
                  value={claveSupervisor}
                  onChange={(e) => setClaveSupervisor(e.target.value)}
                  placeholder="••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmarOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmarRomaneo} disabled={saving} className="bg-green-600 hover:bg-green-700">
                {saving ? 'Confirmando...' : 'Confirmar y Enviar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default RomaneoModule
