# Instalación y Configuración

## 📋 Requisitos del Sistema

### Tecnologías Utilizadas
- **Next.js**: 15.3.3
- **React**: 19.0.0
- **Prisma**: 6.9.0
- **PostgreSQL**: Base de datos
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x

### Requisitos Previos
- Node.js 18+ instalado
- PostgreSQL instalado y configurado
- Git instalado

## 🚀 Instalación

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Ranco35/AdminTermas.git
cd AdminTermas
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear archivo `.env`:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/admin_termas"
```

### 4. Configurar Base de Datos
```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma db push

# (Opcional) Poblar con datos de prueba
npx prisma db seed
```

### 5. Ejecutar en Desarrollo
```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Iniciar servidor de producción
npm start

# Linter
npm run lint

# Generar cliente de Prisma
npm run postinstall
```

## 🌐 Configuración para Producción

### Variables de Entorno Adicionales
```env
NEXTAUTH_SECRET="tu-secreto-aqui"
NEXTAUTH_URL="https://tu-dominio.com"
```

### Despliegue en Vercel
1. Conectar repositorio de GitHub
2. Configurar variables de entorno
3. Deploy automático configurado

## ✅ Verificación de Instalación

### Comprobar que todo funciona:
1. Acceder a `http://localhost:3000` - Página de inicio
2. Acceder a `http://localhost:3000/dashboard` - Dashboard principal
3. Acceder a `http://localhost:3000/dashboard/category` - Módulo de categorías

### Problemas Comunes
Ver [Troubleshooting](../troubleshooting/resolved-issues.md) para soluciones. 