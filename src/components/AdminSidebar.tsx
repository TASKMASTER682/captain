'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Layers,
  FileText,
  Users,
  ClipboardList,
  IndianRupee,
  ShoppingCart,
  Ticket,
  Star,
  Megaphone,
  HelpCircle,
  Newspaper,
  Bug,
  BarChart3,
  Activity,
  ScrollText,
  Shield,
  CreditCard,
  Zap,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { clearAuth } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface NavGroup {
  label: string;
  items: { name: string; href: string; icon: any; color: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, color: 'text-primary' },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Agencies', href: '/admin/agencies', icon: Building2, color: 'text-cyan-500' },
      { name: 'Exams', href: '/admin/exams', icon: GraduationCap, color: 'text-violet-500' },
      { name: 'Test Series', href: '/admin/test-series', icon: Layers, color: 'text-orange-500' },
      { name: 'Questions', href: '/admin/parser', icon: FileText, color: 'text-emerald-500' },
      { name: 'Materials', href: '/admin/materials', icon: FileText, color: 'text-amber-500' },
      { name: 'Blogs', href: '/admin/blogs', icon: Newspaper, color: 'text-sky-500' },
    ],
  },
  {
    label: 'Users',
    items: [
      { name: 'Users', href: '/admin/users', icon: Users, color: 'text-rose-500' },
      { name: 'Attempts', href: '/admin/attempts', icon: ClipboardList, color: 'text-violet-500' },
      { name: 'Doubts', href: '/admin/doubts', icon: HelpCircle, color: 'text-amber-500' },
    ],
  },
  {
    label: 'Business',
    items: [
      { name: 'Revenue', href: '/admin/revenue', icon: IndianRupee, color: 'text-emerald-500' },
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, color: 'text-cyan-500' },
      { name: 'Plans', href: '/admin/plans', icon: Star, color: 'text-amber-500' },
      { name: 'Coupons', href: '/admin/coupons', icon: Ticket, color: 'text-pink-500' },
      { name: 'Razorpay', href: '/admin/razorpay', icon: CreditCard, color: 'text-indigo-500' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3, color: 'text-cyan-500' },
      { name: 'Engagement', href: '/admin/engagement', icon: Activity, color: 'text-violet-500' },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Announcements', href: '/admin/announcements', icon: Megaphone, color: 'text-sky-500' },
      { name: 'Moderation', href: '/admin/moderation', icon: Shield, color: 'text-rose-500' },
      { name: 'Audit Logs', href: '/admin/audit-logs', icon: ScrollText, color: 'text-indigo-500' },
      { name: 'Error Logs', href: '/admin/error-logs', icon: Bug, color: 'text-rose-500' },
    ],
  },
];

export default function AdminSidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [pathname, setIsOpen]);

  const toggleGroup = (label: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[55] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-card border-r border-border z-[60] transition-all duration-300 flex flex-col shadow-2xl lg:shadow-none
          ${isOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center p-4 h-20 border-b border-border">
          <Link href="/admin/dashboard" className={`flex items-center gap-3 transition-all w-full ${!isOpen ? 'lg:justify-center' : ''}`}>
            <img src="/logo.png" alt="ExamOS" className="w-9 h-9 rounded-xl shadow-sm object-cover shrink-0" />
            <span className={`font-bold text-lg tracking-tight font-outfit text-foreground transition-all duration-300 overflow-hidden ${!isOpen ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}`}>
              Admin Panel
            </span>
          </Link>
          {isOpen && (
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 sidebar-scroll">
          {navGroups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.label);
            const hasActive = group.items.some((item) => isActive(item.href));

            return (
              <div key={group.label}>
                {isOpen && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                  >
                    {group.label}
                    <ChevronDown className={`w-3 h-3 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}

                {(!isCollapsed || !isOpen) && group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden
                        ${active ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'}
                        ${!isOpen ? 'lg:justify-center' : ''}
                      `}
                      title={!isOpen ? item.name : undefined}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
                      )}
                      <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${active ? item.color : ''}`} />
                      <span className={`text-sm whitespace-nowrap transition-all duration-300 ${!isOpen ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100 w-auto'}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-border hidden lg:block">
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
