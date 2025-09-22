'use client';
import UniversalHorizontalMenu from '@/components/shared/UniversalHorizontalMenu';
import { createClient } from '@/lib/supabase';
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { EmailAnalysisProvider, useEmailAnalysisPopup } from '@/contexts/EmailAnalysisContext';
import EmailAnalysisPopup from '@/components/emails/EmailAnalysisPopup';

// Componente interno que usa el hook
function DashboardContent({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();
  const { isPopupOpen, popupTrigger, showPopup, hidePopup } = useEmailAnalysisPopup();

  useEffect(() => {
    async function loadUser() {
      try {
        console.log('🔍 Dashboard Layout: Verificando usuario...');
        
        // Usar Supabase auth directo en cliente con cookies
        const supabase = createClient();
        
        // Intentar obtener sesión primero con timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );
        
        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (sessionError) {
          console.log('❌ Dashboard Layout: Error obteniendo sesión:', sessionError.message);
          setShouldRedirect(true);
          return;
        }
        
        if (!session) {
          console.log('❌ Dashboard Layout: No hay sesión activa, redirigiendo a login');
          setShouldRedirect(true);
          return;
        }
        
        console.log('✅ Dashboard Layout: Sesión encontrada:', session.user.email);
        
        // Verificar usuario (usar la sesión que ya tenemos)
        const user = session.user;
        
        if (!user) {
          console.log('❌ Dashboard Layout: Usuario no encontrado en sesión, redirigiendo a login');
          setShouldRedirect(true);
          return;
        }

        // Obtener perfil del usuario desde la tabla User con timeout
        const profilePromise = supabase
          .from('User')
          .select('id, name, email, Role(roleName), department, isCashier, isActive')
          .eq('id', user.id)
          .single();
        
        const profileTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile timeout')), 10000)
        );
        
        const { data: userProfile, error: profileError } = await Promise.race([
          profilePromise,
          profileTimeoutPromise
        ]) as any;

        // Si hay error obteniendo el perfil, usar datos básicos de la sesión
        const userData = {
          id: user.id,
          username: userProfile?.name || user.email?.split('@')[0] || 'Usuario',
          email: user.email || '',
          firstName: userProfile?.name?.split(' ')[0] || user.email?.split('@')[0] || 'Usuario',
          lastName: userProfile?.name?.split(' ').slice(1).join(' ') || '',
          role: userProfile?.Role ? (userProfile.Role as any).roleName : 'user',
          department: userProfile?.department || null,
          isCashier: userProfile?.isCashier || false,
          isActive: userProfile?.isActive !== false,
          lastLogin: null
        };

        console.log('✅ Dashboard Layout: Usuario verificado:', userData.email, 'Rol:', userData.role);
        setCurrentUser(userData);
        
        // Mostrar popup de análisis al cargar el dashboard (simula login)
        setTimeout(() => {
          showPopup('login');
        }, 2000); // Esperar 2 segundos después de cargar
        
      } catch (err: any) {
        console.error('💥 Dashboard Layout Error:', err);
        
        // Si es timeout o error de perfil, usar datos básicos de la sesión
        if (err.message === 'Profile timeout' || err.message.includes('Profile')) {
          console.log('⚠️ Dashboard Layout: Usando datos básicos de sesión debido a timeout');
          
          // Crear datos básicos del usuario desde la sesión
          const basicUserData = {
            id: user.id,
            username: user.email?.split('@')[0] || 'Usuario',
            email: user.email || '',
            firstName: user.email?.split('@')[0] || 'Usuario',
            lastName: '',
            role: 'ADMINISTRADOR', // Rol por defecto
            department: null,
            isCashier: false,
            isActive: true,
            lastLogin: null
          };
          
          setCurrentUser(basicUserData);
          console.log('✅ Dashboard Layout: Usuario básico configurado:', basicUserData.email);
        } else {
          // Para otros errores, mostrar error y redirigir
          setError(err.message);
          setShouldRedirect(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();

    // Escuchar cambios de autenticación
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Dashboard Layout: Cambio de autenticación:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('🚪 Dashboard Layout: Usuario deslogueado, redirigiendo...');
        setShouldRedirect(true);
      } else if (event === 'SIGNED_IN' && session) {
        console.log('✅ Dashboard Layout: Usuario logueado, recargando datos...');
        loadUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [showPopup]);

  // Handle redirects in a separate useEffect
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error de autenticación: {error}</p>
            <button 
              onClick={() => router.push('/login')}
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Ir a Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || shouldRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo a login...</p>
        </div>
      </div>
    );
  }

  const userName = currentUser.firstName && currentUser.lastName 
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser.username || currentUser.email || 'Usuario';

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Menú Horizontal Universal */}
        <UniversalHorizontalMenu 
          currentUser={currentUser}
        />
        
        {/* Contenido Principal */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>

      {/* Popup de análisis de emails */}
      <EmailAnalysisPopup
        isOpen={isPopupOpen}
        onClose={hidePopup}
        userName={userName}
        trigger={popupTrigger}
      />
    </>
  );
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <EmailAnalysisProvider>
      <DashboardContent>
        {children}
      </DashboardContent>
    </EmailAnalysisProvider>
  );
}
