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
        
        // Usar Supabase auth directo en cliente (CORRECTO)
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('❌ Dashboard Layout: Usuario no encontrado, redirigiendo a login');
          setShouldRedirect(true);
          return;
        }

        // Obtener perfil del usuario desde la tabla User
        const { data: userProfile, error: profileError } = await supabase
          .from('User')
          .select('id, name, email, Role(roleName), department, isCashier, isActive')
          .eq('id', user.id)
          .single();

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
        setError(err.message);
        // En caso de error, redirigir a login
        setShouldRedirect(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
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
