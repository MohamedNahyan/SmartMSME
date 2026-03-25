import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Trash2, Upload, ShoppingCart, X, Search, Filter, BarChart2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Sales() {
  const [sales, setSales] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importBranch, setImportBranch] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [form, setForm] = useState({ id: '', branch: '', product: '', quantity: '', unit_price: '', sale_date: '' })
  const [filterBranch, setFilterBranch] = useState('')
  const [filterProduct, setFilterProduct] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useEffect(() => {
    loadSales()
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
    api.get('/products/').then(res => {
      const data = res.data.results || res.data
      setProducts(Array.isArray(data) ? data : [])
    }).catch(() => setProducts([]))
  }, [])

  const loadSales = () => api.get('/sales/').then(res => {
    const data = res.data.results || res.data
    setSales(Array.isArray(data) ? data : [])
  }).catch(() => setSales([]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        branch: form.branch,
        sale_date: form.sale_date ? `${form.sale_date}T00:00:00` : '',
        items: [{ product: form.product, quantity: Number(form.quantity), unit_price: form.unit_price }]
      }
      if (form.id) {
        await api.put(`/sales/${form.id}/`, payload)
      } else {
        await api.post('/sales/', payload)
      }
      closeForm()
      loadSales()
    } catch (err: any) {
      const data = err.response?.data
      alert(data?.error || (typeof data === 'object' ? JSON.stringify(data) : null) || 'Failed to save sale')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this sale?')) {
      try {
        await api.delete(`/sales/${id}/`)
        loadSales()
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete sale')
      }
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile || !importBranch) return
    const formData = new FormData()
    formData.append('file', importFile)
    formData.append('branch_id', importBranch)
    setImporting(true)
    try {
      await api.post('/sales/import/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Sales imported successfully')
      setShowImport(false)
      setImportBranch('')
      setImportFile(null)
      loadSales()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setForm({ id: '', branch: '', product: '', quantity: '', unit_price: '', sale_date: '' })
  }

  const filtered = useMemo(() => {
    return sales.filter(sale => {
      if (filterBranch) {
        const branch = branches.find(b => b.id === parseInt(filterBranch))
        if (branch && sale.branch_name !== branch.name) return false
      }
      if (filterProduct) {
        const hasProduct = sale.items?.some((i: any) => i.product_name?.toLowerCase().includes(filterProduct.toLowerCase()))
        if (!hasProduct) return false
      }
      if (filterSearch) {
        const inv = sale.invoice_number?.toLowerCase().includes(filterSearch.toLowerCase())
        const prod = sale.items?.some((i: any) => i.product_name?.toLowerCase().includes(filterSearch.toLowerCase()))
        if (!inv && !prod) return false
      }
      if (filterFrom && sale.sale_date < filterFrom) return false
      if (filterTo && sale.sale_date.split('T')[0] > filterTo) return false
      return true
    })
  }, [sales, filterBranch, filterProduct, filterSearch, filterFrom, filterTo, branches])

  const totalRevenue = useMemo(() => sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0), [sales])
  const filteredRevenue = useMemo(() => filtered.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0), [filtered])
  const thisMonthRevenue = useMemo(() => {
    const now = new Date()
    return sales.filter(s => {
      const d = new Date(s.sale_date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0)
  }, [sales])

  const hasFilters = filterBranch || filterProduct || filterSearch || filterFrom || filterTo

  // Unique product names for filter dropdown
  const productNames = useMemo(() => {
    const names = new Set<string>()
    sales.forEach(s => s.items?.forEach((i: any) => i.product_name && names.add(i.product_name)))
    return Array.from(names)
  }, [sales])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all sales transactions across your branches</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImport(!showImport)}>
            <Upload className="w-4 h-4 mr-1.5" /> Import
          </Button>
          <Button size="sm" onClick={() => { setShowForm(true); setShowImport(false) }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Sale
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-blue-100 p-3 rounded-lg">
            <BarChart2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-green-100 p-3 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">This Month</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(thisMonthRevenue)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Filter className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Filtered Revenue</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(filteredRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Import Sales (CSV / Excel)</h2>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleImport} className="space-y-3">
            <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={importBranch} onChange={e => setImportBranch(e.target.value)} required>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <Input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files?.[0] || null)} required />
            <p className="text-xs text-gray-400">Required columns: invoice_number, sale_date, product_name, quantity, unit_price</p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={importing}>{importing ? 'Importing...' : 'Import'}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search invoice or product..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
          </div>
          <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
            <option value="">All Products</option>
            {productNames.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <input type="date" className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <div className="flex gap-2">
            <input type="date" className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            {hasFilters && (
              <button onClick={() => { setFilterBranch(''); setFilterProduct(''); setFilterSearch(''); setFilterFrom(''); setFilterTo('') }} className="h-9 px-2 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg whitespace-nowrap">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            {hasFilters ? `${filtered.length} of ${sales.length} records` : `${sales.length} record${sales.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">Invoice</TableHead>
              <TableHead className="font-semibold text-gray-600">Date</TableHead>
              <TableHead className="font-semibold text-gray-600">Branch</TableHead>
              <TableHead className="font-semibold text-gray-600">Product</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">Qty</TableHead>
              <TableHead className="font-semibold text-gray-600 text-right">Total</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="bg-blue-50 p-4 rounded-full mb-3">
                      <ShoppingCart className="w-8 h-8 text-blue-300" />
                    </div>
                    <p className="text-gray-700 font-medium">
                      {hasFilters ? 'No records match your filters' : 'No sales records yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {hasFilters ? 'Try adjusting your filters' : 'Click "+ Add Sale" to record your first sale'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(sale => (
                <TableRow key={sale.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-mono text-xs text-gray-500">{sale.invoice_number || '—'}</TableCell>
                  <TableCell className="text-gray-700">{formatDate(sale.sale_date)}</TableCell>
                  <TableCell>
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{sale.branch_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                      {sale.items?.[0]?.product_name || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-gray-700">{sale.items?.[0]?.quantity ?? '—'}</TableCell>
                  <TableCell className="text-right font-semibold text-blue-600">{formatCurrency(sale.total_amount)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <button onClick={() => handleDelete(sale.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{form.id ? 'Edit Sale' : 'Add Sale'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} required>
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} required>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <Input type="number" placeholder="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                  <Input type="number" step="0.01" placeholder="0.00" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} required />
                </div>
              </div>
              {form.quantity && form.unit_price && (
                <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700 font-medium">
                  Total: {formatCurrency(parseFloat(form.quantity) * parseFloat(form.unit_price))}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
                <Input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Save Sale</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
