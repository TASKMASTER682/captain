'use client';

import React, { useState, useRef, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Link from 'next/link';
import { clearAuth } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

const mobileNavItems = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Agencies', href: '/admin/agencies' },
  { name: 'Exams', href: '/admin/exams' },
  { name: 'Test Series', href: '/admin/test-series' },
  { name: 'Questions', href: '/admin/parser' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Revenue', href: '/admin/revenue' },
  { name: 'Orders', href: '/admin/orders' },
  { name: 'Materials', href: '/admin/materials' },
  { name: 'Blogs', href: '/admin/blogs' },
  { name: 'Analytics', href: '/admin/analytics' },
  { name: 'Error Logs', href: '/admin/error-logs' },
];

export default function AdminLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans transition-colors duration-300">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="sticky top-0 z-50 glass w-full border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) setIsSidebarOpen(!isSidebarOpen);
                  else setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              {mobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl z-[70] overflow-hidden max-h-[70vh] overflow-y-auto">
                  <nav className="flex flex-col p-2">
                    {mobileNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === item.href ? 'bg-primary/10 text-primary font-bold' : 'text-foreground hover:bg-muted'}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </nav>
                </div>
              )}
            </div>

            <Link href="/admin/dashboard" className="flex items-center gap-2 shrink-0">
              <img src="/logo.png" alt="ExamOS" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
              <span className="font-bold tracking-tight font-outfit hidden sm:inline">Admin Panel</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex px-3 py-2 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted transition-colors items-center gap-1.5">
              Student View
            </Link>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors" title="Toggle Theme">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-[10px] text-primary font-bold">{user?.role}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8 flex flex-col gap-6">
          {children}
        </main>

        <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
          ExamOS Admin Console
        </footer>
      </div>
    </div>
  );
}
