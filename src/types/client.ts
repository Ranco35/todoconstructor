// Tipos para el módulo de clientes

export interface Client {
  id: number;
  tipoCliente: ClientType;
  nombrePrincipal: string;
  apellido?: string;
  rut?: string;
  email?: string;
  telefono?: string;
  telefonoMovil?: string;
  estado: ClientStatus;
  fechaCreacion: Date;
  fechaModificacion: Date;
  
  // Campos de dirección
  calle?: string;
  calle2?: string;
  ciudad?: string;
  codigoPostal?: string;
  region?: string;
  paisId?: number;
  
  // Campos adicionales
  sitioWeb?: string;
  idioma: string;
  zonaHoraria?: string;
  imagen?: string;
  comentarios?: string;
  
  // Campos específicos para empresas
  razonSocial?: string;
  giro?: string;
  numeroEmpleados?: number;
  facturacionAnual?: number;
  sectorEconomicoId?: number;
  
  // Campos específicos para personas
  fechaNacimiento?: Date;
  genero?: Gender;
  profesion?: string;
  titulo?: string;
  
  // Campos de segmentación y análisis
  esClienteFrecuente: boolean;
  fechaUltimaCompra?: Date;
  totalCompras: number;
  rankingCliente: number;
  origenCliente?: string;
  
  // Campos de configuración
  recibirNewsletter: boolean;
  aceptaMarketing: boolean;
  
  // Relaciones
  pais?: Country;
  sectorEconomico?: EconomicSector;
  contactos?: ClientContact[];
  etiquetas?: ClientTag[];
}

export interface ClientContact {
  id: number;
  clienteId: number;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  telefonoMovil?: string;
  
  // Para empresas: cargo del contacto
  cargo?: string;
  departamento?: string;
  tipoRelacionId?: number;
  
  // Para personas: relación con el cliente principal
  relacion?: string;
  
  esContactoPrincipal: boolean;
  notas?: string;
  fechaCreacion: Date;
  
  // Relaciones
  tipoRelacion?: RelationshipType;
}

export interface ClientTag {
  id: number;
  nombre: string;
  color: string;
  icono?: string;
  descripcion?: string;
  tipoAplicacion: TagApplicationType;
  esSistema: boolean;
  activo: boolean;
  orden: number;
  fechaCreacion: Date;
}

export interface ClientTagAssignment {
  id: number;
  clienteId: number;
  etiquetaId: number;
  fechaAsignacion: Date;
  asignadoPor?: number;
  
  // Relaciones
  etiqueta?: ClientTag;
  usuario?: User;
}

export interface Country {
  id: number;
  codigo: string;
  nombre: string;
  nombreCompleto?: string;
  activo: boolean;
}

export interface EconomicSector {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  sectorPadreId?: number;
  activo: boolean;
  
  // Relaciones
  sectorPadre?: EconomicSector;
  subsectores?: EconomicSector[];
}

export interface RelationshipType {
  id: number;
  nombre: string;
  tipoCliente: ClientType;
  descripcion?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Enums
export enum ClientType {
  EMPRESA = 'EMPRESA',
  PERSONA = 'PERSONA'
}

export enum ClientStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo'
}

export enum Gender {
  MASCULINO = 'masculino',
  FEMENINO = 'femenino',
  OTRO = 'otro'
}

export enum TagApplicationType {
  TODOS = 'todos',
  EMPRESA = 'empresa',
  PERSONA = 'persona'
}

// Tipos para formularios
export interface CreateClientFormData {
  tipoCliente: ClientType;
  nombrePrincipal: string;
  apellido?: string;
  rut?: string;
  email?: string;
  telefono?: string;
  telefonoMovil?: string;
  
  // Dirección
  calle?: string;
  calle2?: string;
  ciudad?: string;
  codigoPostal?: string;
  region?: string;
  paisId?: number;
  
  // Adicionales
  sitioWeb?: string;
  idioma?: string;
  zonaHoraria?: string;
  imagen?: string;
  comentarios?: string;
  
  // Empresa
  razonSocial?: string;
  giro?: string;
  numeroEmpleados?: number;
  facturacionAnual?: number;
  sectorEconomicoId?: number;
  
  // Persona
  fechaNacimiento?: string;
  genero?: Gender;
  profesion?: string;
  titulo?: string;
  
  // Configuración
  recibirNewsletter?: boolean;
  aceptaMarketing?: boolean;
  
  // Contactos
  contactos?: CreateClientContactFormData[];
  
  // Etiquetas
  etiquetas?: number[];
}

export interface CreateClientContactFormData {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  telefonoMovil?: string;
  cargo?: string;
  departamento?: string;
  tipoRelacionId?: number;
  relacion?: string;
  esContactoPrincipal?: boolean;
  notas?: string;
}

export interface UpdateClientFormData extends Partial<CreateClientFormData> {
  id: number;
}

// Tipos para búsqueda y filtros
export interface ClientSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tipoCliente?: ClientType;
  estado?: ClientStatus;
  ciudad?: string;
  etiquetas?: number[];  // Array de IDs de etiquetas para filtrar
  esClienteFrecuente?: boolean;
  rankingCliente?: number;
  sectorEconomicoId?: number;
  paisId?: number;
  ordenarPor?: string;
  orden?: 'asc' | 'desc';
}

export interface ClientSearchResult {
  cliente: Client;
  tipoResultado: 'Principal' | 'Contacto';
  contacto?: ClientContact;
}

// Tipos para estadísticas
export interface ClientStats {
  total: number;
  activos: number;
  inactivos: number;
  empresas: number;
  personas: number;
  frecuentes: number;
  porRegion: { region: string; count: number }[];
  porSector: { sector: string; count: number }[];
  porRanking: { ranking: number; count: number }[];
}

// Tipos para importación/exportación
export interface ClientImportData {
  id?: string;
  tipoCliente: string;
  nombrePrincipal: string;
  apellido?: string;
  rut?: string;
  email?: string;
  telefono?: string;
  telefonoMovil?: string;
  calle?: string;
  calle2?: string;
  ciudad?: string;
  codigoPostal?: string;
  region?: string;
  pais?: string;
  paisId?: string;
  sitioWeb?: string;
  idioma?: string;
  zonaHoraria?: string;
  imagen?: string;
  comentarios?: string;
  razonSocial?: string;
  giro?: string;
  numeroEmpleados?: string;
  facturacionAnual?: string;
  sectorEconomico?: string;
  sectorEconomicoId?: string;
  fechaNacimiento?: string;
  genero?: string;
  profesion?: string;
  titulo?: string;
  origenCliente?: string;
  recibirNewsletter?: string;
  aceptaMarketing?: string;
  etiquetas?: string;
  contactos?: string;
  // Campos del contacto principal (para empresas)
  contactoPrincipalNombre?: string;
  contactoPrincipalApellido?: string;
  contactoPrincipalEmail?: string;
  contactoPrincipalTelefono?: string;
  contactoPrincipalMovil?: string;
  contactoPrincipalCargo?: string;
  contactoPrincipalDepartamento?: string;
}

export interface ClientExportData extends ClientImportData {
  id: number;
  estado: string;
  fechaCreacion: string;
  fechaModificacion: string;
  fechaUltimaCompra?: string;
  totalCompras: number;
  rankingCliente: number;
  esClienteFrecuente: string;
  // Campos del contacto principal (para empresas)
  contactoPrincipalNombre?: string;
  contactoPrincipalApellido?: string;
  contactoPrincipalEmail?: string;
  contactoPrincipalTelefono?: string;
  contactoPrincipalMovil?: string;
  contactoPrincipalCargo?: string;
  contactoPrincipalDepartamento?: string;
} 