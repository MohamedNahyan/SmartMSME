import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Bell, AlertCircle } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [revenueTrend, setRevenueTrend] = useState<any[]>([])
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [topProductsByRevenue, setTopProductsByRevenue] = useState<any[]>([])
  const [salesGrowth, setSalesGrowth] = useState<any[]>([])
  const [branchPerformance, setBranchPerformance] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [selectedBranch])

  const loadDashboard = () => {
    setLoading(true)
    const params = selectedBranch ? `?branch_id=${selectedBranch}` : ''
    Promise.all([
      api.get(`/dashboard/overview/${params}`).catch(() => ({ data: { revenue: 0, expenses: 0, profit: 0, profit_margin: 0, average_order_value: 0, total_sales: 0, pending_reminders: 0, overdue_reminders: 0 } })),
      api.get(`/dashboard/revenue-trend/${params}`).catch(() => ({ data: [] })),
      api.get(`/dashboard/expense-breakdown/${params}`).catch(() => ({ data: [] })),
      api.get(`/dashboard/top-products/${params}`).catch(() => ({ data: [] })),
      api.get(`/dashboard/top-products-revenue/${params}`).catch(() => ({ data: [] })),
      api.get(`/dashboard/sales-growth/${params}`).catch(() => ({ data: [] })),
      api.get(`/dashboard/branch-performance/`).catch(() => ({ data: [] })),
    ]).then(([m, r, e, p, pr, sg, bp]) => {
      setMetrics(m.data)
      setRevenueTrend(
        Array.isArray(r.data)
          ? r.data.map((d: any) => ({
              ...d,
              month: d.month ? new Date(d.month).toLocaleDateString('en', { month: 'short', year: '2-digit' }) : ''
            }))
          : []
      )
      setExpenseBreakdown(
        Array.isArray(e.data)
          ? e.data.map((d: any) => ({ category: d.category__name, amount: d.total }))
          : []
      )
      setTopProducts(
        Array.isArray(p.data)
          ? p.data.map((d: any) => ({ name: d.product__name, quantity: d.quantity }))
          : []
      )
      setTopProductsByRevenue(
        Array.isArray(pr.data)
          ? pr.data.map((d: any) => ({ name: d.product__name, revenue: parseFloat(d.revenue) }))
          : []
      )
      setSalesGrowth(
        Array.isArray(sg.data)
          ? sg.data.map((d: any) => ({
              month: d.month ? new Date(d.month).toLocaleDateString('en', { month: 'short', year: '2-digit' }) : '',
              growth: parseFloat(d.growth_rate ?? d.growth ?? 0).toFixed(1)
            }))
          : []
      )
      setBranchPerformance(
        Array.isArray(bp.data)
          ? bp.data.map((d: any) => ({ name: d.branch__name ?? d.name, revenue: parseFloat(d.revenue ?? 0) }))
          : []
      )
      setLoading(false)
    })
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <select
          className="h-10 rounded-md border px-3 text-sm min-w-[180px]"
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
        >
          <option value="">All Branches (Combined)</option>
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-4 text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.revenue || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.expenses || 0)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics?.profit || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {typeof metrics?.profit_margin === 'number' ? metrics.profit_margin.toFixed(1) : 0}% margin
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.total_sales || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: {formatCurrency(metrics?.average_order_value || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
                <Bell className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.pending_reminders || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Overdue Reminders</CardTitle>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">{metrics?.overdue_reminders || 0}</div>
              </CardContent>
            </Card>
          </div>

          {revenueTrend.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {expenseBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={expenseBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                          {expenseBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {(topProducts.length > 0 || topProductsByRevenue.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {topProducts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products (by Quantity)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" fill="#3b82f6" name="Quantity Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {topProductsByRevenue.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Products (by Revenue)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topProductsByRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {salesGrowth.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales Growth (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis unit="%" />
                    <Tooltip formatter={(v: any) => `${v}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="growth" stroke="#f59e0b" strokeWidth={2} name="Growth Rate" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {branchPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Branch Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
