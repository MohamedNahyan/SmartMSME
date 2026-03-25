import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, X, Search, Building2, MapPin } from 'lucide-react'

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', address: '' })
  const [filterSearch, setFilterSearch] = useState('')

  useEffect(() => { loadBranches() }, [])

  const loadBranches = () => api.get('/branches/').then(res => {
    const data = res.data.results || res.data
    setBranches(Array.isArray(data) ? data : [])
  }).catch(() => setBranches([]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (form.id) {
        await api.put(`/branches/${form.id}/`, form)
      } else {
        await api.post('/branches/', form)
      }
      closeForm()
      loadBranches()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save branch')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this branch?')) {
      try {
        await api.delete(`/branches/${id}/`)
        loadBranches()
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete branch')
      }
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setForm({ id: '', name: '', address: '' })
  }

  const filtered = useMemo(() => {
    if (!filterSearch) return branches
    const q = filterSearch.toLowerCase()
    return branches.filter(b =>
      b.name?.toLowerCase().includes(q) || b.address?.toLowerCase().includes(q)
    )
  }, [branches, filterSearch])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Branches</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your business locations</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Branch
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Branches</p>
            <p className="text-xl font-bold text-gray-900">{branches.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-purple-100 p-3 rounded-lg">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Locations</p>
            <p className="text-xl font-bold text-gray-900">{new Set(branches.map(b => b.address?.split(',').pop()?.trim())).size || branches.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name or address..."
            value={filterSearch}
            onChange={e => setFilterSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            {filterSearch ? `${filtered.length} of ${branches.length} branches` : `${branches.length} branch${branches.length !== 1 ? 'es' : ''}`}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">Name</TableHead>
              <TableHead className="font-semibold text-gray-600">Address</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="bg-blue-50 p-4 rounded-full mb-3">
                      <Building2 className="w-8 h-8 text-blue-300" />
                    </div>
                    <p className="text-gray-700 font-medium">
                      {filterSearch ? 'No branches match your search' : 'No branches yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {filterSearch ? 'Try a different search term' : 'Click "+ Add Branch" to create your first branch'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(branch => (
                <TableRow key={branch.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-1.5 rounded-lg">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">{branch.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {branch.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => { setForm(branch); setShowForm(true) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(branch.id)}
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
              <h2 className="text-lg font-semibold text-gray-900">{form.id ? 'Edit Branch' : 'Add Branch'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                <Input placeholder="e.g. Main Branch, Downtown..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Input placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Save Branch</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
