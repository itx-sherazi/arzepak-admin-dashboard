"use client";
import useSWR from "swr";
import { useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDate, statusColor } from "@/lib/utils";
import Link from "next/link";
import { Search, CheckCircle, XCircle, Trash2, Eye, Ban } from "lucide-react";

const fetcher = (url: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { credentials: "include" }).then(r => r.json());

interface Dealer {
  _id: string; agencyName?: string; status: string; package: string; city: string;
  totalListings: number; totalLeads: number; createdAt: string; isVerified: boolean;
  userId?: { name?: string; email?: string } | null;
}

const STATUSES = ["ALL","PENDING","ACTIVE","SUSPENDED","REJECTED"];

export default function DealersPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const q = `/admin/dealers?page=${page}&limit=20${filter !== "ALL" ? `&status=${filter}` : ""}${search ? `&search=${search}` : ""}`;
  const { data, isLoading, mutate } = useSWR<{ data: Dealer[]; total: number; pages: number }>(q, fetcher);

  const updateStatus = async (id: string, status: string) => {
    try { await api.patch(`/admin/dealers/${id}`, { status }); toast.success("Updated"); mutate(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const deleteDealer = async (id: string) => {
    if (!confirm("Delete this dealer permanently?")) return;
    try { await api.delete(`/admin/dealers/${id}`); toast.success("Deleted"); mutate(); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dealers</h1>
          <p className="text-gray-500 text-sm">{data?.total ?? 0} total · use the eye icon to open full profile, documents, and verify</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-48" />
          </div>
          {STATUSES.map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter===s?"bg-green-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{["Agency","Owner","City","Package","Listings","Status","Joined","Review"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map(d => (
                <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{d.agencyName}</div>
                    {d.isVerified && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Verified</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{d.userId?.name}</div>
                    <div className="text-xs text-gray-400">{d.userId?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.city}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{d.package}</span></td>
                  <td className="px-4 py-3 text-gray-600">{d.totalListings}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(d.status)}`}>{d.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(d.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Link
                        href={`/dashboard/dealers/${d._id}`}
                        title="View details & verify"
                        className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 inline-flex"
                      >
                        <Eye size={15} />
                      </Link>
                      {d.status !== "ACTIVE" && (
                        <button type="button" onClick={() => updateStatus(d._id, "ACTIVE")} title="Quick approve"
                          className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><CheckCircle size={15} /></button>
                      )}
                      {d.status === "PENDING" && (
                        <button type="button" onClick={() => updateStatus(d._id, "REJECTED")} title="Reject"
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"><XCircle size={15} /></button>
                      )}
                      {d.status === "ACTIVE" && (
                        <button type="button" onClick={() => updateStatus(d._id, "SUSPENDED")} title="Suspend"
                          className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600"><Ban size={15} /></button>
                      )}
                      <button type="button" onClick={() => deleteDealer(d._id)} title="Delete"
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data?.pages ?? 0) > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-gray-500 self-center">Page {page} of {data?.pages}</span>
          <button disabled={page===data?.pages} onClick={() => setPage(p=>p+1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
