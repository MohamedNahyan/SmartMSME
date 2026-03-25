import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutDashboard, Building2, Package, ShoppingCart, TrendingUp, TrendingDown, Bell, Bot, User, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

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
      {open && (
        <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={cn(
        'fixed z-30 inset-y-0 left-0 flex flex-col bg-white border-r transition-transform duration-200 w-64',
        'lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-600">SmartMSME</h1>
          <button className="lg:hidden p-1 rounded hover:bg-gray-100" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {nav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm',
                location.pathname === item.path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t bg-white">
          <div className="flex items-center justify-between">
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm hover:text-blue-600 min-w-0">
              <User className="w-4 h-4 shrink-0" />
              <span className="truncate">{user?.username}</span>
            </Link>
            <button onClick={logout} className="p-2 hover:bg-gray-100 rounded shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b shrink-0">
          <button onClick={() => setOpen(true)} className="p-1 rounded hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-blue-600">SmartMSME</span>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
