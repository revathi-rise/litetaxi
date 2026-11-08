'use client';

import React, { useEffect, useState } from 'react';
import {
  Users, Search, RefreshCw, Phone, Mail, Calendar,
  Shield, CheckCircle2, UserCheck
} from 'lucide-react';
import { adminApi } from '../../lib/api';

interface CustomerItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone: string;
  totalBookings: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCustomers();
      setCustomers(res.customers || []);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Customer Accounts & Riders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registered customer profiles, ride booking frequency, contact details, and account status.
          </p>
        </div>
        <button
          onClick={fetchCustomers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="flex-1 relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, mobile number (+91...), or email..."
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium px-2">
          {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Customer' : 'Customers'}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Rides Taken</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-950 border border-purple-600/40 flex items-center justify-center font-bold text-purple-300 text-sm">
                          {cust.name ? cust.name[0].toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{cust.name || 'LiteSpark Customer'}</p>
                          <p className="text-xs font-mono text-slate-500">ID: {cust.userId.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{cust.phone || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      {cust.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{cust.email}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600 italic">Not set</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-400 text-base">{cust.totalBookings}</span>
                        <span className="text-xs text-slate-400">rides booked</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3" /> Active Rider
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

