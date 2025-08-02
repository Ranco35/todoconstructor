import { NextResponse } from 'next/server';
import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    console.log('🧪 TEST ENDPOINT: Iniciando diagnóstico...');
    
    // Verificar variables de entorno
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🧪 ENV CHECK:', { hasSupabaseUrl, hasServiceKey });
    
    // Probar conexión a Supabase
    console.log('🧪 Probando conexión a Supabase...');
    
    let connectionTest = {
      connected: false,
      error: '',
      tablesFound: [],
      clientsCount: null,
      tableTests: {}
    };
    
    try {
      // Probar tablas conocidas del sistema según las migraciones
      const knownTables = ['Role', 'Category', 'Cost_Center', 'User', 'Supplier', 'Warehouse', 'Product'];
      
      const supabase = await getSupabaseServerClient();
      for (const tableName of knownTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            connectionTest.tablesFound.push(tableName);
            connectionTest.tableTests[tableName] = { exists: true, count };
          } else {
            connectionTest.tableTests[tableName] = { exists: false, error: error.message };
          }
        } catch (e) {
          connectionTest.tableTests[tableName] = { exists: false, error: 'No accesible' };
        }
      }
      
      // Si encontramos al menos una tabla, la conexión funciona
      if (connectionTest.tablesFound.length > 0) {
        connectionTest.connected = true;
        
        // Probar específicamente si existen las tablas de clientes
        const clientTables = ['Client', 'ClientContact', 'ClientAddress', 'ClientDocument'];
        for (const tableName of clientTables) {
          try {
            const { count, error } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              connectionTest.tablesFound.push(tableName);
              connectionTest.tableTests[tableName] = { exists: true, count };
              
              if (tableName === 'Client') {
                connectionTest.clientsCount = count;
              }
            } else {
              connectionTest.tableTests[tableName] = { exists: false, error: error.message };
            }
          } catch (e) {
            connectionTest.tableTests[tableName] = { exists: false, error: 'No accesible' };
          }
        }
      } else {
        connectionTest.error = 'No se pudo conectar a ninguna tabla del sistema';
      }
      
    } catch (supabaseError) {
      connectionTest.error = supabaseError instanceof Error ? supabaseError.message : 'Error de conexión desconocido';
    }
    
    console.log('🧪 CONNECTION TEST RESULT:', connectionTest);
    
    return NextResponse.json({
      success: true,
      environment: {
        hasSupabaseUrl,
        hasServiceKey,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
      },
      supabaseTest: connectionTest
    });
    
  } catch (error) {
    console.error('🧪 TEST ENDPOINT ERROR:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 