import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Rutas API que NO requieren autenticación (webhooks, públicas)
// IMPORTANTE: /api/auth debe ser pública para permitir el propio login.
// Las rutas dentro de /api/auth que requieren sesión (ej. current-user)
// hacen su propia verificación con getUser() y retornan 401 si corresponde.
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/webhooks',
  '/api/cron',
  '/api/mcp',
  '/api/health',
]

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname === '/login'
  const isApiRoute = pathname.startsWith('/api/')

  // Si no es ruta protegida ni API, continuar
  if (!isProtectedRoute && !isApiRoute) {
    return NextResponse.next()
  }

  // Rutas API públicas no requieren auth
  if (isApiRoute && isPublicApiRoute(pathname)) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as CookieOptions)
          })
        },
      },
    }
  )

  // Verificar usuario (getUser() valida JWT contra el servidor)
  let hasSupabaseSession = false
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    hasSupabaseSession = !!user && !error
  } catch (error) {
    console.warn('Middleware: Error verificando sesión:', error)
    hasSupabaseSession = false
  }

  // Proteger rutas API: devolver 401 si no autenticado
  if (isApiRoute && !hasSupabaseSession) {
    return NextResponse.json(
      { success: false, error: 'No autorizado' },
      { status: 401 }
    )
  }

  // Proteger rutas del dashboard
  if (!hasSupabaseSession && pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Evitar que usuarios autenticados vean /login
  if (hasSupabaseSession && pathname === '/login') {
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
