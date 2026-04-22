"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Upload, X, RefreshCw, ArrowLeft } from "lucide-react";

type ImageRef = { url: string; publicId?: string };

interface PropertyData {
  slug: string; title: string; description: string;
  purpose: string; type: string; city: string; areaName: string; address: string;
  area: number; areaUnit: string; bedrooms?: number; bathrooms?: number;
  floors?: number; furnishing?: string; buildYear?: number;
  price: number; amenities: string[]; images: Array<string | ImageRef>;
  status: string; isFeatured: boolean; isSponsored: boolean;
}

const BASE = process.env.NEXT_PUBLIC_API_URL!;
const CITIES = ["Lahore","Karachi","Islamabad","Rawalpindi","Faisalabad","Multan","Peshawar","Quetta","Sialkot","Gujranwala"];
const AMENITIES = ["Parking","Generator","CCTV","Gas","Electricity","Water Supply","Gym","Swimming Pool","Internet","Security Guard","Elevator","Central Cooling","Central Heating","Servant Quarters","Garden"];
const STATUSES = ["PENDING","ACTIVE","REJECTED","EXPIRED","SOLD","RENTED"];

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AdminEditListingPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replacingIdx, setReplacingIdx] = useState<Record<number, boolean>>({});
  const [addingImages, setAddingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    purpose: "SALE", type: "HOUSE", city: "Lahore", areaName: "", address: "",
    title: "", description: "", area: "", areaUnit: "MARLA",
    bedrooms: "", bathrooms: "", floors: "", furnishing: "UNFURNISHED", buildYear: "",
    amenities: [] as string[], images: [] as ImageRef[], price: "",
    status: "ACTIVE", isFeatured: false, isSponsored: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE}/properties/${slug}`, { credentials: "include" });
        const json = await res.json();
        const p: PropertyData = json.data;
        const normalizedImages: ImageRef[] = (p.images || []).map((img) =>
          typeof img === "string" ? { url: img } : img
        ).filter((x): x is ImageRef => Boolean(x?.url));
        setForm({
          purpose: p.purpose || "SALE",
          type: p.type || "HOUSE",
          city: p.city || "Lahore",
          areaName: p.areaName || "",
          address: p.address || "",
          title: p.title || "",
          description: p.description || "",
          area: String(p.area || ""),
          areaUnit: p.areaUnit || "MARLA",
          bedrooms: p.bedrooms != null ? String(p.bedrooms) : "",
          bathrooms: p.bathrooms != null ? String(p.bathrooms) : "",
          floors: p.floors != null ? String(p.floors) : "",
          furnishing: p.furnishing || "UNFURNISHED",
          buildYear: p.buildYear != null ? String(p.buildYear) : "",
          amenities: p.amenities || [],
          images: normalizedImages,
          price: String(p.price || ""),
          status: p.status || "ACTIVE",
          isFeatured: p.isFeatured || false,
          isSponsored: p.isSponsored || false,
        });
      } catch { toast.error("Failed to load property"); }
      setLoading(false);
    })();
  }, [slug]);

  const s = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const toggleAmenity = (a: string) => s("amenities", form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a]);

  const removeImage = (idx: number) => {
    s("images", form.images.filter((_, i) => i !== idx));
  };

  const replaceImage = async (idx: number, file: File) => {
    setReplacingIdx(r => ({ ...r, [idx]: true }));
    try {
      const b64 = await toBase64(file);
      const res = await api.post<{ urls: string[]; images: ImageRef[] }>("/upload", { images: [b64], folder: "arzepak/properties" });
      const newImg = res.images?.[0];
      if (!newImg?.url) throw new Error("Upload failed");
      setForm(f => {
        const imgs = [...f.images];
        imgs[idx] = newImg;
        return { ...f, images: imgs };
      });
      toast.success("Image replaced");
    } catch { toast.error("Replace failed"); }
    setReplacingIdx(r => ({ ...r, [idx]: false }));
  };

  const addImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (form.images.length + files.length > 20) return toast.error("Max 20 images");
    setAddingImages(true);
    try {
      const b64s = await Promise.all(files.map(toBase64));
      const res = await api.post<{ urls: string[]; images: ImageRef[] }>("/upload", { images: b64s, folder: "arzepak/properties" });
      s("images", [...form.images, ...(res.images || []).filter(Boolean)]);
      toast.success(`${files.length} image(s) added`);
    } catch { toast.error("Upload failed"); }
    setAddingImages(false);
    e.target.value = "";
  };

  const save = async () => {
    if (!form.title || !form.price || !form.areaName) return toast.error("Title, price and area name are required");
    setSaving(true);
    try {
      await api.put(`/admin/listings/${slug}`, {
        ...form,
        area: Number(form.area),
        price: Number(form.price),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        floors: form.floors ? Number(form.floors) : undefined,
        buildYear: form.buildYear ? Number(form.buildYear) : undefined,
      });
      toast.success("Property updated!");
      router.push("/dashboard/listings");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    setSaving(false);
  };

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
  const lbl = "block text-sm font-medium text-gray-700 mb-1.5";

  if (loading) return (
    <div className="flex justify-center items-center min-h-64">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Property</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{slug}</p>
        </div>
      </div>

      {/* Admin-only controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wide text-green-600">Admin Controls</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Status</label>
            <select value={form.status} onChange={e => s("status", e.target.value)} className={inp}>
              {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          <div className="flex gap-6 items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={e => s("isFeatured", e.target.checked)} className="w-4 h-4 accent-green-600" />
              <span className="text-sm text-gray-700">Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isSponsored} onChange={e => s("isSponsored", e.target.checked)} className="w-4 h-4 accent-green-600" />
              <span className="text-sm text-gray-700">Sponsored</span>
            </label>
          </div>
        </div>
      </div>

      {/* Purpose & Type */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-sm uppercase tracking-wide text-green-600">Purpose & Type</h2>
        <div><label className={lbl}>Purpose</label>
          <div className="flex gap-3">
            {["SALE","RENT"].map(p => <button key={p} onClick={() => s("purpose",p)} className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.purpose===p?"border-green-600 bg-green-50 text-green-700":"border-gray-200 text-gray-500"}`}>{p==="SALE"?"For Sale":"For Rent"}</button>)}
          </div>
        </div>
        <div><label className={lbl}>Property Type</label>
          <div className="grid grid-cols-3 gap-2">
            {["HOUSE","APARTMENT","PLOT","COMMERCIAL","FARMHOUSE","ROOM"].map(t => <button key={t} onClick={() => s("type",t)} className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${form.type===t?"border-green-600 bg-green-50 text-green-700":"border-gray-200 text-gray-500"}`}>{t}</button>)}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wide text-green-600">Location</h2>
        <div><label className={lbl}>City</label><select value={form.city} onChange={e => s("city",e.target.value)} className={inp}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><label className={lbl}>Area / Society *</label><input type="text" value={form.areaName} onChange={e => s("areaName",e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Street Address</label><input type="text" value={form.address} onChange={e => s("address",e.target.value)} className={inp} /></div>
      </div>

      {/* Property Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wide text-green-600">Property Details</h2>
        <div><label className={lbl}>Title *</label><input type="text" value={form.title} onChange={e => s("title",e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Description *</label><textarea rows={4} value={form.description} onChange={e => s("description",e.target.value)} className={`${inp} resize-none`} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={lbl}>Area Size</label><input type="number" value={form.area} onChange={e => s("area",e.target.value)} className={inp} /></div>
          <div><label className={lbl}>Unit</label><select value={form.areaUnit} onChange={e => s("areaUnit",e.target.value)} className={inp}>{["MARLA","KANAL","SQFT","SQYD"].map(u=><option key={u}>{u}</option>)}</select></div>
        </div>
        {form.type !== "PLOT" && (
          <>
            <div className="grid grid-cols-3 gap-4">
              {[{l:"Beds",k:"bedrooms"},{l:"Baths",k:"bathrooms"},{l:"Floors",k:"floors"}].map(f=>(
                <div key={f.k}><label className={lbl}>{f.l}</label><input type="number" value={form[f.k as keyof typeof form] as string} onChange={e => s(f.k,e.target.value)} className={inp} /></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Furnishing</label><select value={form.furnishing} onChange={e => s("furnishing",e.target.value)} className={inp}>{["UNFURNISHED","SEMI_FURNISHED","FURNISHED"].map(f=><option key={f} value={f}>{f.replace(/_/g," ")}</option>)}</select></div>
              <div><label className={lbl}>Build Year</label><input type="number" value={form.buildYear} onChange={e => s("buildYear",e.target.value)} className={inp} /></div>
            </div>
          </>
        )}
        <div><label className={lbl}>Price (PKR) *</label><input type="number" value={form.price} onChange={e => s("price",e.target.value)} className={inp} /></div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wide text-green-600">Photos ({form.images.length}/20)</h2>
        <p className="text-xs text-gray-400">Hover an image to replace or remove it. Removed images are deleted from storage on save.</p>
        {form.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {form.images.map((img, i) => (
              <div key={`${img.publicId || img.url}-${i}`} className="relative group aspect-square">
                <img src={img.url} alt="" className="w-full h-full object-cover rounded-xl" />
                <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) replaceImage(i, f); e.target.value = ""; }} />
                    <div className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
                      {replacingIdx[i] ? <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /> : <RefreshCw size={13} className="text-gray-700" />}
                    </div>
                  </label>
                  <button onClick={() => removeImage(i)} className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600">
                    <X size={13} className="text-white" />
                  </button>
                </div>
                <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded text-[10px]">{i+1}</div>
              </div>
            ))}
          </div>
        )}
        {form.images.length < 20 && (
          <label className={`${inp} flex items-center justify-center gap-2 py-5 border-dashed cursor-pointer hover:bg-gray-50`}>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={addImages} disabled={addingImages} />
            {addingImages
              ? <span className="text-green-600 text-sm flex items-center gap-2"><div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />Uploading...</span>
              : <span className="text-gray-400 text-sm flex items-center gap-2"><Upload size={16} />Add photos</span>}
          </label>
        )}
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-sm uppercase tracking-wide text-green-600">Amenities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AMENITIES.map(a => <button key={a} onClick={() => toggleAmenity(a)} className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all text-left ${form.amenities.includes(a)?"border-green-500 bg-green-50 text-green-700":"border-gray-200 text-gray-500"}`}>{form.amenities.includes(a)?"✓ ":""}{a}</button>)}
        </div>
      </div>

      {/* Save */}
      <div className="flex gap-3 pb-8">
        <button onClick={() => router.back()} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl text-sm font-semibold">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
