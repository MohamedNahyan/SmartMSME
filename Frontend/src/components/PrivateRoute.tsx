import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  
  if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>
  return user ? <>{children}</> : <Navigate to="/login" />
}
