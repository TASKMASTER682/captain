'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { getAuthUser } from '@/lib/api';
import { Menu, X, Sun, Moon, LayoutDashboard } from 'lucide-react';

const NAV_LINKS = [
  { href: '/explore', label: 'Test Series' },
  { href: '/blogs', label: 'Blogs' },
];

/**
 * Shared header for public pages (explore, blogs, series detail).
 * Desktop: inline nav links. Mobile: hamburger dropdown — nothing overlaps.
 * `cta` (optional) renders an extra action on the right, desktop only.
 */
export default function PublicHeader({ cta }: { cta?: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  // Read localStorage after mount — avoids SSR/hydration mismatch.
  useEffect(() => {
    setLoggedIn(!!getAuthUser());
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 glass w-full border-b border-border">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-2 min-w-0">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="ExamOS home">
          <img src="/logo.png" alt="ExamOS" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-md shadow-primary/20 object-cover" />
          <span className="font-bold text-lg sm:text-xl tracking-tight font-outfit">ExamOS</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-muted-foreground" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition-colors hover:text-foreground ${isActive(l.href) ? 'text-primary font-bold' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          {cta && <div className="hidden sm:block">{cta}</div>}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors"
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {loggedIn ? (
            <Link
              href="/dashboard"
              className="hidden sm:flex px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/20 items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:flex px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/95 shadow-md shadow-primary/20"
            >
              Sign In
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden p-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary transition-colors"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="sm:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1 shadow-lg" aria-label="Mobile">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive(l.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {cta && <div className="pt-1">{cta}</div>}
          {loggedIn ? (
            <Link href="/dashboard" className="mt-1 px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-bold text-center flex items-center justify-center gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
            </Link>
          ) : (
            <Link href="/login" className="mt-1 px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-bold text-center">
              Sign In
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
