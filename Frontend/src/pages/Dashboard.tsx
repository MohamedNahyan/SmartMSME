import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Bell, AlertCircle,
  RefreshCw, ArrowRight, Clock, CheckCircle2, Package, Building2, Percent
} from 'lucide-react'
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell, BarChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Build explicit date_from / date_to strings for a given preset + year
function getDateParams(preset: string, year: number): string {
  if (!preset) return ''
  const now = new Date()
  const y = year

  if (preset === 'this_year') {
    return `date_from=${y}-01-01&date_to=${y}-12-31`
  }
  if (preset === 'this_month') {
    // use current month but in the selected year
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
    return `date_from=${y}-${m}-01&date_to=${y}-${m}-${lastDay}`
  }
  if (preset === 'last_month') {
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const m = String(lastMonthDate.getMonth() + 1).padStart(2, '0')
    const lastDay = new Date(y, lastMonthDate.getMonth() + 1, 0).getDate()
    return `date_from=${y}-${m}-01&date_to=${y}-${m}-${lastDay}`
  }
  return ''
}

const DATE_RANGES = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
  { label: 'Custom', value: 'custom' },
  { label: 'All Time', value: '' },
]

function KPICard({ title, value, sub, icon: Icon, bg, text, trend }: any) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{title}</p>
          <div className={`p-2 rounded-xl ${bg} shrink-0 ml-1`}>
            <Icon className={`w-4 h-4 ${text}`} />
          </div>
        </div>
        <p className={`text-xl font-bold truncate ${text}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}% margin
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TopProductsCard({ byRevenue, byQty }: { byRevenue: any[], byQty: any[] }) {
  const [tab, setTab] = useState<'revenue' | 'qty'>('revenue')
  const data = tab === 'revenue' ? byRevenue : byQty
  const hasData = data.length > 0
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold text-gray-800">Top Products</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTab('revenue')} className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${tab === 'revenue' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Revenue</button>
            <button onClick={() => setTab('qty')} className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all ${tab === 'qty' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Units</button>
          </div>
          <Link to="/products" className="text-xs text-blue-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              {tab === 'revenue'
                ? <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                : <XAxis type="number" tick={{ fontSize: 10 }} />}
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
              <Tooltip formatter={(v: any) => tab === 'revenue' ? formatCurrency(v) : `${v} units`} />
              <Bar dataKey={tab === 'revenue' ? 'revenue' : 'quantity'} fill={tab === 'revenue' ? '#10b981' : '#8b5cf6'} name={tab === 'revenue' ? 'Revenue' : 'Units Sold'} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-56 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Package className="w-8 h-8 opacity-30" />
            <p className="text-sm">No product data</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [revenueTrend, setRevenueTrend] = useState<any[]>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [topProductsQty, setTopProductsQty] = useState<any[]>([])
  const [salesGrowth, setSalesGrowth] = useState<any[]>([])
  const [branchPerformance, setBranchPerformance] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [dateRange, setDateRange] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Generate year options: current year ± 3
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i)

  useEffect(() => {
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
  }, [])

  useEffect(() => { loadDashboard() }, [selectedBranch, dateRange, selectedYear, customFrom, customTo])

  const buildQs = () => {
    const parts: string[] = []
    if (selectedBranch) parts.push(`branch_id=${selectedBranch}`)
    if (dateRange === 'custom') {
      if (customFrom) parts.push(`date_from=${customFrom}`)
      if (customTo) parts.push(`date_to=${customTo}`)
    } else {
      const dateParams = getDateParams(dateRange, selectedYear)
      if (dateParams) parts.push(dateParams)
    }
    return parts.length ? `?${parts.join('&')}` : ''
  }

  const loadDashboard = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    const qs = buildQs()

    try {
      const [m, r, e, p, pq, sg, bp] = await Promise.all([
        api.get(`/dashboard/overview/${qs}`).catch(() => ({ data: {} })),
        api.get(`/dashboard/revenue-trend/${qs}`).catch(() => ({ data: [] })),
        api.get(`/dashboard/expense-breakdown/${qs}`).catch(() => ({ data: [] })),
        api.get(`/dashboard/top-products-revenue/${qs}`).catch(() => ({ data: [] })),
        api.get(`/dashboard/top-products/${qs}`).catch(() => ({ data: [] })),
        api.get(`/dashboard/sales-growth/${qs}`).catch(() => ({ data: [] })),
        api.get(`/dashboard/branch-performance/${qs}`).catch(() => ({ data: [] })),
      ])

      setMetrics(m.data)
      setRevenueTrend(
        Array.isArray(r.data)
          ? r.data.map((d: any) => ({
              month: d.month ? new Date(d.month).toLocaleDateString('en', { month: 'short', year: '2-digit' }) : '',
              revenue: parseFloat(d.revenue) || 0,
            }))
          : []
      )
      setExpenseBreakdown(
        Array.isArray(e.data)
          ? e.data.map((d: any) => ({ category: d.category__name || 'Other', amount: parseFloat(d.total) || 0 }))
          : []
      )
      setTopProducts(
        Array.isArray(p.data)
          ? p.data.map((d: any) => ({ name: d.product__name, revenue: parseFloat(d.revenue) || 0 }))
          : []
      )
      setTopProductsQty(
        Array.isArray(pq.data)
          ? pq.data.map((d: any) => ({ name: d.product__name, quantity: parseInt(d.quantity) || 0 }))
          : []
      )
      setSalesGrowth(
        Array.isArray(sg.data)
          ? sg.data.map((d: any) => ({
              month: d.month ? new Date(d.month).toLocaleDateString('en', { month: 'short', year: '2-digit' }) : '',
              growth: parseFloat(d.growth_rate) || 0,
              revenue: parseFloat(d.revenue) || 0,
            }))
          : []
      )
      setBranchPerformance(Array.isArray(bp.data) ? bp.data : [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const upcomingReminders: any[] = metrics?.upcoming_reminders || []
  const now = new Date()
  const profitColor = (metrics?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-500'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-full">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business performance overview</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="h-9 rounded-lg border bg-white px-3 text-sm shadow-sm"
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          {/* Year selector — only show for preset ranges */}
          {dateRange && dateRange !== 'custom' && (
            <select
              className="h-9 rounded-lg border bg-white px-3 text-sm shadow-sm"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {/* Custom date pickers */}
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="h-9 rounded-lg border bg-white px-3 text-sm shadow-sm"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="h-9 rounded-lg border bg-white px-3 text-sm shadow-sm"
              />
            </>
          )}
          <button
            onClick={() => loadDashboard(true)}
            title="Refresh"
            className="h-9 w-9 flex items-center justify-center rounded-lg border bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Date Range Tabs */}
      <div className="flex gap-1 bg-white border rounded-xl p-1 w-fit shadow-sm">
        {DATE_RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => setDateRange(r.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              dateRange === r.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
            <KPICard title="Total Revenue" value={formatCurrency(metrics?.revenue || 0)} icon={DollarSign} bg="bg-blue-50" text="text-blue-600" />
            <KPICard title="Other Income" value={formatCurrency(metrics?.total_income || 0)} sub="non-sales" icon={TrendingUp} bg="bg-teal-50" text="text-teal-600" />
            <KPICard title="Total Expenses" value={formatCurrency(metrics?.expenses || 0)} icon={TrendingDown} bg="bg-red-50" text="text-red-500" />
            <KPICard
              title="Expense Ratio"
              value={`${(metrics?.expense_ratio || 0).toFixed(1)}%`}
              sub="of revenue"
              icon={Percent}
              bg={(metrics?.expense_ratio || 0) > 80 ? 'bg-red-50' : 'bg-indigo-50'}
              text={(metrics?.expense_ratio || 0) > 80 ? 'text-red-500' : 'text-indigo-600'}
            />
            <KPICard
              title="Net Profit"
              value={formatCurrency(metrics?.profit || 0)}
              icon={TrendingUp}
              bg={(metrics?.profit || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'}
              text={profitColor}
              trend={typeof metrics?.profit_margin === 'number' ? metrics.profit_margin : undefined}
            />
            <KPICard
              title="Total Sales"
              value={metrics?.total_sales || 0}
              sub={`Avg: ${formatCurrency(metrics?.average_order_value || 0)}`}
              icon={ShoppingCart}
              bg="bg-purple-50" text="text-purple-600"
            />
            <KPICard title="Pending" value={metrics?.pending_reminders || 0} sub="reminders" icon={Bell} bg="bg-amber-50" text="text-amber-600" />
            <KPICard title="Overdue" value={metrics?.overdue_reminders || 0} sub="reminders" icon={AlertCircle} bg="bg-orange-50" text="text-orange-600" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      <Bar dataKey="revenue" fill="#bfdbfe" name="Revenue" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Trend" />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <TrendingUp className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No revenue data for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={170}>
                      <PieChart>
                        <Pie data={expenseBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={75} innerRadius={38}>
                          {expenseBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                      {expenseBreakdown.slice(0, 4).map((e, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-gray-600 truncate">{e.category}</span>
                          </div>
                          <span className="font-semibold text-gray-700 ml-2 shrink-0">{formatCurrency(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <TrendingDown className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No expense data</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sales Growth Chart */}
          {salesGrowth.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-800">Monthly Sales Growth %</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={salesGrowth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: any, name: string) => name === 'Growth %' ? `${parseFloat(v).toFixed(1)}%` : formatCurrency(v)} />
                    <ReferenceLine yAxisId="left" y={0} stroke="#9ca3af" strokeDasharray="4 4" />
                    <Bar yAxisId="right" dataKey="revenue" fill="#bfdbfe" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="left" type="monotone" dataKey="growth" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} name="Growth %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <TopProductsCard
              byRevenue={topProducts}
              byQty={topProductsQty}
            />

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">Upcoming Reminders</CardTitle>
                <Link to="/reminders" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {upcomingReminders.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingReminders.slice(0, 5).map((r: any, i: number) => {
                      const due = new Date(r.due_date)
                      const isOverdue = due < now
                      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                      return (
                        <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                          <div className={`mt-0.5 shrink-0 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
                            {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                            <p className="text-xs text-gray-500">{r.branch__name} · {formatDate(r.due_date)}</p>
                          </div>
                          <span className={`text-xs font-semibold shrink-0 ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>
                            {isOverdue ? 'Overdue' : `${daysLeft}d`}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <CheckCircle2 className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No upcoming reminders</p>
                    <Link to="/reminders" className="text-xs text-blue-600 hover:underline">Add a reminder</Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">Branch Performance</CardTitle>
                <Link to="/branches" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Manage <ArrowRight className="w-3 h-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {branchPerformance.length > 0 ? (
                  <div className="space-y-2">
                    {branchPerformance.map((b: any, i: number) => {
                      const profit = parseFloat(b.profit) || 0
                      const revenue = parseFloat(b.revenue) || 0
                      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0'
                      return (
                        <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="text-sm font-semibold text-gray-800 truncate">{b.name}</span>
                            </div>
                            <span className={`text-xs font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{margin}%</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            <div>
                              <p className="text-gray-400">Revenue</p>
                              <p className="font-medium text-gray-700">{formatCurrency(revenue)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Expenses</p>
                              <p className="font-medium text-gray-700">{formatCurrency(parseFloat(b.expenses) || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Profit</p>
                              <p className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(profit)}</p>
                            </div>
                          </div>
                          {revenue > 0 && (
                            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${profit >= 0 ? 'bg-green-500' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(Math.abs(parseFloat(margin)), 100)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Building2 className="w-8 h-8 opacity-30" />
                    <p className="text-sm">No branch data</p>
                    <Link to="/branches" className="text-xs text-blue-600 hover:underline">Add a branch</Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { to: '/sales', label: 'Add Sale', icon: ShoppingCart, bg: 'bg-blue-50 hover:bg-blue-100', text: 'text-blue-700' },
                  { to: '/income', label: 'Add Income', icon: TrendingUp, bg: 'bg-green-50 hover:bg-green-100', text: 'text-green-700' },
                  { to: '/expenses', label: 'Add Expense', icon: TrendingDown, bg: 'bg-red-50 hover:bg-red-100', text: 'text-red-700' },
                  { to: '/reminders', label: 'Add Reminder', icon: Bell, bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-700' },
                ].map(({ to, label, icon: Icon, bg, text }) => (
                  <Link key={to} to={to} className={`flex items-center gap-3 p-4 rounded-xl ${bg} transition-colors`}>
                    <Icon className={`w-5 h-5 ${text} shrink-0`} />
                    <span className={`text-sm font-semibold ${text}`}>{label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
