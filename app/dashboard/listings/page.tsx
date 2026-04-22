"use client";
import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatDate, formatPrice, statusColor } from "@/lib/utils";
import { Search, CheckCircle, XCircle, Trash2, Eye, X, MapPin, Bed, Bath, Maximize2, Pencil } from "lucide-react";

const fetcher = (url: string) => fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, { credentials: "include" }).then(r => r.json());

interface Listing {
  _id: string; title: string; slug: string; purpose: string; type: string;
  city: string; areaName: string; address?: string;
  price: number; status: string; createdAt: string; images: Array<string | { url: string; publicId?: string }>;
  area: number; areaUnit: string; bedrooms?: number; bathrooms?: number;
  floors?: number; furnishing?: string; buildYear?: number;
  description: string; amenities?: string[];
  isFeatured: boolean; isSponsored: boolean;
  dealerId?: { agencyName: string; };
  rejectionReason?: string;
}

const STATUSES = ["ALL","PENDING","ACTIVE","SOLD","RENTED","REJECTED"];

function DetailModal({ listing, onClose, onApprove, onReject, onDelete }: {
  listing: Listing;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{listing.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <MapPin size={13} />
              <span>{listing.areaName}, {listing.city}</span>
              {listing.address && <span>· {listing.address}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        {/* Image gallery */}
        {listing.images?.length > 0 && (
          <div className="relative">
            <img
              src={typeof listing.images[imgIdx] === "string" ? listing.images[imgIdx] : listing.images[imgIdx]?.url}
              alt=""
              className="w-full h-64 object-cover"
            />
            {listing.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {listing.images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? "bg-white" : "bg-white/50"}`} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-6 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(listing.status)}`}>{listing.status}</span>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">{listing.purpose}</span>
            <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{listing.type}</span>
            {listing.isFeatured && <span className="text-xs font-semibold bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-full">Featured</span>}
            {listing.isSponsored && <span className="text-xs font-semibold bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full">Sponsored</span>}
          </div>

          {/* Price + dealer */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-green-600">PKR {formatPrice(listing.price)}</div>
            {listing.dealerId && <div className="text-sm text-gray-500">by <span className="font-medium text-gray-700">{listing.dealerId.agencyName}</span></div>}
          </div>

          {/* Key specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Maximize2 size={16} className="mx-auto mb-1 text-gray-400" />
              <div className="text-sm font-semibold text-gray-800">{listing.area} {listing.areaUnit}</div>
              <div className="text-xs text-gray-400">Area</div>
            </div>
            {listing.bedrooms != null && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Bed size={16} className="mx-auto mb-1 text-gray-400" />
                <div className="text-sm font-semibold text-gray-800">{listing.bedrooms}</div>
                <div className="text-xs text-gray-400">Bedrooms</div>
              </div>
            )}
            {listing.bathrooms != null && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <Bath size={16} className="mx-auto mb-1 text-gray-400" />
                <div className="text-sm font-semibold text-gray-800">{listing.bathrooms}</div>
                <div className="text-xs text-gray-400">Bathrooms</div>
              </div>
            )}
            {listing.floors != null && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-sm font-semibold text-gray-800">{listing.floors}</div>
                <div className="text-xs text-gray-400">Floors</div>
              </div>
            )}
          </div>

          {/* Extra details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {listing.furnishing && <div><span className="text-gray-400">Furnishing: </span><span className="font-medium">{listing.furnishing.replace(/_/g," ")}</span></div>}
            {listing.buildYear && <div><span className="text-gray-400">Build Year: </span><span className="font-medium">{listing.buildYear}</span></div>}
            <div><span className="text-gray-400">Added: </span><span className="font-medium">{formatDate(listing.createdAt)}</span></div>
            {listing.slug && <div><span className="text-gray-400">Slug: </span><span className="font-mono text-xs text-gray-600">{listing.slug}</span></div>}
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Description</div>
              <p className="text-sm text-gray-600 leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map(a => (
                  <span key={a} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {listing.rejectionReason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <div className="text-xs font-semibold text-red-500 mb-1">Rejection Reason</div>
              <p className="text-sm text-red-700">{listing.rejectionReason}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <Link href={`/dashboard/listings/${listing.slug}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              <Pencil size={14} /> Edit
            </Link>
            {listing.status !== "ACTIVE" && (
              <button onClick={onApprove} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700">
                <CheckCircle size={14} /> Approve
              </button>
            )}
            {listing.status !== "REJECTED" && (
              <button onClick={onReject} className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-xl hover:bg-yellow-600">
                <XCircle size={14} /> Reject
              </button>
            )}
            <button onClick={onDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 ml-auto">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Listing | null>(null);

  const q = `/admin/listings?page=${page}&limit=20${filter !== "ALL" ? `&status=${filter}` : ""}${search ? `&search=${search}` : ""}`;
  const { data, isLoading, mutate } = useSWR<{ data: Listing[]; total: number; pages: number }>(q, fetcher);

  const updateStatus = async (slug: string, status: string) => {
    try { await api.patch(`/admin/listings/${slug}`, { status }); toast.success("Updated"); mutate(); setSelected(null); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const deleteListing = async (slug: string) => {
    if (!confirm("Delete this listing? All images will be permanently removed.")) return;
    try { await api.delete(`/admin/listings/${slug}`); toast.success("Deleted"); mutate(); setSelected(null); }
    catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-6">
      {selected && (
        <DetailModal
          listing={selected}
          onClose={() => setSelected(null)}
          onApprove={() => updateStatus(selected.slug, "ACTIVE")}
          onReject={() => updateStatus(selected.slug, "REJECTED")}
          onDelete={() => deleteListing(selected.slug)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800">Listings</h1><p className="text-gray-500 text-sm">{data?.total ?? 0} total</p></div>
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
              <tr>{["Property","Dealer","Purpose","City","Price","Status","Date","Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data?.map(l => (
                <tr key={l._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          (typeof l.images?.[0] === "string" ? l.images?.[0] : l.images?.[0]?.url) ||
                          "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=60"
                        }
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="font-medium text-gray-800 max-w-[180px] truncate">{l.title}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.dealerId?.agencyName || "—"}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{l.purpose}</span></td>
                  <td className="px-4 py-3 text-gray-600">{l.city}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium text-xs">{formatPrice(l.price)}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor(l.status)}`}>{l.status}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(l)} title="View Details"
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"><Eye size={15}/></button>
                      <Link href={`/dashboard/listings/${l.slug}/edit`} title="Edit"
                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 inline-flex"><Pencil size={15}/></Link>
                      {l.status !== "ACTIVE" && (
                        <button onClick={() => updateStatus(l.slug, "ACTIVE")} title="Approve"
                          className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"><CheckCircle size={15}/></button>
                      )}
                      {l.status !== "REJECTED" && (
                        <button onClick={() => updateStatus(l.slug, "REJECTED")} title="Reject"
                          className="p-1.5 hover:bg-yellow-50 rounded-lg text-yellow-600"><XCircle size={15}/></button>
                      )}
                      <button onClick={() => deleteListing(l.slug)} title="Delete"
                        className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15}/></button>
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
