import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, BookOpen, TrendingUp, User, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/academy', label: 'Academy', icon: GraduationCap },
  { to: '/glossary', label: 'Glossaire', icon: BookOpen },
  { to: '/progress', label: 'Progression', icon: TrendingUp },
  { to: '/profile', label: 'Profil', icon: User },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { canEditContent } = useAuth();

  return (
    <nav className="flex flex-1 flex-col p-4">
      <div className="space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className={navLinkClass}>
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
        {canEditContent && (
          <NavLink to="/admin" onClick={onNavigate} className={navLinkClass}>
            <ShieldCheck className="h-4 w-4" />
            Administration
          </NavLink>
        )}
      </div>

      <div className="mt-auto border-t border-border pt-3">
        <a
          href="https://contralityx.netlify.app/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Contralityx
        </a>
      </div>
    </nav>
  );
}

/** Sidebar fixe, visible uniquement à partir de md (desktop/tablette). */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <img src="/logo.png" alt="LTCA" className="h-9 w-9 rounded-full" />
        <span className="text-sm font-bold tracking-tight text-primary">LTCA</span>
      </div>
      <NavContent />
    </aside>
  );
}

/** Tiroir de navigation mobile — overlay + panneau coulissant, fermé par défaut. */
export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 md:hidden',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/60 transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <img src="/logo.png" alt="LTCA" className="h-9 w-9 rounded-full" />
          <span className="text-sm font-bold tracking-tight text-primary">LTCA</span>
        </div>
        <NavContent onNavigate={onClose} />
      </aside>
    </div>
  );
}
