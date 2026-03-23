import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { User } from 'lucide-react'

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>({})
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/profile/').then(res => setProfile(res.data)).catch(() => {})
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match')
      return
    }

    try {
      await api.post('/profile/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })
      setMessage('Password changed successfully')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password')
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Username</label>
              <p className="text-lg">{user?.username}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Business Name</label>
              <p className="text-lg">{profile.business_name || 'Not set'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-lg">{profile.phone_number || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {message && <div className="p-3 text-sm text-green-600 bg-green-50 rounded">{message}</div>}
              {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input
                  type="password"
                  value={passwordForm.old_password}
                  onChange={e => setPasswordForm({...passwordForm, old_password: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">Change Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
