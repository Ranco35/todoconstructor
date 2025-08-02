import { NextRequest, NextResponse } from 'next/server';
import { parseClientsExcel, importClients } from '@/actions/clients/import';
import { randomUUID } from 'crypto';

// Progreso en memoria (solo para pruebas y pocos usuarios)
const importProgress: { [key: string]: { processed: number; total: number; status: string; error?: string } } = {};

export async function POST(request: NextRequest) {
  try {
    console.log('📥 API: Recibiendo request de importación de clientes');
    const contentType = request.headers.get('content-type') || '';
    let clients: any[] = [];
    let importId = randomUUID();
    let totalClientes = 0;
    if (contentType.includes('application/json')) {
      // Procesar JSON (reintentos, unificación, etc)
      const body = await request.json();
      clients = body.clients || body;
      if (!Array.isArray(clients) || clients.length === 0) {
        return NextResponse.json({ error: 'No se encontraron clientes válidos en el body', importId }, { status: 400 });
      }
      totalClientes = clients.length;
      importProgress[importId] = { processed: 0, total: totalClientes, status: 'processing' };
    } else if (contentType.includes('multipart/form-data')) {
      // Procesar archivo Excel
      const formData = await request.formData();
      const file = formData.get('file') as File;
      if (!file) {
        return NextResponse.json({ error: 'No se proporcionó ningún archivo', importId }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      clients = await parseClientsExcel(arrayBuffer);
      totalClientes = clients.length;
      importProgress[importId] = { processed: 0, total: totalClientes, status: 'processing' };
    } else {
      return NextResponse.json({ error: 'Content-Type no soportado', importId }, { status: 400 });
    }

    if (clients.length === 0) {
      importProgress[importId].status = 'error';
      importProgress[importId].error = 'No se encontraron clientes válidos';
      return NextResponse.json({ error: 'No se encontraron clientes válidos', importId }, { status: 400 });
    }

    // Procesar clientes con progreso
    let processed = 0;
    const importResult = await importClients(
      clients,
      (step) => {
        processed = step;
        importProgress[importId].processed = processed;
      }
    );
    importProgress[importId].processed = totalClientes;
    importProgress[importId].status = 'done';

    // Construir respuesta completa incluyendo pendingUpdates y emailDuplicateGroups
    let message = '';
    if (importResult.emailDuplicateGroups && importResult.emailDuplicateGroups.length > 0) {
      message = `Importación parcial: ${importResult.created} creados, ${importResult.updated} actualizados. ${importResult.emailDuplicateGroups.length} grupo(s) de emails duplicados requieren unificación.`;
    } else if (importResult.pendingUpdates && importResult.pendingUpdates.length > 0) {
      message = `Importación parcial: ${importResult.created} creados. ${importResult.pendingUpdates.length} requieren confirmación.`;
    } else {
      message = `Importación completada. Creados: ${importResult.created}, Actualizados: ${importResult.updated}`;
    }

    // Ajustar mensaje si hay emails inválidos
    if (importResult.invalidEmails && importResult.invalidEmails.length > 0) {
      message += ` ${importResult.invalidEmails.length} email(s) inválido(s) encontrado(s)`;
    }
    
    const response = {
      success: importResult.success,
      message,
      created: importResult.created,
      updated: importResult.updated,
      errors: importResult.errors,
      createdClients: importResult.createdClients,
      updatedClients: importResult.updatedClients,
      pendingUpdates: importResult.pendingUpdates || [],
      invalidEmails: importResult.invalidEmails || [],
      emailDuplicateGroups: importResult.emailDuplicateGroups || [],
      importId
    };
    
    console.log('📤 API: Enviando respuesta:', {
      success: response.success,
      created: response.created,
      updated: response.updated,
      errorsCount: response.errors.length,
      pendingUpdatesCount: response.pendingUpdates.length,
      invalidEmailsCount: response.invalidEmails.length,
      emailDuplicateGroupsCount: response.emailDuplicateGroups.length
    });
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API: Error en importación de clientes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al importar clientes' },
      { status: 500 }
    );
  }
} 

// Endpoint para consultar progreso
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const importId = searchParams.get('id');
  if (!importId || !importProgress[importId]) {
    return NextResponse.json({ error: 'ImportId no encontrado' }, { status: 404 });
  }
  return NextResponse.json(importProgress[importId]);
} 