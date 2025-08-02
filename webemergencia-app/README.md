# 🏨 Hotel Termas Llifen - Página de Emergencia

Aplicación Next.js independiente para el subdominio `webemergencia.termasllifen.cl`.

## 🚀 Instalación Local

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Acceder a http://localhost:3001
```

## 📦 Deployment en Vercel

### Paso 1: Crear proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com) y haz login
2. Clic en "New Project"
3. Importa este repositorio
4. **Configurar Root Directory:** `webemergencia-app`
5. Framework Preset: Next.js
6. Clic en "Deploy"

### Paso 2: Configurar dominio personalizado

1. En el dashboard del proyecto → Settings → Domains
2. Agregar dominio: `webemergencia.termasllifen.cl`
3. Configurar DNS en tu proveedor:

```
CNAME   webemergencia   cname.vercel-dns.com
```

### Paso 3: Configurar Cloudflare (opcional)

1. En Cloudflare → DNS → Records
2. Agregar registro CNAME:
   - Name: `webemergencia`
   - Target: `cname.vercel-dns.com`
   - Proxy status: DNS only (gris)

## 🌐 URLs

- **Desarrollo:** http://localhost:3001
- **Producción:** https://webemergencia.termasllifen.cl

## ✨ Características

- ⚡ Next.js 15 con App Router
- 🎨 Tailwind CSS
- 📱 Responsive design
- 🔗 Enlaces directos WhatsApp y teléfono
- 🚨 Información de emergencia
- ⏰ Hora local en tiempo real

## 📁 Estructura

```
webemergencia-app/
├── src/
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── package.json
├── next.config.js
├── tailwind.config.js
└── README.md
```

## 🛠️ Scripts

- `npm run dev` - Desarrollo local (puerto 3001)
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter

## 📞 Contacto

- **Teléfono:** +56 9 9887 1415
- **Reservas:** +56 63 2197150
- **Email:** contacto@termasllifen.cl 