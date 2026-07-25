import { useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/button';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await authService.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <Button variant="ghost" size="icon" onClick={onOpenMenu} title="Menu">
          <Menu className="h-5 w-5" />
        </Button>
        <img src="/logo.png" alt="LTCA" className="h-7 w-7 rounded-full" />
        <span className="text-sm font-medium text-foreground">LTCA</span>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="hidden text-sm text-muted-foreground md:inline">
          {profile?.full_name ?? profile?.email}
        </span>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Déconnexion">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
