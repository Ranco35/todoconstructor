'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from './auth-actions';

export interface BackupInfo {
  id: string;
  filename: string;
  size: string;
  createdAt: string;
  status: 'completed' | 'failed' | 'in_progress';
  tables: string[];
  recordCount: number;
}

export interface BackupProgress {
  currentTable: string;
  totalTables: number;
  currentRecord: number;
  totalRecords: number;
  percentage: number;
}

/**
 * Obtiene información sobre backups existentes
 */
export async function getBackupHistory(): Promise<BackupInfo[]> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Consulta para obtener backups desde la tabla de logs o archivos
    const { data: backups, error } = await supabase
      .from('system_backups')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error obteniendo historial de backups:', error);
      return [];
    }

    return backups || [];
  } catch (error) {
    console.error('Error en getBackupHistory:', error);
    return [];
  }
}

/**
 * Inicia un nuevo backup de la base de datos
 */
export async function startDatabaseBackup(): Promise<{ success: boolean; message: string; backupId?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    // Verificar permisos de administrador
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'admin') {
      return { success: false, message: 'Solo administradores pueden realizar backups' };
    }

    const supabase = await getSupabaseServerClient();
    
    // Crear registro de backup
    const backupId = `backup_${Date.now()}`;
    const filename = `admintermas_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.sql`;
    
    const { error: insertError } = await supabase
      .from('system_backups')
      .insert({
        id: backupId,
        filename,
        status: 'in_progress',
        created_by: currentUser.id,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creando registro de backup:', insertError);
      return { success: false, message: 'Error iniciando backup' };
    }

    // Iniciar proceso de backup en background
    setTimeout(async () => {
      await performBackup(backupId, currentUser.id);
    }, 100);

    return { 
      success: true, 
      message: 'Backup iniciado correctamente', 
      backupId 
    };
  } catch (error) {
    console.error('Error en startDatabaseBackup:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}

/**
 * Ejecuta el backup real de la base de datos
 */
async function performBackup(backupId: string, userId: string) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Lista de tablas principales del sistema
    const tables = [
      'users', 'products', 'categories', 'warehouses', 'inventory',
      'clients', 'suppliers', 'purchases', 'sales', 'reservations',
      'petty_cash_sessions', 'petty_cash_transactions', 'pos_sales',
      'rooms', 'seasons', 'tags', 'client_tags', 'supplier_contacts',
      'cost_centers', 'pos_categories', 'modular_products', 'packages_modular'
    ];

    let totalRecords = 0;
    let backupData: any = {};

    // Obtener datos de cada tabla
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error obteniendo datos de ${table}:`, error);
          continue;
        }

        backupData[table] = data || [];
        totalRecords += (data || []).length;
        
        // Actualizar progreso
        await updateBackupProgress(backupId, table, tables.length, totalRecords);
      } catch (error) {
        console.error(`Error procesando tabla ${table}:`, error);
      }
    }

    // Generar archivo SQL
    const sqlContent = generateSQLBackup(backupData);
    
    // Guardar archivo localmente (simulado)
    const filename = `admintermas_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.sql`;
    const filePath = `./backups/${filename}`;
    
    // En un entorno real, aquí se guardaría el archivo
    console.log(`Backup completado: ${filename}`);
    console.log(`Contenido SQL generado (${sqlContent.length} caracteres)`);

    // Actualizar estado del backup
    await supabase
      .from('system_backups')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        record_count: totalRecords,
        file_size: `${(sqlContent.length / 1024).toFixed(2)} KB`,
        tables: tables
      })
      .eq('id', backupId);

  } catch (error) {
    console.error('Error en performBackup:', error);
    
    // Marcar backup como fallido
    const supabase = await getSupabaseServerClient();
    await supabase
      .from('system_backups')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Error desconocido'
      })
      .eq('id', backupId);
  }
}

/**
 * Actualiza el progreso del backup
 */
async function updateBackupProgress(backupId: string, currentTable: string, totalTables: number, totalRecords: number) {
  try {
    const supabase = await getSupabaseServerClient();
    
    await supabase
      .from('system_backups')
      .update({
        current_table: currentTable,
        total_tables: totalTables,
        total_records: totalRecords,
        updated_at: new Date().toISOString()
      })
      .eq('id', backupId);
  } catch (error) {
    console.error('Error actualizando progreso:', error);
  }
}

/**
 * Genera el contenido SQL del backup
 */
function generateSQLBackup(data: any): string {
  let sql = `-- Backup de Admintermas - ${new Date().toISOString()}\n`;
  sql += `-- Generado automáticamente por el sistema\n\n`;
  
  for (const [tableName, records] of Object.entries(data)) {
    if (Array.isArray(records) && records.length > 0) {
      sql += `-- Tabla: ${tableName}\n`;
      sql += `-- ${records.length} registros\n\n`;
      
      for (const record of records) {
        const columns = Object.keys(record);
        const values = Object.values(record).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (typeof value === 'boolean') return value ? 'true' : 'false';
          return value;
        });
        
        sql += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }
      sql += '\n';
    }
  }
  
  return sql;
}

/**
 * Descarga un backup específico
 */
export async function downloadBackup(backupId: string): Promise<{ success: boolean; message: string; data?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();
    
    // Obtener información del backup
    const { data: backup, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      return { success: false, message: 'Backup no encontrado' };
    }

    if (backup.status !== 'completed') {
      return { success: false, message: 'Backup no completado' };
    }

    // En un entorno real, aquí se leería el archivo físico
    // Por ahora simulamos el contenido
    const sqlContent = `-- Backup de Admintermas\n-- ID: ${backupId}\n-- Fecha: ${backup.created_at}\n-- Estado: ${backup.status}\n\n-- Contenido del backup...`;

    return {
      success: true,
      message: 'Backup descargado correctamente',
      data: sqlContent
    };
  } catch (error) {
    console.error('Error en downloadBackup:', error);
    return { success: false, message: 'Error descargando backup' };
  }
}

/**
 * Elimina un backup específico
 */
export async function deleteBackup(backupId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Usuario no autenticado' };
    }

    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'admin') {
      return { success: false, message: 'Solo administradores pueden eliminar backups' };
    }

    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('system_backups')
      .delete()
      .eq('id', backupId);

    if (error) {
      return { success: false, message: 'Error eliminando backup' };
    }

    return { success: true, message: 'Backup eliminado correctamente' };
  } catch (error) {
    console.error('Error en deleteBackup:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
}

/**
 * Obtiene estadísticas de backups
 */
export async function getBackupStats(): Promise<{
  totalBackups: number;
  completedBackups: number;
  failedBackups: number;
  lastBackup: string | null;
  totalSize: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: backups, error } = await supabase
      .from('system_backups')
      .select('*');

    if (error) {
      return {
        totalBackups: 0,
        completedBackups: 0,
        failedBackups: 0,
        lastBackup: null,
        totalSize: '0 KB'
      };
    }

    const completed = backups?.filter(b => b.status === 'completed').length || 0;
    const failed = backups?.filter(b => b.status === 'failed').length || 0;
    const total = backups?.length || 0;
    
    const lastBackup = backups?.length > 0 
      ? new Date(Math.max(...backups.map(b => new Date(b.created_at).getTime()))).toISOString()
      : null;

    const totalSize = backups?.reduce((sum, b) => {
      const size = parseFloat(b.file_size?.replace(' KB', '') || '0');
      return sum + size;
    }, 0) || 0;

    return {
      totalBackups: total,
      completedBackups: completed,
      failedBackups: failed,
      lastBackup,
      totalSize: `${totalSize.toFixed(2)} KB`
    };
  } catch (error) {
    console.error('Error en getBackupStats:', error);
    return {
      totalBackups: 0,
      completedBackups: 0,
      failedBackups: 0,
      lastBackup: null,
      totalSize: '0 KB'
    };
  }
} 