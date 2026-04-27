"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Edit2, Trash2, Star, ExternalLink } from "lucide-react";

const fetcher = (url: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { credentials: "include" }).then(r => r.json());

function formatPrice(n: number) {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} Lac`;
  return n.toLocaleString();
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  SOLD_OUT: "bg-red-100 text-red-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

interface Project {
  _id: string;
  title: string;
  slug: string;
  city: string;
  minPrice?: number;
  maxPrice?: number;
  status: string;
  isFeatured: boolean;
  images?: string[];
}

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useSWR<{ data: Project[]; total: number; pages: number }>(
    `/admin/projects?page=${page}&limit=20`, fetcher
  );

  const deleteProject = async (slug: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/admin/projects/${encodeURIComponent(slug)}`);
      toast.success("Project deleted");
      mutate();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const toggleFeatured = async (slug: string, current: boolean) => {
    try {
      await api.put(`/admin/projects/${encodeURIComponent(slug)}`, { isFeatured: !current });
      toast.success(!current ? "Marked as featured" : "Removed from featured");
      mutate();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">New Projects</h1>
          <p className="text-gray-500 text-sm">{data?.total ?? 0} total projects</p>
        </div>
        <Link href="/dashboard/projects/add"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Add Project
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !data?.data?.length ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
          <div className="text-5xl mb-4">🏗️</div>
          <h3 className="font-semibold text-gray-700">No projects yet</h3>
          <p className="text-gray-400 text-sm mt-1">Add your first real estate project.</p>
          <Link href="/dashboard/projects/add" className="mt-4 inline-block bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
            Add Project
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Project","City","Price Range","Status","Views","Featured","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.data.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.images?.[0]
                          ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-400">🏗️</div>}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm line-clamp-1">{p.title}</div>
                        <div className="text-xs text-gray-400 font-mono">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{p.city}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {p.minPrice && p.maxPrice
                      ? `PKR ${formatPrice(p.minPrice)} – ${formatPrice(p.maxPrice)}`
                      : p.minPrice ? `From PKR ${formatPrice(p.minPrice)}` : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button onClick={() => toggleFeatured(p.slug, p.isFeatured)}
                      className={`p-1.5 rounded-lg transition-colors ${p.isFeatured ? "text-yellow-500 bg-yellow-50" : "text-gray-300 hover:text-yellow-400"}`}>
                      <Star size={16} fill={p.isFeatured ? "currentColor" : "none"} />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <a href={`${(process.env.NEXT_PUBLIC_MAIN_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/new-projects/${p.slug}`} target="_blank" rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <ExternalLink size={15} />
                      </a>
                      <Link href={`/dashboard/projects/${encodeURIComponent(p.slug)}/edit`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 size={15} />
                      </Link>
                      <button onClick={() => deleteProject(p.slug, p.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.pages ?? 0) > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">← Prev</button>
              <span className="text-sm text-gray-500 self-center">Page {page} of {data?.pages}</span>
              <button disabled={page === data?.pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
