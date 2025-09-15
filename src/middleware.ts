import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Crear respuesta para manejar cookies de Supabase
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Crear cliente Supabase con manejo de cookies
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

  // Verificar sesión de Supabase
  const { data: { session } } = await supabase.auth.getSession()
  const hasSupabaseSession = !!session

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
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


