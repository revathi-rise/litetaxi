'use client';

import React, { useEffect, useState } from 'react';
import {
  Navigation, Radio, MapPin, Car, User, Clock, AlertCircle,
  RefreshCw, CheckCircle2, ChevronRight, Phone, Shield, X, StopCircle
} from 'lucide-react';
import { adminApi } from '../../lib/api';

interface LiveRide {
  id: string;
  code?: string;
  status: 'searching' | 'assigned' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  estimatedFare: number;
  finalFare?: number;
  distanceKm?: number;
  durationMinutes?: number;
  startOtp?: string;
  createdAt: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    rating: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    category?: string;
  } | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export default function CurrentRidesPage() {
  const [rides, setRides] = useState<LiveRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelModalRide, setCancelModalRide] = useState<LiveRide | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchRides = async () => {
    try {
      const res = await adminApi.getCurrentRides();
      setRides(res.rides || []);
    } catch (err: any) {
      console.error('Error fetching live rides:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    if (!autoRefresh) return;
    const interval = setInterval(fetchRides, 3500);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleCancelBooking = async () => {
    if (!cancelModalRide) return;
    try {
      setCancelling(true);
      await adminApi.cancelBooking(cancelModalRide.id, cancelReason || 'Cancelled by admin operations');
      setToast({ message: 'Ride has been successfully cancelled by admin.', type: 'success' });
      setCancelModalRide(null);
      setCancelReason('');
      await fetchRides();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to cancel ride', type: 'error' });
    } finally {
      setCancelling(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const filteredRides = rides.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const inProgressCount = rides.filter((r) => r.status === 'in_progress').length;
  const arrivedCount = rides.filter((r) => r.status === 'arrived').length;
  const assignedCount = rides.filter((r) => r.status === 'assigned').length;
  const searchingCount = rides.filter((r) => r.status === 'searching').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-600 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Navigation className="w-6 h-6 text-purple-400" />
              Live Cab Rides & GPS Dispatch
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              REAL-TIME DISPATCH
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Monitor all active taxi trips on the road, track driver allocations, and supervise in-transit rides.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-2 ${
              autoRefresh
                ? 'bg-emerald-950/40 border-emerald-600/60 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            {autoRefresh ? 'Live Polling Active (3.5s)' : 'Auto-refresh Paused'}
          </button>

          <button
            onClick={fetchRides}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'all'
              ? 'bg-purple-950/40 border-purple-500/80 shadow-md shadow-purple-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs text-slate-400 font-semibold uppercase">Total Active</p>
          <p className="text-2xl font-bold text-white mt-0.5">{rides.length}</p>
        </button>

        <button
          onClick={() => setStatusFilter('in_progress')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'in_progress'
              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs text-emerald-400 font-semibold uppercase">In Progress</p>
          <p className="text-2xl font-bold text-emerald-400 mt-0.5">{inProgressCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('arrived')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'arrived'
              ? 'bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs text-blue-400 font-semibold uppercase">Driver Arrived</p>
          <p className="text-2xl font-bold text-blue-400 mt-0.5">{arrivedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('assigned')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'assigned'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs text-amber-400 font-semibold uppercase">Assigned</p>
          <p className="text-2xl font-bold text-amber-400 mt-0.5">{assignedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('searching')}
          className={`p-3.5 rounded-xl border text-left transition ${
            statusFilter === 'searching'
              ? 'bg-purple-950/40 border-purple-500/80 shadow-md shadow-purple-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs text-purple-400 font-semibold uppercase">Searching</p>
          <p className="text-2xl font-bold text-purple-400 mt-0.5">{searchingCount}</p>
        </button>
      </div>

      {/* Rides List Cards */}
      {loading && rides.length === 0 ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-400 mb-3" />
          <p className="text-slate-300 font-medium">Scanning live cab dispatches...</p>
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-16 text-center">
          <Navigation className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-white">No active rides right now</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            When a customer requests a ride on the mobile app or web portal, it will instantly appear here with live tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRides.map((ride) => (
            <div
              key={ride.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                {/* Header: ID, Status, Fare */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{ride.id.slice(0, 8).toUpperCase()}
                      </span>
                      {ride.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-500 text-emerald-400 animate-pulse">
                          ● IN PROGRESS
                        </span>
                      )}
                      {ride.status === 'arrived' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 border border-blue-500 text-blue-400">
                          ● DRIVER ARRIVED
                        </span>
                      )}
                      {ride.status === 'assigned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950 border border-amber-500 text-amber-400">
                          ● DRIVER ASSIGNED
                        </span>
                      )}
                      {ride.status === 'searching' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-950 border border-purple-500 text-purple-400 animate-pulse">
                          ● SEARCHING DRIVER
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Started: {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">
                      ₹{ride.finalFare || ride.estimatedFare || '0'}
                    </p>
                    {ride.distanceKm && (
                      <p className="text-xs text-slate-400">
                        {ride.distanceKm} km • ~{ride.durationMinutes} min
                      </p>
                    )}
                  </div>
                </div>

                {/* Route: Pickup & Dropoff */}
                <div className="py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-950" />
                      <div className="w-0.5 h-7 bg-slate-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Pickup</p>
                      <p className="text-sm font-medium text-white truncate">{ride.pickupAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 flex flex-col items-center">
                      <MapPin className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Dropoff</p>
                      <p className="text-sm font-medium text-white truncate">{ride.dropoffAddress}</p>
                    </div>
                  </div>
                </div>

                {/* People: Driver & Customer */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  {/* Customer */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      <span>Customer</span>
                    </div>
                    <p className="font-semibold text-white truncate">
                      {ride.customer?.name || 'Customer'}
                    </p>
                    <p className="text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {ride.customer?.phone || 'N/A'}
                    </p>
                  </div>

                  {/* Driver */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold mb-1">
                      <Car className="w-3.5 h-3.5 text-amber-400" />
                      <span>Driver Partner</span>
                    </div>
                    {ride.driver ? (
                      <>
                        <p className="font-semibold text-white truncate">
                          {ride.driver.name}
                        </p>
                        <p className="text-amber-300 font-mono text-[11px] uppercase mt-0.5">
                          {ride.driver.vehicleNumber || ride.driver.vehicleModel || 'Cab'}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-500 italic">Assigning driver...</span>
                    )}
                  </div>
                </div>

                {/* OTP & Security Info */}
                {ride.startOtp && (
                  <div className="mt-3 bg-purple-950/30 border border-purple-800/40 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                    <span className="text-purple-300 font-medium flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-400" />
                      Ride Start OTP:
                    </span>
                    <span className="font-mono font-bold text-amber-300 tracking-widest text-sm bg-purple-900/60 px-2.5 py-0.5 rounded border border-purple-500/50">
                      {ride.startOtp}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Live Dispatch ID: {ride.id.slice(-6)}
                </span>
                <button
                  onClick={() => setCancelModalRide(ride)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  Ops Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalRide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <StopCircle className="w-5 h-5 text-rose-500" />
                Cancel Active Ride
              </h3>
              <button
                onClick={() => setCancelModalRide(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-slate-300">
                Are you sure you want to cancel ride #{cancelModalRide.id.slice(0, 8)}? Both customer and driver will be notified immediately.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Reason for Cancellation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer requested, driver unreachable, accident"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setCancelModalRide(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                {cancelling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

