import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { authService } from '@/features/auth/services/authService';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

const schema = z
  .object({
    password: z.string().min(8, 'Minimum 8 caractères'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Le lien reçu par email contient un token qui crée une session "recovery" via
  // detectSessionInUrl (déjà activé dans src/lib/supabase.ts) — on attend qu'elle
  // soit posée avant d'afficher le formulaire, sinon updateUser échouerait.
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasValidSession(!!data.session);
      setIsSessionReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasValidSession(true);
        setIsSessionReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await authService.updatePassword(values.password);
      toast.success('Mot de passe mis à jour, vous pouvez vous connecter.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Réinitialiser le mot de passe">
      {!isSessionReady ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : !hasValidSession ? (
        <p className="text-sm text-destructive">
          Ce lien de réinitialisation est invalide ou expiré. Redemande un nouveau lien depuis la page
          "Mot de passe oublié".
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
