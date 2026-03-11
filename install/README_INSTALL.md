# 📦 Paquete de Instalación - Sistema Frigorífico

## Solemar Alimentaria - CICLO I

---

## 📁 Contenido de este Paquete

```
install/
├── src/                    # Código fuente de la aplicación
│   ├── app/               # Páginas y API routes (Next.js App Router)
│   │   ├── api/           # Endpoints de la API
│   │   ├── layout.tsx     # Layout principal
│   │   ├── page.tsx       # Página principal
│   │   └── globals.css    # Estilos globales
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes UI (shadcn/ui)
│   │   └── ...           # Módulos del sistema
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilidades y configuración
├── prisma/               # Esquema de base de datos
│   ├── schema.prisma     # Definición de modelos
│   ├── seed.ts           # Datos iniciales
│   └── seed-test.ts      # Datos de prueba
├── public/               # Archivos estáticos
│   ├── logo.png         # Logo de la empresa
│   └── logo.svg
├── scripts/              # Scripts de utilidad
├── install.sh            # Instalador para Linux/macOS
├── install.ps1           # Instalador para Windows
├── INSTALL.md            # Guía detallada de instalación
├── .env.example          # Plantilla de configuración
├── package.json          # Dependencias del proyecto
├── tsconfig.json         # Configuración TypeScript
├── tailwind.config.ts    # Configuración Tailwind CSS
└── next.config.ts        # Configuración Next.js
```

---

## 🚀 Instalación Rápida

### Linux / macOS
```bash
chmod +x install.sh
sudo ./install.sh
```

### Windows (PowerShell como Administrador)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1
```

---

## 📖 Documentación Completa

Para instrucciones detalladas, solución de problemas y configuración avanzada, consultar:
**[INSTALL.md](./INSTALL.md)**

---

## 🔐 Credenciales por Defecto

| Usuario | Password | PIN | Rol |
|---------|----------|-----|-----|
| admin | admin123 | 1234 | Administrador |
| supervisor | super123 | 2222 | Supervisor |
| balanza | balanza123 | 1111 | Operador |

**⚠️ IMPORTANTE:** Cambiar estas credenciales después de la primera instalación.

---

## 📋 Requisitos

- **Bun Runtime** (se instala automáticamente)
- **Sistema Operativo:**
  - Linux: Ubuntu 20.04+ / Debian 11+
  - Windows: Windows 10+ / Windows Server 2019+
  - macOS: macOS 11+ (Big Sur)
- **Hardware:** 4GB RAM, 10GB disco

---

## 🛠️ Módulos del Sistema

### CICLO I
- Pesaje Camiones
- Pesaje Individual
- Movimiento de Hacienda
- Lista de Faena
- Ingreso a Cajón
- Romaneo
- VB Romaneo
- Expedición

### CICLO II
- Cuarteo
- Ingreso a Despostada
- Cortes en Despostada
- Empaque

### Subproductos
- Menudencias
- Cueros
- Rendering (Grasa, Desperdicios, Fondo Digestor)

### Reportes
- Stocks Corrales
- Stocks Cámaras
- Planilla 01
- Rindes por Tropa
- Reportes SENASA

### Administración
- Facturación
- Insumos

### Configuración
- Rótulos
- Usuarios y Operadores
- Productos y Subproductos
- Balanzas, Impresoras, Terminales
- Código de Barras

---

## 📞 Soporte

- **GitHub Issues:** https://github.com/aarescalvo/104/issues
- **Email:** soporte@solemar.com.ar

---

## 📄 Licencia

Software propietario - Solemar Alimentaria
Todos los derechos reservados.
