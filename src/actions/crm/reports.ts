'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { LeadSource } from '@/types/crm';

// ==================== INTERFACES ====================

export interface CRMReportFilters {
  dateFrom?: string;
  dateTo?: string;
  source?: LeadSource;
  assignedTo?: string;
  period?: 'monthly' | 'annual';
}

export interface CRMReportSummary {
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  activeLeads: number;
  conversionRate: number;
  totalRevenue: number;
  avgDealSize: number;
  topLossReason: string | null;
}

export interface StageCount {
  stageId: number;
  stageName: string;
  stageColor: string;
  count: number;
  totalValue: number;
}

export interface SourceCount {
  source: string;
  count: number;
  won: number;
  lost: number;
  conversionRate: number;
}

export interface WinLossMonthly {
  month: string;
  won: number;
  lost: number;
  total: number;
  conversionRate: number;
  revenue: number;
}

export interface TimeInStageData {
  stageId: number;
  stageName: string;
  stageColor: string;
  avgDurationDays: number;
  medianDurationDays: number;
  leadCount: number;
}

export interface LossReasonData {
  category: string;
  categoryLabel: string;
  count: number;
  percentage: number;
}

// ==================== HELPERS ====================

const LOSS_CATEGORY_LABELS: Record<string, string> = {
  price: 'Precio',
  competitor: 'Competencia',
  timing: 'Timing',
  no_response: 'Sin Respuesta',
  requirements: 'Requisitos No Cumplidos',
  other: 'Otro',
};

function applyDateFilter(query: any, filters: CRMReportFilters, dateField: string = 'created_at') {
  if (filters.dateFrom) {
    query = query.gte(dateField, filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte(dateField, filters.dateTo + 'T23:59:59');
  }
  if (filters.source) {
    query = query.eq('source', filters.source);
  }
  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  return query;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ==================== REPORT FUNCTIONS ====================

/**
 * Main CRM report stats with date filtering
 */
export async function getCRMReportStats(filters: CRMReportFilters): Promise<{
  success: boolean;
  data?: {
    summary: CRMReportSummary;
    leadsByStage: StageCount[];
    leadsBySource: SourceCount[];
    winLossOverTime: WinLossMonthly[];
    pipelineFunnel: StageCount[];
  };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Fetch stages for reference
    const { data: stages } = await supabase
      .from('crm_stages')
      .select('id, name, description, color, order_index')
      .order('order_index', { ascending: true });

    const stageMap = new Map((stages || []).map(s => [s.id, s]));

    // Fetch leads with date filter - use * to avoid issues with columns that may not exist yet
    let leadsQuery = supabase
      .from('crm_leads')
      .select('*');

    leadsQuery = applyDateFilter(leadsQuery, filters);
    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      console.error('Error fetching CRM leads for report:', leadsError);
      return { success: false, error: leadsError.message };
    }

    const allLeads = leads || [];

    // Summary
    const wonLeads = allLeads.filter(l => l.stage_id === 7);
    const lostLeads = allLeads.filter(l => l.stage_id === 8);
    const activeLeads = allLeads.filter(l => l.stage_id !== 7 && l.stage_id !== 8);
    const totalRevenue = wonLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
    const closedLeads = wonLeads.length + lostLeads.length;

    // Top loss reason
    const lossReasons: Record<string, number> = {};
    lostLeads.forEach(l => {
      const cat = l.loss_reason_category || 'other';
      lossReasons[cat] = (lossReasons[cat] || 0) + 1;
    });
    const topLossReason = Object.entries(lossReasons).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const summary: CRMReportSummary = {
      totalLeads: allLeads.length,
      wonLeads: wonLeads.length,
      lostLeads: lostLeads.length,
      activeLeads: activeLeads.length,
      conversionRate: closedLeads > 0 ? Math.round((wonLeads.length / closedLeads) * 100) : 0,
      totalRevenue,
      avgDealSize: wonLeads.length > 0 ? Math.round(totalRevenue / wonLeads.length) : 0,
      topLossReason: topLossReason ? (LOSS_CATEGORY_LABELS[topLossReason] || topLossReason) : null,
    };

    // Leads by stage
    const stageCountMap: Record<number, { count: number; totalValue: number }> = {};
    allLeads.forEach(l => {
      if (!stageCountMap[l.stage_id]) stageCountMap[l.stage_id] = { count: 0, totalValue: 0 };
      stageCountMap[l.stage_id].count++;
      stageCountMap[l.stage_id].totalValue += l.estimated_value || 0;
    });

    const leadsByStage: StageCount[] = (stages || []).map(s => ({
      stageId: s.id,
      stageName: s.description || s.name,
      stageColor: s.color,
      count: stageCountMap[s.id]?.count || 0,
      totalValue: stageCountMap[s.id]?.totalValue || 0,
    }));

    // Pipeline funnel (same as leadsByStage, ordered)
    const pipelineFunnel = leadsByStage;

    // Leads by source
    const sourceMap: Record<string, { count: number; won: number; lost: number }> = {};
    allLeads.forEach(l => {
      if (!sourceMap[l.source]) sourceMap[l.source] = { count: 0, won: 0, lost: 0 };
      sourceMap[l.source].count++;
      if (l.stage_id === 7) sourceMap[l.source].won++;
      if (l.stage_id === 8) sourceMap[l.source].lost++;
    });

    const leadsBySource: SourceCount[] = Object.entries(sourceMap).map(([source, data]) => ({
      source,
      count: data.count,
      won: data.won,
      lost: data.lost,
      conversionRate: (data.won + data.lost) > 0 ? Math.round((data.won / (data.won + data.lost)) * 100) : 0,
    }));

    // Win/Loss over time (monthly)
    const monthlyMap: Record<string, { won: number; lost: number; total: number; revenue: number }> = {};
    allLeads.forEach(l => {
      const closeDate = l.actual_close_date || l.updated_at;
      const date = new Date(l.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { won: 0, lost: 0, total: 0, revenue: 0 };
      monthlyMap[monthKey].total++;

      if (l.stage_id === 7) {
        const closeDateObj = closeDate ? new Date(closeDate) : date;
        const closeMonthKey = `${closeDateObj.getFullYear()}-${String(closeDateObj.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[closeMonthKey]) monthlyMap[closeMonthKey] = { won: 0, lost: 0, total: 0, revenue: 0 };
        monthlyMap[closeMonthKey].won++;
        monthlyMap[closeMonthKey].revenue += l.estimated_value || 0;
      }
      if (l.stage_id === 8) {
        const closeDateObj = closeDate ? new Date(closeDate) : date;
        const closeMonthKey = `${closeDateObj.getFullYear()}-${String(closeDateObj.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[closeMonthKey]) monthlyMap[closeMonthKey] = { won: 0, lost: 0, total: 0, revenue: 0 };
        monthlyMap[closeMonthKey].lost++;
      }
    });

    const winLossOverTime: WinLossMonthly[] = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        won: data.won,
        lost: data.lost,
        total: data.total,
        conversionRate: (data.won + data.lost) > 0 ? Math.round((data.won / (data.won + data.lost)) * 100) : 0,
        revenue: data.revenue,
      }));

    return {
      success: true,
      data: { summary, leadsByStage, leadsBySource, winLossOverTime, pipelineFunnel },
    };
  } catch (error) {
    console.error('Error in getCRMReportStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Time in stage report - calculates average time leads spend in each stage
 */
export async function getTimeInStageReport(filters: CRMReportFilters): Promise<{
  success: boolean;
  data?: TimeInStageData[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Fetch stages
    const { data: stages } = await supabase
      .from('crm_stages')
      .select('id, name, description, color, order_index')
      .order('order_index', { ascending: true });

    // Fetch leads in date range
    let leadsQuery = supabase
      .from('crm_leads')
      .select('id, stage_id, created_at');
    leadsQuery = applyDateFilter(leadsQuery, filters);
    const { data: leads } = await leadsQuery;

    if (!leads || leads.length === 0) {
      return {
        success: true,
        data: (stages || []).map(s => ({
          stageId: s.id,
          stageName: s.description || s.name,
          stageColor: s.color,
          avgDurationDays: 0,
          medianDurationDays: 0,
          leadCount: 0,
        })),
      };
    }

    const leadIds = leads.map(l => l.id);
    const leadCreatedMap = new Map(leads.map(l => [l.id, l.created_at]));

    // Fetch audit entries with stage changes
    const { data: auditEntries } = await supabase
      .from('crm_lead_audit')
      .select('lead_id, changes, created_at')
      .in('lead_id', leadIds)
      .eq('action', 'updated')
      .order('created_at', { ascending: true });

    // Compute time in stage per lead
    // stageId -> array of durations in days
    const stageDurations: Record<number, number[]> = {};

    // Group audit entries by lead
    const auditByLead: Record<number, { changes: any; created_at: string }[]> = {};
    (auditEntries || []).forEach(entry => {
      if (!auditByLead[entry.lead_id]) auditByLead[entry.lead_id] = [];
      auditByLead[entry.lead_id].push(entry);
    });

    leads.forEach(lead => {
      const entries = auditByLead[lead.id] || [];
      // Filter only entries that have stage_id changes
      const stageChanges = entries.filter(e => {
        try {
          const changes = typeof e.changes === 'string' ? JSON.parse(e.changes) : e.changes;
          return changes && changes.stage_id !== undefined;
        } catch {
          return false;
        }
      });

      // Build timeline: start at stage 1 from created_at
      let currentStageId = 1; // Default first stage
      let currentTimestamp = new Date(lead.created_at).getTime();

      stageChanges.forEach(entry => {
        const entryTime = new Date(entry.created_at).getTime();
        const durationDays = (entryTime - currentTimestamp) / (1000 * 60 * 60 * 24);

        if (!stageDurations[currentStageId]) stageDurations[currentStageId] = [];
        stageDurations[currentStageId].push(durationDays);

        // Parse the new stage from changes
        try {
          const changes = typeof entry.changes === 'string' ? JSON.parse(entry.changes) : entry.changes;
          if (changes.stage_id?.new !== undefined) {
            currentStageId = changes.stage_id.new;
          } else if (typeof changes.stage_id === 'number') {
            currentStageId = changes.stage_id;
          }
        } catch {
          // Skip unparseable entries
        }
        currentTimestamp = entryTime;
      });

      // For the current stage (if not final), add duration until now
      const now = Date.now();
      const durationDays = (now - currentTimestamp) / (1000 * 60 * 60 * 24);
      if (!stageDurations[currentStageId]) stageDurations[currentStageId] = [];
      stageDurations[currentStageId].push(durationDays);
    });

    const result: TimeInStageData[] = (stages || []).map(s => {
      const durations = stageDurations[s.id] || [];
      const avg = durations.length > 0
        ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
        : 0;
      return {
        stageId: s.id,
        stageName: s.description || s.name,
        stageColor: s.color,
        avgDurationDays: avg,
        medianDurationDays: Math.round(median(durations) * 10) / 10,
        leadCount: durations.length,
      };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Error in getTimeInStageReport:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Loss reason report - analyzes why deals were lost
 */
export async function getLossReasonReport(filters: CRMReportFilters): Promise<{
  success: boolean;
  data?: LossReasonData[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from('crm_leads')
      .select('*')
      .eq('stage_id', 8);

    query = applyDateFilter(query, filters);
    const { data: lostLeads, error } = await query;

    if (error) {
      console.error('Error fetching lost leads:', error);
      return { success: false, error: error.message };
    }

    const total = lostLeads?.length || 0;
    const categoryCount: Record<string, number> = {};
    (lostLeads || []).forEach(l => {
      const cat = l.loss_reason_category || 'other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const result: LossReasonData[] = Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        categoryLabel: LOSS_CATEGORY_LABELS[category] || category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error in getLossReasonReport:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}
