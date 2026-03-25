import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, X, Search, Package, Tag, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', description: '', default_price: '', branch: '' })
  const [filterBranch, setFilterBranch] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  useEffect(() => {
    loadProducts()
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
  }, [])

  const loadProducts = () => api.get('/products/').then(res => {
    const data = res.data.results || res.data
    setProducts(Array.isArray(data) ? data : [])
  }).catch(() => setProducts([]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (form.id) {
        await api.put(`/products/${form.id}/`, form)
      } else {
        await api.post('/products/', form)
      }
      closeForm()
      loadProducts()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save product')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await api.delete(`/products/${id}/`)
        loadProducts()
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete product')
      }
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setForm({ id: '', name: '', description: '', default_price: '', branch: '' })
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (filterBranch && p.branch_name !== branches.find(b => b.id === parseInt(filterBranch))?.name) return false
      if (filterSearch) {
        const q = filterSearch.toLowerCase()
        if (!p.name?.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [products, filterBranch, filterSearch, branches])

  const avgPrice = useMemo(() => {
    if (!products.length) return 0
    return products.reduce((sum, p) => sum + parseFloat(p.default_price || 0), 0) / products.length
  }, [products])

  const hasFilters = filterBranch || filterSearch

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your product catalog across branches</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Products</p>
            <p className="text-xl font-bold text-gray-900">{products.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-green-100 p-3 rounded-lg">
            <Tag className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Price</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(avgPrice)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Branches</p>
            <p className="text-xl font-bold text-gray-900">{branches.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by name or description..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterBranch}
              onChange={e => setFilterBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {hasFilters && (
              <button
                onClick={() => { setFilterBranch(''); setFilterSearch('') }}
                className="h-9 px-2 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg whitespace-nowrap"
              >
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
            {hasFilters ? `${filtered.length} of ${products.length} products` : `${products.length} product${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">Name</TableHead>
              <TableHead className="font-semibold text-gray-600">Branch</TableHead>
              <TableHead className="font-semibold text-gray-600">Description</TableHead>
              <TableHead className="font-semibold text-gray-600 text-right">Price</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="bg-blue-50 p-4 rounded-full mb-3">
                      <Package className="w-8 h-8 text-blue-300" />
                    </div>
                    <p className="text-gray-700 font-medium">
                      {hasFilters ? 'No products match your filters' : 'No products yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {hasFilters ? 'Try adjusting your filters' : 'Click "+ Add Product" to add your first product'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(product => (
                <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                  <TableCell>
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{product.branch_name}</span>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{product.description || '—'}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{formatCurrency(product.default_price)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => { setForm({ ...product, branch: product.branch }); setShowForm(true) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
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
              <h2 className="text-lg font-semibold text-gray-900">{form.id ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.branch}
                  onChange={e => setForm({ ...form, branch: e.target.value })}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <Input placeholder="e.g. Laptop, T-Shirt..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input placeholder="Optional description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Price (₹)</label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.default_price} onChange={e => setForm({ ...form, default_price: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Save Product</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
