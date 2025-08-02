import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Verificar permisos de administrador
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo administradores pueden descargar backups' },
        { status: 403 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    // Obtener información del backup
    const { data: backup, error } = await supabase
      .from('system_backups')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !backup) {
      return NextResponse.json(
        { error: 'Backup no encontrado' },
        { status: 404 }
      );
    }

    if (backup.status !== 'completed') {
      return NextResponse.json(
        { error: 'Backup no completado' },
        { status: 400 }
      );
    }

    // Generar contenido SQL del backup (simulado)
    const sqlContent = generateBackupContent(backup);

    // Crear respuesta con archivo
    const response = new NextResponse(sqlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="${backup.filename}"`,
        'Content-Length': sqlContent.length.toString(),
      },
    });

    return response;
  } catch (error) {
    console.error('Error en descarga de backup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generateBackupContent(backup: any): string {
  let sql = `-- Backup de Admintermas\n`;
  sql += `-- ID: ${backup.id}\n`;
  sql += `-- Fecha: ${backup.created_at}\n`;
  sql += `-- Estado: ${backup.status}\n`;
  sql += `-- Registros: ${backup.record_count || 0}\n`;
  sql += `-- Tamaño: ${backup.file_size || 'N/A'}\n`;
  sql += `-- Generado por: Sistema de Backup Admintermas\n\n`;
  
  if (backup.tables && backup.tables.length > 0) {
    sql += `-- Tablas incluidas en este backup:\n`;
    backup.tables.forEach((table: string) => {
      sql += `-- - ${table}\n`;
    });
    sql += `\n`;
  }
  
  sql += `-- ==========================================\n`;
  sql += `-- INICIO DEL BACKUP\n`;
  sql += `-- ==========================================\n\n`;
  
  // Aquí se incluiría el contenido real del backup
  // Por ahora es simulado
  sql += `-- Este es un backup simulado del sistema Admintermas\n`;
  sql += `-- En un entorno real, aquí estarían todos los INSERT statements\n`;
  sql += `-- con los datos de todas las tablas del sistema\n\n`;
  
  sql += `-- Ejemplo de estructura:\n`;
  sql += `-- INSERT INTO users (id, name, email, role) VALUES (...);\n`;
  sql += `-- INSERT INTO products (id, name, price, category_id) VALUES (...);\n`;
  sql += `-- INSERT INTO categories (id, name, description) VALUES (...);\n`;
  sql += `-- ... y así sucesivamente para todas las tablas\n\n`;
  
  sql += `-- ==========================================\n`;
  sql += `-- FIN DEL BACKUP\n`;
  sql += `-- ==========================================\n`;
  sql += `-- Para restaurar este backup, ejecuta este archivo SQL\n`;
  sql += `-- en tu base de datos Supabase o PostgreSQL\n`;
  
  return sql;
} 