import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, X, Search, Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Reminders() {
  const [reminders, setReminders] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', branch: '', title: '', description: '', due_date: '', is_completed: false })
  const [filterBranch, setFilterBranch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSearch, setFilterSearch] = useState('')

  useEffect(() => {
    loadReminders()
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
  }, [])

  const loadReminders = () => api.get('/reminders/').then(res => {
    const data = res.data.results || res.data
    setReminders(Array.isArray(data) ? data : [])
  }).catch(() => setReminders([]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (form.id) {
        await api.put(`/reminders/${form.id}/`, form)
      } else {
        await api.post('/reminders/', form)
      }
      closeForm()
      loadReminders()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save reminder')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this reminder?')) {
      try {
        await api.delete(`/reminders/${id}/`)
        loadReminders()
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete reminder')
      }
    }
  }

  const toggleComplete = async (reminder: any) => {
    try {
      await api.put(`/reminders/${reminder.id}/`, { ...reminder, is_completed: !reminder.is_completed })
      loadReminders()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update reminder')
    }
  }

  const closeForm = () => {
    setShowForm(false)
    setForm({ id: '', branch: '', title: '', description: '', due_date: '', is_completed: false })
  }

  const now = new Date()

  const filtered = useMemo(() => {
    return reminders.filter(r => {
      if (filterBranch && r.branch_name !== branches.find(b => b.id === parseInt(filterBranch))?.name) return false
      if (filterStatus === 'completed' && !r.is_completed) return false
      if (filterStatus === 'pending' && r.is_completed) return false
      if (filterStatus === 'overdue' && (r.is_completed || new Date(r.due_date) >= now)) return false
      if (filterSearch && !r.title?.toLowerCase().includes(filterSearch.toLowerCase())) return false
      return true
    })
  }, [reminders, filterBranch, filterStatus, filterSearch, branches])

  const pending = reminders.filter(r => !r.is_completed && new Date(r.due_date) >= now).length
  const overdue = reminders.filter(r => !r.is_completed && new Date(r.due_date) < now).length
  const completed = reminders.filter(r => r.is_completed).length

  const hasFilters = filterBranch || filterStatus || filterSearch

  const getStatusBadge = (r: any) => {
    if (r.is_completed) return <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">Completed</span>
    if (new Date(r.due_date) < now) return <span className="bg-red-50 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">Overdue</span>
    return <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">Pending</span>
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reminders</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track operational tasks and deadlines</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Reminder
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-amber-100 p-3 rounded-lg">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
            <p className="text-xl font-bold text-gray-900">{pending}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-red-100 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Overdue</p>
            <p className="text-xl font-bold text-red-600">{overdue}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Completed</p>
            <p className="text-xl font-bold text-gray-900">{completed}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by title..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div className="flex gap-2">
            <select
              className="flex-1 h-9 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => { setFilterBranch(''); setFilterStatus(''); setFilterSearch('') }}
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
            {hasFilters ? `${filtered.length} of ${reminders.length} reminders` : `${reminders.length} reminder${reminders.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-600">Done</TableHead>
              <TableHead className="font-semibold text-gray-600">Title</TableHead>
              <TableHead className="font-semibold text-gray-600">Branch</TableHead>
              <TableHead className="font-semibold text-gray-600">Due Date</TableHead>
              <TableHead className="font-semibold text-gray-600">Status</TableHead>
              <TableHead className="font-semibold text-gray-600 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <div className="bg-amber-50 p-4 rounded-full mb-3">
                      <Bell className="w-8 h-8 text-amber-300" />
                    </div>
                    <p className="text-gray-700 font-medium">
                      {hasFilters ? 'No reminders match your filters' : 'No reminders yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {hasFilters ? 'Try adjusting your filters' : 'Click "+ Add Reminder" to create your first reminder'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(reminder => {
                const isOverdue = !reminder.is_completed && new Date(reminder.due_date) < now
                return (
                  <TableRow key={reminder.id} className={`hover:bg-gray-50 transition-colors ${reminder.is_completed ? 'opacity-60' : ''}`}>
                    <TableCell>
                      <button onClick={() => toggleComplete(reminder)} className="hover:scale-110 transition-transform">
                        <CheckCircle2 className={`w-5 h-5 ${reminder.is_completed ? 'text-green-600 fill-green-100' : 'text-gray-300 hover:text-green-400'}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <p className={`font-medium ${reminder.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{reminder.title}</p>
                      {reminder.description && <p className="text-xs text-gray-400 mt-0.5">{reminder.description}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{reminder.branch_name}</span>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {formatDate(reminder.due_date)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(reminder)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => { setForm({ ...reminder, branch: reminder.branch }); setShowForm(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(reminder.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{form.id ? 'Edit Reminder' : 'Add Reminder'}</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <Input placeholder="e.g. Pay rent, Check inventory..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input placeholder="Optional details" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
              </div>
              {form.id && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_completed}
                    onChange={e => setForm({ ...form, is_completed: e.target.checked })}
                    className="rounded"
                  />
                  Mark as completed
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Save Reminder</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
