'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Library,
  FolderOpen,
  Trophy,
  HelpCircle,
  Zap,
  Newspaper,
  Receipt,
  CreditCard,
  User,
  BarChart3,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { clearAuth } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function StudentSidebar({
  isOpen,
  setIsOpen
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  // Close sidebar on mobile when path changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: 'text-primary' },
    { name: 'My Library', href: '/my-library', icon: Library, color: 'text-indigo-500' },
    { name: 'Study Materials', href: '/materials', icon: FolderOpen, color: 'text-amber-500' },
    { name: 'Leaderboards', href: '/leaderboard', icon: Trophy, color: 'text-amber-500' },
    { name: 'Doubts', href: '/doubts', icon: HelpCircle, color: 'text-violet-500' },
    { name: 'Create Test', href: '/custom-test', icon: Zap, color: 'text-amber-500' },
    { name: 'Blogs', href: '/blogs', icon: Newspaper, color: 'text-sky-500' },
    { name: 'My Orders', href: '/orders', icon: Receipt, color: 'text-cyan-500' },
    { name: 'Plans & Pricing', href: '/plans', icon: CreditCard, color: 'text-emerald-500' },
    { name: 'Profile', href: '/profile', icon: User, color: 'text-sky-500' },
    { name: 'Performance', href: '/performance', icon: BarChart3, color: 'text-primary' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-card border-r border-border z-[60] transition-all duration-300 flex flex-col shadow-2xl lg:shadow-none
          ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center p-4 h-20 border-b border-border">
          <Link href="/dashboard" className={`flex items-center gap-3 transition-all w-full ${!isOpen ? 'lg:justify-center' : ''}`}>
            <img src="/logo.png" alt="ExamOS" className="w-9 h-9 rounded-xl shadow-sm object-cover shrink-0" />
            <span className={`font-bold text-lg tracking-tight font-outfit text-foreground transition-all duration-300 overflow-hidden ${!isOpen ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
              ExamOS
            </span>
          </Link>
          
          {isOpen && (
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2 sidebar-scroll">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all group relative overflow-hidden
                  ${isActive ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'}
                  ${!isOpen ? 'lg:justify-center' : ''}
                `}
                title={!isOpen ? item.name : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
                )}
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? item.color : ''}`} />
                <span className={`text-sm whitespace-nowrap transition-all duration-300 ${!isOpen ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100 w-auto'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            title={!isOpen ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all font-medium group
              ${!isOpen ? 'lg:justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110 group-hover:-translate-x-0.5" />
            <span className={`text-sm whitespace-nowrap transition-all duration-300 ${!isOpen ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100 w-auto'}`}>
              Logout
            </span>
          </button>
        </div>

      </div>
    </>
  );
}
