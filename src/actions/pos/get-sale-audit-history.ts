'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export interface POSSaleAuditLogEntry {
  id: number;
  sale_id: number | null;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id: string | null;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
}

export interface POSSaleAuditInfo {
  sale_id: number;
  sale_number: string;
  customer_name: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  audit_log: POSSaleAuditLogEntry[];
}

/**
 * Obtiene el historial de auditoría de una venta POS
 */
export async function getPOSSaleAuditHistory(saleId: number): Promise<POSSaleAuditInfo | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const supabase = await getSupabaseServerClient();

    const { data: sale, error: saleError } = await supabase
      .from('POSSale')
      .select('id, saleNumber, customerName, total, createdAt, updatedAt')
      .eq('id', saleId)
      .single();

    if (saleError || !sale) {
      return null;
    }

    const { data: auditLog, error: auditError } = await supabase
      .from('pos_sale_audit_log')
      .select('id, sale_id, action_type, user_id, field_name, old_value, new_value, change_reason, created_at')
      .eq('sale_id', saleId)
      .order('created_at', { ascending: false });

    if (auditError) {
      console.error('Error obteniendo auditoría venta POS:', auditError);
    }

    const userIds = [...new Set((auditLog || []).map(e => e.user_id).filter(Boolean))] as string[];
    const userMap = new Map<string, { name: string | null; email: string | null }>();

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('User')
        .select('id, name, email')
        .in('id', userIds);
      users?.forEach(u => userMap.set(u.id, { name: u.name ?? null, email: u.email ?? null }));
    }

    const enrichedLog: POSSaleAuditLogEntry[] = (auditLog || []).map(entry => {
      // user_name: null => 'Sistema', no resuelto => 'Sin usuario', resuelto => name
      const name = entry.user_id ? (userMap.get(entry.user_id)?.name ?? 'Sin usuario') : 'Sistema';
      // user_email: solo si existe en User; si no, null
      const email = entry.user_id ? (userMap.get(entry.user_id)?.email ?? null) : null;
      return { ...entry, user_name: name, user_email: email };
    });

    return {
      sale_id: sale.id,
      sale_number: sale.saleNumber ?? '',
      customer_name: sale.customerName ?? null,
      total: Number(sale.total),
      created_at: sale.createdAt,
      updated_at: sale.updatedAt ?? sale.createdAt,
      audit_log: enrichedLog,
    };
  } catch (error) {
    console.error('Error getPOSSaleAuditHistory:', error);
    return null;
  }
}
