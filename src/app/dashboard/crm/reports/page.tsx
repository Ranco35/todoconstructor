'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  getCRMReportStats,
  getTimeInStageReport,
  getLossReasonReport,
  type CRMReportFilters,
  type CRMReportSummary,
  type StageCount,
  type SourceCount,
  type WinLossMonthly,
  type TimeInStageData,
  type LossReasonData,
} from '@/actions/crm/reports';

type PeriodPreset = 'all_time' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'last_year' | 'custom';
type TabType = 'funnel' | 'winloss' | 'time_in_stage' | 'revenue' | 'sources' | 'loss_analysis';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function getDateRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case 'this_month':
      return {
        from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
        to: `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`,
      };
    case 'last_month': {
      const lm = month === 0 ? 11 : month - 1;
      const ly = month === 0 ? year - 1 : year;
      return {
        from: `${ly}-${String(lm + 1).padStart(2, '0')}-01`,
        to: `${ly}-${String(lm + 1).padStart(2, '0')}-${new Date(ly, lm + 1, 0).getDate()}`,
      };
    }
    case 'this_quarter': {
      const qStart = Math.floor(month / 3) * 3;
      return {
        from: `${year}-${String(qStart + 1).padStart(2, '0')}-01`,
        to: `${year}-${String(qStart + 3).padStart(2, '0')}-${new Date(year, qStart + 3, 0).getDate()}`,
      };
    }
    case 'this_year':
      return { from: `${year}-01-01`, to: `${year}-12-31` };
    case 'last_year':
      return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
    default:
      return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
}

export default function CRMReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('funnel');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('all_time');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Report data
  const [summary, setSummary] = useState<CRMReportSummary | null>(null);
  const [leadsByStage, setLeadsByStage] = useState<StageCount[]>([]);
  const [leadsBySource, setLeadsBySource] = useState<SourceCount[]>([]);
  const [winLossOverTime, setWinLossOverTime] = useState<WinLossMonthly[]>([]);
  const [timeInStage, setTimeInStage] = useState<TimeInStageData[]>([]);
  const [lossReasons, setLossReasons] = useState<LossReasonData[]>([]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const filters: CRMReportFilters = {};

      if (periodPreset !== 'all_time') {
        const dateRange = periodPreset === 'custom'
          ? { from: customFrom, to: customTo }
          : getDateRange(periodPreset);
        filters.dateFrom = dateRange.from;
        filters.dateTo = dateRange.to;
      }

      const [statsResult, timeResult, lossResult] = await Promise.all([
        getCRMReportStats(filters),
        getTimeInStageReport(filters),
        getLossReasonReport(filters),
      ]);

      if (statsResult.success && statsResult.data) {
        setSummary(statsResult.data.summary);
        setLeadsByStage(statsResult.data.leadsByStage);
        setLeadsBySource(statsResult.data.leadsBySource);
        setWinLossOverTime(statsResult.data.winLossOverTime);
      }

      if (timeResult.success && timeResult.data) {
        setTimeInStage(timeResult.data);
      }

      if (lossResult.success && lossResult.data) {
        setLossReasons(lossResult.data);
      }
    } catch (error) {
      console.error('Error loading CRM reports:', error);
    } finally {
      setLoading(false);
    }
  }, [periodPreset, customFrom, customTo]);

  useEffect(() => {
    if (periodPreset === 'all_time' || periodPreset !== 'custom' || (customFrom && customTo)) {
      loadReports();
    }
  }, [loadReports, periodPreset, customFrom, customTo]);

  const TABS: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'funnel', label: 'Embudo', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'winloss', label: 'Win/Loss', icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'time_in_stage', label: 'Tiempo en Etapa', icon: <Clock className="h-4 w-4" /> },
    { key: 'revenue', label: 'Revenue', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'sources', label: 'Fuentes', icon: <PieChartIcon className="h-4 w-4" /> },
    { key: 'loss_analysis', label: 'Perdidos', icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
    { key: 'all_time', label: 'Todo' },
    { key: 'this_month', label: 'Este Mes' },
    { key: 'last_month', label: 'Mes Anterior' },
    { key: 'this_quarter', label: 'Este Trimestre' },
    { key: 'this_year', label: 'Este Año' },
    { key: 'last_year', label: 'Año Anterior' },
    { key: 'custom', label: 'Personalizado' },
  ];

  const monthLabel = (month: string) => {
    const [y, m] = month.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(m) - 1]} ${y}`;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/crm" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          CRM
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Reportes</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes CRM</h1>
        <p className="text-muted-foreground">Análisis de pipeline, conversiones y rendimiento de ventas</p>
      </div>

      {/* Period Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            {PERIOD_PRESETS.map((p) => (
              <Button
                key={p.key}
                variant={periodPreset === p.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriodPreset(p.key)}
              >
                {p.label}
              </Button>
            ))}
            {periodPreset === 'custom' && (
              <div className="flex items-end gap-2 ml-2">
                <div>
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-9 w-40"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hasta</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-9 w-40"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando reportes...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.totalLeads || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {summary?.activeLeads || 0} activos en pipeline
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ganados / Conversión</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  {summary?.wonLeads || 0}
                  <span className="text-lg ml-2">({summary?.conversionRate || 0}%)</span>
                </div>
                <p className="text-xs text-muted-foreground">Tasa de conversión sobre cerrados</p>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{summary?.lostLeads || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {summary?.topLossReason ? `Razón principal: ${summary.topLossReason}` : 'Sin datos de razón'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  ${(summary?.totalRevenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Promedio: ${(summary?.avgDealSize || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b pb-2">
            {TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="gap-1.5"
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Tab Content */}
          <Card>
            <CardContent className="pt-6">
              {/* Funnel */}
              {activeTab === 'funnel' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Embudo de Pipeline</h3>
                  {leadsByStage.length > 0 ? (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={leadsByStage} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="stageName" type="category" width={150} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value: number, name: string) =>
                              name === 'count' ? [`${value} leads`, 'Leads'] : [`$${value.toLocaleString()}`, 'Valor']
                            }
                          />
                          <Legend />
                          <Bar dataKey="count" name="Leads" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Etapa</th>
                              <th className="text-right p-2">Leads</th>
                              <th className="text-right p-2">Valor Total</th>
                              <th className="text-right p-2">% del Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leadsByStage.map((stage, i) => (
                              <tr key={stage.stageId} className="border-b hover:bg-gray-50">
                                <td className="p-2 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.stageColor }} />
                                  {stage.stageName}
                                </td>
                                <td className="text-right p-2 font-medium">{stage.count}</td>
                                <td className="text-right p-2">${stage.totalValue.toLocaleString()}</td>
                                <td className="text-right p-2">
                                  {summary && summary.totalLeads > 0
                                    ? Math.round((stage.count / summary.totalLeads) * 100)
                                    : 0}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No hay datos para el período seleccionado</p>
                  )}
                </div>
              )}

              {/* Win/Loss Over Time */}
              {activeTab === 'winloss' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Win/Loss en el Tiempo</h3>
                  {winLossOverTime.length > 0 ? (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={winLossOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip
                            labelFormatter={monthLabel}
                            formatter={(value: number, name: string) => {
                              const labels: Record<string, string> = { won: 'Ganados', lost: 'Perdidos', conversionRate: 'Conversión %' };
                              return [value, labels[name] || name];
                            }}
                          />
                          <Legend formatter={(v) => ({ won: 'Ganados', lost: 'Perdidos', conversionRate: 'Conversión %' }[v] || v)} />
                          <Line type="monotone" dataKey="won" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="conversionRate" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Mes</th>
                              <th className="text-right p-2">Total</th>
                              <th className="text-right p-2 text-green-700">Ganados</th>
                              <th className="text-right p-2 text-red-700">Perdidos</th>
                              <th className="text-right p-2">Conversión</th>
                            </tr>
                          </thead>
                          <tbody>
                            {winLossOverTime.map((row) => (
                              <tr key={row.month} className="border-b hover:bg-gray-50">
                                <td className="p-2">{monthLabel(row.month)}</td>
                                <td className="text-right p-2">{row.total}</td>
                                <td className="text-right p-2 text-green-700 font-medium">{row.won}</td>
                                <td className="text-right p-2 text-red-700 font-medium">{row.lost}</td>
                                <td className="text-right p-2">{row.conversionRate}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No hay datos para el período seleccionado</p>
                  )}
                </div>
              )}

              {/* Time in Stage */}
              {activeTab === 'time_in_stage' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tiempo Promedio por Etapa</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Identifica cuellos de botella en tu pipeline viendo cuánto tiempo pasan los leads en cada etapa.
                  </p>
                  {timeInStage.length > 0 ? (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={timeInStage.filter(s => s.leadCount > 0)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="stageName" tick={{ fontSize: 11 }} />
                          <YAxis label={{ value: 'Días', angle: -90, position: 'insideLeft' }} />
                          <Tooltip
                            formatter={(value: number) => [`${value} días`, 'Promedio']}
                          />
                          <Bar dataKey="avgDurationDays" name="Días promedio" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                            {timeInStage.filter(s => s.leadCount > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.stageColor || CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Etapa</th>
                              <th className="text-right p-2">Promedio (días)</th>
                              <th className="text-right p-2">Mediana (días)</th>
                              <th className="text-right p-2">Leads</th>
                            </tr>
                          </thead>
                          <tbody>
                            {timeInStage.map((stage) => (
                              <tr key={stage.stageId} className="border-b hover:bg-gray-50">
                                <td className="p-2 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.stageColor }} />
                                  {stage.stageName}
                                </td>
                                <td className="text-right p-2 font-medium">{stage.avgDurationDays}</td>
                                <td className="text-right p-2">{stage.medianDurationDays}</td>
                                <td className="text-right p-2">{stage.leadCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No hay datos de auditoría disponibles</p>
                  )}
                </div>
              )}

              {/* Revenue */}
              {activeTab === 'revenue' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Revenue por Mes</h3>
                  {winLossOverTime.length > 0 ? (
                    <div className="space-y-6">
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={winLossOverTime.filter(m => m.revenue > 0)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            labelFormatter={monthLabel}
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                          />
                          <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <p className="text-sm text-green-700">Revenue Total</p>
                          <p className="text-xl font-bold text-green-900">${(summary?.totalRevenue || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">Deal Promedio</p>
                          <p className="text-xl font-bold text-blue-900">${(summary?.avgDealSize || 0).toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                          <p className="text-sm text-purple-700">Deals Cerrados</p>
                          <p className="text-xl font-bold text-purple-900">{summary?.wonLeads || 0}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-700">Tasa Conversión</p>
                          <p className="text-xl font-bold text-orange-900">{summary?.conversionRate || 0}%</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No hay revenue registrado para este período</p>
                  )}
                </div>
              )}

              {/* Sources */}
              {activeTab === 'sources' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Análisis por Fuente</h3>
                  {leadsBySource.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={leadsBySource}
                              dataKey="count"
                              nameKey="source"
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              label={({ source, count }) => `${source} (${count})`}
                            >
                              {leadsBySource.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} leads`, 'Cantidad']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Fuente</th>
                              <th className="text-right p-2">Total</th>
                              <th className="text-right p-2 text-green-700">Ganados</th>
                              <th className="text-right p-2 text-red-700">Perdidos</th>
                              <th className="text-right p-2">Conversión</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leadsBySource.map((source, i) => (
                              <tr key={source.source} className="border-b hover:bg-gray-50">
                                <td className="p-2 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  <span className="capitalize">{source.source}</span>
                                </td>
                                <td className="text-right p-2 font-medium">{source.count}</td>
                                <td className="text-right p-2 text-green-700">{source.won}</td>
                                <td className="text-right p-2 text-red-700">{source.lost}</td>
                                <td className="text-right p-2">
                                  <Badge variant={source.conversionRate >= 50 ? 'default' : 'secondary'}>
                                    {source.conversionRate}%
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">No hay datos para el período seleccionado</p>
                  )}
                </div>
              )}

              {/* Loss Analysis */}
              {activeTab === 'loss_analysis' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Análisis de Pérdidas</h3>
                  {lossReasons.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <ResponsiveContainer width="100%" height={350}>
                          <PieChart>
                            <Pie
                              data={lossReasons}
                              dataKey="count"
                              nameKey="categoryLabel"
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              label={({ categoryLabel, percentage }) => `${categoryLabel} (${percentage}%)`}
                            >
                              {lossReasons.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value} leads`, 'Cantidad']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Razón</th>
                              <th className="text-right p-2">Cantidad</th>
                              <th className="text-right p-2">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lossReasons.map((reason, i) => (
                              <tr key={reason.category} className="border-b hover:bg-gray-50">
                                <td className="p-2 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                  {reason.categoryLabel}
                                </td>
                                <td className="text-right p-2 font-medium">{reason.count}</td>
                                <td className="text-right p-2">{reason.percentage}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Total leads perdidos:</strong> {lossReasons.reduce((sum, r) => sum + r.count, 0)}
                          </p>
                          {lossReasons[0] && (
                            <p className="text-sm text-amber-700 mt-1">
                              Razón principal: <strong>{lossReasons[0].categoryLabel}</strong> ({lossReasons[0].percentage}%)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-muted-foreground">No hay leads perdidos con razón registrada</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Las razones se registran al mover un lead a &quot;Perdido&quot; en el pipeline
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
