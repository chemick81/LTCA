import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await authService.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <span className="text-sm font-medium text-foreground md:hidden">LTCA</span>
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
