// Tipos de enumeración que antes venían de Prisma
export enum SupplierRank {
  BASICO = 'BASICO',
  REGULAR = 'REGULAR',
  BUENO = 'BUENO',
  EXCELENTE = 'EXCELENTE',
  PART_TIME = 'PART_TIME',
  PREMIUM = 'PREMIUM'
}

export enum CompanyType {
  SOCIEDAD_ANONIMA = 'SOCIEDAD_ANONIMA',
  SOCIEDAD_LIMITADA = 'SOCIEDAD_LIMITADA',
  EMPRESA_INDIVIDUAL = 'EMPRESA_INDIVIDUAL',
  COOPERATIVA = 'COOPERATIVA',
  ASOCIACION = 'ASOCIACION',
  FUNDACION = 'FUNDACION',
  OTRO = 'OTRO'
}

export enum ContactType {
  PRINCIPAL = 'PRINCIPAL',
  SECUNDARIO = 'SECUNDARIO',
  EMERGENCIA = 'EMERGENCIA'
}

export enum PaymentTerm {
  CONTADO = 'CONTADO',
  CREDITO_30 = 'CREDITO_30',
  CREDITO_60 = 'CREDITO_60',
  CREDITO_90 = 'CREDITO_90',
  CREDITO_120 = 'CREDITO_120'
}

// PAISES Y CODIGOS
export const COUNTRIES = [
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'CA', name: 'Canadá', flag: '🇨🇦' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japón', flag: '🇯🇵' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'UK', name: 'Reino Unido', flag: '🇬🇧' },
] as const;

// MONEDAS
export const CURRENCIES = [
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
  { code: 'CNY', name: 'Yuan Chino', symbol: '¥' },
  { code: 'JPY', name: 'Yen Japonés', symbol: '¥' },
] as const;

// TIPOS DE CUENTA BANCARIA
export const ACCOUNT_TYPES = [
  { value: 'corriente', label: 'Cuenta Corriente' },
  { value: 'ahorro', label: 'Cuenta de Ahorro' },
  { value: 'vista', label: 'Cuenta Vista' },
  { value: 'rut', label: 'Cuenta RUT' },
] as const;

// TIPOS DE IMPUESTOS
export const TAX_TYPES = [
  // IVA Estándar
  { value: 'IVA', label: 'IVA' },
  { value: 'IVA_19', label: 'IVA 19% Compra' },
  
  // IVA Compras con diferentes tasas
  { value: 'IVA_C_10', label: 'IVA C 10%' },
  { value: 'IVA_C_18', label: 'IVA C 18%' },
  { value: 'IVA_C_19', label: 'IVA C 19%' },
  { value: 'IVA_C_20_5', label: 'IVA C 20.5%' },
  { value: 'IVA_C_31_5', label: 'IVA C 31.5%' },
  
  // IVA Anticipado por categoría de producto
  { value: 'IVA_ANTICIPADO_CARNE_5', label: 'IVA Anticipado Carne 5%' },
  { value: 'IVA_ANTICIPADO_HARINA_12', label: 'IVA ANTICIPADO HARINA 12%' },
  { value: 'IVA_ANTICIPADO_VINOS_20_5', label: 'IVA Anticipado Vinos 20.5%' },
  { value: 'IVA_ANTICIPADO_LICORES_31_5', label: 'IVA Anticipado Licores 31.5%' },
  { value: 'IVA_ANTICIPADO_BEBIDAS_18', label: 'IVA Anticipado Bebidas 18%' },
  
  // Otros impuestos
  { value: 'ISR', label: 'ISR' },
  { value: 'IEPS', label: 'IEPS' },
  { value: 'ISH', label: 'ISH' },
  { value: 'RETENCION', label: 'Retención' },
  
  // Impuestos personalizados
  { value: 'CUSTOM', label: 'Personalizado' },
] as const;

// CONFIGURACIÓN DE IMPUESTOS CON TASAS POR DEFECTO
export const TAX_CONFIG = {
  'IVA': { defaultRate: 19.0, category: null, isRetention: false },
  'IVA_19': { defaultRate: 19.0, category: null, isRetention: false },
  
  // IVA Compras
  'IVA_C_10': { defaultRate: 10.0, category: 'Bebidas Analcohólicas', isRetention: false },
  'IVA_C_18': { defaultRate: 18.0, category: 'Bebidas Analcohólicas', isRetention: false },
  'IVA_C_19': { defaultRate: 19.0, category: 'General', isRetention: false },
  'IVA_C_20_5': { defaultRate: 20.5, category: 'Vinos y Cervezas', isRetention: false },
  'IVA_C_31_5': { defaultRate: 31.5, category: 'Licores', isRetention: false },
  
  // IVA Anticipado
  'IVA_ANTICIPADO_CARNE_5': { defaultRate: 5.0, category: 'Carnes', isRetention: false },
  'IVA_ANTICIPADO_HARINA_12': { defaultRate: 12.0, category: 'Harinas', isRetention: false },
  'IVA_ANTICIPADO_VINOS_20_5': { defaultRate: 20.5, category: 'Vinos', isRetention: false },
  'IVA_ANTICIPADO_LICORES_31_5': { defaultRate: 31.5, category: 'Licores', isRetention: false },
  'IVA_ANTICIPADO_BEBIDAS_18': { defaultRate: 18.0, category: 'Bebidas', isRetention: false },
  
  // Otros
  'ISR': { defaultRate: 10.0, category: null, isRetention: true },
  'IEPS': { defaultRate: 8.0, category: null, isRetention: false },
  'ISH': { defaultRate: 5.0, category: null, isRetention: false },
  'RETENCION': { defaultRate: 10.0, category: null, isRetention: true },
  
  'CUSTOM': { defaultRate: 0.0, category: null, isRetention: false },
} as const;

// CATEGORIAS DE PROVEEDORES
export const SUPPLIER_CATEGORIES = [
  // Categorías generales
  'Tecnología',
  'Alimentación',
  'Ropa y Textiles',
  'Construcción',
  'Automotriz',
  'Farmacéutico',
  'Servicios',
  'Logística',
  'Manufactura',
  'Distribución',
  'Importación',
  'Exportación',
  
  // Categorías específicas para hotel en Chile
  'Part-Time',
  'Hotelería',
  'Limpieza',
  'Mantenimiento',
  'Restaurante',
  'Seguridad',
  'Transporte',
  'Lácteos',
  'Servicios Básicos',
  'Bebidas',
  'Carnes',
  'Verduras',
  'Panadería',
  'Pescados',
  
  'Otros',
] as const;

// CONFIGURACION DE BADGES
export const RANK_BADGES = {
  [SupplierRank.BASICO]: {
    label: '🔄 BÁSICO',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    points: 'Calidad mínima (1-10 puntos)',
  },
  [SupplierRank.REGULAR]: {
    label: '⚠️ REGULAR',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    points: 'Calidad aceptable (11-50 puntos)',
  },
  [SupplierRank.BUENO]: {
    label: '✅ BUENO',
    color: 'bg-green-100 text-green-800 border-green-200',
    points: 'Calidad confiable (51-100 puntos)',
  },
  [SupplierRank.EXCELENTE]: {
    label: '🌟 EXCELENTE',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    points: 'Máxima calidad (100+ puntos)',
  },
  [SupplierRank.PREMIUM]: {
    label: '🔥 PREMIUM',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    points: 'Proveedor premium',
  },
} as const;

// CONFIGURACION DE TIPOS DE EMPRESA
export const COMPANY_TYPE_LABELS = {
  [CompanyType.EMPRESA_INDIVIDUAL]: {
    label: '👤 Individual',
    icon: '👤',
  },
  [CompanyType.SOCIEDAD_ANONIMA]: {
    label: '🏢 Empresa',
    icon: '🏢',
  },
} as const;

// CONFIGURACION DE TIPOS DE CONTACTO
export const CONTACT_TYPE_LABELS = {
  [ContactType.PRINCIPAL]: {
    label: '👤 Principal',
    icon: '👤',
  },
  [ContactType.SECUNDARIO]: {
    label: '🧾 Facturación',
    icon: '🧾',
  },
  [ContactType.EMERGENCIA]: {
    label: '📦 Envío',
    icon: '📦',
  },
} as const;

// TIPOS DE CONTACTO PARA FORMULARIOS
export const CONTACT_TYPES = [
  { value: ContactType.PRINCIPAL, label: '👤 Principal', icon: '👤' },
  { value: ContactType.SECUNDARIO, label: '🧾 Facturación', icon: '🧾' },
  { value: ContactType.EMERGENCIA, label: '📦 Envío', icon: '📦' },
] as const;

// CONFIGURACION DE TERMINOS DE PAGO
export const PAYMENT_TERM_LABELS = {
  [PaymentTerm.CONTADO]: {
    label: '💰 Inmediato',
    days: 0,
  },
  [PaymentTerm.CREDITO_30]: {
    label: '🗓️ Net 30 días',
    days: 30,
  },
  [PaymentTerm.CREDITO_60]: {
    label: '🗓️ Net 60 días',
    days: 60,
  },
  [PaymentTerm.CREDITO_90]: {
    label: '🗓️ Net 90 días',
    days: 90,
  },
  [PaymentTerm.CREDITO_120]: {
    label: '🗓️ Net 120 días',
    days: 120,
  },
} as const;

// CONFIGURACION DE PUNTOS DE RANKING
export const RANKING_POINTS = {
  // Factores positivos
  ORDER_ON_TIME: 5,           // Orden entregada a tiempo
  QUALITY_PRODUCT: 3,         // Producto de calidad
  GOOD_COMMUNICATION: 2,      // Buena comunicación
  FAST_RESPONSE: 2,           // Respuesta rápida
  COMPETITIVE_PRICE: 1,       // Precio competitivo
  
  // Factores negativos
  LATE_DELIVERY: -5,          // Entrega tardía
  DEFECTIVE_PRODUCT: -3,      // Producto defectuoso
  POOR_COMMUNICATION: -2,     // Mala comunicación
  CONTRACT_VIOLATION: -10,    // Incumplimiento de contrato
} as const;

// CONFIGURACION REGIONAL
export const REGIONAL_CONFIG = {
  defaultLanguage: 'es',
  defaultTimezone: 'America/Santiago',
  defaultCountry: 'CL',
  defaultCurrency: 'CLP',
} as const;

// VALIDACIONES
export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100,
    required: true,
  },
  vat: {
    minLength: 8,
    maxLength: 20,
    pattern: /^[0-9.-]+$/,
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  phone: {
    pattern: /^[\+]?[0-9\s\-\(\)\.]*$/,
  },
  website: {
    pattern: /^https?:\/\/.+/,
  },
  creditLimit: {
    min: 0,
    max: 999999999,
  },
} as const;

// MENSAJES DE ERROR
export const ERROR_MESSAGES = {
  required: 'Este campo es obligatorio',
  invalidEmail: 'Email inválido',
  invalidPhone: 'Teléfono inválido',
  invalidVAT: 'RUT/RFC inválido',
  invalidWebsite: 'URL inválida',
  minLength: (min: number) => `Mínimo ${min} caracteres`,
  maxLength: (max: number) => `Máximo ${max} caracteres`,
} as const;

// CONFIGURACION DE TABLA
export const TABLE_CONFIG = {
  pageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
  sortableColumns: ['name', 'rank', 'createdAt', 'updatedAt'],
} as const;

// CONFIGURACION DE FILTROS
export const FILTER_CONFIG = {
  searchFields: ['name', 'vat', 'email', 'phone'],
  rankOptions: Object.values(SupplierRank),
  categoryOptions: SUPPLIER_CATEGORIES,
  statusOptions: ['active', 'inactive', 'suspended'],
} as const; 