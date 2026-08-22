'use client';

import React, { useState } from 'react';
import StudentSidebar from './StudentSidebar';
import { AgencyProvider } from '@/components/AgencyContext';
import { Menu, Sun, Moon, Crown } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import Link from 'next/link';

export default function StudentLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 -ml-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
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
