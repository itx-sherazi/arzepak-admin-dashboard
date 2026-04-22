"use client";
import useSWR from "swr";
import { Building2, Home, TrendingUp, Clock, CheckCircle, MessageCircle } from "lucide-react";

const fetcher = (url: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { credentials: "include" }).then(r => r.json());

interface Stats {
  totalDealers: number;
  totalProperties: number;
  activeListings: number;
  pendingListings: number;
  totalInquiries: number;
  pendingDealers: number;
}

export default function AdminDashboard() {
  const { data, isLoading } = useSWR<{ data: Stats }>("/admin/stats", fetcher);
  const d = data?.data;

  if (isLoading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  const stats = [
    { label: "Total Dealers",     value: d?.totalDealers ?? 0,     icon: Building2,   color: "bg-blue-50 text-blue-600" },
    { label: "Pending Review",    value: d?.pendingDealers ?? 0,     icon: Clock,       color: "bg-yellow-50 text-yellow-600" },
    { label: "Total Listings",    value: d?.totalProperties ?? 0,  icon: Home,        color: "bg-indigo-50 text-indigo-600" },
    { label: "Active Listings",   value: d?.activeListings ?? 0,     icon: TrendingUp,  color: "bg-rose-50 text-rose-600" },
    { label: "Pending Listings",  value: d?.pendingListings ?? 0,    icon: CheckCircle, color: "bg-amber-50 text-amber-600" },
    { label: "Total Inquiries",   value: d?.totalInquiries ?? 0,    icon: MessageCircle, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Overview</h1>
        <p className="text-gray-500 text-sm">Platform-wide statistics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}><s.icon size={18} /></div>
            <div className="text-2xl font-bold text-gray-800">{s.value.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
