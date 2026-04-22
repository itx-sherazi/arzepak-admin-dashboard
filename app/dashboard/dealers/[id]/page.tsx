"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { ChevronLeft, CheckCircle, XCircle, Ban, User, Building2, MapPin, FileText, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserRef {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

interface DealerFull {
  _id: string;
  userId: UserRef | string;
  agencyName?: string;
  cnic?: string;
  bio?: string;
  whatsapp?: string;
  city?: string;
  areasServed?: string[];
  logo?: string;
  experience?: number;
  isVerified: boolean;
  status: string;
  package: string;
  packageExpiry?: string;
  totalListings?: number;
  totalLeads?: number;
  createdAt: string;
}

interface ListingMini {
  _id: string;
  title: string;
  slug: string;
  status: string;
  city?: string;
  createdAt: string;
}

export default function DealerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ? decodeURIComponent(params.id) : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dealer, setDealer] = useState<DealerFull | null>(null);
  const [listings, setListings] = useState<ListingMini[]>([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: { dealer: DealerFull; listings: ListingMini[] } }>(
        `/admin/dealers/${encodeURIComponent(id)}`
      );
      if (!res.success || !res.data?.dealer) {
        toast.error("Dealer not found");
        router.push("/dashboard/dealers");
        return;
      }
      setDealer(res.data.dealer);
      setListings(res.data.listings || []);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
      router.push("/dashboard/dealers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const user = dealer?.userId && typeof dealer.userId === "object" ? dealer.userId : null;

  const patchStatus = async (status: string) => {
    if (!dealer) return;
    const msg =
      status === "ACTIVE"
        ? "Verify this dealer and activate their account?"
        : status === "REJECTED"
          ? "Reject this dealer application?"
          : "Change dealer status?";
    if (!confirm(msg)) return;
    setSaving(true);
    try {
      await api.patch(`/admin/dealers/${dealer._id}`, { status });
      toast.success(status === "ACTIVE" ? "Dealer verified & active" : "Updated");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setSaving(false);
  };

  if (loading || !dealer) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/dealers"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-2"
          >
            <ChevronLeft size={16} /> Back to dealers
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
            <Building2 className="text-emerald-600" size={26} />
            {dealer.agencyName || "Dealer profile"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Submitted {formatDate(dealer.createdAt)} ·{" "}
            <span
              className={`font-semibold ${
                dealer.status === "ACTIVE"
                  ? "text-green-600"
                  : dealer.status === "PENDING"
                    ? "text-amber-600"
                    : "text-red-600"
              }`}
            >
              {dealer.status}
            </span>
            {dealer.isVerified && <span className="text-green-600"> · Verified</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dealer.status !== "ACTIVE" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => patchStatus("ACTIVE")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle size={18} /> Verify & activate
            </button>
          )}
          {dealer.status !== "REJECTED" && dealer.status !== "ACTIVE" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => patchStatus("REJECTED")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle size={18} /> Reject
            </button>
          )}
          {dealer.status === "ACTIVE" && (
            <button
              type="button"
              disabled={saving}
              onClick={() => patchStatus("SUSPENDED")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-200 text-amber-800 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50"
            >
              <Ban size={18} /> Suspend
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <User size={18} className="text-gray-400" /> Account owner
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Name</dt>
              <dd className="font-medium text-gray-900">{user?.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Email</dt>
              <dd className="font-medium text-gray-900">{user?.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Phone</dt>
              <dd className="font-medium text-gray-900">{user?.phone || "—"}</dd>
            </div>
            {user?.createdAt && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide">User since</dt>
                <dd className="text-gray-700">{formatDate(user.createdAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={18} className="text-gray-400" /> Business
          </h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">City</dt>
              <dd className="font-medium text-gray-900">{dealer.city || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">WhatsApp</dt>
              <dd className="font-medium text-gray-900">{dealer.whatsapp || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">CNIC</dt>
              <dd className="font-medium text-gray-900 font-mono">{dealer.cnic || "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Experience (years)</dt>
              <dd className="text-gray-900">{dealer.experience ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Package</dt>
              <dd>
                <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{dealer.package}</span>
              </dd>
            </div>
            {dealer.areasServed && dealer.areasServed.length > 0 && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide">Areas served</dt>
                <dd className="text-gray-800">{dealer.areasServed.join(", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {dealer.bio && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <FileText size={18} className="text-gray-400" /> Bio
          </h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{dealer.bio}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <ImageIcon size={18} className="text-gray-400" /> Agency logo
        </h2>
        <div className="text-sm">
          {dealer.logo ? (
            <a href={dealer.logo} target="_blank" rel="noopener noreferrer" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dealer.logo} alt="Logo" className="h-20 w-20 object-contain rounded-lg border border-gray-100 bg-gray-50" />
            </a>
          ) : (
            <span className="text-gray-400">No logo uploaded</span>
          )}
        </div>
      </div>

      {listings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-3">Recent listings ({listings.length})</h2>
          <ul className="divide-y divide-gray-50">
            {listings.slice(0, 8).map((l) => (
              <li key={l._id} className="py-2 flex justify-between gap-2 text-sm">
                <span className="font-medium text-gray-800 truncate">{l.title}</span>
                <span className="text-xs text-gray-500 shrink-0">{l.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
