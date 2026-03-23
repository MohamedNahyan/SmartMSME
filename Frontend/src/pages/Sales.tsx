import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function Sales() {
  const [sales, setSales] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', branch: '', product: '', quantity: '', unit_price: '', sale_date: '' })

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
      const payload = { ...form, items: [{ product: form.product, quantity: form.quantity, unit_price: form.unit_price }] }
      if (form.id) {
        await api.put(`/sales/${form.id}/`, payload)
      } else {
        await api.post('/sales/', payload)
      }
      setForm({ id: '', branch: '', product: '', quantity: '', unit_price: '', sale_date: '' })
      setShowForm(false)
      loadSales()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save sale')
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Sale
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? 'Edit' : 'Add'} Sale</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="w-full h-10 rounded-md border px-3" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} required>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select className="w-full h-10 rounded-md border px-3" value={form.product} onChange={e => setForm({...form, product: e.target.value})} required>
                <option value="">Select Product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input type="number" placeholder="Quantity" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
              <Input type="number" step="0.01" placeholder="Unit Price" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} required />
              <Input type="date" value={form.sale_date} onChange={e => setForm({...form, sale_date: e.target.value})} required />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm({ id: '', branch: '', product: '', quantity: '', unit_price: '', sale_date: '' }) }}>Cancel</Button>
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
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">No sales found. Add your first sale!</TableCell>
              </TableRow>
            ) : (
              sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.sale_date)}</TableCell>
                  <TableCell>{sale.branch_name}</TableCell>
                  <TableCell>{sale.items?.[0]?.product_name || 'N/A'}</TableCell>
                  <TableCell>{sale.items?.[0]?.quantity || 0}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(sale.total_amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(sale.id)}>
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
