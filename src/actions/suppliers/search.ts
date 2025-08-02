'use server';

import { SupplierInfo } from '@/components/purchases/SupplierSelectionConfirmation';

// Mock implementation of searchSuppliers function
// In a real application, this would make an API call to your backend
// and return actual supplier data from your database

export async function searchSuppliers(query: string): Promise<SupplierInfo[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data - replace with real API call
  const mockSuppliers: SupplierInfo[] = [
    {
      id: 1,
      name: 'Proveedor Ejemplo 1',
      taxId: '12.345.678-9',
      email: 'contacto@proveedor1.cl',
      phone: '+56 9 1234 5678'
    },
    {
      id: 2,
      name: 'Proveedor Ejemplo 2',
      taxId: '98.765.432-1',
      email: 'contacto@proveedor2.cl',
      phone: '+56 9 8765 4321'
    },
    {
      id: 3,
      name: 'Distribuidora Los Andes',
      taxId: '11.111.111-1',
      email: 'ventas@distribuidoralosandes.cl',
      phone: '+56 2 2345 6789'
    },
    {
      id: 4,
      name: 'Importadora del Sur',
      taxId: '22.222.222-2',
      email: 'contacto@importadoradelsur.cl',
      phone: '+56 2 3456 7890'
    },
    {
      id: 5,
      name: 'Comercializadora Norte',
      taxId: '33.333.333-3',
      email: 'ventas@comercializadoranorte.cl',
      phone: '+56 2 4567 8901'
    }
  ];

  // Búsqueda flexible por nombre o RUT
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];

  // Normalizar términos de búsqueda (eliminar acentos y caracteres especiales)
  const normalize = (str: string) => 
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const normalizedSearch = normalize(searchTerm);
  
  // Función para calcular similitud entre cadenas (método simple)
  const similarity = (s1: string, s2: string) => {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    // Si una cadena está vacía, retornar 0
    if (shorter.length === 0) return 0.0;
    
    // Calcular similitud basada en coincidencias parciales
    const longerArray = longer.split(/\s+/);
    const shorterArray = shorter.split(/\s+/);
    
    // Contar palabras coincidentes
    const matches = shorterArray.filter(word => 
      longerArray.some(w => w.includes(word) || word.includes(w))
    ).length;
    
    return matches / Math.max(longerArray.length, shorterArray.length);
  };

  // Buscar coincidencias exactas primero
  const exactMatches = mockSuppliers.filter(supplier => 
    normalize(supplier.name).includes(normalizedSearch) ||
    (supplier.taxId && normalize(supplier.taxId).includes(normalizedSearch))
  );

  // Si hay coincidencias exactas, retornarlas
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Si no hay coincidencias exactas, buscar coincidencias parciales
  const partialMatches = mockSuppliers
    .map(supplier => ({
      ...supplier,
      // Puntaje de coincidencia (0-1)
      matchScore: Math.max(
        similarity(normalize(supplier.name), normalizedSearch),
        supplier.taxId ? similarity(normalize(supplier.taxId), normalizedSearch) : 0
      )
    }))
    // Filtrar resultados con cierto grado de similitud
    .filter(item => item.matchScore > 0.3)
    // Ordenar por mejor coincidencia
    .sort((a, b) => b.matchScore - a.matchScore)
    // Eliminar el puntaje del resultado final
    .map(({ matchScore, ...supplier }) => supplier);

  return partialMatches;
}
