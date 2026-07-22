import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, BookOpen, TrendingUp, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/academy', label: 'Academy', icon: GraduationCap },
  { to: '/glossary', label: 'Glossaire', icon: BookOpen },
  { to: '/progress', label: 'Progression', icon: TrendingUp },
  { to: '/profile', label: 'Profil', icon: User },
];

export function Sidebar() {
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center border-b border-border px-6">
        <span className="text-lg font-bold tracking-tight text-primary">LTCA</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <ShieldCheck className="h-4 w-4" />
            Administration
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
