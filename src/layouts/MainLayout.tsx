import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/layouts/Sidebar';
import { Topbar } from '@/layouts/Topbar';

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
