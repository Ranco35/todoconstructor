'use server';

import { generateClientsExcel } from './export';
import { importClients, parseClientsExcel } from './import';

// Función wrapper para exportar clientes
export async function exportClients() {
  try {
    const excelBuffer = await generateClientsExcel();
    return {
      success: true,
      data: excelBuffer
    };
  } catch (error) {
    console.error('Error exporting clients:', error);
    return {
      success: false,
      error: 'Error al exportar clientes'
    };
  }
}

// Función wrapper para importar clientes desde archivo
export async function importClientsFromFile(file: File) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const clients = parseClientsExcel(arrayBuffer);
    const result = await importClients(clients);
    return result;
  } catch (error) {
    console.error('Error importing clients from file:', error);
    return {
      success: false,
      message: 'Error al importar clientes',
      created: 0,
      updated: 0,
      errors: ['Error interno del servidor']
    };
  }
}

// Función wrapper para generar template
export async function generateClientTemplate() {
  try {
    const { generateClientTemplate } = await import('./export');
    const templateBuffer = await generateClientTemplate();
    return {
      success: true,
      data: templateBuffer
    };
  } catch (error) {
    console.error('Error generating client template:', error);
    return {
      success: false,
      error: 'Error al generar plantilla'
    };
  }
} 