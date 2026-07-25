import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const baseTabs = [
  { to: '/admin', label: 'Parcours', end: true },
  { to: '/admin/students', label: 'Étudiants' },
  { to: '/admin/announcements', label: 'Annonces' },
];

export function AdminLayout() {
  const { isAdmin } = useAuth();
  const tabs = isAdmin ? [...baseTabs, { to: '/admin/users', label: 'Utilisateurs', end: false }] : baseTabs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
        <p className="text-sm text-muted-foreground">Gestion des parcours, modules, leçons et annonces.</p>
      </div>
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
