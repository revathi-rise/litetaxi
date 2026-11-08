'use client';

import React, { useEffect, useState } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, Search, Eye, ShieldCheck,
  Car, FileText, Phone, Mail, AlertTriangle, ExternalLink, RefreshCw, X
} from 'lucide-react';
import { adminApi } from '../../lib/api';

interface DriverItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  approval: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isOnline: boolean;
  onActiveTrip: boolean;
  rating: string;
  isSimulated: boolean;
  aadhaarNumber?: string;
  aadhaarImageUrl?: string;
  licenseNumber?: string;
  licenseImageUrl?: string;
  totalTrips?: number;
  totalEarnings?: number;
  walletBalance?: number;
  createdAt: string;
  vehicle?: {
    id: string;
    registrationNumber: string;
    model: string;
    color: string;
    categoryName: string;
    vehicleFrontImageUrl?: string;
    vehicleBackImageUrl?: string;
    vehicleLeftImageUrl?: string;
    vehicleRightImageUrl?: string;
  } | null;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDrivers(
        statusFilter === 'all' ? undefined : statusFilter,
        searchTerm || undefined
      );
      setDrivers(res.drivers || []);
    } catch (err: any) {
      console.error('Failed to load drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDrivers();
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (driverId: string) => {
    try {
      setActionLoading(true);
      await adminApi.approveDriver(driverId);
      showNotification('Driver profile successfully approved! The driver can now go online.');
      await loadDrivers();
      if (selectedDriver && selectedDriver.id === driverId) {
        setSelectedDriver((prev) => prev ? { ...prev, approval: 'approved', rejectionReason: undefined } : null);
      }
    } catch (err: any) {
      showNotification(err.message || 'Approval failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (driverId: string) => {
    try {
      setActionLoading(true);
      await adminApi.rejectDriver(driverId, rejectReason || 'Documents verification did not meet standards');
      showNotification('Driver application has been rejected.', 'success');
      setShowRejectBox(false);
      setRejectReason('');
      await loadDrivers();
      if (selectedDriver && selectedDriver.id === driverId) {
        setSelectedDriver((prev) => prev ? { ...prev, approval: 'rejected', rejectionReason: rejectReason || 'Documents verification did not meet standards' } : null);
      }
    } catch (err: any) {
      showNotification(err.message || 'Rejection failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = drivers.filter(d => d.approval === 'pending').length;
  const approvedCount = drivers.filter(d => d.approval === 'approved').length;
  const rejectedCount = drivers.filter(d => d.approval === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200' 
            : 'bg-rose-950/90 border-rose-600 text-rose-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Driver Management & KYC Verification
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review driver onboarding applications, verify Aadhaar, Driving Licence, and 4-sided vehicle photos.
          </p>
        </div>
        <button
          onClick={loadDrivers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Quick Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'all'
              ? 'bg-purple-950/40 border-purple-500/80 shadow-lg shadow-purple-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Total Drivers</p>
          <p className="text-2xl font-bold text-white mt-1">{drivers.length}</p>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'pending'
              ? 'bg-amber-950/40 border-amber-500/80 shadow-lg shadow-amber-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Pending Approval</p>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'approved'
              ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Approved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{approvedCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-xl border text-left transition ${
            statusFilter === 'rejected'
              ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-900/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs uppercase tracking-wider text-rose-400 font-semibold">Rejected</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{rejectedCount}</p>
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
            placeholder="Search by driver name, phone (+91...), email or license..."
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </form>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={loadDrivers}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition shadow-md shadow-purple-600/30 flex-1 md:flex-none text-center"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Drivers List Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Driver</th>
                <th className="py-3.5 px-4">Vehicle Details</th>
                <th className="py-3.5 px-4">Documents</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Online / Trip</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                    Loading driver partners...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No drivers found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-800/40 transition">
                    {/* Driver Column */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-900/60 border border-purple-500/40 flex items-center justify-center font-bold text-purple-200">
                          {driver.name ? driver.name[0].toUpperCase() : 'D'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{driver.name || 'Unnamed Driver'}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {driver.phone || 'No phone'}
                          </p>
                          {driver.email && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              {driver.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Vehicle Column */}
                    <td className="py-4 px-4">
                      {driver.vehicle ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <Car className="w-4 h-4 text-amber-400" />
                            <span>{driver.vehicle.model}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {driver.vehicle.categoryName}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-purple-300 mt-0.5 uppercase">
                            {driver.vehicle.registrationNumber} • {driver.vehicle.color}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">No vehicle attached</span>
                      )}
                    </td>

                    {/* Documents Column */}
                    <td className="py-4 px-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1 text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-purple-400" />
                          <span>DL:</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            {driver.licenseNumber || 'Not submitted'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Aadhaar:</span>
                          <span className="font-mono text-slate-200 font-semibold">
                            {driver.aadhaarNumber || 'Not submitted'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="py-4 px-4">
                      {driver.approval === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      )}
                      {driver.approval === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/40 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Review
                        </span>
                      )}
                      {driver.approval === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/40">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Online / Active Trip Column */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${driver.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span className={driver.isOnline ? 'text-emerald-300 font-medium' : 'text-slate-500'}>
                            {driver.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </span>
                        {driver.onActiveTrip && (
                          <span className="text-amber-400 font-medium">On Ride</span>
                        )}
                      </div>
                    </td>

                    {/* Action Column */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowRejectBox(false);
                          setRejectReason('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 text-purple-200 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Driver Inspection & Verification Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-lg font-bold text-purple-200">
                  {selectedDriver.name ? selectedDriver.name[0].toUpperCase() : 'D'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedDriver.name}
                    {selectedDriver.approval === 'approved' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 font-normal">Approved</span>
                    )}
                    {selectedDriver.approval === 'pending' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500 text-amber-400 font-normal">Pending KYC Verification</span>
                    )}
                    {selectedDriver.approval === 'rejected' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500 text-rose-400 font-normal">Rejected</span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phone: <span className="text-slate-200 font-medium">{selectedDriver.phone || 'N/A'}</span> • Email: <span className="text-slate-200 font-medium">{selectedDriver.email || 'N/A'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
              {/* If Rejected, show reason */}
              {selectedDriver.approval === 'rejected' && selectedDriver.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-600/60 text-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Application Rejected</h4>
                    <p className="text-xs text-rose-300 mt-1">{selectedDriver.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Driver Rides & Wallet Quick Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Completed Rides</p>
                  <p className="text-xl font-bold text-white mt-1">{selectedDriver.totalTrips ?? 0} trips</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Driver Earnings</p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">₹{selectedDriver.totalEarnings ?? '0.00'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-purple-400 font-semibold">Wallet Balance</p>
                  <p className="text-xl font-bold text-purple-400 mt-1">₹{selectedDriver.walletBalance ?? '0.00'}</p>
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-amber-400 font-semibold">Driver Rating</p>
                    <p className="text-xl font-bold text-amber-400 mt-1">★ {selectedDriver.rating || '5.00'}</p>
                  </div>
                  <a
                    href={`/bookings?search=${encodeURIComponent(selectedDriver.name)}`}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-medium underline flex items-center gap-1 mt-1"
                  >
                    View Trips in Bookings →
                  </a>
                </div>
              </div>

              {/* Section 1: Official Identity & License Documents */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4" />
                  1. Official Verification Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Driving License Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase text-slate-400">Driving Licence</span>
                        <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-600/40">
                          {selectedDriver.licenseNumber || 'Not provided'}
                        </span>
                      </div>
                      <div className="aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {selectedDriver.licenseImageUrl ? (
                          <>
                            <img
                              src={selectedDriver.licenseImageUrl}
                              alt="Driving Licence"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <button
                                onClick={() => setLightboxImage({ url: selectedDriver.licenseImageUrl!, title: 'Driving Licence Image' })}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Fullscreen
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-slate-500">
                            <FileText className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <p className="text-xs">No licence photo uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Card */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase text-slate-400">Aadhaar Card</span>
                        <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-600/40">
                          {selectedDriver.aadhaarNumber || 'Not provided'}
                        </span>
                      </div>
                      <div className="aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {selectedDriver.aadhaarImageUrl ? (
                          <>
                            <img
                              src={selectedDriver.aadhaarImageUrl}
                              alt="Aadhaar Card"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <button
                                onClick={() => setLightboxImage({ url: selectedDriver.aadhaarImageUrl!, title: 'Aadhaar Card Image' })}
                                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Fullscreen
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-4 text-slate-500">
                            <ShieldCheck className="w-8 h-8 mx-auto mb-1 opacity-50" />
                            <p className="text-xs">No Aadhaar photo uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle Inspection (4-Sided Photos) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    2. Vehicle Inspection & 4-Sided Photographs
                  </h3>
                  {selectedDriver.vehicle && (
                    <span className="text-xs font-mono bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-slate-700">
                      {selectedDriver.vehicle.registrationNumber} • {selectedDriver.vehicle.model} ({selectedDriver.vehicle.color})
                    </span>
                  )}
                </div>

                {selectedDriver.vehicle ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Front */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 mb-2">Front View</span>
                      <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {selectedDriver.vehicle.vehicleFrontImageUrl ? (
                          <>
                            <img
                              src={selectedDriver.vehicle.vehicleFrontImageUrl}
                              alt="Front View"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <button
                                onClick={() => setLightboxImage({ url: selectedDriver.vehicle!.vehicleFrontImageUrl!, title: 'Vehicle Front View' })}
                                className="p-2 rounded-full bg-purple-600 text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">No front photo</span>
                        )}
                      </div>
                    </div>

                    {/* Back / Rear */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 mb-2">Rear / Back View</span>
                      <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {selectedDriver.vehicle.vehicleBackImageUrl ? (
                          <>
                            <img
                              src={selectedDriver.vehicle.vehicleBackImageUrl}
                              alt="Rear View"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <button
                                onClick={() => setLightboxImage({ url: selectedDriver.vehicle!.vehicleBackImageUrl!, title: 'Vehicle Rear View' })}
                                className="p-2 rounded-full bg-purple-600 text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">No rear photo</span>
                        )}
                      </div>
                    </div>

                    {/* Left Side */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 mb-2">Left Side View</span>
                      <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {selectedDriver.vehicle.vehicleLeftImageUrl ? (
                          <>
                            <img
                              src={selectedDriver.vehicle.vehicleLeftImageUrl}
                              alt="Left Side View"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <button
                                onClick={() => setLightboxImage({ url: selectedDriver.vehicle!.vehicleLeftImageUrl!, title: 'Vehicle Left Side View' })}
                                className="p-2 rounded-full bg-purple-600 text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">No left photo</span>
                        )}
                      </div>
                    </div>

                    {/* Right Side */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 mb-2">Right Side View</span>
                      <div className="aspect-square bg-slate-900 rounded-lg overflow-hidden border border-slate-800 relative group flex items-center justify-center">
                        {selectedDriver.vehicle.vehicleRightImageUrl ? (
                          <>
                            <img
                              src={selectedDriver.vehicle.vehicleRightImageUrl}
                              alt="Right Side View"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <button
                                onClick={() => setLightboxImage({ url: selectedDriver.vehicle!.vehicleRightImageUrl!, title: 'Vehicle Right Side View' })}
                                className="p-2 rounded-full bg-purple-600 text-white"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-500">No right photo</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No vehicle details submitted.</p>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Registered on: {new Date(selectedDriver.createdAt).toLocaleDateString()} at {new Date(selectedDriver.createdAt).toLocaleTimeString()}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {showRejectBox ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Reason for rejection..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={() => handleReject(selectedDriver.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectBox(true)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      {selectedDriver.approval === 'rejected' ? 'Update Rejection' : 'Reject Application'}
                    </button>

                    <button
                      onClick={() => handleApprove(selectedDriver.id)}
                      disabled={actionLoading}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedDriver.approval === 'approved' ? 'Already Approved' : 'Approve Driver'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <h3 className="font-semibold text-sm">{lightboxImage.title}</h3>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-hidden rounded-xl border border-slate-700">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

