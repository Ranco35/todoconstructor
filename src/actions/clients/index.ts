// Exportar todas las acciones del módulo de clientes

// Acciones principales de clientes
export { createClient } from './create';
export { getClients, getClientStats } from './list';
export { getClient, getClientByRut, searchClients } from './get';
export { 
  updateClient, 
  updateClientStatus, 
  updateClientFrequent, 
  updateClientRanking 
} from './update';
export { 
  deleteClient, 
  softDeleteClient, 
  deleteClientContact, 
  removeClientTag 
} from './delete';

// Acciones de etiquetas
export { 
  getClientTags,
  createClientTag,
  updateClientTag,
  deleteClientTag,
  assignClientTag,
  assignTagsToMultipleClients
} from './tags';

// Acciones de catálogos
export { 
  getCountries,
  getEconomicSectors,
  getEconomicSectorSubsectors,
  getRelationshipTypes,
  createRelationshipType,
  updateRelationshipType,
  deleteRelationshipType,
  initializeDefaultData
} from './catalogs';

export * from './verify-tables'; 