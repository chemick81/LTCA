import { useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Upload, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { profileService } from '@/features/profile/services/profileService';
import { getErrorMessage } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordFormValues {
  newPassword: string;
}

function AvatarSection() {
  const { profile, session, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setIsUploading(true);
    try {
      const url = await profileService.uploadAvatar(session.user.id, file);
      await profileService.updateProfile(session.user.id, { avatar_url: url });
      await refreshProfile();
      toast.success('Photo mise à jour');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveName() {
    if (!session) return;
    setIsSavingName(true);
    try {
      await profileService.updateProfile(session.user.id, { full_name: fullName || null });
      await refreshProfile();
      toast.success('Nom mis à jour');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Upload className="mr-2 h-3.5 w-3.5" />
              {isUploading ? 'Envoi...' : 'Changer la photo'}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Nom complet</Label>
          <div className="flex gap-2">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Button size="sm" onClick={handleSaveName} disabled={isSavingName}>
              {isSavingName ? '...' : 'Enregistrer'}
            </Button>
          </div>
        </div>

        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">Email : </span>
          {profile?.email}
        </p>
        <p className="text-sm text-foreground">
          <span className="text-muted-foreground">Rôle : </span>
          {profile?.role}
        </p>
      </CardContent>
    </Card>
  );
}

export function ProfilePage() {
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

      <AvatarSection />

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
