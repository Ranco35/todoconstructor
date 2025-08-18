import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { ClientImportData, ClientType } from '@/types/client';

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  // Información detallada de clientes procesados
  createdClients: Array<{
    nombre: string;
    email?: string;
    id: number;
    fila: number;
  }>;
  updatedClients: Array<{
    nombre: string;
    email?: string;
    id: number;
    fila: number;
    razon: string;
  }>;
}

// Función para parsear Excel de clientes
export async function parseClientsExcel(fileBuffer: ArrayBuffer): Promise<ClientImportData[]> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    
    // Buscar la hoja de datos (primera hoja o la que tenga "Plantilla" en el nombre)
    let worksheetName = workbook.SheetNames[0];
    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('plantilla') || sheetName.toLowerCase().includes('clientes')) {
        worksheetName = sheetName;
        break;
      }
    }
    
    const worksheet = workbook.Sheets[worksheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    const clients: ClientImportData[] = [];
    
    for (const row of jsonData) {
      const rowData = row as any;
      
      // Mapear columnas del Excel a nuestro formato
      const client: ClientImportData = {
        id: rowData['ID'] || rowData['id'] || '',
        tipoCliente: rowData['Tipo Cliente'] || rowData['tipo_cliente'] || rowData['tipoCliente'] || '',
        nombrePrincipal: rowData['Nombre Principal'] || rowData['nombre_principal'] || rowData['nombrePrincipal'] || '',
        apellido: rowData['Apellido'] || rowData['apellido'] || '',
        rut: rowData['RUT'] || rowData['rut'] || '',
        email: rowData['Email'] || rowData['email'] || '',
        telefono: rowData['Teléfono'] || rowData['telefono'] || '',
        telefonoMovil: rowData['Teléfono Móvil'] || rowData['telefono_movil'] || rowData['telefonoMovil'] || '',
        calle: rowData['Dirección Principal'] || rowData['Dirección'] || rowData['direccion'] || rowData['calle'] || '',
        calle2: rowData['Dirección Secundaria'] || rowData['direccion_secundaria'] || rowData['calle2'] || '',
        ciudad: rowData['Ciudad'] || rowData['ciudad'] || '',
        codigoPostal: rowData['Código Postal'] || rowData['codigo_postal'] || rowData['codigoPostal'] || '',
        region: rowData['Región'] || rowData['region'] || '',
        pais: rowData['País'] || rowData['pais'] || '',
        paisId: rowData['ID País'] || rowData['id_pais'] || rowData['paisId'] || '',
        sitioWeb: rowData['Sitio Web'] || rowData['sitio_web'] || rowData['sitioWeb'] || '',
        idioma: rowData['Idioma'] || rowData['idioma'] || '',
        zonaHoraria: rowData['Zona Horaria'] || rowData['zona_horaria'] || rowData['zonaHoraria'] || '',
        imagen: rowData['Imagen'] || rowData['imagen'] || '',
        comentarios: rowData['Comentarios'] || rowData['comentarios'] || '',
        razonSocial: rowData['Razón Social'] || rowData['razon_social'] || rowData['razonSocial'] || '',
        giro: rowData['Giro'] || rowData['giro'] || '',
        numeroEmpleados: rowData['Número Empleados'] || rowData['numero_empleados'] || rowData['numeroEmpleados'] || '',
        facturacionAnual: rowData['Facturación Anual'] || rowData['facturacion_anual'] || rowData['facturacionAnual'] || '',
        sectorEconomico: rowData['Sector Económico'] || rowData['sector_economico'] || rowData['sectorEconomico'] || '',
        sectorEconomicoId: rowData['ID Sector Económico'] || rowData['id_sector_economico'] || rowData['sectorEconomicoId'] || '',
        fechaNacimiento: rowData['Fecha Nacimiento'] || rowData['fecha_nacimiento'] || rowData['fechaNacimiento'] || '',
        genero: rowData['Género'] || rowData['genero'] || '',
        profesion: rowData['Profesión'] || rowData['profesion'] || '',
        titulo: rowData['Título'] || rowData['titulo'] || '',
        origenCliente: rowData['Origen Cliente'] || rowData['origen_cliente'] || rowData['origenCliente'] || '',
        recibirNewsletter: rowData['Recibir Newsletter'] || rowData['recibir_newsletter'] || rowData['recibirNewsletter'] || '',
        aceptaMarketing: rowData['Acepta Marketing'] || rowData['acepta_marketing'] || rowData['aceptaMarketing'] || '',
        etiquetas: rowData['Etiquetas'] || rowData['etiquetas'] || rowData['Tags'] || rowData['tags'] || rowData['Categoría'] || rowData['categoria'] || rowData['Tipo'] || rowData['tipo'] || rowData['ID Etiqueta'] || rowData['id_etiqueta'] || rowData['idEtiqueta'] || rowData['Nombre Etiqueta'] || rowData['nombre_etiqueta'] || rowData['nombreEtiqueta'] || '',
        contactos: rowData['Contactos'] || rowData['contactos'] || '',
        // Campos del contacto principal (para empresas)
        contactoPrincipalNombre: rowData['Contacto Principal Nombre'] || rowData['contacto_principal_nombre'] || rowData['contactoPrincipalNombre'] || '',
        contactoPrincipalApellido: rowData['Contacto Principal Apellido'] || rowData['contacto_principal_apellido'] || rowData['contactoPrincipalApellido'] || '',
        contactoPrincipalEmail: rowData['Contacto Principal Email'] || rowData['contacto_principal_email'] || rowData['contactoPrincipalEmail'] || '',
        contactoPrincipalTelefono: rowData['Contacto Principal Teléfono'] || rowData['contacto_principal_telefono'] || rowData['contactoPrincipalTelefono'] || '',
        contactoPrincipalMovil: rowData['Contacto Principal Móvil'] || rowData['contacto_principal_movil'] || rowData['contactoPrincipalMovil'] || '',
        contactoPrincipalCargo: rowData['Contacto Principal Cargo'] || rowData['contacto_principal_cargo'] || rowData['contactoPrincipalCargo'] || '',
        contactoPrincipalDepartamento: rowData['Contacto Principal Departamento'] || rowData['contacto_principal_departamento'] || rowData['contactoPrincipalDepartamento'] || '',
        // NO mapear fechaModificacion ni variantes
      };
      
      // Solo agregar si tiene al menos nombre principal
      if (client.nombrePrincipal?.trim()) {
        clients.push(client);
      }
    }
    
    return clients;
  } catch (error) {
    console.error('Error parseando Excel de clientes:', error);
    throw new Error('Error al leer el archivo Excel');
  }
}

// Función para validar duplicados dentro del mismo archivo Excel
function validateInternalDuplicates(clients: ClientImportData[]): {
  duplicates: Array<{
    row1: number;
    row2: number;
    reason: string;
    value: string;
  }>;
  emailDuplicateGroups: Array<{
    email: string;
    rows: Array<{
      row: number;
      clientData: ClientImportData;
    }>;
  }>;
} {
  const duplicates: Array<{
    row1: number;
    row2: number;
    reason: string;
    value: string;
  }> = [];

  // Map para agrupar duplicados por email
  const emailGroups = new Map<string, Array<{ row: number; clientData: ClientImportData }>>();

  for (let i = 0; i < clients.length; i++) {
    for (let j = i + 1; j < clients.length; j++) {
      const client1 = clients[i];
      const client2 = clients[j];
      const row1 = i + 2;
      const row2 = j + 2;

      // Validar RUT duplicado
      if (client1.rut && client2.rut && 
          client1.rut.trim() === client2.rut.trim() && 
          client1.rut.trim() !== '') {
        duplicates.push({
          row1,
          row2,
          reason: 'RUT duplicado',
          value: client1.rut.trim()
        });
      }

      // Agrupar emails duplicados para manejo especial
      if (client1.email && client2.email && 
          client1.email.trim().toLowerCase() === client2.email.trim().toLowerCase() && 
          client1.email.trim() !== '') {
        const emailKey = client1.email.trim().toLowerCase();
        
        if (!emailGroups.has(emailKey)) {
          emailGroups.set(emailKey, []);
        }
        
        const group = emailGroups.get(emailKey)!;
        
        // Agregar client1 si no está ya en el grupo
        if (!group.some(item => item.row === row1)) {
          group.push({ row: row1, clientData: client1 });
        }
        
        // Agregar client2 si no está ya en el grupo
        if (!group.some(item => item.row === row2)) {
          group.push({ row: row2, clientData: client2 });
        }
      }

      // Validar Nombre + Apellido + Tipo duplicado
      if (
        client1.nombrePrincipal && client2.nombrePrincipal &&
        client1.apellido && client2.apellido &&
        client1.tipoCliente && client2.tipoCliente &&
        client1.nombrePrincipal.trim().toLowerCase() === client2.nombrePrincipal.trim().toLowerCase() &&
        client1.apellido.trim().toLowerCase() === client2.apellido.trim().toLowerCase() &&
        client1.tipoCliente.toUpperCase() === client2.tipoCliente.toUpperCase()
      ) {
        duplicates.push({
          row1,
          row2,
          reason: 'Nombre + Apellido + Tipo duplicado',
          value: `${client1.nombrePrincipal.trim()} ${client1.apellido.trim()} (${client1.tipoCliente.toUpperCase()})`
        });
      }

      // Para empresas, validar Razón Social duplicada
      if (client1.tipoCliente?.toUpperCase() === 'EMPRESA' && 
          client2.tipoCliente?.toUpperCase() === 'EMPRESA' &&
          client1.razonSocial && client2.razonSocial &&
          client1.razonSocial.trim().toLowerCase() === client2.razonSocial.trim().toLowerCase() &&
          client1.razonSocial.trim() !== '') {
        duplicates.push({
          row1,
          row2,
          reason: 'Razón Social duplicada',
          value: client1.razonSocial.trim()
        });
      }
    }
  }

  // Convertir el Map a Array, solo grupos con más de 1 elemento
  const emailDuplicateGroups = Array.from(emailGroups.entries())
    .filter(([_, group]) => group.length > 1)
    .map(([email, rows]) => ({
      email,
      rows
    }));

  return { duplicates, emailDuplicateGroups };
}

// Función para validar duplicados antes de procesar
async function validateDuplicates(supabase: any, clients: ClientImportData[]): Promise<{
  duplicates: Array<{
    row: number;
    reason: string;
    existingClient: string;
    newClient: string;
  }>;
  emailConflicts: Array<{
    row: number;
    email: string;
    existingClient: string;
  }>;
}> {
  const duplicates: Array<{
    row: number;
    reason: string;
    existingClient: string;
    newClient: string;
  }> = [];
  
  const emailConflicts: Array<{
    row: number;
    email: string;
    existingClient: string;
  }> = [];

  for (let i = 0; i < clients.length; i++) {
    const clientData = clients[i];
    const rowNumber = i + 2;

    // Validar solo si tiene datos básicos
    if (!clientData.nombrePrincipal?.trim()) continue;

    // Buscar por RUT
    if (clientData.rut && clientData.rut.trim()) {
      const { data: clientByRUT } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, email')
        .eq('rut', clientData.rut.trim())
        .maybeSingle();
      if (clientByRUT) {
        duplicates.push({
          row: rowNumber,
          reason: `RUT "${clientData.rut}"`,
          existingClient: `${clientByRUT.nombrePrincipal} (ID: ${clientByRUT.id})`,
          newClient: clientData.nombrePrincipal
        });
        continue;
      }
    }

    // Buscar por email
    if (clientData.email && clientData.email.trim()) {
      const { data: clientByEmail } = await supabase
        .from('Client')
        .select('id, nombrePrincipal')
        .ilike('email', clientData.email.trim())
        .maybeSingle();
      if (clientByEmail) {
        duplicates.push({
          row: rowNumber,
          reason: `Email "${clientData.email}"`,
          existingClient: `${clientByEmail.nombrePrincipal} (ID: ${clientByEmail.id})`,
          newClient: clientData.nombrePrincipal
        });
        continue;
      }
    }

    // Buscar por nombre + tipo
    const tipoCliente = clientData.tipoCliente?.toUpperCase();
    if (tipoCliente === 'PERSONA' || tipoCliente === 'EMPRESA') {
      const { data: clientByName } = await supabase
        .from('Client')
        .select('id, nombrePrincipal')
        .ilike('nombrePrincipal', clientData.nombrePrincipal.trim())
        .eq('tipoCliente', tipoCliente)
        .maybeSingle();
      if (clientByName) {
        duplicates.push({
          row: rowNumber,
          reason: `Nombre "${clientData.nombrePrincipal}" + Tipo "${tipoCliente}"`,
          existingClient: `${clientByName.nombrePrincipal} (ID: ${clientByName.id})`,
          newClient: clientData.nombrePrincipal
        });
        continue;
      }
    }

    // Para empresas, buscar por razón social
    if (tipoCliente === 'EMPRESA' && clientData.razonSocial && clientData.razonSocial.trim()) {
      const { data: clientByRazonSocial } = await supabase
        .from('Client')
        .select('id, nombrePrincipal')
        .ilike('razonSocial', clientData.razonSocial.trim())
        .eq('tipoCliente', 'EMPRESA')
        .maybeSingle();
      if (clientByRazonSocial) {
        duplicates.push({
          row: rowNumber,
          reason: `Razón Social "${clientData.razonSocial}"`,
          existingClient: `${clientByRazonSocial.nombrePrincipal} (ID: ${clientByRazonSocial.id})`,
          newClient: clientData.nombrePrincipal
        });
        continue;
      }
    }
  }

  return { duplicates, emailConflicts };
}

export async function importClients(
  clients: ClientImportData[],
  onProgress?: (processed: number) => void
): Promise<ImportResult & {
  pendingUpdates: Array<{
    row: number;
    reason: string;
    existingClient: any;
    newClient: any;
  }>;
  invalidEmails: Array<{
    row: number;
    email: string;
    clientData: any;
    reason: string;
  }>;
  emailDuplicateGroups: Array<{
    email: string;
    rows: Array<{
      row: number;
      clientData: ClientImportData;
    }>;
  }>;
}> {
  console.log(`🔄 Iniciando importación de ${clients.length} clientes`);
  
  const result: ImportResult = {
    success: true,
    created: 0,
    updated: 0,
    errors: [],
    createdClients: [],
    updatedClients: []
  };
  const pendingUpdates: Array<{
    row: number;
    reason: string;
    existingClient: any;
    newClient: any;
  }> = [];
  const invalidEmails: Array<{
    row: number;
    email: string;
    clientData: any;
    reason: string;
  }> = [];

  // Obtener cliente Supabase local (patrón moderno)
  const supabase = await getSupabaseServerClient();

  // 1. Validar duplicados internos (dentro del mismo Excel)
  const { duplicates, emailDuplicateGroups } = validateInternalDuplicates(clients);
  if (duplicates.length > 0) {
    console.warn(`⚠️ Hay ${duplicates.length} duplicados INTERNOS en el archivo Excel:`);
    for (const dup of duplicates) {
      const errorMsg = `Filas ${dup.row1} y ${dup.row2}: ${dup.reason} - "${dup.value}"`;
      console.warn(`  - ${errorMsg}`);
      result.errors.push(errorMsg);
    }
  }

  // 2. Validar duplicados con la base de datos (SOLO INFORMATIVO)
  const { duplicates: dbDuplicates, emailConflicts } = await validateDuplicates(supabase, clients);
  if (dbDuplicates.length > 0) {
    console.info(`ℹ️ Hay ${dbDuplicates.length} clientes que se actualizarán (duplicados encontrados en BD):`);
    for (const dup of dbDuplicates) {
      console.info(`  - Fila ${dup.row}: ${dup.reason} (Cliente existente: ${dup.existingClient}, Nuevo: ${dup.newClient}) → SE ACTUALIZARÁ`);
    }
  }

  // === NUEVO FLUJO: Procesar todos los clientes válidos, saltar los duplicados internos de email ===
  // 1. Construir un Set de filas a saltar (los de emailDuplicateGroups)
  const skipRows = new Set<number>();
  for (const group of emailDuplicateGroups) {
    for (const rowObj of group.rows) {
      skipRows.add(rowObj.row);
    }
  }

  let processedCount = 0;
  for (let i = 0; i < clients.length; i++) {
    const clientData = clients[i];
    const rowNumber = i + 2; // +2 porque las filas empiezan en 1 y hay header

    // Saltar si este cliente está en un grupo de email duplicado
    if (skipRows.has(rowNumber)) {
      continue;
    }

    console.log(`📝 Procesando fila ${rowNumber}:`, clientData);

    try {
      // Validaciones básicas
      if (!clientData.nombrePrincipal?.trim()) {
        result.errors.push(`Fila ${rowNumber}: Nombre Principal es obligatorio`);
        continue;
      }

      if (!clientData.tipoCliente?.trim()) {
        result.errors.push(`Fila ${rowNumber}: Tipo Cliente es obligatorio`);
        continue;
      }

      // Validar tipo de cliente
      const tipoCliente = clientData.tipoCliente.toUpperCase();
      if (tipoCliente !== 'PERSONA' && tipoCliente !== 'EMPRESA') {
        result.errors.push(`Fila ${rowNumber}: Tipo Cliente debe ser PERSONA o EMPRESA`);
        continue;
      }

      // Validar email si se proporciona - NUEVA LÓGICA
      if (clientData.email && !isValidEmail(clientData.email)) {
        invalidEmails.push({
          row: rowNumber,
          email: clientData.email,
          clientData,
          reason: 'Formato de email inválido'
        });
        continue; // Saltar este cliente por ahora
      }

      // Buscar país por ID si viene, si no por nombre
      let paisId = null;
      if (clientData.paisId && !isNaN(Number(clientData.paisId))) {
        paisId = Number(clientData.paisId);
      } else if (clientData.pais?.trim()) {
        const { data: country } = await supabase
          .from('Country')
          .select('id')
          .ilike('nombre', clientData.pais.trim())
          .single();
        if (country) {
          paisId = country.id;
        }
      }

      // Buscar sector económico por ID si viene, si no por nombre
      let sectorEconomicoId = null;
      if (clientData.sectorEconomicoId && !isNaN(Number(clientData.sectorEconomicoId))) {
        sectorEconomicoId = Number(clientData.sectorEconomicoId);
      } else if (clientData.sectorEconomico?.trim()) {
        const { data: sector } = await supabase
          .from('EconomicSector')
          .select('id')
          .ilike('nombre', clientData.sectorEconomico.trim())
          .single();
        if (sector) {
          sectorEconomicoId = sector.id;
        }
      }

      const dbData: any = {
        nombrePrincipal: clientData.nombrePrincipal?.trim(),
        apellido: clientData.apellido?.trim() || null,
        tipoCliente: clientData.tipoCliente?.trim().toUpperCase(),
        rut: (clientData.rut?.trim() && clientData.rut.trim() !== '') ? clientData.rut.trim() : null,
        email: clientData.email?.trim().toLowerCase() || null,
        telefono: clientData.telefono?.trim() || null,
        telefonoMovil: clientData.telefonoMovil?.trim() || null,
        calle: clientData.direccionPrincipal?.trim() || null,
        calle2: clientData.direccionSecundaria?.trim() || null,
        ciudad: clientData.ciudad?.trim() || null,
        codigoPostal: clientData.codigoPostal?.trim() || null,
        region: clientData.region?.trim() || null,
        paisId,
        sitioWeb: clientData.sitioWeb?.trim() || null,
        idioma: clientData.idioma?.trim() || null,
        zonaHoraria: clientData.zonaHoraria?.trim() || null,
        imagen: clientData.imagen?.trim() || null,
        comentarios: clientData.comentarios?.trim() || null,
        razonSocial: clientData.razonSocial?.trim() || null,
        giro: clientData.giro?.trim() || null,
        numeroEmpleados: clientData.numeroEmpleados ? Number(clientData.numeroEmpleados) : null,
        facturacionAnual: clientData.facturacionAnual ? Number(clientData.facturacionAnual) : null,
        sectorEconomicoId,
        fechaNacimiento: clientData.fechaNacimiento?.trim() || null,
        genero: clientData.genero?.trim() || null,
        profesion: clientData.profesion?.trim() || null,
        titulo: clientData.titulo?.trim() || null,
        origenCliente: clientData.origenCliente?.trim() || null,
        recibirNewsletter: clientData.recibirNewsletter === 'SI' || clientData.recibirNewsletter === '1' || clientData.recibirNewsletter === 'true',
        aceptaMarketing: clientData.aceptaMarketing === 'SI' || clientData.aceptaMarketing === '1' || clientData.aceptaMarketing === 'true',
        estado: 'activo',
        esClienteFrecuente: false,
        totalCompras: 0,
        rankingCliente: 1
      };

      // Filtro estricto de campos válidos para la tabla Client
      const allowedFields = [
        'nombrePrincipal', 'apellido', 'tipoCliente', 'rut', 'email', 'telefono', 'telefonoMovil',
        'calle', 'calle2', 'ciudad', 'codigoPostal', 'region', 'paisId', 'sitioWeb', 'idioma',
        'zonaHoraria', 'imagen', 'comentarios', 'razonSocial', 'giro', 'numeroEmpleados',
        'facturacionAnual', 'sectorEconomicoId', 'fechaNacimiento', 'genero', 'profesion', 'titulo',
        'origenCliente', 'recibirNewsletter', 'aceptaMarketing', 'estado', 'fechaCreacion',
        'fechaModificacion', 'fechaUltimaCompra', 'totalCompras', 'rankingCliente', 'esClienteFrecuente'
      ];
      const filteredDbData = Object.fromEntries(
        Object.entries(dbData).filter(([key]) => allowedFields.includes(key))
      );

      // Lógica de importación basada en ID
      const clientId = clientData.id && clientData.id.toString().trim();
      if (clientId && !isNaN(parseInt(clientId))) {
        // CASO 1: Tiene ID → Actualizar cliente existente
        const { data: existingClient } = await supabase
          .from('Client')
          .select('id')
          .eq('id', parseInt(clientId))
          .single();

        if (existingClient) {
          // Cliente existe → Actualizar
          console.log('Objeto FINAL enviado al update:', filteredDbData);
          const { error } = await supabase
            .from('Client')
            .update(filteredDbData)
            .eq('id', existingClient.id);

          if (error) {
            result.errors.push(`Fila ${rowNumber}: Error al actualizar cliente ID ${existingClient.id} - ${error.message}`);
            continue;
          }
          result.updated++;
          result.updatedClients.push({
            nombre: clientData.nombrePrincipal,
            email: clientData.email,
            id: existingClient.id,
            fila: rowNumber,
            razon: `RUT "${clientData.rut}"`
          });

          // === PROCESAR ETIQUETAS (ACTUALIZACIÓN) ===
          await processClientTags(supabase, existingClient.id, clientData.etiquetas, rowNumber, result);
        }
      } else {
        // CASO 2: NO tiene ID → Buscar duplicados y crear/actualizar según corresponda
        let existingClient = null;
        let duplicateReason = '';

        // Buscar duplicado por RUT si existe
        if (dbData.rut && dbData.rut.trim()) {
          const { data: clientByRUT } = await supabase
            .from('Client')
            .select('id, nombrePrincipal, email, apellido, rut')
            .eq('rut', dbData.rut.trim())
            .maybeSingle();
          if (clientByRUT) {
            existingClient = clientByRUT;
            duplicateReason = `RUT "${dbData.rut}"`;
          }
        }

        // Si no se encontró por RUT, buscar por email si existe
        if (!existingClient && dbData.email && dbData.email.trim()) {
          const { data: clientByEmail } = await supabase
            .from('Client')
            .select('id, nombrePrincipal, apellido, rut, email')
            .ilike('email', dbData.email.trim())
            .maybeSingle();
          if (clientByEmail) {
            existingClient = clientByEmail;
            duplicateReason = `Email "${dbData.email}"`;
          }
        }

        // Si no se encontró por RUT ni email, buscar por nombre+apellido+tipo
        if (!existingClient && dbData.nombrePrincipal && dbData.apellido && dbData.tipoCliente) {
          const { data: clientByName } = await supabase
            .from('Client')
            .select('id, nombrePrincipal, apellido, rut, email')
            .ilike('nombrePrincipal', dbData.nombrePrincipal.trim())
            .ilike('apellido', dbData.apellido.trim())
            .eq('tipoCliente', dbData.tipoCliente)
            .maybeSingle();
          if (clientByName) {
            existingClient = clientByName;
            duplicateReason = `Nombre "${dbData.nombrePrincipal} ${dbData.apellido}" + Tipo "${dbData.tipoCliente}"`;
          }
        }

        // Si se encontró duplicado, NO actualizar, solo agregar a pendingUpdates
        if (existingClient) {
          pendingUpdates.push({
            row: rowNumber,
            reason: duplicateReason,
            existingClient,
            newClient: filteredDbData
          });
          continue;
        }

        // Cliente NO encontrado → Crear nuevo
        console.log(`✅ Creando nuevo cliente para fila ${rowNumber} - No se encontraron duplicados`);
        console.log('Objeto FINAL enviado al insert:', filteredDbData);
        const { data: created, error } = await supabase
          .from('Client')
          .insert(filteredDbData)
          .select('id')
          .single();
        if (error) {
          result.errors.push(`Fila ${rowNumber}: Error al crear cliente - ${error.message}`);
          continue;
        }
        result.created++;
        result.createdClients.push({
          nombre: clientData.nombrePrincipal,
          email: clientData.email,
          id: created.id,
          fila: rowNumber
        });

        // === PROCESAR ETIQUETAS (CREACIÓN) ===
        await processClientTags(supabase, created.id, clientData.etiquetas, rowNumber, result);
      }
      // Al final de cada cliente válido procesado:
      processedCount++;
      if (onProgress) onProgress(processedCount);
    } catch (e: any) {
      result.errors.push(`Fila ${rowNumber}: ${e.message}`);
      processedCount++;
      if (onProgress) onProgress(processedCount);
    }
  }

  // Solo marcar como error crítico si hay errores graves (no por duplicados de email)
  if (result.errors.length > 0) {
    result.success = false;
  }

  return { ...result, pendingUpdates, invalidEmails, emailDuplicateGroups };
}

/**
 * Aplica solo los updates confirmados por el usuario.
 * @param updates Array de objetos { id, newData }
 * @returns { updated: number, errors: string[] }
 */
export async function applyConfirmedClientUpdates(
  updates: Array<{ id: number, newData: any }>
): Promise<{ updated: number, errors: string[] }> {
  const supabase = await getSupabaseServerClient();
  let updated = 0;
  const errors: string[] = [];

  console.log(`🔄 Aplicando ${updates.length} updates confirmados por el usuario`);

  for (const update of updates) {
    try {
      console.log(`📝 Actualizando cliente ID ${update.id}:`, update.newData);
      
      const { error } = await supabase
        .from('Client')
        .update(update.newData)
        .eq('id', update.id);

      if (error) {
        const errorMsg = `Cliente ID ${update.id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      } else {
        updated++;
        console.log(`✅ Cliente ID ${update.id} actualizado exitosamente`);
      }
    } catch (e: any) {
      const errorMsg = `Cliente ID ${update.id}: ${e.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  console.log(`📊 Resultado de updates confirmados: ${updated} actualizados, ${errors.length} errores`);
  return { updated, errors };
}

/**
 * Aplica las unificaciones de emails duplicados confirmadas por el usuario.
 * @param unifications Array de unificaciones { email, selectedData, rowsToSkip }
 * @returns { created: number, skipped: number, errors: string[] }
 */
export async function applyEmailUnifications(
  unifications: Array<{
    email: string;
    selectedData: ClientImportData;
    rowsToSkip: number[];
  }>
): Promise<{ created: number, skipped: number, errors: string[] }> {
  const supabase = await getSupabaseServerClient();
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  console.log(`🔄 Aplicando ${unifications.length} unificaciones de emails duplicados`);

  for (const unification of unifications) {
    try {
      console.log(`📝 Creando cliente unificado para email: ${unification.email}`);
      
      const clientData = unification.selectedData;
      
      // Buscar país por ID si viene, si no por nombre
      let paisId = null;
      if (clientData.paisId && !isNaN(Number(clientData.paisId))) {
        paisId = Number(clientData.paisId);
      } else if (clientData.pais?.trim()) {
        const { data: country } = await supabase
          .from('Country')
          .select('id')
          .ilike('nombre', clientData.pais.trim())
          .single();
        if (country) {
          paisId = country.id;
        }
      }

      // Buscar sector económico por ID si viene, si no por nombre
      let sectorEconomicoId = null;
      if (clientData.sectorEconomicoId && !isNaN(Number(clientData.sectorEconomicoId))) {
        sectorEconomicoId = Number(clientData.sectorEconomicoId);
      } else if (clientData.sectorEconomico?.trim()) {
        const { data: sector } = await supabase
          .from('EconomicSector')
          .select('id')
          .ilike('nombre', clientData.sectorEconomico.trim())
          .single();
        if (sector) {
          sectorEconomicoId = sector.id;
        }
      }

      const dbData: any = {
        nombrePrincipal: clientData.nombrePrincipal?.trim(),
        apellido: clientData.apellido?.trim() || null,
        tipoCliente: clientData.tipoCliente?.trim().toUpperCase(),
        rut: (clientData.rut?.trim() && clientData.rut.trim() !== '') ? clientData.rut.trim() : null,
        email: clientData.email?.trim().toLowerCase() || null,
        telefono: clientData.telefono?.trim() || null,
        telefonoMovil: clientData.telefonoMovil?.trim() || null,
        calle: clientData.direccionPrincipal?.trim() || null,
        calle2: clientData.direccionSecundaria?.trim() || null,
        ciudad: clientData.ciudad?.trim() || null,
        codigoPostal: clientData.codigoPostal?.trim() || null,
        region: clientData.region?.trim() || null,
        paisId,
        sitioWeb: clientData.sitioWeb?.trim() || null,
        idioma: clientData.idioma?.trim() || null,
        zonaHoraria: clientData.zonaHoraria?.trim() || null,
        imagen: clientData.imagen?.trim() || null,
        comentarios: clientData.comentarios?.trim() || null,
        razonSocial: clientData.razonSocial?.trim() || null,
        giro: clientData.giro?.trim() || null,
        numeroEmpleados: clientData.numeroEmpleados ? Number(clientData.numeroEmpleados) : null,
        facturacionAnual: clientData.facturacionAnual ? Number(clientData.facturacionAnual) : null,
        sectorEconomicoId,
        fechaNacimiento: clientData.fechaNacimiento?.trim() || null,
        genero: clientData.genero?.trim() || null,
        profesion: clientData.profesion?.trim() || null,
        titulo: clientData.titulo?.trim() || null,
        origenCliente: clientData.origenCliente?.trim() || null,
        recibirNewsletter: clientData.recibirNewsletter === 'SI' || clientData.recibirNewsletter === '1' || clientData.recibirNewsletter === 'true',
        aceptaMarketing: clientData.aceptaMarketing === 'SI' || clientData.aceptaMarketing === '1' || clientData.aceptaMarketing === 'true',
        estado: 'activo',
        esClienteFrecuente: false,
        totalCompras: 0,
        rankingCliente: 1
      };

      // Filtro estricto de campos válidos para la tabla Client
      const allowedFields = [
        'nombrePrincipal', 'apellido', 'tipoCliente', 'rut', 'email', 'telefono', 'telefonoMovil',
        'calle', 'calle2', 'ciudad', 'codigoPostal', 'region', 'paisId', 'sitioWeb', 'idioma',
        'zonaHoraria', 'imagen', 'comentarios', 'razonSocial', 'giro', 'numeroEmpleados',
        'facturacionAnual', 'sectorEconomicoId', 'fechaNacimiento', 'genero', 'profesion', 'titulo',
        'origenCliente', 'recibirNewsletter', 'aceptaMarketing', 'estado', 'fechaCreacion',
        'fechaModificacion', 'fechaUltimaCompra', 'totalCompras', 'rankingCliente', 'esClienteFrecuente'
      ];
      const filteredDbData = Object.fromEntries(
        Object.entries(dbData).filter(([key]) => allowedFields.includes(key))
      );

      // Crear el cliente unificado
      const { data: newClient, error } = await supabase
        .from('Client')
        .insert(filteredDbData)
        .select('id')
        .single();

      if (error) {
        const errorMsg = `Email ${unification.email}: Error al crear cliente unificado - ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      } else {
        created++;
        skipped += unification.rowsToSkip.length;
        console.log(`✅ Cliente unificado creado para email ${unification.email} (ID: ${newClient.id}), ${unification.rowsToSkip.length} filas saltadas`);
        
        // Procesar etiquetas del cliente unificado si las tiene
        if (clientData.etiquetas) {
          const mockResult: ImportResult = {
            success: true,
            created: 0,
            updated: 0,
            errors: [],
            createdClients: [],
            updatedClients: []
          };
          await processClientTags(supabase, newClient.id, clientData.etiquetas, 0, mockResult);
          errors.push(...mockResult.errors);
        }
      }
    } catch (e: any) {
      const errorMsg = `Email ${unification.email}: ${e.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  console.log(`📊 Resultado de unificaciones: ${created} creados, ${skipped} saltados, ${errors.length} errores`);
  return { created, skipped, errors };
}

// Función helper para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Función helper para parsear fechas
function parseDate(dateString: string): string | null {
  try {
    // Intentar parsear diferentes formatos
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    ];

    if (formats[0].test(dateString)) {
      return dateString; // Ya está en formato correcto
    }

    if (formats[1].test(dateString)) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (formats[2].test(dateString)) {
      const [day, month, year] = dateString.split('-');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return null;
  } catch {
    return null;
  }
} 

// Función helper para procesar etiquetas (común para creación y actualización)
async function processClientTags(
  supabase: any,
  clientId: number,
  etiquetas: string | undefined,
  rowNumber: number,
  result: ImportResult
) {
  console.log(`🏷️ [processClientTags] Cliente ${clientId}, Fila ${rowNumber}, Etiquetas recibidas:`, etiquetas);
  console.log(`🏷️ [processClientTags] Tipo de etiquetas:`, typeof etiquetas, `| Valor:`, JSON.stringify(etiquetas));
  if (!clientId || !etiquetas || etiquetas.toString().trim() === '') {
    console.log(`🏷️ [processClientTags] Saltando procesamiento - clientId: ${clientId}, etiquetas: "${etiquetas}"`);
    return;
  }

  // Separar por coma o punto y coma
  const etiquetasArr = etiquetas
    .toString()
    .split(/[;,]/)
    .map((e: string) => e.trim())
    .filter((e: string) => e.length > 0);

  console.log(`🏷️ [processClientTags] Etiquetas separadas:`, etiquetasArr);

  for (const etiquetaRaw of etiquetasArr) {
    console.log(`🏷️ [processClientTags] Procesando etiqueta individual:`, etiquetaRaw);
    let etiquetaId: number | null = null;
    // Si es número, usar como ID
    if (/^\d+$/.test(etiquetaRaw)) {
      etiquetaId = parseInt(etiquetaRaw);
      console.log(`🏷️ [processClientTags] Etiqueta es ID numérico: ${etiquetaId}`);
      // Verificar que exista (usando maybeSingle para evitar errores)
      let tagById = null;
      let tagError = null;
      
      // Intentar búsqueda con retry (máximo 3 intentos)
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🏷️ [processClientTags] Intento ${attempt}/3 - Buscando etiqueta ID ${etiquetaId}`);
        const result = await supabase
          .from('ClientTag')
          .select('id, nombre')
          .eq('id', etiquetaId)
          .maybeSingle();
        
        tagById = result.data;
        tagError = result.error;
        
        if (tagById && !tagError) {
          console.log(`🏷️ [processClientTags] ✅ Etiqueta encontrada en intento ${attempt}`);
          break;
        }
        
        if (attempt < 3) {
          console.log(`🏷️ [processClientTags] ⚠️ Intento ${attempt} falló, reintentando...`);
          await new Promise(resolve => setTimeout(resolve, 100)); // Esperar 100ms
        }
      }
      
      console.log(`🏷️ [processClientTags] Resultado búsqueda por ID:`, tagById);
      console.log(`🏷️ [processClientTags] Error búsqueda por ID:`, tagError);
      
      if (!tagById || tagError) {
        console.log(`🏷️ [processClientTags] ❌ Etiqueta con ID ${etiquetaId} no encontrada después de 3 intentos`);
        result.errors.push(`Fila ${rowNumber}: Etiqueta con ID ${etiquetaId} no encontrada`);
        continue;
      }
      console.log(`🏷️ [processClientTags] ✅ Etiqueta encontrada por ID: ${tagById.nombre} (ID: ${tagById.id})`);
    } else {
      // Buscar por nombre, insensible a tildes y mayúsculas
      console.log(`🏷️ [processClientTags] Etiqueta es texto, buscando por nombre: "${etiquetaRaw}"`);
      // Normalizar función para quitar tildes
      function normalize(str: string) {
        return str.normalize('NFD').replace(/[ -]/g, '').replace(/\p{Diacritic}/gu, '').toLowerCase();
      }
      const nombreNormalizado = normalize(etiquetaRaw);
      console.log(`🏷️ [processClientTags] Nombre normalizado: "${nombreNormalizado}"`);
      // Buscar todas las etiquetas y comparar normalizadas
      const { data: allTags, error: allTagsError } = await supabase
        .from('ClientTag')
        .select('id, nombre');
      console.log(`🏷️ [processClientTags] Total etiquetas en BD:`, allTags?.length || 0);
      console.log(`🏷️ [processClientTags] Error al obtener etiquetas:`, allTagsError);
      let found = false;
      if (allTags) {
        for (const tag of allTags) {
          const tagNormalizado = normalize(tag.nombre);
          console.log(`🏷️ [processClientTags] Comparando "${nombreNormalizado}" vs "${tagNormalizado}" (${tag.nombre})`);
          if (tagNormalizado === nombreNormalizado) {
            etiquetaId = tag.id;
            found = true;
            console.log(`🏷️ [processClientTags] ✅ Etiqueta encontrada por nombre: ${tag.nombre} (ID: ${tag.id})`);
            break;
          }
        }
      }
      if (!found) {
        console.log(`🏷️ [processClientTags] ❌ Etiqueta '${etiquetaRaw}' no encontrada por nombre`);
        result.errors.push(`Fila ${rowNumber}: Etiqueta '${etiquetaRaw}' no encontrada`);
        continue;
      }
    }
    // Insertar relación si no existe
    if (etiquetaId) {
      console.log(`🏷️ [processClientTags] Intentando asignar etiqueta ID ${etiquetaId} al cliente ${clientId}`);
      const { data: existingAssignment } = await supabase
        .from('ClientTagAssignment')
        .select('id')
        .eq('clienteId', clientId)
        .eq('etiquetaId', etiquetaId)
        .maybeSingle();
      console.log(`🏷️ [processClientTags] Asignación existente:`, existingAssignment);
      if (!existingAssignment) {
        const { data: newAssignment, error: assignError } = await supabase
          .from('ClientTagAssignment')
          .insert({
            clienteId: clientId,
            etiquetaId: etiquetaId
          })
          .select();
        console.log(`🏷️ [processClientTags] Nueva asignación creada:`, newAssignment);
        if (assignError) {
          console.log(`🏷️ [processClientTags] ❌ Error creando asignación:`, assignError);
          result.errors.push(`Fila ${rowNumber}: Error asignando etiqueta: ${assignError.message}`);
        } else {
          console.log(`🏷️ [processClientTags] ✅ Etiqueta asignada exitosamente`);
        }
      } else {
        console.log(`🏷️ [processClientTags] ⚠️ Asignación ya existe, saltando`);
      }
    }
  }
}

