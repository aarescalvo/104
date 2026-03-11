# 📦 GUÍA DE INSTALACIÓN - SISTEMA FRIGORÍFICO

## Solemar Alimentaria - CICLO I
### Versión: 2.0

---

## 📋 ÍNDICE

1. [Requisitos del Sistema](#requisitos-del-sistema)
2. [Instalación Rápida](#instalación-rápida)
3. [Instalación Detallada - Linux](#instalación-detallada---linux)
4. [Instalación Detallada - Windows](#instalación-detallada---windows)
5. [Instalación Detallada - macOS](#instalación-detallada---macos)
6. [Solución de Problemas](#solución-de-problemas)
7. [Configuración Post-Instalación](#configuración-post-instalación)
8. [Actualización del Sistema](#actualización-del-sistema)
9. [Backup y Restauración](#backup-y-restauración)

---

## 🔧 REQUISITOS DEL SISTEMA

### Hardware Mínimo
| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 núcleos | 4 núcleos |
| RAM | 4 GB | 8 GB |
| Disco | 10 GB | 50 GB SSD |
| Red | 100 Mbps | 1 Gbps |

### Software Requerido

#### Linux (Ubuntu/Debian)
- Ubuntu 20.04 LTS o superior
- O Debian 11 o superior

#### Windows
- Windows 10 Pro/Enterprise
- O Windows Server 2019/2022

#### macOS
- macOS 11 (Big Sur) o superior

### Puertos de Red
- **3000**: Puerto principal de la aplicación (HTTP)
- **3001**: Puerto alternativo (opcional)

---

## ⚡ INSTALACIÓN RÁPIDA

### Linux (Ubuntu/Debian)
```bash
# 1. Descargar el paquete
wget https://github.com/aarescalvo/104/archive/refs/heads/main.zip
unzip main.zip
cd 104-main/install

# 2. Ejecutar instalador
sudo chmod +x install.sh
sudo ./install.sh

# 3. Acceder al sistema
# http://localhost:3000
# Usuario: admin | Password: admin123
```

### Windows (PowerShell como Administrador)
```powershell
# 1. Descargar el paquete
# Extraer el archivo ZIP en una carpeta

# 2. Ejecutar instalador
cd install
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1

# 3. Acceder al sistema
# http://localhost:3000
# Usuario: admin | Password: admin123
```

---

## 📖 INSTALACIÓN DETALLADA - LINUX

### Paso 1: Preparar el Sistema

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
sudo apt install -y curl wget git unzip

# Verificar versión de Node.js (opcional, Bun lo reemplaza)
node --version  # Si está instalado
```

### Paso 2: Instalar Bun Runtime

```bash
# Instalar Bun
curl -fsSL https://bun.sh/install | bash

# Agregar al PATH (reiniciar terminal después)
source ~/.bashrc
# o para zsh:
source ~/.zshrc

# Verificar instalación
bun --version
```

**⚠️ Posible Error 1**: `bun: command not found`
```bash
# Solución: Agregar manualmente al PATH
echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Paso 3: Crear Directorios

```bash
# Crear directorios del sistema
sudo mkdir -p /opt/solemar
sudo mkdir -p /var/lib/solemar/db
sudo mkdir -p /var/lib/solemar/logs
sudo mkdir -p /var/lib/solemar/backups

# Establecer permisos
sudo chown -R $USER:$USER /opt/solemar
sudo chown -R $USER:$USER /var/lib/solemar
```

### Paso 4: Copiar Archivos

```bash
# Copiar desde el directorio de instalación
cp -r /ruta/al/proyecto/install/* /opt/solemar/

# Crear archivo de configuración
cd /opt/solemar
cp .env.example .env
```

### Paso 5: Configurar Variables de Entorno

Editar el archivo `.env`:
```bash
nano /opt/solemar/.env
```

Contenido:
```env
DATABASE_URL=file:/var/lib/solemar/db/custom.db
NODE_ENV=production
PORT=3000
NEXTAUTH_SECRET=generar-un-secret-seguro-aqui
NEXTAUTH_URL=http://su-servidor:3000
```

**⚠️ Posible Error 2**: `DATABASE_URL invalid`
```bash
# Verificar que la ruta existe
ls -la /var/lib/solemar/db/
# Crear si no existe
mkdir -p /var/lib/solemar/db
```

### Paso 6: Instalar Dependencias

```bash
cd /opt/solemar
bun install
```

**⚠️ Posible Error 3**: `Network error` o `ETIMEDOUT`
```bash
# Verificar conexión a internet
ping registry.npmjs.org

# Si hay proxy corporativo, configurar:
export HTTP_PROXY=http://proxy:puerto
export HTTPS_PROXY=http://proxy:puerto
```

### Paso 7: Configurar Base de Datos

```bash
cd /opt/solemar

# Generar cliente Prisma
bun run db:generate

# Crear estructura de base de datos
bun run db:push

# Cargar datos iniciales
bun run db:seed
```

**⚠️ Posible Error 4**: `Prisma Client not generated`
```bash
# Regenerar manualmente
bunx prisma generate
bunx prisma db push
bunx prisma db seed
```

### Paso 8: Compilar el Proyecto

```bash
cd /opt/solemar
bun run build
```

**⚠️ Posible Error 5**: `Build failed` o `TypeScript error`
```bash
# Limpiar y reconstruir
rm -rf .next node_modules
bun install
bun run build
```

### Paso 9: Crear Servicio del Sistema

```bash
# Crear archivo de servicio
sudo nano /etc/systemd/system/solemar.service
```

Contenido:
```ini
[Unit]
Description=Sistema Frigorífico - Solemar Alimentaria
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/solemar
Environment="NODE_ENV=production"
ExecStart=/root/.bun/bin/bun .next/standalone/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/lib/solemar/logs/app.log
StandardError=append:/var/lib/solemar/logs/error.log

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar y iniciar servicio
sudo systemctl daemon-reload
sudo systemctl enable solemar
sudo systemctl start solemar

# Verificar estado
sudo systemctl status solemar
```

### Paso 10: Configurar Firewall

```bash
# Para UFW (Ubuntu)
sudo ufw allow 3000/tcp
sudo ufw reload

# Para firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

---

## 📖 INSTALACIÓN DETALLADA - WINDOWS

### Paso 1: Preparar el Sistema

1. Abrir **PowerShell como Administrador**
2. Verificar versión de Windows:
```powershell
winver
```

3. Instalar características necesarias (si no están):
```powershell
# Verificar .NET Framework
Get-WindowsFeature -Name NET-Framework-45-Core

# Instalar si falta
Install-WindowsFeature -Name NET-Framework-45-Core
```

### Paso 2: Instalar Bun Runtime

```powershell
# Método 1: Usando PowerShell
irm bun.sh/install.ps1 | iex

# Método 2: Si tiene npm instalado
npm install -g bun

# Verificar instalación
bun --version
```

**⚠️ Posible Error 1**: `bun no reconocido como comando`
```powershell
# Agregar al PATH manualmente
$env:Path += ";$env:USERPROFILE\.bun\bin"

# Hacer permanente
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.bun\bin", "User")
```

**⚠️ Posible Error 2**: `Execution Policy restricted`
```powershell
# Cambiar política de ejecución
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Paso 3: Crear Directorios

```powershell
# Crear estructura de directorios
New-Item -ItemType Directory -Path "C:\Solemar" -Force
New-Item -ItemType Directory -Path "C:\Solemar\Data\db" -Force
New-Item -ItemType Directory -Path "C:\Solemar\Data\logs" -Force
New-Item -ItemType Directory -Path "C:\Solemar\Data\backups" -Force
```

### Paso 4: Copiar Archivos

1. Extraer el archivo ZIP del proyecto
2. Copiar contenido de `install/` a `C:\Solemar\`
```powershell
Copy-Item -Path "install\*" -Destination "C:\Solemar\" -Recurse -Force
```

### Paso 5: Configurar Variables de Entorno

```powershell
# Crear archivo .env
Copy-Item "C:\Solemar\.env.example" "C:\Solemar\.env"

# Editar archivo
notepad C:\Solemar\.env
```

Contenido:
```env
DATABASE_URL=file:C:/Solemar/Data/db/custom.db
NODE_ENV=production
PORT=3000
NEXTAUTH_SECRET=generar-un-secret-seguro-aqui
NEXTAUTH_URL=http://localhost:3000
```

### Paso 6: Instalar Dependencias

```powershell
cd C:\Solemar
bun install
```

**⚠️ Posible Error 3**: `Network error`
```powershell
# Verificar conexión
Test-NetConnection registry.npmjs.org -Port 443

# Configurar proxy si es necesario
$env:HTTP_PROXY = "http://proxy:puerto"
$env:HTTPS_PROXY = "http://proxy:puerto"
```

### Paso 7: Configurar Base de Datos

```powershell
cd C:\Solemar

bun run db:generate
bun run db:push
bun run db:seed
```

**⚠️ Posible Error 4**: `Cannot find module '@prisma/client'`
```powershell
# Instalar Prisma globalmente
bun add -g prisma

# Regenerar
bunx prisma generate
bunx prisma db push
```

### Paso 8: Compilar el Proyecto

```powershell
cd C:\Solemar
bun run build
```

### Paso 9: Crear Servicio de Windows (Opcional)

**Opción A: Usando NSSM (Recomendado)**

```powershell
# Descargar NSSM
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "nssm.zip"
Expand-Archive "nssm.zip" -DestinationPath "C:\temp"

# Copiar ejecutable
Copy-Item "C:\temp\nssm-2.24\win64\nssm.exe" "C:\Solemar\"

# Crear servicio
C:\Solemar\nssm.exe install SolemarFrigorifico "C:\Users\$env:USERNAME\.bun\bin\bun.exe" ".next\standalone\server.js"
C:\Solemar\nssm.exe set SolemarFrigorifico AppDirectory "C:\Solemar"
C:\Solemar\nssm.exe set SolemarFrigorifico AppStdout "C:\Solemar\Data\logs\app.log"
C:\Solemar\nssm.exe set SolemarFrigorifico AppStderr "C:\Solemar\Data\logs\error.log"

# Iniciar servicio
Start-Service SolemarFrigorifico
```

**Opción B: Script de inicio manual**

```powershell
# Crear script iniciar.bat
Set-Content -Path "C:\Solemar\iniciar.bat" -Value @"
@echo off
cd /d C:\Solemar
set NODE_ENV=production
bun .next\standalone\server.js
pause
"@

# Crear acceso directo en escritorio
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Solemar.lnk")
$Shortcut.TargetPath = "C:\Solemar\iniciar.bat"
$Shortcut.Save()
```

### Paso 10: Configurar Firewall

```powershell
# Crear regla de firewall
New-NetFirewallRule -DisplayName "Solemar Frigorífico - Puerto 3000" `
    -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## 📖 INSTALACIÓN DETALLADA - macOS

### Paso 1: Instalar Homebrew (si no está instalado)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Paso 2: Instalar Bun

```bash
curl -fsSL https://bun.sh/install | bash

# Agregar al PATH
source ~/.zshrc  # o source ~/.bash_profile
```

### Paso 3: Crear Directorios

```bash
sudo mkdir -p /usr/local/solemar
sudo mkdir -p /usr/local/var/solemar/db
sudo mkdir -p /usr/local/var/solemar/logs
sudo chown -R $(whoami) /usr/local/solemar
sudo chown -R $(whoami) /usr/local/var/solemar
```

### Paso 4: Copiar e Instalar

```bash
# Copiar archivos
cp -r install/* /usr/local/solemar/
cd /usr/local/solemar

# Configurar .env
cp .env.example .env
# Editar DATABASE_URL=file:/usr/local/var/solemar/db/custom.db

# Instalar y compilar
bun install
bun run db:generate
bun run db:push
bun run db:seed
bun run build
```

### Paso 5: Crear Servicio launchd

```bash
nano ~/Library/LaunchAgents/com.solemar.frigorifico.plist
```

Contenido:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.solemar.frigorifico</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/tu_usuario/.bun/bin/bun</string>
        <string>.next/standalone/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/usr/local/solemar</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/usr/local/var/solemar/logs/app.log</string>
    <key>StandardErrorPath</key>
    <string>/usr/local/var/solemar/logs/error.log</string>
</dict>
</plist>
```

```bash
# Cargar servicio
launchctl load ~/Library/LaunchAgents/com.solemar.frigorifico.plist
```

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Error: `Port 3000 already in use`

```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: `Database is locked`

```bash
# Detener el servicio
sudo systemctl stop solemar  # Linux
Stop-Service SolemarFrigorifico  # Windows

# Verificar procesos
lsof /var/lib/solemar/db/custom.db  # Linux

# Reiniciar
sudo systemctl start solemar
```

### Error: `Cannot find module`

```bash
# Reinstalar dependencias
rm -rf node_modules bun.lock
bun install
```

### Error: `Prisma Client could not be generated`

```bash
# Regenerar cliente
bunx prisma generate
bun run db:push
```

### Error: `Out of memory`

```bash
# Aumentar memoria para Node/Bun
export NODE_OPTIONS="--max-old-space-size=4096"
# o en .env:
NODE_OPTIONS=--max-old-space-size=4096
```

### Error: `Permission denied`

```bash
# Linux/macOS
sudo chown -R $(whoami):$(whoami) /opt/solemar
sudo chown -R $(whoami):$(whoami) /var/lib/solemar

# Windows (ejecutar como Admin)
icacls "C:\Solemar" /grant Users:F /T
```

### Logs de Error

```bash
# Linux
tail -f /var/lib/solemar/logs/error.log

# Windows
Get-Content C:\Solemar\Data\logs\error.log -Tail 50 -Wait

# macOS
tail -f /usr/local/var/solemar/logs/error.log
```

---

## ⚙️ CONFIGURACIÓN POST-INSTALACIÓN

### 1. Cambiar Credenciales por Defecto

Acceder al sistema con:
- Usuario: `admin`
- Password: `admin123`

Ir a **Configuración > Operadores** y cambiar la contraseña.

### 2. Configurar Datos del Frigorífico

Ir a **Configuración > Frigorífico** y completar:
- Nombre del establecimiento
- Número de establecimiento SENASA
- CUIT
- Dirección

### 3. Configurar Corrales y Cámaras

Ir a **Configuración > Corrales** y **Configuración > Cámaras** para crear las estructuras físicas.

### 4. Configurar Tipificadores

Ir a **Configuración > Tipificadores** y agregar los matriculados habilitados.

### 5. Configurar Clientes

Ir a **Configuración > Clientes** y crear:
- Productores
- Usuarios de Faena (matarifes)

---

## 🔄 ACTUALIZACIÓN DEL SISTEMA

### Linux
```bash
cd /opt/solemar
git pull origin main
bun install
bun run db:generate
bun run db:push
bun run build
sudo systemctl restart solemar
```

### Windows
```powershell
cd C:\Solemar
git pull origin main
bun install
bun run db:generate
bun run db:push
bun run build
Restart-Service SolemarFrigorifico
```

---

## 💾 BACKUP Y RESTAURACIÓN

### Backup Manual

**Linux:**
```bash
cp /var/lib/solemar/db/custom.db /var/lib/solemar/backups/solemar_$(date +%Y%m%d).db
```

**Windows:**
```powershell
Copy-Item "C:\Solemar\Data\db\custom.db" "C:\Solemar\Data\backups\solemar_$(Get-Date -Format 'yyyyMMdd').db"
```

### Backup Automático (Cron)

**Linux:**
```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * cp /var/lib/solemar/db/custom.db /var/lib/solemar/backups/solemar_$(date +\%Y\%m\%d).db
```

**Windows (Task Scheduler):**
```powershell
# Crear tarea programada
$action = New-ScheduledTaskAction -Execute "C:\Solemar\backup.bat"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "SolemarBackup" -Action $action -Trigger $trigger
```

### Restaurar Backup

**Linux:**
```bash
sudo systemctl stop solemar
cp /var/lib/solemar/backups/solemar_20250101.db /var/lib/solemar/db/custom.db
sudo systemctl start solemar
```

**Windows:**
```powershell
Stop-Service SolemarFrigorifico
Copy-Item "C:\Solemar\Data\backups\solemar_20250101.db" "C:\Solemar\Data\db\custom.db"
Start-Service SolemarFrigorifico
```

---

## 📞 SOPORTE TÉCNICO

Para asistencia técnica, contactar:
- **Email**: soporte@solemar.com.ar
- **GitHub**: https://github.com/aarescalvo/104/issues

---

## 📄 LICENCIA

Software propietario - Solemar Alimentaria
Todos los derechos reservados.
