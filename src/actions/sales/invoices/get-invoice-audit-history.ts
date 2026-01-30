'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export interface InvoiceAuditLogEntry {
  id: number;
  invoice_id: number | null;
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

export interface InvoiceAuditInfo {
  invoice_id: number;
  invoice_number: string;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  seller_name: string | null;
  audit_log: InvoiceAuditLogEntry[];
}

/**
 * Obtiene el historial de auditoría de una factura de venta
 */
export async function getInvoiceAuditHistory(invoiceId: number): Promise<InvoiceAuditInfo | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const supabase = await getSupabaseServerClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, number, total, status, created_at, updated_at, seller_id')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return null;
    }

    const { data: auditLog, error: auditError } = await supabase
      .from('invoice_audit_log')
      .select('id, invoice_id, action_type, user_id, field_name, old_value, new_value, change_reason, created_at')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false });

    if (auditError) {
      console.error('Error obteniendo auditoría factura:', auditError);
    }

    const userIds = [...new Set((auditLog || []).map(e => e.user_id).filter(Boolean))] as string[];
    if (invoice.seller_id) userIds.push(invoice.seller_id);
    const uniqueUserIds = [...new Set(userIds)];

    const userMap = new Map<string, { name: string | null; email: string | null }>();
    if (uniqueUserIds.length > 0) {
      const { data: users } = await supabase
        .from('User')
        .select('id, name, email')
        .in('id', uniqueUserIds);
      users?.forEach(u => userMap.set(u.id, { name: u.name ?? null, email: u.email ?? null }));
    }

    const enrichedLog: InvoiceAuditLogEntry[] = (auditLog || []).map(entry => {
      // user_name: null => 'Sistema', no resuelto => 'Sin usuario', resuelto => name
      const name = entry.user_id ? (userMap.get(entry.user_id)?.name ?? 'Sin usuario') : 'Sistema';
      // user_email: solo si existe en User; si no, null
      const email = entry.user_id ? (userMap.get(entry.user_id)?.email ?? null) : null;
      return { ...entry, user_name: name, user_email: email };
    });

    return {
      invoice_id: invoice.id,
      invoice_number: invoice.number ?? '',
      total: Number(invoice.total),
      status: invoice.status ?? 'draft',
      created_at: invoice.created_at,
      updated_at: invoice.updated_at ?? invoice.created_at,
      seller_name: invoice.seller_id ? userMap.get(invoice.seller_id)?.name ?? null : null,
      audit_log: enrichedLog,
    };
  } catch (error) {
    console.error('Error getInvoiceAuditHistory:', error);
    return null;
  }
}
