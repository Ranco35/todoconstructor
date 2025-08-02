'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ['/login', '/register'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      // Si es una ruta pública, permitir acceso inmediatamente
      if (PUBLIC_ROUTES.includes(pathname)) {
        setIsLoading(false);
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user) {
          // Solo redirigir si no hay usuario y no es una ruta pública
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // En caso de error, también redirigir a login
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Mostrar loading solo para rutas protegidas
  if (isLoading && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Siempre mostrar el contenido, la redirección se maneja en el useEffect
  return <>{children}</>;
} 