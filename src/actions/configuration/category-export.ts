'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface CategoryExportRow {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  parentName: string | null;
}

export async function getCategoriesForExport(): Promise<CategoryExportRow[]> {
  const supabase = await getSupabaseServerClient();
  const table = (process.env.NEXT_PUBLIC_CATEGORY_TABLE_NAME || 'Category') as string;

  const { data: cats, error } = await supabase
    .from(table)
    .select('*')
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);

  const categories = cats || [];

  // Resolver nombres de padres
  const parentIds = Array.from(new Set(categories.map((c: any) => c.parentId).filter(Boolean)));
  const parentMap = new Map<number, string>();
  if (parentIds.length > 0) {
    const { data: parents } = await supabase
      .from(table)
      .select('id, name')
      .in('id', parentIds);
    (parents || []).forEach((p: any) => parentMap.set(p.id, p.name));
  }

  return categories.map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description || null,
    parentId: c.parentId || null,
    parentName: c.parentId ? (parentMap.get(c.parentId) || null) : null,
  }));
}

export async function generateCategoriesExcel(): Promise<Buffer> {
  const XLSX = await import('xlsx');
  const rows = await getCategoriesForExport();

  const data = rows.map(r => ({
    'ID': r.id,
    'Nombre': r.name,
    'Descripción': r.description || '',
    'ID Padre': r.parentId || '',
    'Nombre Padre': r.parentName || ''
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },   // ID
    { wch: 30 },  // Nombre
    { wch: 40 },  // Descripción
    { wch: 10 },  // ID Padre
    { wch: 30 },  // Nombre Padre
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Categorías');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}


