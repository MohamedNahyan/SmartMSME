import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function Reminders() {
  const [reminders, setReminders] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', branch: '', title: '', description: '', due_date: '', is_completed: false })

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
      setForm({ id: '', branch: '', title: '', description: '', due_date: '', is_completed: false })
      setShowForm(false)
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reminders</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Reminder
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? 'Edit' : 'Add'} Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="w-full h-10 rounded-md border px-3" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} required>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Input placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              <Input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <Input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} required />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm({ id: '', branch: '', title: '', description: '', due_date: '', is_completed: false }) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reminders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No reminders found. Add your first reminder!</TableCell>
              </TableRow>
            ) : (
              reminders.map(reminder => (
                <TableRow key={reminder.id} className={reminder.is_completed ? 'opacity-50' : ''}>
                  <TableCell>
                    <button onClick={() => toggleComplete(reminder)} className="hover:scale-110 transition-transform">
                      <CheckCircle className={`w-5 h-5 ${reminder.is_completed ? 'text-green-600 fill-green-600' : 'text-gray-300'}`} />
                    </button>
                  </TableCell>
                  <TableCell>{formatDate(reminder.due_date)}</TableCell>
                  <TableCell>{reminder.branch_name}</TableCell>
                  <TableCell className="font-medium">{reminder.title}</TableCell>
                  <TableCell>{reminder.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setForm(reminder); setShowForm(true) }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(reminder.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
