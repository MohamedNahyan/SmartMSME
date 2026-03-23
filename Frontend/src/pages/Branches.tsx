import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', address: '' })

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
      setForm({ id: '', name: '', address: '' })
      setShowForm(false)
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Branches</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Branch
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? 'Edit' : 'Add'} Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input placeholder="Branch Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} required />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm({ id: '', name: '', address: '' }) }}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">No branches found. Add your first branch!</TableCell>
              </TableRow>
            ) : (
              branches.map(branch => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.address}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setForm(branch); setShowForm(true) }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(branch.id)}>
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
