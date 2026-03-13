# 🤖 CLAUDE.md — todoconstructor
> **URL producción:** todoconstructor.cl
> **GitHub:** Ranco35/todoconstructor
> **Descripción:** Plataforma para el sector construcción

---

## 📖 Recursos compartidos del ecosistema

> ⚠️ **IMPORTANTE — Lee estos archivos antes de crear cualquier cosa:**

- **IDEAS.md** (componentes reutilizables + dashboard de propagación):
  `C:\Users\eduar\DJANGO\Programas-Principales\IDEAS.md`

- **CLAUDE.md global** (contexto general del ecosistema):
  `C:\Users\eduar\DJANGO\Programas-Principales\CLAUDE.md`

### Instrucciones
1. **Antes de crear algo**, consulta `IDEAS.md` — puede que ya exista en otro proyecto
2. **Cuando implementes algo útil**, actualiza el dashboard de propagación en `IDEAS.md`
3. **`admintermas` es el proyecto más completo** — busca allí componentes reutilizables
4. **No dupliques código** — si algo existe, reutilízalo

---

## 🛠️ Stack de este proyecto

- **Framework:** Next.js (App Router)
- **Estilos:** Tailwind CSS + shadcn/ui + Radix UI
- **Base de datos:** Supabase (PostgreSQL) — compartida con app Android
- **Auth:** Supabase Auth + `@supabase/ssr`
- **Deploy:** Vercel (automático desde GitHub `main`)
- **Íconos:** Lucide React
- **Validación:** Zod

---

## 📱 Arquitectura Full-Stack

| Capa | Tecnología | Deploy |
|------|-----------|--------|
| Web | Next.js (App Router) | Vercel |
| Android | Android Studio (Kotlin/Java) | Play Store / APK |
| Base de datos | Supabase (PostgreSQL) | Supabase Cloud |
| Auth | Supabase Auth | Supabase Cloud |

### Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 🚀 Comandos frecuentes

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Instalar dependencias
npm install

# Abrir Claude Code
claude
```

---

*Proyecto: todoconstructor | Eduardo Proboste — eduardo@termasllifen.cl*