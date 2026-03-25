import { useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { User } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [infoForm, setInfoForm] = useState({ username: user?.username || '', email: user?.email || '' })
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [infoMsg, setInfoMsg] = useState('')
  const [infoErr, setInfoErr] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')

  const handleInfoSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setInfoMsg(''); setInfoErr('')
    try {
      const res = await api.put('/profile/', infoForm)
      updateUser({ ...user!, username: res.data.username, email: res.data.email })
      setInfoMsg('Profile updated successfully')
    } catch (err: any) {
      setInfoErr(err.response?.data?.error || 'Failed to update profile')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(''); setPwErr('')
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPwErr('New passwords do not match'); return
    }
    try {
      await api.post('/profile/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password
      })
      setPwMsg('Password changed successfully')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      setPwErr(err.response?.data?.error || 'Failed to change password')
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
          <CardContent>
            <form onSubmit={handleInfoSave} className="space-y-4">
              {infoMsg && <div className="p-3 text-sm text-green-600 bg-green-50 rounded">{infoMsg}</div>}
              {infoErr && <div className="p-3 text-sm text-red-600 bg-red-50 rounded">{infoErr}</div>}
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <Input value={infoForm.username} onChange={e => setInfoForm({ ...infoForm, username: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input type="email" value={infoForm.email} onChange={e => setInfoForm({ ...infoForm, email: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Save Changes</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {pwMsg && <div className="p-3 text-sm text-green-600 bg-green-50 rounded">{pwMsg}</div>}
              {pwErr && <div className="p-3 text-sm text-red-600 bg-red-50 rounded">{pwErr}</div>}
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <Input type="password" value={passwordForm.old_password} onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <Input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <Input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full">Change Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
