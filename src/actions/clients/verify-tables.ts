'use server'

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export interface TableVerificationResult {
  tableName: string;
  exists: boolean;
  error?: string;
  recordCount?: number;
}

export interface VerificationSummary {
  success: boolean;
  tables: TableVerificationResult[];
  totalTables: number;
  existingTables: number;
  missingTables: string[];
}

export async function verifyClientTables(): Promise<VerificationSummary> {
  try {
    const supabase = await getSupabaseServerClient();
    const requiredTables = [
      'Country',
      'EconomicSector', 
      'RelationshipType',
      'Client',
      'ClientContact',
      'ClientTag',
      'ClientTagAssignment'
    ];

    const results: TableVerificationResult[] = [];
    const missingTables: string[] = [];

    for (const tableName of requiredTables) {
      try {
        // Intentar hacer una consulta simple para verificar que la tabla existe
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          if (error.code === '42P01') {
            // Tabla no existe
            results.push({
              tableName,
              exists: false,
              error: 'Tabla no encontrada'
            });
            missingTables.push(tableName);
          } else {
            // Otro error
            results.push({
              tableName,
              exists: false,
              error: error.message
            });
            missingTables.push(tableName);
          }
        } else {
          // Tabla existe
          results.push({
            tableName,
            exists: true,
            recordCount: count || 0
          });
        }
      } catch (err: any) {
        results.push({
          tableName,
          exists: false,
          error: `Error al verificar tabla ${tableName}: ${err?.message || err}`
        });
        missingTables.push(tableName);
      }
    }

    const existingTables = results.filter(r => r.exists).length;
    const success = existingTables === requiredTables.length;

    return {
      success,
      tables: results,
      totalTables: requiredTables.length,
      existingTables,
      missingTables
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Error general: ${error?.message || error}`,
      tables: [],
      totalTables: 0,
      existingTables: 0,
      missingTables: []
    };
  }
}

export async function testClientOperations(): Promise<{
  success: boolean;
  operations: Array<{
    operation: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const supabase = await getSupabaseServerClient();
  const operations = [];

  try {
    // 1. Verificar que podemos obtener países
    const { data: countries, error: countriesError } = await supabase
      .from('Country')
      .select('*')
      .limit(1);
    
    operations.push({
      operation: 'Leer países',
      success: !countriesError,
      error: countriesError?.message
    });

    // 2. Verificar que podemos obtener sectores económicos
    const { data: sectors, error: sectorsError } = await supabase
      .from('EconomicSector')
      .select('*')
      .limit(1);
    
    operations.push({
      operation: 'Leer sectores económicos',
      success: !sectorsError,
      error: sectorsError?.message
    });

    // 3. Verificar que podemos obtener tipos de relación
    const { data: relations, error: relationsError } = await supabase
      .from('RelationshipType')
      .select('*')
      .limit(1);
    
    operations.push({
      operation: 'Leer tipos de relación',
      success: !relationsError,
      error: relationsError?.message
    });

    // 4. Verificar que podemos obtener etiquetas
    const { data: tags, error: tagsError } = await supabase
      .from('ClientTag')
      .select('*')
      .limit(1);
    
    operations.push({
      operation: 'Leer etiquetas',
      success: !tagsError,
      error: tagsError?.message
    });

    // 5. Verificar que podemos crear un cliente de prueba (y luego eliminarlo)
    const testClient = {
      tipoCliente: 'empresa',
      nombrePrincipal: 'Cliente de Prueba',
      email: 'test@example.com',
      estado: 'activo'
    };

    const { data: createdClient, error: createError } = await supabase
      .from('Client')
      .insert(testClient)
      .select()
      .single();

    if (createError) {
      operations.push({
        operation: 'Crear cliente',
        success: false,
        error: createError.message
      });
    } else {
      // Eliminar el cliente de prueba
      const { error: deleteError } = await supabase
        .from('Client')
        .delete()
        .eq('id', createdClient.id);

      operations.push({
        operation: 'Crear y eliminar cliente',
        success: !deleteError,
        error: deleteError?.message
      });
    }

  } catch (error) {
    operations.push({
      operation: 'Operaciones generales',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }

  const success = operations.every(op => op.success);

  return {
    success,
    operations
  };
} 