import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, Tag, Upload, TrendingDown, X, Search, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importBranch, setImportBranch] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [form, setForm] = useState({ id: '', branch: '', category: '', amount: '', description: '', expense_date: '' })
  const [filterBranch, setFilterBranch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  useEffect(() => {
    loadExpenses()
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
    loadCategories()
  }, [])

  const loadExpenses = () => api.get('/expenses/').then(res => {
    const data = res.data.results || res.data
    setExpenses(Array.isArray(data) ? data : [])
  }).catch(() => setExpenses([]))

  const loadCategories = () => api.get('/expense-categories/').then(res => {
    const data = res.data.results || res.data
    setCategories(Array.isArray(data) ? data : [])
  }).catch(() => setCategories([]))

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    try {
      await api.post('/expense-categories/', { name: newCategory.trim() })
      setNewCategory('')
      loadCategories()
    } catch (err: any) {
      alert(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to create category')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (confirm('Delete this category?')) {
      try {
        await api.delete(`/expense-categories/${id}/`)
        loadCategories()
      } catch { alert('Failed to delete category') }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, expense_date: form.expense_date ? `${form.expense_date}T00:00:00` : '' }
      if (form.id) {
        await api.put(`/expenses/${form.id}/`, payload)
      } else {
        await api.post('/expenses/', payload)
      }
      closeForm()
      loadExpenses()
    } catch (err: any) {
      alert(err.response?.data?.error || JSON.stringify(err.response?.data) || 'Failed to save expense')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}/`)
        loadExpenses()
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete expense')
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
      await api.post('/expenses/import/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Expenses imported successfully')
      setShowImport(false)
      setImportBranch('')
      setImportFile(null)
      loadExpenses()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setForm({ id: '', branch: '', category: '', amount: '', description: '', expense_date: '' })
  }

  const openEdit = (item: any) => {
    setForm({ ...item, branch: item.branch, category: item.category || '', expense_date: item.expense_date?.split('T')[0] || '' })
    setShowForm(true)
  }

  const filtered = useMemo(() => {
    return expenses.filter(item => {
      if (filterBranch) {
        const branch = branches.find(b => b.id === parseInt(filterBranch))
        if (branch && item.branch_name !== branch.name) return false
      }
      if (filterCategory && item.category_name?.toLowerCase() !== filterCategory.toLowerCase()) return false
      if (filterSearch && !item.description?.toLowerCase().includes(filterSearch.toLowerCase()) && !item.category_name?.toLowerCase().includes(filterSearch.toLowerCase())) return false
      if (filterFrom && item.expense_date < filterFrom) return false
      if (filterTo && item.expense_date.split('T')[0] > filterTo) return false
      return true
    })
  }, [expenses, filterBranch, filterCategory, filterSearch, filterFrom, filterTo, branches])

  const totalFiltered = useMemo(() => filtered.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0), [filtered])
  const totalAll = useMemo(() => expenses.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0), [expenses])
  const thisMonth = useMemo(() => {
    const now = new Date()
    return expenses.filter(i => {
      const d = new Date(i.expense_date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((sum, i) => sum + parseFloat(i.amount || 0), 0)
  }, [expenses])

  const hasFilters = filterBranch || filterCategory || filterSearch || filterFrom || filterTo

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor and categorize your business expenses</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setShowImport(!showImport); setShowCatForm(false) }}>
            <Upload className="w-4 h-4 mr-1.5" /> Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowCatForm(!showCatForm); setShowImport(false) }}>
            <Tag className="w-4 h-4 mr-1.5" /> Categories
          </Button>
          <Button size="sm" onClick={() => { setShowForm(true); setShowImport(false); setShowCatForm(false) }}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-red-100 p-3 rounded-lg">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Expenses</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAll)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-orange-100 p-3 rounded-lg">
            <TrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">This Month</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(thisMonth)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-purple-100 p-3 rounded-lg">
            <Filter className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Filtered Total</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalFiltered)}</p>
          </div>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Import Expenses (CSV / Excel)</h2>
            <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleImport} className="space-y-3">
            <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={importBranch} onChange={e => setImportBranch(e.target.value)} required>
              <option value="">Select Branch</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <Input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files?.[0] || null)} required />
            <p className="text-xs text-gray-400">Required columns: category, amount, expense_date — optional: description</p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={importing}>{importing ? 'Importing...' : 'Import'}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowImport(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Panel */}
      {showCatForm && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-800">Expense Categories</h2>
            <button onClick={() => setShowCatForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-2 mb-4">
            <Input placeholder="New category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
            <Button size="sm" onClick={handleAddCategory}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.length === 0
              ? <p className="text-sm text-gray-400">No categories yet.</p>
              : categories.map(c => (
                <span key={c.id} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
                  {c.name}
                  <button onClick={() => handleDeleteCategory(c.id)} className="text-gray-400 hover:text-red-500 leading-none">×</button>
                </span>
              ))
            }
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
          </div>
          <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <input type="date" className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
          <div className="flex gap-2">
            <input type="date" className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
            {hasFilters && (
              <button onClick={() => { setFilterBranch(''); setFilterCategory(''); setFilterSearch(''); setFilterFrom(''); setFilterTo('') }} className="h-9 px-2 text-xs text-gray-500 hover:text-red-500 border border-gray-200 rounded-lg whitespace-nowrap">
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
            {hasFilters ? `${filtered.length} of ${expenses.length} records` : `${expenses.length} record${expenses.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">Date</TableHead>
              <TableHead className="font-semibold text-gray-600">Branch</TableHead>
              <TableHead className="font-semibold text-gray-600">Category</TableHead>
              <TableHead className="font-semibold text-gray-600">Description</TableHead>
              <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="bg-red-50 p-4 rounded-full mb-3">
                      <TrendingDown className="w-8 h-8 text-red-300" />
                    </div>
                    <p className="text-gray-700 font-medium">
                      {hasFilters ? 'No records match your filters' : 'No expense records yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {hasFilters ? 'Try adjusting your filters' : 'Click "+ Add Expense" to record your first expense'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(item => (
                <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="text-gray-700">{formatDate(item.expense_date)}</TableCell>
                  <TableCell>
                    <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{item.branch_name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="bg-orange-50 text-orange-700 text-xs font-medium px-2 py-0.5 rounded-full">{item.category_name || '—'}</span>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.description || <span className="text-gray-300">—</span>}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">{formatCurrency(item.amount)}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
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
              <h2 className="text-lg font-semibold text-gray-900">{form.id ? 'Edit Expense' : 'Add Expense'}</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <Input type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <Input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input placeholder="e.g. Office rent payment" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Save Expense</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
