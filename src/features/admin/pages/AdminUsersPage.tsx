import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { adminContentService } from '@/features/admin/services/adminContentService';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';
import type { UserRole } from '@/types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  COACH: 'Coach',
  STUDENT: 'Étudiant',
};

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminContentService.listAllProfiles,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminContentService.updateUserRole(userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Rôle mis à jour');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Gestion des rôles — réservé à ADMIN.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Tous les comptes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner />
          ) : users && users.length > 0 ? (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.full_name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    disabled={u.id === session?.user.id}
                    title={u.id === session?.user.id ? 'Tu ne peux pas changer ton propre rôle' : undefined}
                    onChange={(e) =>
                      updateRoleMutation.mutate({ userId: u.id, role: e.target.value as UserRole })
                    }
                    className="h-9 rounded-md border border-border bg-muted px-2 text-sm text-foreground disabled:opacity-50"
                  >
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun utilisateur.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
