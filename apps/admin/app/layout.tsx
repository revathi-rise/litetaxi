'use client';

import './globals.css';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Car,
  Users,
  CalendarCheck,
  Radio,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../lib/api';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBadgeCounts = async () => {
    try {
      setRefreshing(true);
      const stats = await adminApi.getStats();
      setPendingCount(stats.pendingDrivers || 0);
      setActiveCount(stats.activeRides || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      label: 'Overview',
      href: '/admin',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Drivers & Approvals',
      href: '/drivers',
      icon: Car,
      badge: pendingCount > 0 ? `${pendingCount} pending` : null,
      badgeColor: 'bg-amber-500 text-white font-bold',
    },
    {
      label: 'Current Rides',
      href: '/rides',
      icon: Radio,
      badge: activeCount > 0 ? `${activeCount} live` : null,
      badgeColor: 'bg-emerald-500 text-white font-bold animate-pulse',
    },
    {
      label: 'All Bookings',
      href: '/bookings',
      icon: CalendarCheck,
      badge: null,
    },
    {
      label: 'Customers',
      href: '/customers',
      icon: Users,
      badge: null,
    },
  ];

  const isAdminPath =
    pathname?.startsWith('/admin') ||
    pathname === '/drivers' ||
    pathname === '/rides' ||
    pathname === '/bookings' ||
    pathname === '/customers';

  return (
    <html lang="en">
      <head>
        <title>LiteSpark Taxi — Modern Cab Dispatch & Operations</title>
        <meta name="description" content="Fast, reliable cab booking and driver partner fleet network." />
      </head>
      {!isAdminPath ? (
        <body className="min-h-screen bg-white text-slate-900 font-sans antialiased overflow-x-hidden">
          {children}
        </body>
      ) : (
        <body className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
          {/* ── Sidebar ── */}
          <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
            <div>
              {/* Logo & Brand Header */}
              <div className="p-5 border-b border-slate-800/80 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h1 className="font-extrabold text-white text-base tracking-wide flex items-center gap-1.5">
                    LiteSpark <span className="text-amber-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">ADMIN</span>
                  </h1>
                  <p className="text-xs text-slate-400">Operations Portal</p>
                </div>
              </div>

              {/* Public Website Shortcut */}
              <div className="px-3 pt-3">
                <a
                  href="/"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/60 hover:bg-purple-900/60 transition"
                >
                  <span>🌐 View Public Website</span>
                </a>
              </div>

              {/* Navigation List */}
              <nav className="p-3 space-y-1">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Management
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Footer Card */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Operations Admin</p>
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      API Connected
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchBadgeCounts}
                  title="Refresh stats"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main App Content ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top header bar */}
            <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-bold text-slate-800">
                  {pathname === '/admin' && 'Overview Dashboard'}
                  {pathname === '/drivers' && 'Driver Approvals & Fleet Directory'}
                  {pathname === '/rides' && 'Live In-Progress Rides'}
                  {pathname === '/bookings' && 'All Ride Bookings History'}
                  {pathname === '/customers' && 'Registered Customers'}
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center gap-2 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="font-medium">Backend:</span>
                  <span className="font-mono text-purple-600 font-semibold">http://localhost:3001</span>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-sm transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload</span>
                </button>
              </div>
            </header>

            {/* Page Body */}
            <main className="flex-1 overflow-y-auto p-8">
              {children}
            </main>
          </div>
        </body>
      )}
    </html>
  );
}

