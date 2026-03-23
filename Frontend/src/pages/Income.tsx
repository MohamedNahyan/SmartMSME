import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Income() {
  const [income, setIncome] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', branch: '', category: '', amount: '', description: '', income_date: '' })

  useEffect(() => {
    loadIncome()
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
    api.get('/income-categories/').then(res => {
      const data = res.data.results || res.data
      setCategories(Array.isArray(data) ? data : [])
    }).catch(() => setCategories([]))
  }, [])

  const loadIncome = () => api.get('/income/').then(res => {
    const data = res.data.results || res.data
    setIncome(Array.isArray(data) ? data : [])
  }).catch(() => setIncome([]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (form.id) {
        await api.put(`/income/${form.id}/`, form)
      } else {
        await api.post('/income/', form)
      }
      setForm({ id: '', branch: '', category: '', amount: '', description: '', income_date: '' })
      setShowForm(false)
      loadIncome()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save income')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this income record?')) {
      try {
        await api.delete(`/income/${id}/`)
        loadIncome()
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete income')
      }
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Income</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Income
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? 'Edit' : 'Add'} Income</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="w-full h-10 rounded-md border px-3" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} required>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className="w-full h-10 rounded-md border px-3" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">Select Category (Optional)</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              <Input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <Input type="date" value={form.income_date} onChange={e => setForm({...form, income_date: e.target.value})} required />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm({ id: '', branch: '', category: '', amount: '', description: '', income_date: '' }) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {income.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No income records found. Add your first income!</TableCell>
              </TableRow>
            ) : (
              income.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{formatDate(item.income_date)}</TableCell>
                  <TableCell>{item.branch_name}</TableCell>
                  <TableCell>{item.category_name || 'N/A'}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(item.amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setForm({...item, branch: item.branch, category: item.category || ''}); setShowForm(true) }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
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
