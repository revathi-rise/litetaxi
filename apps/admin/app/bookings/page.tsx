'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar, Search, Filter, RefreshCw, MapPin, User, Car, Clock,
  CheckCircle2, XCircle, AlertCircle, Eye, X, CreditCard
} from 'lucide-react';
import { adminApi } from '../../lib/api';

interface BookingItem {
  id: string;
  code?: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedFare: number;
  finalFare?: number;
  distanceKm?: number;
  durationMinutes?: number;
  startOtp?: string;
  cancellationReason?: string;
  createdAt: string;
  allocatedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  driver?: {
    id: string;
    name: string;
    phone: string;
    vehicleModel?: string;
    vehicleNumber?: string;
  } | null;
  customer?: {
    id: string;
    name: string;
    phone: string;
  } | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getBookings(statusFilter || undefined, searchTerm || undefined);
      setBookings(res.items || res.bookings || []);
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            Bookings History & Dispatch Records
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete log of all customer ride requests, allocations, completed trips, and cancellations.
          </p>
        </div>
        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, driver, or booking ID..."
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="assigned">Driver Assigned</option>
            <option value="searching">Searching</option>
          </select>

          <button
            type="button"
            onClick={fetchBookings}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Booking ID & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Driver & Cab</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Fare</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No bookings found matching filter criteria.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4">
                      <p className="font-mono text-purple-300 font-bold text-xs uppercase">
                        #{booking.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(booking.createdAt).toLocaleDateString()} {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span>{booking.customer?.name || 'Customer'}</span>
                      </div>
                      <p className="text-xs text-slate-400">{booking.customer?.phone || 'N/A'}</p>
                    </td>

                    <td className="py-4 px-4">
                      {booking.driver ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-white">
                            <Car className="w-3.5 h-3.5 text-amber-400" />
                            <span>{booking.driver.name}</span>
                          </div>
                          <p className="text-xs font-mono text-amber-300 uppercase">
                            {booking.driver.vehicleNumber || booking.driver.vehicleModel}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-xs text-emerald-400 truncate">
                        <span className="font-semibold text-slate-400 mr-1">From:</span>
                        {booking.pickupAddress}
                      </p>
                      <p className="text-xs text-rose-400 truncate mt-0.5">
                        <span className="font-semibold text-slate-400 mr-1">To:</span>
                        {booking.dropoffAddress}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <p className="font-bold text-amber-400 text-sm">
                        ₹{booking.finalFare || booking.estimatedFare || '0'}
                      </p>
                      {booking.distanceKm && (
                        <p className="text-xs text-slate-400">{booking.distanceKm} km</p>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      {booking.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                      {booking.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-400 border border-purple-500/40 animate-pulse">
                          ● On Trip
                        </span>
                      )}
                      {booking.status === 'cancelled' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-400 border border-rose-500/40">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      )}
                      {booking.status === 'assigned' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-500/40">
                          Assigned
                        </span>
                      )}
                      {booking.status === 'searching' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                          Searching
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Trip Breakdown #{selectedBooking.id.slice(0, 8).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Requested on {new Date(selectedBooking.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm text-slate-200">
              {/* Fare & Status banner */}
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-purple-300 font-semibold">Total Fare</p>
                  <p className="text-2xl font-bold text-amber-400">
                    ₹{selectedBooking.finalFare || selectedBooking.estimatedFare || '0'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estimated: ₹{selectedBooking.estimatedFare} • Distance: {selectedBooking.distanceKm || '0'} km
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase font-semibold text-slate-400 block mb-1">Status</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 border border-slate-700 text-white">
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              {/* Locations */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Pickup Location</span>
                    <p className="text-sm font-medium text-white">{selectedBooking.pickupAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 mt-1" />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Dropoff Location</span>
                    <p className="text-sm font-medium text-white">{selectedBooking.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    Customer Details
                  </span>
                  <p className="font-bold text-white text-sm">{selectedBooking.customer?.name || 'Customer'}</p>
                  <p className="text-slate-400 mt-0.5">{selectedBooking.customer?.phone || 'No phone'}</p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    Driver Details
                  </span>
                  {selectedBooking.driver ? (
                    <>
                      <p className="font-bold text-white text-sm">{selectedBooking.driver.name}</p>
                      <p className="text-slate-400 mt-0.5">{selectedBooking.driver.phone}</p>
                      <p className="font-mono text-amber-300 uppercase mt-0.5">
                        {selectedBooking.driver.vehicleNumber || selectedBooking.driver.vehicleModel}
                      </p>
                    </>
                  ) : (
                    <p className="text-slate-500 italic">No driver assigned</p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" /> Trip Timeline
                </h4>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Requested:</span>
                    <span>{new Date(selectedBooking.createdAt).toLocaleTimeString()}</span>
                  </div>
                  {selectedBooking.allocatedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver Allocated:</span>
                      <span>{new Date(selectedBooking.allocatedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectedBooking.arrivedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Driver Arrived:</span>
                      <span>{new Date(selectedBooking.arrivedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectedBooking.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trip Started:</span>
                      <span>{new Date(selectedBooking.startedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectedBooking.completedAt && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Trip Completed:</span>
                      <span>{new Date(selectedBooking.completedAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectedBooking.cancelledAt && (
                    <div className="flex justify-between text-rose-400 font-semibold">
                      <span>Cancelled:</span>
                      <span>{new Date(selectedBooking.cancelledAt).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectedBooking.cancellationReason && (
                    <div className="pt-2 text-rose-300 border-t border-slate-800">
                      <span className="font-semibold">Reason:</span> {selectedBooking.cancellationReason}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

