'use client'
// Sistema Frigorífico - Solemar Alimentaria v2.0
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ConfiguracionModule } from '@/components/configuracion'
import { PesajeCamionesModule } from '@/components/pesaje-camiones-module'
import { PesajeIndividualModule } from '@/components/pesaje-individual-module'
import { MovimientoHaciendaModule } from '@/components/movimiento-hacienda-module'
import { ListaFaenaModule } from '@/components/lista-faena'
import { RomaneoModule } from '@/components/romaneo'
import { MenudenciasModule } from '@/components/menudencias'
import { IngresoCajonModule } from '@/components/ingreso-cajon'
import { StockCamarasModule } from '@/components/stock-camaras'
import { ReportesModule } from '@/components/reportes'
import { Planilla01Module } from '@/components/planilla-01'
import RindesTropaModule from '@/components/rindes-tropa'
import { StocksCorralesModule } from '@/components/stocks-corrales'
import { BusquedaFiltroModule } from '@/components/busqueda-filtro'
import { CortesDespostadaModule } from '@/components/cortes-despostada'
import { ConfigBalanzasModule } from '@/components/config-balanzas'
import { ConfigImpresorasModule } from '@/components/config-impresoras'
import { ConfigTerminalesModule } from '@/components/config-terminales'
import { ConfigCodigobarrasModule } from '@/components/config-codigobarras'
import { StocksInsumosModule } from '@/components/stocks-insumos'
import { RenderingModule } from '@/components/rendering'
import { VBRomaneoModule } from '@/components/vb-romaneo'
import { ExpedicionModule } from '@/components/expedicion'
import { CuarteoModule } from '@/components/cuarteo'
import { IngresoDespostadaModule } from '@/components/ingreso-despostada'
import { MovimientosDespostadaModule } from '@/components/movimientos-despostada'
import { EmpaqueModule } from '@/components/empaque'
import { CuerosModule } from '@/components/cueros'
import { ReportesSenasaModule } from '@/components/reportes-senasa'
import { FacturacionModule } from '@/components/facturacion'
import { ConfigRotulosModule } from '@/components/config-rotulos'
import { ConfigInsumosModule } from '@/components/config-insumos'
import { ConfigUsuariosModule } from '@/components/config-usuarios'
import { ConfigProductosModule } from '@/components/config-productos'
import { ConfigSubproductosModule } from '@/components/config-subproductos'
import { ConfigListadoInsumosModule } from '@/components/config-listado-insumos'
import { ConfigCondicionesEmbalajeModule } from '@/components/config-condiciones-embalaje'
import { ConfigTiposProductoModule } from '@/components/config-tipos-producto'
import { CalidadRegistroUsuariosModule } from '@/components/calidad-registro-usuarios'
import { DespachosModule } from '@/components/despachos'
import { ConfigOperadoresModule } from '@/components/config-operadores'

// Lucide icons
import { 
  Truck, Beef, Scale, ClipboardList, TrendingUp, Package, Tag, Scissors, 
  Warehouse, FileText, Settings, Calendar, LogOut, Lock, Users,
  Loader2, Plus, Search, Weight, RefreshCw, BoxSelect, Barcode, Printer, Monitor,
  ChevronDown, ChevronRight, LayoutDashboard
} from 'lucide-react'

// Types
interface Operador {
  id: string
  nombre: string
  usuario: string
  rol: string
  email?: string
  permisos: {
    puedePesajeCamiones: boolean
    puedePesajeIndividual: boolean
    puedeMovimientoHacienda: boolean
    puedeListaFaena: boolean
    puedeRomaneo: boolean
    puedeIngresoCajon: boolean
    puedeMenudencias: boolean
    puedeStock: boolean
    puedeReportes: boolean
    puedeConfiguracion: boolean
  }
}

interface Tropa {
  id: string
  numero: number
  codigo: string
  productor?: { nombre: string }
  usuarioFaena: { nombre: string }
  especie: string
  cantidadCabezas: number
  corralId?: string
  corral?: { nombre: string }
  estado: string
  fechaRecepcion: string
  pesoBruto?: number
  pesoTara?: number
  pesoNeto?: number
}

interface Stats {
  tropasActivas: number
  enPesaje: number
  pesajesHoy: number
  enCamara: number
}

type Page = 'dashboard' | 'pesajeCamiones' | 'pesajeIndividual' | 'movimientoHacienda' | 'listaFaena' | 'romaneo' | 'ingresoCajon' | 'vbRomaneo' | 'expedicion' | 'despachos' | 'cuarteo' | 'ingresoDespostada' | 'movimientosDespostada' | 'cortesDespostada' | 'empaque' | 'menudencias' | 'cueros' | 'grasa' | 'desperdicios' | 'fondoDigestor' | 'stock' | 'stocksCorrales' | 'planilla01' | 'rindesTropa' | 'busquedaFiltro' | 'reportesSenasa' | 'facturacion' | 'insumos' | 'stocksInsumos' | 'configRotulos' | 'configInsumos' | 'configUsuarios' | 'configCodigobarras' | 'configImpresoras' | 'configBalanzas' | 'configTerminales' | 'configOperadores' | 'configProductos' | 'configSubproductos' | 'configListadoInsumos' | 'configCondicionesEmbalaje' | 'configTiposProducto' | 'calidadRegistroUsuarios' | 'reportes' | 'configuracion'

// Navigation item
interface NavItem {
  id: Page
  label: string
  icon: typeof Beef
  permiso?: string
}

// Sub-group (for nested menus like Consumo/Rendering)
interface NavSubGroup {
  label: string
  items: NavItem[]
}

// Navigation group
interface NavGroup {
  label: string
  icon?: typeof Beef
  items: NavItem[]
  subGroups?: NavSubGroup[]  // For nested submenus
}

// Main navigation structure
const NAV_GROUPS: NavGroup[] = [
  // 1. Pesaje Camiones - destacado al inicio (sin agrupar)
  {
    label: '',
    items: [
      { id: 'pesajeCamiones', label: 'Pesaje Camiones', icon: Truck, permiso: 'puedePesajeCamiones' },
    ]
  },
  // 2. CICLO I
  {
    label: 'CICLO I',
    icon: ClipboardList,
    items: [
      { id: 'pesajeIndividual', label: 'Pesaje Individual', icon: Scale, permiso: 'puedePesajeIndividual' },
      { id: 'movimientoHacienda', label: 'Movimiento de Hacienda', icon: RefreshCw, permiso: 'puedeMovimientoHacienda' },
      { id: 'listaFaena', label: 'Lista de Faena', icon: ClipboardList, permiso: 'puedeListaFaena' },
      { id: 'ingresoCajon', label: 'Ingreso a Cajón', icon: BoxSelect, permiso: 'puedeIngresoCajon' },
      { id: 'romaneo', label: 'Romaneo', icon: TrendingUp, permiso: 'puedeRomaneo' },
      { id: 'vbRomaneo', label: 'VB Romaneo', icon: FileText, permiso: 'puedeRomaneo' },
      { id: 'expedicion', label: 'Expedición', icon: Truck, permiso: 'puedeStock' },
    ]
  },
  // 3. CICLO II
  {
    label: 'CICLO II',
    icon: Scissors,
    items: [
      { id: 'cuarteo', label: 'Cuarteo', icon: Scissors, permiso: 'puedeConfiguracion' },
      { id: 'ingresoDespostada', label: 'Ingreso a Despostada', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'movimientosDespostada', label: 'Movimientos de Despostada', icon: RefreshCw, permiso: 'puedeConfiguracion' },
      { id: 'cortesDespostada', label: 'Cortes en Despostada', icon: Scissors, permiso: 'puedeConfiguracion' },
      { id: 'empaque', label: 'Empaque', icon: Package, permiso: 'puedeConfiguracion' },
    ]
  },
  // 4. Subproductos (con subgrupos)
  {
    label: 'Subproductos',
    icon: Package,
    items: [],
    subGroups: [
      {
        label: 'Consumo',
        items: [
          { id: 'menudencias', label: 'Menudencias', icon: Package, permiso: 'puedeMenudencias' },
          { id: 'cueros', label: 'Cueros', icon: Tag, permiso: 'puedeMenudencias' },
        ]
      },
      {
        label: 'Rendering',
        items: [
          { id: 'grasa', label: 'Grasa', icon: TrendingUp, permiso: 'puedeMenudencias' },
          { id: 'desperdicios', label: 'Desperdicios', icon: Package, permiso: 'puedeMenudencias' },
          { id: 'fondoDigestor', label: 'Fondo de Digestor', icon: Package, permiso: 'puedeMenudencias' },
        ]
      }
    ]
  },
  // 5. Reportes
  {
    label: 'Reportes',
    icon: FileText,
    items: [
      { id: 'stocksCorrales', label: 'Stocks Corrales', icon: Warehouse, permiso: 'puedeReportes' },
      { id: 'stock', label: 'Stocks Cámaras', icon: Warehouse, permiso: 'puedeReportes' },
      { id: 'planilla01', label: 'Planilla 01', icon: FileText, permiso: 'puedeReportes' },
      { id: 'rindesTropa', label: 'Rindes por Tropa', icon: TrendingUp, permiso: 'puedeReportes' },
      { id: 'busquedaFiltro', label: 'Búsqueda por Filtro', icon: Search, permiso: 'puedeReportes' },
      { id: 'reportesSenasa', label: 'Reportes SENASA', icon: FileText, permiso: 'puedeReportes' },
    ]
  },
  // 6. Administración
  {
    label: 'Administración',
    icon: FileText,
    items: [
      { id: 'facturacion', label: 'Facturación', icon: FileText, permiso: 'puedeConfiguracion' },
      { id: 'insumos', label: 'Insumos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'stocksInsumos', label: 'Stocks de Insumos', icon: Package, permiso: 'puedeStock' },
    ]
  },
  // 7. Configuración
  {
    label: 'Configuración',
    icon: Settings,
    items: [
      { id: 'configRotulos', label: 'Rótulos', icon: Tag, permiso: 'puedeConfiguracion' },
      { id: 'configInsumos', label: 'Insumos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configUsuarios', label: 'Usuarios', icon: Users, permiso: 'puedeConfiguracion' },
      { id: 'configCodigobarras', label: 'Código de Barras', icon: Barcode, permiso: 'puedeConfiguracion' },
      { id: 'configImpresoras', label: 'Impresoras', icon: Printer, permiso: 'puedeConfiguracion' },
      { id: 'configBalanzas', label: 'Balanzas', icon: Scale, permiso: 'puedeConfiguracion' },
      { id: 'configTerminales', label: 'Terminales', icon: Monitor, permiso: 'puedeConfiguracion' },
      { id: 'configOperadores', label: 'Operadores', icon: Users, permiso: 'puedeConfiguracion' },
      { id: 'configProductos', label: 'Productos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configSubproductos', label: 'Subproductos', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configListadoInsumos', label: 'Listado de Insumos', icon: ClipboardList, permiso: 'puedeConfiguracion' },
      { id: 'configCondicionesEmbalaje', label: 'Condiciones de Embalaje', icon: Package, permiso: 'puedeConfiguracion' },
      { id: 'configTiposProducto', label: 'Tipos de Producto', icon: Tag, permiso: 'puedeConfiguracion' },
    ]
  },
  // 8. Calidad
  {
    label: 'Calidad',
    icon: FileText,
    items: [
      { id: 'calidadRegistroUsuarios', label: 'Registro de Usuarios', icon: Users, permiso: 'puedeConfiguracion' },
    ]
  }
]

export default function FrigorificoApp() {
  const [operador, setOperador] = useState<Operador | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>('pesajeCamiones')
  const [tropas, setTropas] = useState<Tropa[]>([])
  const [stats, setStats] = useState<Stats>({ tropasActivas: 0, enPesaje: 0, pesajesHoy: 0, enCamara: 0 })
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['CICLO I', 'Subproductos'])
  const [expandedSubGroups, setExpandedSubGroups] = useState<string[]>(['Subproductos-Consumo', 'Subproductos-Rendering'])
  
  // Login state
  const [loginTab, setLoginTab] = useState<'usuario' | 'pin'>('usuario')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // Check for existing session
  useEffect(() => {
    const savedOperador = localStorage.getItem('operador')
    if (savedOperador) {
      try {
        setOperador(JSON.parse(savedOperador))
      } catch {
        localStorage.removeItem('operador')
      }
    }
    setLoading(false)
  }, [])

  // Fetch data
  useEffect(() => {
    if (operador) {
      fetchTropas()
      fetchStats()
    }
  }, [operador])

  const fetchTropas = async () => {
    try {
      const res = await fetch('/api/tropas')
      const data = await res.json()
      if (data.success) {
        setTropas(data.data)
      }
    } catch (error) {
      console.error('Error fetching tropas:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoggingIn(true)
    
    try {
      const body = loginTab === 'usuario' 
        ? { usuario, password }
        : { pin }
      
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setOperador(data.data)
        localStorage.setItem('operador', JSON.stringify(data.data))
        setUsuario('')
        setPassword('')
        setPin('')
      } else {
        setLoginError(data.error || 'Error de autenticación')
      }
    } catch {
      setLoginError('Error de conexión')
    } finally {
      setLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    if (operador) {
      try {
        await fetch('/api/auth', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operadorId: operador.id })
        })
      } catch {
        // Ignore logout errors
      }
    }
    setOperador(null)
    localStorage.removeItem('operador')
    setCurrentPage('pesajeCamiones')
  }

  // Check permission - recorre items y subgrupos
  const canAccess = (page: Page): boolean => {
    if (!operador) return false
    for (const group of NAV_GROUPS) {
      // Buscar en items directos
      const item = group.items.find(n => n.id === page)
      if (item) {
        if (!item.permiso) return true
        return operador.permisos[item.permiso as keyof typeof operador.permisos] === true
      }
      // Buscar en subgrupos
      if (group.subGroups) {
        for (const subGroup of group.subGroups) {
          const subItem = subGroup.items.find(n => n.id === page)
          if (subItem) {
            if (!subItem.permiso) return true
            return operador.permisos[subItem.permiso as keyof typeof operador.permisos] === true
          }
        }
      }
    }
    return true
  }

  // Toggle group expansion
  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupLabel) 
        ? prev.filter(g => g !== groupLabel)
        : [...prev, groupLabel]
    )
  }

  // Toggle subgroup expansion
  const toggleSubGroup = (parentLabel: string, subLabel: string) => {
    const key = `${parentLabel}-${subLabel}`
    setExpandedSubGroups(prev => 
      prev.includes(key) 
        ? prev.filter(g => g !== key)
        : [...prev, key]
    )
  }

  // Filter nav groups by permission (incluye subgrupos)
  const visibleNavGroups = NAV_GROUPS.map(group => {
    // Filtrar items directos
    const filteredItems = group.items.filter(item => {
      if (!item.permiso) return true
      return operador?.permisos[item.permiso as keyof typeof operador.permisos] === true
    })
    
    // Filtrar subgrupos
    const filteredSubGroups = group.subGroups?.map(subGroup => ({
      ...subGroup,
      items: subGroup.items.filter(item => {
        if (!item.permiso) return true
        return operador?.permisos[item.permiso as keyof typeof operador.permisos] === true
      })
    })).filter(subGroup => subGroup.items.length > 0)
    
    return {
      ...group,
      items: filteredItems,
      subGroups: filteredSubGroups
    }
  }).filter(group => group.items.length > 0 || (group.subGroups && group.subGroups.length > 0))

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  // Login screen
  if (!operador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="relative w-64 h-64 mx-auto mb-4">
              <Image 
                src="/logo.png" 
                alt="Solemar Alimentaria" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <CardTitle className="text-2xl">Solemar Alimentaria</CardTitle>
            <CardDescription>Sistema de Gestión Frigorífica - CICLO I</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginTab} onValueChange={(v) => setLoginTab(v as 'usuario' | 'pin')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="usuario">Usuario</TabsTrigger>
                <TabsTrigger value="pin">PIN</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {loginTab === 'usuario' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="usuario">Usuario</Label>
                      <Input
                        id="usuario"
                        type="text"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        placeholder="Ingrese su usuario"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN</Label>
                    <Input
                      id="pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className="text-center text-2xl tracking-widest h-14"
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                )}
                
                {loginError && (
                  <p className="text-red-500 text-sm text-center">{loginError}</p>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600"
                  disabled={(loginTab === 'usuario' && (!usuario || !password)) || (loginTab === 'pin' && pin.length < 4) || loggingIn}
                >
                  {loggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Ingresar
                    </>
                  )}
                </Button>
              </form>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t text-center text-xs text-stone-400">
              <p>Credenciales de prueba:</p>
              <p>Usuario: <span className="font-mono">admin</span> / Password: <span className="font-mono">admin123</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Placeholder content for modules
  const PlaceholderContent = ({ title, description, icon: Icon }: { title: string; description: string; icon: typeof LayoutDashboard }) => (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">{title}</h1>
            <p className="text-stone-500 mt-1">{description}</p>
          </div>
        </div>
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center text-stone-400">
            <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">Módulo en desarrollo</p>
            <p className="text-sm">Esta funcionalidad estará disponible próximamente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Dashboard content
  const DashboardContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-800">Sistema Frigorífico - CICLO I</h1>
          <p className="text-stone-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => canAccess('movimientoHacienda') && setCurrentPage('movimientoHacienda')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 p-2 rounded-lg">
                  <Beef className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Tropas Activas</p>
                  <p className="text-xl font-bold">{stats.tropasActivas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => canAccess('pesajeIndividual') && setCurrentPage('pesajeIndividual')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-600 p-2 rounded-lg">
                  <Scale className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">En Pesaje</p>
                  <p className="text-xl font-bold">{stats.enPesaje}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => canAccess('pesajeCamiones') && setCurrentPage('pesajeCamiones')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">Pesajes Hoy</p>
                  <p className="text-xl font-bold">{stats.pesajesHoy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => canAccess('stock') && setCurrentPage('stock')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Warehouse className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">En Cámara</p>
                  <p className="text-xl font-bold">{stats.enCamara}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tropas */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-stone-50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-stone-800 flex items-center gap-2">
              <Beef className="w-5 h-5" />
              Últimas Tropas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {tropas.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Beef className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay tropas registradas</p>
              </div>
            ) : (
              <div className="divide-y">
                {tropas.slice(0, 5).map((tropa) => (
                  <div key={tropa.id} className="p-4 hover:bg-stone-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold text-stone-800">{tropa.codigo}</p>
                        <p className="text-sm text-stone-500">
                          {tropa.usuarioFaena?.nombre} • {tropa.cantidadCabezas} cabezas • {tropa.especie}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-amber-300 text-amber-600">
                        {tropa.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render current page
  const renderPage = () => {
    if (!canAccess(currentPage)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 p-4 md:p-6 flex items-center justify-center">
          <Card className="border-0 shadow-md max-w-md">
            <CardContent className="p-8 text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-red-400" />
              <p className="text-lg font-medium text-stone-800">Acceso Denegado</p>
              <p className="text-sm text-stone-500 mt-2">No tiene permisos para acceder a este módulo</p>
              <Button className="mt-4" onClick={() => setCurrentPage('pesajeCamiones')}>
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    switch (currentPage) {
      case 'pesajeCamiones':
        return <PesajeCamionesModule operador={operador} onTropaCreada={fetchTropas} />
      case 'pesajeIndividual':
        return <PesajeIndividualModule operador={operador} />
      case 'movimientoHacienda':
        return <MovimientoHaciendaModule operador={operador} />
      case 'listaFaena':
        return <ListaFaenaModule operador={operador} />
      case 'romaneo':
        return <RomaneoModule operador={operador} />
      case 'ingresoCajon':
        return <IngresoCajonModule operador={operador} />
      case 'menudencias':
        return <MenudenciasModule operador={operador} />
      case 'stock':
        return <StockCamarasModule operador={operador} />
      case 'stocksCorrales':
        return <StocksCorralesModule operador={operador} />
      case 'reportes':
        return <ReportesModule operador={operador} />
      case 'planilla01':
        return <Planilla01Module operador={operador} />
      case 'rindesTropa':
        return <RindesTropaModule operador={operador} />
      case 'busquedaFiltro':
        return <BusquedaFiltroModule operador={operador} />
      case 'cortesDespostada':
        return <CortesDespostadaModule operador={operador} />
      case 'stocksInsumos':
        return <StocksInsumosModule operador={operador} />
      case 'configuracion':
        return <ConfiguracionModule operador={operador} />
      case 'configBalanzas':
        return <ConfigBalanzasModule operador={operador} />
      case 'configImpresoras':
        return <ConfigImpresorasModule operador={operador} />
      case 'configTerminales':
        return <ConfigTerminalesModule operador={operador} />
      case 'configCodigobarras':
        return <ConfigCodigobarrasModule operador={operador} />
      // Placeholders for new modules
      case 'vbRomaneo':
        return <VBRomaneoModule operador={operador} />
      case 'expedicion':
        return <ExpedicionModule operador={operador} />
      case 'despachos':
        return <DespachosModule operador={operador} />
      case 'cuarteo':
        return <CuarteoModule operador={operador} />
      case 'ingresoDespostada':
        return <IngresoDespostadaModule operador={operador} />
      case 'movimientosDespostada':
        return <MovimientosDespostadaModule operador={operador} />
      case 'empaque':
        return <EmpaqueModule operador={operador} />
      case 'cueros':
        return <CuerosModule operador={operador} />
      case 'grasa':
        return <RenderingModule operador={operador} tipoInicial="GRASA" />
      case 'desperdicios':
        return <RenderingModule operador={operador} tipoInicial="DESPERDICIOS" />
      case 'fondoDigestor':
        return <RenderingModule operador={operador} tipoInicial="FONDO_DIGESTOR" />
      case 'reportesSenasa':
        return <ReportesSenasaModule operador={operador} />
      case 'facturacion':
        return <FacturacionModule operador={operador} />
      case 'insumos':
        return <ConfigInsumosModule operador={operador} />
      case 'configRotulos':
        return <ConfigRotulosModule operador={operador} />
      case 'configInsumos':
        return <ConfigInsumosModule operador={operador} />
      case 'configUsuarios':
        return <ConfigUsuariosModule operador={operador} />
      case 'configOperadores':
        return <ConfigOperadoresModule operador={operador} />
      case 'configProductos':
        return <ConfigProductosModule operador={operador} />
      case 'configSubproductos':
        return <ConfigSubproductosModule operador={operador} />
      case 'configListadoInsumos':
        return <ConfigListadoInsumosModule operador={operador} />
      case 'configCondicionesEmbalaje':
        return <ConfigCondicionesEmbalajeModule operador={operador} />
      case 'configTiposProducto':
        return <ConfigTiposProductoModule operador={operador} />
      case 'calidadRegistroUsuarios':
        return <CalidadRegistroUsuariosModule operador={operador} />
      default:
        return <PesajeCamionesModule operador={operador} onTropaCreada={fetchTropas} />
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 flex">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r flex flex-col shadow-lg">
        {/* Logo */}
        <div className="h-28 flex items-center gap-3 px-4 border-b bg-gradient-to-r from-amber-50 to-white">
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image 
              src="/logo.png" 
              alt="Solemar Alimentaria" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-stone-800 text-sm leading-tight">Solemar Alimentaria</h1>
            <p className="text-xs text-amber-600 font-medium">CICLO I</p>
          </div>
        </div>
        
        {/* Operator info */}
        <div className="p-3 border-b bg-stone-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-400" />
              <div>
                <p className="text-sm font-medium text-stone-700">{operador.nombre}</p>
                <p className="text-xs text-stone-400">{operador.rol}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-stone-400 hover:text-red-500">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {visibleNavGroups.map((group, index) => {
            // Grupo sin label = botón destacado (Pesaje Camiones)
            if (!group.label) {
              const item = group.items[0]
              if (!item) return null
              const isActive = currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg w-full text-left
                    transition-all duration-150 mb-2
                    ${isActive 
                      ? 'bg-amber-500 text-white font-medium shadow-md' 
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              )
            }
            
            // Grupos normales con items y subgrupos
            const isExpanded = expandedGroups.includes(group.label)
            const hasActiveItem = group.items.some(item => currentPage === item.id) ||
              (group.subGroups?.some(sg => sg.items.some(item => currentPage === item.id)) ?? false)
            
            return (
              <div key={group.label} className="mb-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg w-full text-left
                    transition-all duration-150
                    ${hasActiveItem 
                      ? 'bg-amber-50 text-amber-700' 
                      : 'text-stone-600 hover:bg-stone-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    {group.icon && <group.icon className={`w-4 h-4 ${hasActiveItem ? 'text-amber-600' : ''}`} />}
                    <span className="text-xs font-semibold uppercase tracking-wider">{group.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className={`w-4 h-4 ${hasActiveItem ? 'text-amber-500' : 'text-stone-400'}`} />
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${hasActiveItem ? 'text-amber-500' : 'text-stone-400'}`} />
                  )}
                </button>
                
                {/* Group Items */}
                {isExpanded && (
                  <div className="ml-2 mt-1 space-y-0.5 border-l-2 border-stone-100 pl-2">
                    {group.items.map((item) => {
                      const isActive = currentPage === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentPage(item.id)}
                          className={`
                            flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 w-full text-left
                            ${isActive 
                              ? 'bg-amber-100 text-amber-800 font-medium shadow-sm' 
                              : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                            }
                          `}
                        >
                          <item.icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : ''}`} />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      )
                    })}
                    
                    {/* SubGroups */}
                    {group.subGroups?.map((subGroup) => {
                      const subKey = `${group.label}-${subGroup.label}`
                      const isSubExpanded = expandedSubGroups.includes(subKey)
                      const hasActiveSubItem = subGroup.items.some(item => currentPage === item.id)
                      
                      return (
                        <div key={subGroup.label} className="mt-1">
                          {/* SubGroup Header */}
                          <button
                            onClick={() => toggleSubGroup(group.label, subGroup.label)}
                            className={`
                              flex items-center justify-between px-3 py-1.5 rounded w-full text-left
                              transition-all duration-150
                              ${hasActiveSubItem 
                                ? 'text-amber-600' 
                                : 'text-stone-500 hover:text-stone-700'
                              }
                            `}
                          >
                            <span className="text-xs font-medium">{subGroup.label}</span>
                            {isSubExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                          
                          {/* SubGroup Items */}
                          {isSubExpanded && (
                            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-stone-200 pl-2">
                              {subGroup.items.map((item) => {
                                const isActive = currentPage === item.id
                                return (
                                  <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    className={`
                                      flex items-center gap-2 px-2 py-1.5 rounded w-full text-left
                                      transition-all duration-150
                                      ${isActive 
                                        ? 'bg-amber-50 text-amber-700 font-medium' 
                                        : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
                                      }
                                    `}
                                  >
                                    <item.icon className={`w-3 h-3 ${isActive ? 'text-amber-500' : ''}`} />
                                    <span className="text-xs">{item.label}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t bg-stone-50">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Beef className="w-4 h-4 text-amber-500" />
            <span>Frigorífico Solemar Alimentaria</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 min-h-screen">
        {renderPage()}
      </main>
    </div>
  )
}
