'use client';

import { useEffect, useState } from 'react';
import {
  Car,
  Users,
  CalendarCheck,
  Radio,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { adminApi } from '../../lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [pendingDrivers, setPendingDrivers] = useState<any[]>([]);
  const [activeRides, setActiveRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [s, d, r] = await Promise.all([
        adminApi.getStats(),
        adminApi.getDrivers('pending'),
        adminApi.getCurrentRides(),
      ]);
      setStats(s);
      setPendingDrivers(d.drivers || []);
      setActiveRides(r.rides || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to approve driver ${name}?`)) return;
    try {
      await adminApi.approveDriver(id);
      loadData();
    } catch (e) {
      alert(`Approval failed: ${e}`);
    }
  };

  const handleReject = async (id: string, name: string) => {
    const reason = prompt(`Enter rejection reason for driver ${name}:`, 'Incomplete or unclear vehicle photos');
    if (reason === null) return;
    try {
      await adminApi.rejectDriver(id, reason);
      loadData();
    } catch (e) {
      alert(`Rejection failed: ${e}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Pending Approvals Card */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.pendingDrivers ?? 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">Needs Review</span>
          </div>
          <a
            href="/drivers?status=pending"
            className="mt-3 text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group-hover:underline"
          >
            Review applications <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Live Rides Card */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Active Rides
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Radio className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.activeRides ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">In Progress</span>
          </div>
          <a
            href="/rides"
            className="mt-3 text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 group-hover:underline"
          >
            Monitor live fleet <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Total Bookings Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.totalBookings ?? 0}
            </span>
            <span className="text-xs text-slate-400">All Time</span>
          </div>
          <a
            href="/bookings"
            className="mt-3 text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
          >
            View all rides <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900">
              ₹ {stats?.totalRevenue ?? '0.00'}
            </span>
          </div>
          <p className="mt-3 text-xs text-slate-400">Completed Trips Fare</p>
        </div>

        {/* Registered Customers Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.totalCustomers ?? 0}
            </span>
            <span className="text-xs text-slate-400">Registered</span>
          </div>
          <a
            href="/customers"
            className="mt-3 text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline"
          >
            Customer list <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ── Two Column Action Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Pending Driver Applications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <h3 className="font-bold text-slate-800 text-sm">
                Driver Registrations Awaiting Verification
              </h3>
            </div>
            <a
              href="/drivers?status=pending"
              className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
            >
              View All ({pendingDrivers.length}) <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 flex-1 divide-y divide-slate-100">
            {pendingDrivers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-2 opacity-80" />
                <p className="font-semibold text-sm text-slate-600">All Caught Up!</p>
                <p className="text-xs mt-1">No driver applications are currently waiting for review.</p>
              </div>
            ) : (
              pendingDrivers.slice(0, 4).map((driver) => (
                <div key={driver.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{driver.name || 'New Driver'}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        PENDING
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>📱 {driver.phone}</span>
                      <span>🚗 {driver.vehicle?.registrationNumber || 'No Plate'} ({driver.vehicle?.categoryName || 'Standard'})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(driver.id, driver.name)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(driver.id, driver.name)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Active Live Rides */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="font-bold text-slate-800 text-sm">
                Live Trips On Road
              </h3>
            </div>
            <a
              href="/rides"
              className="text-xs font-semibold text-purple-600 hover:underline flex items-center gap-1"
            >
              Monitor All ({activeRides.length}) <ArrowRight className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 flex-1 divide-y divide-slate-100">
            {activeRides.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Car className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-sm text-slate-600">No Active Trips</p>
                <p className="text-xs mt-1">Book a ride in Customer App to see it appear live!</p>
              </div>
            ) : (
              activeRides.slice(0, 4).map((ride) => (
                <div key={ride.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        #{ride.reference || ride.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full capitalize">
                        {ride.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-emerald-700">{ride.pickup?.address || 'Pickup'}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="font-semibold text-red-700">{ride.dropoff?.address || 'Drop-off'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Cab: {ride.driver?.vehicle?.model || 'LiteSpark Cab'} • Driver: {ride.driver?.name || 'Assigning...'}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">
                      ₹ {ride.estimatedFare || '180'}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {ride.paymentMethod || 'cash'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

