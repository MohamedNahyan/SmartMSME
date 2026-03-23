import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ id: '', name: '', description: '', default_price: '', branch: '' })

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
      setForm({ id: '', name: '', description: '', default_price: '', branch: '' })
      setShowForm(false)
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{form.id ? 'Edit' : 'Add'} Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select className="w-full h-10 rounded-md border px-3" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} required>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Input placeholder="Product Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <Input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <Input type="number" step="0.01" placeholder="Price" value={form.default_price} onChange={e => setForm({...form, default_price: e.target.value})} required />
              <div className="flex gap-2">
                <Button type="submit">Save</Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm({ id: '', name: '', description: '', default_price: '', branch: '' }) }}>Cancel</Button>
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
              <TableHead>Branch</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No products found. Add your first product!</TableCell>
              </TableRow>
            ) : (
              products.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.branch_name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>{formatCurrency(product.default_price)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { setForm({...product, branch: product.branch}); setShowForm(true) }}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)}>
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
