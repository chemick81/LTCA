import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from '@/layouts/Sidebar';
import { Topbar } from '@/layouts/Topbar';

export function MainLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onOpenMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
