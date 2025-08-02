import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Datos de ejemplo para la plantilla
    const data = [
      { 
        'ID': '(dejar vacío para crear)', 
        'Nombre Categoria': 'Electrónicos', 
        'Descripcion': 'Dispositivos y gadgets electrónicos.', 
        'ID Categoria Padre': '(opcional)',
        'Nombre Categoria Padre': '(opcional)'
      },
      { 
        'ID': '', 
        'Nombre Categoria': 'Celulares', 
        'Descripcion': 'Smartphones y accesorios.', 
        'ID Categoria Padre': '',
        'Nombre Categoria Padre': 'Electrónicos' // Ejemplo usando el nombre
      },
      { 
        'ID': '', 
        'Nombre Categoria': 'Laptops', 
        'Descripcion': '', 
        'ID Categoria Padre': '1', // Ejemplo usando el ID (si Electrónicos es ID 1)
        'Nombre Categoria Padre': ''
      },
      { 
        'ID': '3', 
        'Nombre Categoria': 'Libros y Cómics', 
        'Descripcion': 'Actualizando nombre y descripción', 
        'ID Categoria Padre': '',
        'Nombre Categoria Padre': ''
      },
    ];

    // Crear una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Categorias');

    // Cabeceras
    worksheet['A1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "FFFFAA00" } } };
    worksheet['B1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "FFFFAA00" } } };
    worksheet['C1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "FFFFAA00" } } };
    worksheet['D1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "FFFFAA00" } } };
    worksheet['E1'].s = { font: { bold: true }, fill: { fgColor: { rgb: "FFFFAA00" } } };

    // Ajustar el ancho de las columnas
    worksheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 50 }, { wch: 20 }, { wch: 25 }];

    // Generar el buffer del archivo Excel
    const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    // Devolver el archivo como respuesta
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="plantilla_categorias.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('Error al generar la plantilla de categorías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al generar la plantilla.' },
      { status: 500 }
    );
  }
} 