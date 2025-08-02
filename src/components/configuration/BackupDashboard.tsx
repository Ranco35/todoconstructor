'use client';

import { useState, useEffect } from 'react';
import { startDatabaseBackup, downloadBackup, deleteBackup, getBackupHistory, getBackupStats } from '@/actions/configuration/backup-actions';
import { BackupInfo } from '@/actions/configuration/backup-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Trash2, 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Database,
  HardDrive,
  Calendar,
  FileText,
  RefreshCw
} from 'lucide-react';

interface BackupStats {
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  lastBackup: string | null;
  totalSize: string;
}

interface BackupDashboardProps {
  currentUser: any;
}

export default function BackupDashboard({ currentUser }: BackupDashboardProps) {
  const { toast } = useToast();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStats, setCurrentStats] = useState<BackupStats>({
    totalBackups: 0,
    completedBackups: 0,
    failedBackups: 0,
    lastBackup: null,
    totalSize: '0 KB'
  });
  const [currentHistory, setCurrentHistory] = useState<BackupInfo[]>([]);
  const [downloadingBackup, setDownloadingBackup] = useState<string | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);

  // Función para cargar datos iniciales
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [newStats, newHistory] = await Promise.all([
        getBackupStats(),
        getBackupHistory()
      ]);
      setCurrentStats(newStats);
      setCurrentHistory(newHistory);
    } catch (error) {
      console.error('Error cargando datos de backup:', error);
      toast({
        title: "❌ Error",
        description: "Error cargando datos del sistema de backup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Función para actualizar datos
  const refreshData = async () => {
    await loadData();
  };

  // Función para iniciar backup
  const handleStartBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const result = await startDatabaseBackup();
      
      if (result.success) {
        toast({
          title: "✅ Backup iniciado",
          description: result.message,
        });
        
        // Actualizar datos después de un breve delay
        setTimeout(() => {
          refreshData();
        }, 2000);
      } else {
        toast({
          title: "❌ Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error interno del servidor",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Función para descargar backup
  const handleDownloadBackup = async (backupId: string) => {
    setDownloadingBackup(backupId);
    try {
      const result = await downloadBackup(backupId);
      
      if (result.success && result.data) {
        // Crear y descargar archivo
        const blob = new Blob([result.data], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${backupId}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "✅ Backup descargado",
          description: "El archivo se ha descargado correctamente",
        });
      } else {
        toast({
          title: "❌ Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error descargando backup",
        variant: "destructive",
      });
    } finally {
      setDownloadingBackup(null);
    }
  };

  // Función para eliminar backup
  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este backup?')) {
      return;
    }

    setDeletingBackup(backupId);
    try {
      const result = await deleteBackup(backupId);
      
      if (result.success) {
        toast({
          title: "✅ Backup eliminado",
          description: result.message,
        });
        refreshData();
      } else {
        toast({
          title: "❌ Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Error eliminando backup",
        variant: "destructive",
      });
    } finally {
      setDeletingBackup(null);
    }
  };

  // Función para obtener badge de estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Fallido</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />En progreso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de backup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Backups</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalBackups}</div>
            <p className="text-xs text-muted-foreground">
              {currentStats.completedBackups} completados, {currentStats.failedBackups} fallidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamaño Total</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalSize}</div>
            <p className="text-xs text-muted-foreground">
              Espacio ocupado en backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.lastBackup ? '✅' : '❌'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStats.lastBackup ? formatDate(currentStats.lastBackup) : 'Nunca'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">✅</div>
            <p className="text-xs text-muted-foreground">
              Sistema operativo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="w-5 h-5 mr-2" />
              Crear Nuevo Backup
            </CardTitle>
            <CardDescription>
              Inicia un backup completo de la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Este proceso puede tomar varios minutos dependiendo del tamaño de la base de datos.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Incluye todas las tablas principales del sistema
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Genera archivo SQL completo y ejecutable
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Guarda en tu PC local automáticamente
              </div>
            </div>

            <Button 
              onClick={handleStartBackup}
              disabled={isCreatingBackup}
              className="w-full"
              size="lg"
            >
              {isCreatingBackup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creando backup...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Información del Sistema
            </CardTitle>
            <CardDescription>
              Detalles sobre el sistema de backup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Usuario actual:</span>
                <span className="text-sm text-muted-foreground">{currentUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rol:</span>
                <Badge variant="outline">{currentUser.role}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Permisos:</span>
                <Badge className="bg-green-100 text-green-800">Administrador</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Última actualización:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleString('es-CL')}
                </span>
              </div>
            </div>
            
            <Button 
              onClick={refreshData}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar Datos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Historial de Backups
          </CardTitle>
          <CardDescription>
            Lista de todos los backups realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay backups realizados aún</p>
              <p className="text-sm text-muted-foreground mt-2">
                Crea tu primer backup para comenzar
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentHistory.map((backup) => (
                <div key={backup.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{backup.filename}</h4>
                        {getStatusBadge(backup.status)}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span>📅 {formatDate(backup.createdAt)}</span>
                        <span>📊 {backup.recordCount} registros</span>
                        <span>💾 {backup.size}</span>
                      </div>
                      {backup.tables && backup.tables.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground">
                            Tablas: {backup.tables.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {backup.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadBackup(backup.id)}
                          disabled={downloadingBackup === backup.id}
                        >
                          {downloadingBackup === backup.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id)}
                        disabled={deletingBackup === backup.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingBackup === backup.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 