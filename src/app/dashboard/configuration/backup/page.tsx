import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { redirect } from 'next/navigation';
import BackupDashboard from '@/components/configuration/BackupDashboard';

export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  // Verificar permisos de administrador
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🔄 Backup de Base de Datos</h1>
            <p className="text-blue-100">
              Sistema de respaldo automático y gestión de backups
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">💾</div>
            <div className="text-blue-200">Sistema de Backup</div>
          </div>
        </div>
      </div>

      {/* Dashboard de Backup */}
      <BackupDashboard currentUser={currentUser} />
    </div>
  );
} 