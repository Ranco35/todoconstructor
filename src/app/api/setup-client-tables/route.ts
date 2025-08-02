import { NextResponse } from 'next/server';
import { setupClientTables, insertDefaultData } from '@/actions/clients/setup-tables';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    console.log('🔍 VERIFICANDO ESTADO DE TABLAS CLIENTES...');
    
    // Verificar si las tablas existen intentando consultar cada una
    const tablesToCheck = ['Client', 'ClientContact', 'ClientAddress', 'ClientDocument'];
    const existingTables: string[] = [];
    const tableDetails: Record<string, any> = {};
    
    for (const tableName of tablesToCheck) {
      try {
        const supabase = await getSupabaseServerClient();
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          existingTables.push(tableName);
          tableDetails[tableName] = { exists: true, count };
          console.log(`✅ Tabla ${tableName} existe con ${count} registros`);
        } else {
          tableDetails[tableName] = { exists: false, error: error.message };
          console.log(`❌ Tabla ${tableName}: ${error.message}`);
        }
      } catch (e) {
        // Tabla no existe o no es accesible
        tableDetails[tableName] = { exists: false, error: 'No accesible' };
        console.log(`❌ Tabla ${tableName} no existe o no es accesible`);
      }
    }
    
    return NextResponse.json({
      success: true,
      tablesExist: {
        Client: existingTables.includes('Client'),
        ClientContact: existingTables.includes('ClientContact'),
        ClientAddress: existingTables.includes('ClientAddress'),
        ClientDocument: existingTables.includes('ClientDocument')
      },
      allTablesReady: existingTables.length === 4,
      existingTables,
      tableDetails
    });
    
  } catch (error) {
    console.error('🔍 ERROR VERIFICANDO TABLAS:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🚀 SETUP: Iniciando configuración de tablas de clientes...');
    
    // Crear tablas
    const setupResult = await setupClientTables();
    console.log('🚀 SETUP TABLES RESULT:', setupResult);
    
    // Insertar datos por defecto
    const dataResult = await insertDefaultData();
    console.log('🚀 INSERT DATA RESULT:', dataResult);
    
    return NextResponse.json({
      success: true,
      setup: setupResult,
      data: dataResult
    });
    
  } catch (error) {
    console.error('🚀 SETUP ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 