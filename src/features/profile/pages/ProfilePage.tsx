import { useState } from 'react';
import { getErrorMessage } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordFormValues {
  newPassword: string;
}

export function ProfilePage() {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm<PasswordFormValues>();

  async function onSubmit(values: PasswordFormValues) {
    if (values.newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.updatePassword(values.newPassword);
      toast.success('Mot de passe mis à jour');
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profil</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-foreground">
            <span className="text-muted-foreground">Nom : </span>
            {profile?.full_name ?? '—'}
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Email : </span>
            {profile?.email}
          </p>
          <p className="text-foreground">
            <span className="text-muted-foreground">Rôle : </span>
            {profile?.role}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changer de mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input id="newPassword" type="password" {...register('newPassword')} />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
