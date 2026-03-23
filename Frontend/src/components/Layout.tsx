import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, Building2, Package, ShoppingCart, TrendingUp, TrendingDown, Bell, Bot, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const nav = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/branches', icon: Building2, label: 'Branches' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/income', icon: TrendingUp, label: 'Income' },
    { path: '/expenses', icon: TrendingDown, label: 'Expenses' },
    { path: '/reminders', icon: Bell, label: 'Reminders' },
    { path: '/ai-assistant', icon: Bot, label: 'AI Assistant' }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">SmartMSME</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          {nav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t bg-white">
          <div className="flex items-center justify-between">
            <Link to="/profile" className="flex items-center gap-2 text-sm hover:text-blue-600">
              <User className="w-4 h-4" />
              <span>{user?.username}</span>
            </Link>
            <button onClick={logout} className="p-2 hover:bg-gray-100 rounded">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
