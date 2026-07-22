import type { ReactNode } from 'react';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">LTCA</h1>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Le Trading Contrarien Academy
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
