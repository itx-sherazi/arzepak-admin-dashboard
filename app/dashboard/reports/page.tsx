"use client";
import useSWR from "swr";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const fetcher = (url: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { credentials: "include" }).then(r => r.json());
const COLORS = ["#16a34a","#2563eb","#9333ea","#ea580c","#0891b2","#dc2626","#ca8a04","#db2777"];

interface Reports {
  listingsByCity: { _id: string; count: number }[];
  listingsByType: { _id: string; count: number }[];
  listingsByPurpose: { _id: string; count: number }[];
  dealersByPackage: { _id: string; count: number }[];
}

export default function ReportsPage() {
  const { data, isLoading } = useSWR<{ data: Reports }>("/admin/reports", fetcher);
  const d = data?.data;

  const cityChart = d?.listingsByCity?.slice(0, 8).map(c => ({ name: c._id, value: c.count })) ?? [];
  const typeChart = d?.listingsByType?.map(t => ({ name: t._id, value: t.count })) ?? [];
  const purposeChart = d?.listingsByPurpose?.map(p => ({ name: p._id, value: p.count })) ?? [];
  const pkgChart = d?.dealersByPackage?.map(p => ({ name: p._id, value: p.count })) ?? [];

  if (isLoading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1><p className="text-gray-500 text-sm">Platform-wide data insights</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Listings by City</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cityChart} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Listings by Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={typeChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                {typeChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">For Sale vs For Rent</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={purposeChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={false}>
                {purposeChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4">Dealers by Package</h2>
          <div className="space-y-3 mt-2">
            {pkgChart.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="flex-1 text-sm font-medium text-gray-700">{p.name}</div>
                <div className="text-sm text-gray-500">{p.value} dealers</div>
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (p.value / (pkgChart[0]?.value || 1)) * 100)}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
