import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export interface SetupResult {
  success: boolean;
  tables: Array<{
    tableName: string;
    created: boolean;
    error?: string;
  }>;
  summary: {
    totalTables: number;
    createdTables: number;
    failedTables: number;
  };
}

export async function setupClientTables(): Promise<SetupResult> {
  const supabase = await getSupabaseServerClient();
  const results: Array<{ tableName: string; created: boolean; error?: string }> = [];

  // 1. Crear tabla Country - usando una inserción simple para probar
  try {
    console.log('📋 Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('Country')
      .select('count(*)', { count: 'exact', head: true });
    
    if (testError) {
      console.log('⚠️ Tabla Country no existe, necesita ser creada manualmente en Supabase');
      results.push({ tableName: 'Country', created: false, error: `Tabla no existe: ${testError.message}` });
    } else {
      console.log('✅ Tabla Country existe');
      results.push({ tableName: 'Country', created: true });
    }
  } catch (err) {
    results.push({ 
      tableName: 'Country', 
      created: false, 
      error: err instanceof Error ? err.message : 'Error desconocido' 
    });
  }

  // 2. Crear tabla EconomicSector
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "EconomicSector" (
          "id" BIGSERIAL PRIMARY KEY,
          "nombre" TEXT NOT NULL UNIQUE,
          "descripcion" TEXT,
          "activo" BOOLEAN DEFAULT true,
          "orden" INTEGER DEFAULT 0,
          "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error) {
      results.push({ tableName: 'EconomicSector', created: false, error: error.message });
    } else {
      results.push({ tableName: 'EconomicSector', created: true });
    }
  } catch (err) {
    results.push({ 
      tableName: 'EconomicSector', 
      created: false, 
      error: err instanceof Error ? err.message : 'Error desconocido' 
    });
  }

  // 3. Crear tabla RelationshipType
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "RelationshipType" (
          "id" BIGSERIAL PRIMARY KEY,
          "nombre" TEXT NOT NULL UNIQUE,
          "descripcion" TEXT,
          "activo" BOOLEAN DEFAULT true,
          "orden" INTEGER DEFAULT 0
        );
      `
    });

    if (error) {
      results.push({ tableName: 'RelationshipType', created: false, error: error.message });
    } else {
      results.push({ tableName: 'RelationshipType', created: true });
    }
  } catch (err) {
    results.push({ 
      tableName: 'RelationshipType', 
      created: false, 
      error: err instanceof Error ? err.message : 'Error desconocido' 
    });
  }

  // 4. Crear tabla Client
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "Client" (
          "id" BIGSERIAL PRIMARY KEY,
          "tipoCliente" TEXT NOT NULL DEFAULT 'empresa',
          "nombrePrincipal" TEXT NOT NULL,
          "apellido" TEXT,
          "rut" TEXT UNIQUE,
          "email" TEXT,
          "telefono" TEXT,
          "telefonoMovil" TEXT,
          "estado" TEXT NOT NULL DEFAULT 'activo',
          "fechaCreacion" TIMESTAMPTZ DEFAULT NOW(),
          "fechaModificacion" TIMESTAMPTZ DEFAULT NOW(),
          "calle" TEXT,
          "calle2" TEXT,
          "ciudad" TEXT,
          "codigoPostal" TEXT,
          "region" TEXT,
          "paisId" BIGINT REFERENCES "Country"("id"),
          "sitioWeb" TEXT,
          "idioma" TEXT DEFAULT 'es',
          "zonaHoraria" TEXT,
          "imagen" TEXT,
          "comentarios" TEXT,
          "razonSocial" TEXT,
          "giro" TEXT,
          "numeroEmpleados" INTEGER,
          "facturacionAnual" DECIMAL(15,2),
          "sectorEconomicoId" BIGINT REFERENCES "EconomicSector"("id"),
          "fechaNacimiento" DATE,
          "genero" TEXT,
          "profesion" TEXT,
          "titulo" TEXT,
          "esClienteFrecuente" BOOLEAN DEFAULT false,
          "fechaUltimaCompra" DATE,
          "totalCompras" DECIMAL(15,2) DEFAULT 0,
          "rankingCliente" INTEGER DEFAULT 0,
          "origenCliente" TEXT,
          "recibirNewsletter" BOOLEAN DEFAULT true,
          "aceptaMarketing" BOOLEAN DEFAULT false
        );
      `
    });

    if (error) {
      results.push({ tableName: 'Client', created: false, error: error.message });
    } else {
      results.push({ tableName: 'Client', created: true });
    }
  } catch (err) {
    results.push({ 
      tableName: 'Client', 
      created: false, 
      error: err instanceof Error ? err.message : 'Error desconocido' 
    });
  }

  // 5. Crear tabla ClientContact
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "ClientContact" (
          "id" BIGSERIAL PRIMARY KEY,
          "clienteId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
          "nombre" TEXT NOT NULL,
          "apellido" TEXT,
          "email" TEXT,
          "telefono" TEXT,
          "telefonoMovil" TEXT,
          "cargo" TEXT,
          "departamento" TEXT,
          "tipoRelacionId" BIGINT REFERENCES "RelationshipType"("id"),
          "relacion" TEXT,
          "esContactoPrincipal" BOOLEAN DEFAULT false,
          "notas" TEXT,
          "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error) {
      results.push({ tableName: 'ClientContact', created: false, error: error.message });
    } else {
      results.push({ tableName: 'ClientContact', created: true });
    }
  } catch (err) {
    results.push({ 
      tableName: 'ClientContact', 
      created: false, 
      error: err instanceof Error ? err.message : 'Error desconocido' 
    });
  }

  // 6. Crear tabla ClientTag
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "ClientTag" (
          "id" BIGSERIAL PRIMARY KEY,
          "nombre" TEXT NOT NULL UNIQUE,
          "color" TEXT DEFAULT '#3B82F6',
          "icono" TEXT,
          "descripcion" TEXT,
          "tipoAplicacion" TEXT DEFAULT 'todos',
          "esSistema" BOOLEAN DEFAULT false,
          "activo" BOOLEAN DEFAULT true,
          "orden" INTEGER DEFAULT 0,
          "fechaCreacion" TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error) {
      results.push({ tableName: 'ClientTag', created: false, error: error.message });
    } else {
      results.push({ tableName: 'ClientTag', created: true });
    }
  } catch (err) {
    results.push({ 
      tableName: 'ClientTag', 
      created: false, 
      error: err instanceof Error ? err.message : 'Error desconocido' 
    });
  }

  // 7. Crear tabla ClientTagAssignment
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS "ClientTagAssignment" (
          "id" BIGSERIAL PRIMARY KEY,
          "clienteId" BIGINT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
          "etiquetaId" BIGINT NOT NULL REFERENCES "ClientTag"("id") ON DELETE CASCADE,
          "fechaAsignacion" TIMESTAMPTZ DEFAULT NOW(),
          "asignadoPor" UUID REFERENCES "User"("id"),
          UNIQUE("clienteId", "etiquetaId")
        );
      `
    });

    if (error) {
      results.push({ tableName: 'ClientTagAssignment', created: false, error: error.message });
    } else {
      results.push({ tableName: 'ClientTagAssignment', created: true });
    }
  } catch (err) {
    results.push({ 
      tableName: 'ClientTagAssignment', 
      created: false, 
      error: err instanceof Error ? err.message : 'Error desconocido' 
    });
  }

  // Crear índices
  try {
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS "idx_client_tipo" ON "Client"("tipoCliente");
        CREATE INDEX IF NOT EXISTS "idx_client_nombre" ON "Client"("nombrePrincipal");
        CREATE INDEX IF NOT EXISTS "idx_client_rut" ON "Client"("rut");
        CREATE INDEX IF NOT EXISTS "idx_client_ciudad" ON "Client"("ciudad");
        CREATE INDEX IF NOT EXISTS "idx_client_frecuente" ON "Client"("esClienteFrecuente");
        CREATE INDEX IF NOT EXISTS "idx_client_ranking" ON "Client"("rankingCliente");
        CREATE INDEX IF NOT EXISTS "idx_client_contacto_cliente" ON "ClientContact"("clienteId");
        CREATE INDEX IF NOT EXISTS "idx_client_contacto_nombre" ON "ClientContact"("nombre", "apellido");
        CREATE INDEX IF NOT EXISTS "idx_client_contacto_email" ON "ClientContact"("email");
        CREATE INDEX IF NOT EXISTS "idx_client_tag_nombre" ON "ClientTag"("nombre");
        CREATE INDEX IF NOT EXISTS "idx_client_tag_aplicacion" ON "ClientTag"("tipoAplicacion");
        CREATE INDEX IF NOT EXISTS "idx_client_tag_activo" ON "ClientTag"("activo");
        CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_cliente" ON "ClientTagAssignment"("clienteId");
        CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_etiqueta" ON "ClientTagAssignment"("etiquetaId");
        CREATE INDEX IF NOT EXISTS "idx_client_tag_assignment_fecha" ON "ClientTagAssignment"("fechaAsignacion");
      `
    });
  } catch (err) {
    console.warn('Error creando índices:', err);
  }

  // Habilitar RLS
  try {
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE "Country" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "EconomicSector" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "RelationshipType" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "ClientContact" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "ClientTag" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE "ClientTagAssignment" ENABLE ROW LEVEL SECURITY;
      `
    });
  } catch (err) {
    console.warn('Error habilitando RLS:', err);
  }

  // Crear políticas RLS
  try {
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Enable all for service role" ON "Country" FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Enable all for service role" ON "EconomicSector" FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Enable all for service role" ON "RelationshipType" FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Enable all for service role" ON "Client" FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Enable all for service role" ON "ClientContact" FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Enable all for service role" ON "ClientTag" FOR ALL USING (true);
        CREATE POLICY IF NOT EXISTS "Enable all for service role" ON "ClientTagAssignment" FOR ALL USING (true);
      `
    });
  } catch (err) {
    console.warn('Error creando políticas RLS:', err);
  }

  const createdTables = results.filter(r => r.created).length;
  const failedTables = results.filter(r => !r.created).length;
  const success = failedTables === 0;

  return {
    success,
    tables: results,
    summary: {
      totalTables: results.length,
      createdTables,
      failedTables
    }
  };
}

export async function insertDefaultData(): Promise<{
  success: boolean;
  operations: Array<{ operation: string; success: boolean; error?: string }>;
}> {
  const operations: Array<{ operation: string; success: boolean; error?: string }> = [];
  const supabase = await getSupabaseServerClient();

  // Insertar países
  try {
    const { error } = await supabase
      .from('Country')
      .upsert([
        { codigo: 'CL', nombre: 'Chile', nombreCompleto: 'República de Chile' },
        { codigo: 'AR', nombre: 'Argentina', nombreCompleto: 'República Argentina' },
        { codigo: 'PE', nombre: 'Perú', nombreCompleto: 'República del Perú' },
        { codigo: 'CO', nombre: 'Colombia', nombreCompleto: 'República de Colombia' },
        { codigo: 'MX', nombre: 'México', nombreCompleto: 'Estados Unidos Mexicanos' }
      ], { onConflict: 'codigo' });

    operations.push({
      operation: 'Insertar países',
      success: !error,
      error: error?.message
    });
  } catch (err) {
    operations.push({
      operation: 'Insertar países',
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }

  // Insertar sectores económicos
  try {
    const { error } = await supabase
      .from('EconomicSector')
      .upsert([
        { nombre: 'Comercio', descripcion: 'Comercio al por mayor y menor' },
        { nombre: 'Servicios', descripcion: 'Servicios profesionales y personales' },
        { nombre: 'Manufactura', descripcion: 'Industria manufacturera' },
        { nombre: 'Construcción', descripcion: 'Construcción e ingeniería' },
        { nombre: 'Tecnología', descripcion: 'Tecnología de la información' },
        { nombre: 'Salud', descripcion: 'Servicios de salud' },
        { nombre: 'Educación', descripcion: 'Servicios educativos' },
        { nombre: 'Turismo', descripcion: 'Turismo y hotelería' },
        { nombre: 'Transporte', descripcion: 'Transporte y logística' },
        { nombre: 'Otros', descripcion: 'Otros sectores económicos' }
      ], { onConflict: 'nombre' });

    operations.push({
      operation: 'Insertar sectores económicos',
      success: !error,
      error: error?.message
    });
  } catch (err) {
    operations.push({
      operation: 'Insertar sectores económicos',
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }

  // Insertar tipos de relación
  try {
    const { error } = await supabase
      .from('RelationshipType')
      .upsert([
        { nombre: 'Gerente', descripcion: 'Gerente o director' },
        { nombre: 'Administrativo', descripcion: 'Personal administrativo' },
        { nombre: 'Técnico', descripcion: 'Personal técnico' },
        { nombre: 'Ventas', descripcion: 'Personal de ventas' },
        { nombre: 'Soporte', descripcion: 'Personal de soporte' },
        { nombre: 'Otro', descripcion: 'Otro tipo de relación' }
      ], { onConflict: 'nombre' });

    operations.push({
      operation: 'Insertar tipos de relación',
      success: !error,
      error: error?.message
    });
  } catch (err) {
    operations.push({
      operation: 'Insertar tipos de relación',
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }

  // Insertar etiquetas del sistema
  try {
    const { error } = await supabase
      .from('ClientTag')
      .upsert([
        { nombre: 'VIP', color: '#FFD700', descripcion: 'Cliente muy importante', esSistema: true, tipoAplicacion: 'todos' },
        { nombre: 'Frecuente', color: '#10B981', descripcion: 'Cliente frecuente', esSistema: true, tipoAplicacion: 'todos' },
        { nombre: 'Nuevo', color: '#3B82F6', descripcion: 'Cliente nuevo', esSistema: true, tipoAplicacion: 'todos' },
        { nombre: 'Inactivo', color: '#6B7280', descripcion: 'Cliente inactivo', esSistema: true, tipoAplicacion: 'todos' },
        { nombre: 'Empresa', color: '#8B5CF6', descripcion: 'Cliente empresa', esSistema: true, tipoAplicacion: 'empresa' },
        { nombre: 'Persona', color: '#F59E0B', descripcion: 'Cliente persona', esSistema: true, tipoAplicacion: 'persona' }
      ], { onConflict: 'nombre' });

    operations.push({
      operation: 'Insertar etiquetas del sistema',
      success: !error,
      error: error?.message
    });
  } catch (err) {
    operations.push({
      operation: 'Insertar etiquetas del sistema',
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    });
  }

  const success = operations.every(op => op.success);

  return {
    success,
    operations
  };
} 