import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', branch: '', category: '', amount: '', description: '', expense_date: '' })

  useEffect(() => {
    loadExpenses()
    api.get('/branches/').then(res => {
      const data = res.data.results || res.data
      setBranches(Array.isArray(data) ? data : [])
    }).catch(() => setBranches([]))
    api.get('/expense-categories/').then(res => {
      const data = res.data.results || res.data
      setCategories(Array.isArray(data) ? data : [])
    }).catch(() => setCategories([]))
  }, [])

  const loadExpenses = () => api.get('/expenses/').then(res => {
    const data = res.data.results || res.data
    setExpenses(Array.isArray(data) ? data : [])
  }).catch(() => setExpenses([]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (form.id) {
        await api.put(`/expenses/${form.id}/`, form)
      } else {
        await api.post('/expenses/', form)
      }
      setForm({ id: '', branch: '', category: '', amount: '', description: '', expense_date: '' })
      setShowForm(false)
      loadExpenses()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save expense')
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Expense
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? 'Edit' : 'Add'} Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="w-full h-10 rounded-md border px-3" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} required>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className="w-full h-10 rounded-md border px-3" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              <Input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <Input type="date" value={form.expense_date} onChange={e => setForm({...form, expense_date: e.target.value})} required />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm({ id: '', branch: '', category: '', amount: '', description: '', expense_date: '' }) }}>Cancel</Button>
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
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No expenses found. Add your first expense!</TableCell>
              </TableRow>
            ) : (
              expenses.map(expense => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.expense_date)}</TableCell>
                  <TableCell>{expense.branch_name}</TableCell>
                  <TableCell>{expense.category_name}</TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setForm({...expense, branch: expense.branch, category: expense.category}); setShowForm(true) }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(expense.id)}>
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
