'use client';

import React, { useState, useRef, useEffect } from 'react';
import StudentSidebar from './StudentSidebar';
import { AgencyProvider } from '@/components/AgencyContext';
import { Menu, Sun, Moon, Crown, LogOut } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Link from 'next/link';
import { clearAuth } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function StudentLayout({
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

  const handleLogout = () => { clearAuth(); router.push('/'); };

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  const mobileNavItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Test Series', href: '/test-series' },
    { name: 'My Library', href: '/my-library' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Doubts', href: '/doubts' },
    { name: 'Blogs', href: '/blogs' },
    { name: 'My Orders', href: '/orders' },
    { name: 'Plans & Pricing', href: '/plans' },
    { name: 'Profile', href: '/profile' },
    { name: 'Performance', href: '/performance' },
  ];

  // Members see no upgrade prompt — same rule the analytics endpoints enforce.
  const isMember =
    user?.subscription?.status === 'active' &&
    (!user?.subscription?.expiresAt || new Date(user.subscription.expiresAt) > new Date());

  return (
    <AgencyProvider user={user}>
      <div className="min-h-screen bg-background text-foreground flex font-sans transition-colors duration-300">
        <StudentSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          {/* Header */}
          <header className="sticky top-0 z-50 glass w-full border-b border-border px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Desktop: opens sidebar. Mobile: opens dropdown */}
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

                {/* Mobile dropdown */}
                {mobileMenuOpen && (
                  <div className="lg:hidden absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

              <div className="lg:hidden flex items-center gap-2">
                <Link href="/dashboard" className="shrink-0 flex items-center gap-2">
                  <img src="/logo.png" alt="ExamOS" className="w-8 h-8 rounded-lg shadow-sm object-cover" />
                  <span className="font-bold tracking-tight font-outfit">ExamOS</span>
                </Link>
              </div>
              <div className="hidden lg:block font-bold text-xl tracking-tight font-outfit">Dashboard</div>
            </div>

            <div className="flex items-center gap-4">
              {!isMember && (
                <Link
                  href="/plans"
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-500/95 shadow-md shadow-amber-500/20 flex items-center gap-1.5 whitespace-nowrap transition-colors"
                >
                  <Crown className="w-4 h-4" /> Upgrade
                </Link>
              )}
              <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors" title="Toggle Theme">
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
              </button>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{user?.name}</div>
              </div>
            </div>
          </header>

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-8 flex flex-col gap-6">
            {children}
          </main>
        </div>
      </div>
    </AgencyProvider>
  );
}
