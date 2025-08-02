import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import EmailConfiguration from '@/components/configuration/EmailConfiguration';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EmailConfigurationPage() {
  // Verificar autenticación
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración de Emails</h1>
          <p className="text-gray-600">Configurar y gestionar el sistema de correos electrónicos</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/configuration"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Volver a Configuración
          </Link>
          <Link
            href="/dashboard/emails"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard de Emails
          </Link>
        </div>
      </div>

      {/* Componente de configuración */}
      <EmailConfiguration />
    </div>
  );
} 