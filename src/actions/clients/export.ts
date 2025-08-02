import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import * as XLSX from 'xlsx';
import { Client, ClientExportData } from '@/types/client';

// Función para obtener todos los clientes para exportar
export async function getClientsForExport(filters?: {
  search?: string;
  tipoCliente?: string;
  estado?: string;
  etiquetas?: number[];
  selectedIds?: number[];
}): Promise<ClientExportData[]> {
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('Client')
      .select(`
        *,
        Country!paisId(id, nombre),
        EconomicSector!sectorEconomicoId(id, nombre),
        ClientTagAssignment(
          ClientTag(id, nombre)
        ),
        ClientContact(*)
      `);

    // Aplicar filtros
    if (filters?.search) {
      query = query.or(`nombrePrincipal.ilike.%${filters.search}%,apellido.ilike.%${filters.search}%,razonSocial.ilike.%${filters.search}%,rut.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    if (filters?.tipoCliente) {
      query = query.eq('tipoCliente', filters.tipoCliente);
    }

    if (filters?.estado) {
      query = query.eq('estado', filters.estado);
    }

    if (filters?.selectedIds && filters.selectedIds.length > 0) {
      query = query.in('id', filters.selectedIds);
    }

    if (filters?.etiquetas && filters.etiquetas.length > 0) {
      query = query.in('ClientTagAssignment.ClientTag.id', filters.etiquetas);
    }

    const { data: clients, error } = await query.order('nombrePrincipal', { ascending: true });

    if (error) {
      console.error('Error obteniendo clientes:', error);
      throw error;
    }

    if (!clients) return [];

    return clients.map(client => {
      // Obtener arrays de IDs y nombres de etiquetas
      const etiquetasArr = (client.ClientTagAssignment || []).map((ta: any) => ta.ClientTag || {});
      const etiquetasIds = etiquetasArr.map((tag: any) => tag.id).filter(Boolean).join(', ');
      const etiquetasNombres = etiquetasArr.map((tag: any) => tag.nombre).filter(Boolean).join(', ');
      return {
        id: client.id,
        tipoCliente: client.tipoCliente,
        nombrePrincipal: client.nombrePrincipal,
        apellido: client.tipoCliente === 'EMPRESA' ? '' : (client.apellido || ''),
        rut: client.rut || '',
        email: client.email || '',
        telefono: client.telefono || '',
        telefonoMovil: client.telefonoMovil || '',
        calle: client.calle || '',
        calle2: client.calle2 || '',
        ciudad: client.ciudad || '',
        codigoPostal: client.codigoPostal || '',
        region: client.region || '',
        pais: client.Country?.nombre || '',
        paisId: client.paisId?.toString() || '',
        sitioWeb: client.sitioWeb || '',
        idioma: client.idioma || '',
        zonaHoraria: client.zonaHoraria || '',
        imagen: client.imagen || '',
        comentarios: client.comentarios || '',
        razonSocial: client.razonSocial || '',
        giro: client.giro || '',
        numeroEmpleados: client.numeroEmpleados?.toString() || '',
        facturacionAnual: client.facturacionAnual?.toString() || '',
        sectorEconomico: client.EconomicSector?.nombre || '',
        sectorEconomicoId: client.sectorEconomicoId?.toString() || '',
        fechaNacimiento: client.fechaNacimiento || '',
        genero: client.genero || '',
        profesion: client.profesion || '',
        titulo: client.titulo || '',
        origenCliente: client.origenCliente || '',
        recibirNewsletter: client.recibirNewsletter ? 'SÍ' : 'NO',
        aceptaMarketing: client.aceptaMarketing ? 'SÍ' : 'NO',
        estado: client.estado,
        fechaCreacion: client.fechaCreacion,
        fechaModificacion: client.fechaModificacion,
        fechaUltimaCompra: client.fechaUltimaCompra || '',
        totalCompras: client.totalCompras,
        rankingCliente: client.rankingCliente,
        esClienteFrecuente: client.esClienteFrecuente ? 'SÍ' : 'NO',
        idEtiquetas: etiquetasIds,
        nombreEtiquetas: etiquetasNombres,
        // Contacto principal (para empresas)
        contactoPrincipalNombre: client.ClientContact?.find((c: any) => c.esContactoPrincipal)?.nombre || '',
        contactoPrincipalApellido: client.ClientContact?.find((c: any) => c.esContactoPrincipal)?.apellido || '',
        contactoPrincipalEmail: client.ClientContact?.find((c: any) => c.esContactoPrincipal)?.email || '',
        contactoPrincipalTelefono: client.ClientContact?.find((c: any) => c.esContactoPrincipal)?.telefono || '',
        contactoPrincipalMovil: client.ClientContact?.find((c: any) => c.esContactoPrincipal)?.telefonoMovil || '',
        contactoPrincipalCargo: client.ClientContact?.find((c: any) => c.esContactoPrincipal)?.cargo || '',
        contactoPrincipalDepartamento: client.ClientContact?.find((c: any) => c.esContactoPrincipal)?.departamento || ''
      };
    });
  } catch (error) {
    console.error('Error en getClientsForExport:', error);
    throw error;
  }
}

// Función para generar Excel de clientes
export async function generateClientsExcel(filters?: {
  search?: string;
  tipoCliente?: string;
  estado?: string;
  etiquetas?: number[];
  selectedIds?: number[];
}): Promise<Buffer> {
  const clients = await getClientsForExport(filters);
  
  // Crear workbook
  const workbook = XLSX.utils.book_new();
  
  // Datos para la hoja de clientes
  const clientData = clients.map(client => ({
    'ID': client.id,
    'ID de Plantilla': client.id, // Agregar columna ID de Plantilla
    'Tipo Cliente': client.tipoCliente,
    'Nombre Principal': client.nombrePrincipal,
    'Apellido': client.apellido,
    'RUT': client.rut,
    'Email': client.email,
    'Teléfono': client.telefono,
    'Teléfono Móvil': client.telefonoMovil,
    'Dirección Principal': client.calle,
    'Dirección Secundaria': client.calle2,
    'Ciudad': client.ciudad,
    'Código Postal': client.codigoPostal,
    'Región': client.region,
    'País': client.pais,
    'ID País': client.paisId,
    'Sitio Web': client.sitioWeb,
    'Idioma': client.idioma,
    'Zona Horaria': client.zonaHoraria,
    'Imagen': client.imagen,
    'Comentarios': client.comentarios,
    'Razón Social': client.razonSocial,
    'Giro': client.giro,
    'Número Empleados': client.numeroEmpleados,
    'Facturación Anual': client.facturacionAnual,
    'Sector Económico': client.sectorEconomico,
    'ID Sector Económico': client.sectorEconomicoId,
    'Fecha Nacimiento': client.fechaNacimiento,
    'Género': client.genero,
    'Profesión': client.profesion,
    'Título': client.titulo,
    'Origen Cliente': client.origenCliente,
    'Recibir Newsletter': client.recibirNewsletter,
    'Acepta Marketing': client.aceptaMarketing,
    'Estado': client.estado,
    'Fecha Creación': client.fechaCreacion,
    'Fecha Modificación': client.fechaModificacion,
    'Fecha Última Compra': client.fechaUltimaCompra,
    'Total Compras': client.totalCompras,
    'Ranking Cliente': client.rankingCliente,
    'Cliente Frecuente': client.esClienteFrecuente,
    'ID Etiqueta': client.idEtiquetas,
    'Nombre Etiqueta': client.nombreEtiquetas,
    // Campos del contacto principal (para empresas)
    'Contacto Principal Nombre': client.contactoPrincipalNombre,
    'Contacto Principal Apellido': client.contactoPrincipalApellido,
    'Contacto Principal Email': client.contactoPrincipalEmail,
    'Contacto Principal Teléfono': client.contactoPrincipalTelefono,
    'Contacto Principal Móvil': client.contactoPrincipalMovil,
    'Contacto Principal Cargo': client.contactoPrincipalCargo,
    'Contacto Principal Departamento': client.contactoPrincipalDepartamento
  }));

  // Crear hoja de clientes
  const clientSheet = XLSX.utils.json_to_sheet(clientData);
  
  // Aplicar estilos y anchos de columna
  const columnWidths = [
    { wch: 8 },   // ID
    { wch: 12 },  // Tipo Cliente
    { wch: 20 },  // Nombre Principal
    { wch: 15 },  // Apellido
    { wch: 15 },  // RUT
    { wch: 25 },  // Email
    { wch: 15 },  // Teléfono
    { wch: 15 },  // Teléfono Móvil
    { wch: 30 },  // Dirección Principal
    { wch: 30 },  // Dirección Secundaria
    { wch: 15 },  // Ciudad
    { wch: 12 },  // Código Postal
    { wch: 15 },  // Región
    { wch: 12 },  // País
    { wch: 10 },  // ID País
    { wch: 25 },  // Sitio Web
    { wch: 10 },  // Idioma
    { wch: 15 },  // Zona Horaria
    { wch: 40 },  // Imagen
    { wch: 50 },  // Comentarios
    { wch: 30 },  // Razón Social
    { wch: 20 },  // Giro
    { wch: 12 },  // Núm. Empleados
    { wch: 15 },  // Facturación
    { wch: 20 },  // Sector Económico
    { wch: 15 },  // ID Sector Económico
    { wch: 12 },  // Fecha Nacimiento
    { wch: 10 },  // Género
    { wch: 20 },  // Profesión
    { wch: 15 },  // Título
    { wch: 15 },  // Origen Cliente
    { wch: 12 },  // Recibir Newsletter
    { wch: 12 },  // Acepta Marketing
    { wch: 10 },  // Estado
    { wch: 15 },  // Fecha Creación
    { wch: 15 },  // Fecha Modificación
    { wch: 15 },  // Fecha Última Compra
    { wch: 12 },  // Total Compras
    { wch: 12 },  // Ranking Cliente
    { wch: 12 },  // Cliente Frecuente
    { wch: 30 },  // ID Etiqueta
    { wch: 30 },  // Nombre Etiqueta
    // Campos del contacto principal
    { wch: 20 },  // Contacto Principal Nombre
    { wch: 20 },  // Contacto Principal Apellido
    { wch: 25 },  // Contacto Principal Email
    { wch: 15 },  // Contacto Principal Teléfono
    { wch: 15 },  // Contacto Principal Móvil
    { wch: 20 },  // Contacto Principal Cargo
    { wch: 20 }   // Contacto Principal Departamento
  ];
  
  clientSheet['!cols'] = columnWidths;
  
  // Agregar hoja al workbook
  XLSX.utils.book_append_sheet(workbook, clientSheet, 'Clientes');
  
  // Generar buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Función para generar plantilla Excel para importar clientes
export async function generateClientTemplate(): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();
  
  // Datos de ejemplo para la plantilla
  const templateData = [
    {
      'ID': '',
      'ID de Plantilla': '', // Agregar columna ID de Plantilla
      'Tipo Cliente': 'PERSONA',
      'Nombre Principal': 'Juan',
      'Apellido': 'Pérez García',
      'RUT': '12.345.678-9',
      'Email': 'juan.perez@email.com',
      'Teléfono': '+56 9 8765 4321',
      'Teléfono Móvil': '+56 9 1234 5678',
      'Dirección Principal': 'Avenida Principal 123',
      'Dirección Secundaria': 'Depto 4B',
      'Ciudad': 'Santiago',
      'Código Postal': '7500000',
      'Región': 'Región Metropolitana',
      'País': 'Chile',
      'ID País': '1',
      'Sitio Web': '',
      'Idioma': 'es',
      'Zona Horaria': 'America/Santiago',
      'Imagen': '',
      'Comentarios': 'Cliente VIP',
      'Razón Social': '',
      'Giro': '',
      'Número Empleados': '',
      'Facturación Anual': '',
      'Sector Económico': '',
      'ID Sector Económico': '',
      'Fecha Nacimiento': '1985-06-15',
      'Género': 'masculino',
      'Profesión': 'Ingeniero',
      'Título': 'Ingeniero Civil',
      'Origen Cliente': 'Referido',
      'Recibir Newsletter': 'SÍ',
      'Acepta Marketing': 'NO',
      'Estado': 'activo',
      'Fecha Creación': '',
      'Fecha Modificación': '',
      'Fecha Última Compra': '',
      'Total Compras': '0',
      'Ranking Cliente': '1',
      'Cliente Frecuente': 'NO',
      'Etiquetas': '',
      // Campos del contacto principal (para empresas - vacío para personas)
      'Contacto Principal Nombre': '',
      'Contacto Principal Apellido': '',
      'Contacto Principal Email': '',
      'Contacto Principal Teléfono': '',
      'Contacto Principal Móvil': '',
      'Contacto Principal Cargo': '',
      'Contacto Principal Departamento': ''
    },
    {
      'ID': '',
      'ID de Plantilla': '', // Agregar columna ID de Plantilla
      'Tipo Cliente': 'EMPRESA',
      'Nombre Principal': 'Empresa Ejemplo',
      'Apellido': '',
      'RUT': '76.123.456-7',
      'Email': 'contacto@empresaejemplo.cl',
      'Teléfono': '+56 2 2345 6789',
      'Teléfono Móvil': '',
      'Dirección Principal': 'Calle Empresarial 456',
      'Dirección Secundaria': 'Oficina 10',
      'Ciudad': 'Valparaíso',
      'Código Postal': '2360000',
      'Región': 'Región de Valparaíso',
      'País': 'Chile',
      'ID País': '1',
      'Sitio Web': 'https://www.empresaejemplo.cl',
      'Idioma': 'es',
      'Zona Horaria': 'America/Santiago',
      'Imagen': '',
      'Comentarios': 'Cliente corporativo importante',
      'Razón Social': 'Empresa Ejemplo S.A.',
      'Giro': 'Servicios de consultoría',
      'Número Empleados': '50',
      'Facturación Anual': '1000000',
      'Sector Económico': 'Servicios',
      'ID Sector Económico': '3',
      'Fecha Nacimiento': '',
      'Género': '',
      'Profesión': '',
      'Título': '',
      'Origen Cliente': 'Web',
      'Recibir Newsletter': 'SÍ',
      'Acepta Marketing': 'SÍ',
      'Estado': 'activo',
      'Fecha Creación': '',
      'Fecha Modificación': '',
      'Fecha Última Compra': '',
      'Total Compras': '0',
      'Ranking Cliente': '1',
      'Cliente Frecuente': 'NO',
      'Etiquetas': 'VIP, Corporativo',
      // Campos del contacto principal (ejemplo para empresa)
      'Contacto Principal Nombre': 'María',
      'Contacto Principal Apellido': 'González López',
      'Contacto Principal Email': 'maria.gonzalez@empresaejemplo.cl',
      'Contacto Principal Teléfono': '+56 2 2345 6789',
      'Contacto Principal Móvil': '+56 9 8765 4321',
      'Contacto Principal Cargo': 'Gerente de Ventas',
      'Contacto Principal Departamento': 'Comercial'
    }
  ];

  // Crear hoja de plantilla
  const templateSheet = XLSX.utils.json_to_sheet(templateData);
  
  // Aplicar anchos de columna
  const columnWidths = [
    { wch: 8 },   // ID
    { wch: 12 },  // Tipo Cliente
    { wch: 20 },  // Nombre Principal
    { wch: 15 },  // Apellido
    { wch: 15 },  // RUT
    { wch: 25 },  // Email
    { wch: 15 },  // Teléfono
    { wch: 15 },  // Teléfono Móvil
    { wch: 30 },  // Dirección Principal
    { wch: 30 },  // Dirección Secundaria
    { wch: 15 },  // Ciudad
    { wch: 12 },  // Código Postal
    { wch: 20 },  // Región
    { wch: 12 },  // País
    { wch: 10 },  // ID País
    { wch: 25 },  // Sitio Web
    { wch: 10 },  // Idioma
    { wch: 15 },  // Zona Horaria
    { wch: 40 },  // Imagen
    { wch: 50 },  // Comentarios
    { wch: 30 },  // Razón Social
    { wch: 20 },  // Giro
    { wch: 12 },  // Núm. Empleados
    { wch: 15 },  // Facturación
    { wch: 20 },  // Sector Económico
    { wch: 15 },  // ID Sector Económico
    { wch: 12 },  // Fecha Nacimiento
    { wch: 10 },  // Género
    { wch: 20 },  // Profesión
    { wch: 15 },  // Título
    { wch: 15 },  // Origen Cliente
    { wch: 12 },  // Recibir Newsletter
    { wch: 12 },  // Acepta Marketing
    { wch: 10 },  // Estado
    { wch: 15 },  // Fecha Creación
    { wch: 15 },  // Fecha Modificación
    { wch: 15 },  // Fecha Última Compra
    { wch: 12 },  // Total Compras
    { wch: 12 },  // Ranking Cliente
    { wch: 12 },  // Cliente Frecuente
    { wch: 30 },  // Etiquetas
    // Campos del contacto principal
    { wch: 20 },  // Contacto Principal Nombre
    { wch: 20 },  // Contacto Principal Apellido
    { wch: 25 },  // Contacto Principal Email
    { wch: 15 },  // Contacto Principal Teléfono
    { wch: 15 },  // Contacto Principal Móvil
    { wch: 20 },  // Contacto Principal Cargo
    { wch: 20 }   // Contacto Principal Departamento
  ];
  
  templateSheet['!cols'] = columnWidths;
  
  // Agregar hoja de plantilla
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla Clientes');
  
  // Crear hoja de instrucciones
  const instructionsData = [
    { 'Campo': 'ID', 'Obligatorio': 'No', 'Descripción': 'Dejar vacío para crear nuevo cliente. Con ID numérico para actualizar cliente existente.' },
    { 'Campo': 'ID de Plantilla', 'Obligatorio': 'No', 'Descripción': 'Dejar vacío para crear nuevo cliente. Con ID numérico para actualizar cliente existente.' },
    { 'Campo': 'Tipo Cliente', 'Obligatorio': 'SÍ', 'Descripción': 'PERSONA o EMPRESA (en mayúsculas)' },
    { 'Campo': 'Nombre Principal', 'Obligatorio': 'SÍ', 'Descripción': 'Nombre de la persona o empresa' },
    { 'Campo': 'Apellido', 'Obligatorio': 'No', 'Descripción': 'Solo para personas físicas' },
    { 'Campo': 'RUT', 'Obligatorio': 'No', 'Descripción': 'RUT con formato XX.XXX.XXX-X' },
    { 'Campo': 'Email', 'Obligatorio': 'No', 'Descripción': 'Correo electrónico válido' },
    { 'Campo': 'Teléfono', 'Obligatorio': 'No', 'Descripción': 'Teléfono principal' },
    { 'Campo': 'Teléfono Móvil', 'Obligatorio': 'No', 'Descripción': 'Teléfono móvil' },
    { 'Campo': 'Dirección Principal', 'Obligatorio': 'No', 'Descripción': 'Dirección principal del cliente' },
    { 'Campo': 'Dirección Secundaria', 'Obligatorio': 'No', 'Descripción': 'Dirección secundaria (depto, oficina, etc.)' },
    { 'Campo': 'Ciudad', 'Obligatorio': 'No', 'Descripción': 'Ciudad de residencia' },
    { 'Campo': 'Código Postal', 'Obligatorio': 'No', 'Descripción': 'Código postal o ZIP' },
    { 'Campo': 'Región', 'Obligatorio': 'No', 'Descripción': 'Región o estado' },
    { 'Campo': 'País', 'Obligatorio': 'No', 'Descripción': 'País (nombre completo)' },
    { 'Campo': 'ID País', 'Obligatorio': 'No', 'Descripción': 'ID numérico del país en el sistema' },
    { 'Campo': 'Sitio Web', 'Obligatorio': 'No', 'Descripción': 'URL del sitio web del cliente' },
    { 'Campo': 'Idioma', 'Obligatorio': 'No', 'Descripción': 'Código de idioma (es, en, fr, etc.)' },
    { 'Campo': 'Zona Horaria', 'Obligatorio': 'No', 'Descripción': 'Zona horaria (ej: America/Santiago)' },
    { 'Campo': 'Imagen', 'Obligatorio': 'No', 'Descripción': 'URL o path de la imagen del cliente' },
    { 'Campo': 'Comentarios', 'Obligatorio': 'No', 'Descripción': 'Comentarios adicionales sobre el cliente' },
    { 'Campo': 'Razón Social', 'Obligatorio': 'No', 'Descripción': 'Solo para empresas' },
    { 'Campo': 'Giro', 'Obligatorio': 'No', 'Descripción': 'Actividad principal (empresas)' },
    { 'Campo': 'Número Empleados', 'Obligatorio': 'No', 'Descripción': 'Cantidad de empleados (empresas)' },
    { 'Campo': 'Facturación Anual', 'Obligatorio': 'No', 'Descripción': 'Facturación en pesos (empresas)' },
    { 'Campo': 'Sector Económico', 'Obligatorio': 'No', 'Descripción': 'Sector económico (empresas)' },
    { 'Campo': 'ID Sector Económico', 'Obligatorio': 'No', 'Descripción': 'ID numérico del sector económico' },
    { 'Campo': 'Fecha Nacimiento', 'Obligatorio': 'No', 'Descripción': 'Formato YYYY-MM-DD (personas)' },
    { 'Campo': 'Género', 'Obligatorio': 'No', 'Descripción': 'masculino, femenino, otro (personas)' },
    { 'Campo': 'Profesión', 'Obligatorio': 'No', 'Descripción': 'Profesión (personas)' },
    { 'Campo': 'Título', 'Obligatorio': 'No', 'Descripción': 'Título profesional (personas)' },
    { 'Campo': 'Origen Cliente', 'Obligatorio': 'No', 'Descripción': 'Cómo llegó el cliente (Web, Referido, etc.)' },
    { 'Campo': 'Recibir Newsletter', 'Obligatorio': 'No', 'Descripción': 'SÍ o NO - acepta recibir newsletter' },
    { 'Campo': 'Acepta Marketing', 'Obligatorio': 'No', 'Descripción': 'SÍ o NO - acepta marketing directo' },
    { 'Campo': 'Estado', 'Obligatorio': 'No', 'Descripción': 'activo, inactivo, suspendido' },
    { 'Campo': 'Fecha Creación', 'Obligatorio': 'No', 'Descripción': 'Generado automáticamente' },
    { 'Campo': 'Fecha Modificación', 'Obligatorio': 'No', 'Descripción': 'Generado automáticamente' },
    { 'Campo': 'Fecha Última Compra', 'Obligatorio': 'No', 'Descripción': 'Formato YYYY-MM-DD' },
    { 'Campo': 'Total Compras', 'Obligatorio': 'No', 'Descripción': 'Monto total de compras realizadas' },
    { 'Campo': 'Ranking Cliente', 'Obligatorio': 'No', 'Descripción': 'Número del 1 al 5 (clasificación interna)' },
    { 'Campo': 'Cliente Frecuente', 'Obligatorio': 'No', 'Descripción': 'SÍ o NO - es cliente frecuente' },
    { 'Campo': 'Etiquetas', 'Obligatorio': 'No', 'Descripción': 'Etiquetas separadas por comas' },
    { 'Campo': 'Contacto Principal Nombre', 'Obligatorio': 'No', 'Descripción': 'Nombre del contacto principal (solo empresas)' },
    { 'Campo': 'Contacto Principal Apellido', 'Obligatorio': 'No', 'Descripción': 'Apellido del contacto principal (solo empresas)' },
    { 'Campo': 'Contacto Principal Email', 'Obligatorio': 'No', 'Descripción': 'Email del contacto principal (solo empresas)' },
    { 'Campo': 'Contacto Principal Teléfono', 'Obligatorio': 'No', 'Descripción': 'Teléfono del contacto principal (solo empresas)' },
    { 'Campo': 'Contacto Principal Móvil', 'Obligatorio': 'No', 'Descripción': 'Móvil del contacto principal (solo empresas)' },
    { 'Campo': 'Contacto Principal Cargo', 'Obligatorio': 'No', 'Descripción': 'Cargo del contacto principal (solo empresas)' },
    { 'Campo': 'Contacto Principal Departamento', 'Obligatorio': 'No', 'Descripción': 'Departamento del contacto principal (solo empresas)' }
  ];
  
  const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
  instructionsSheet['!cols'] = [
    { wch: 20 },  // Campo
    { wch: 12 },  // Obligatorio
    { wch: 50 }   // Descripción
  ];
  
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
  
  // Generar buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// Función principal para exportar clientes
export async function exportClients(filters?: {
  search?: string;
  tipoCliente?: string;
  estado?: string;
  etiquetas?: number[];
  selectedIds?: number[];
}): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  try {
    const buffer = await generateClientsExcel(filters);
    return { success: true, data: buffer };
  } catch (error) {
    console.error('Error exportando clientes:', error);
    return { success: false, error: 'Error al exportar clientes' };
  }
} 