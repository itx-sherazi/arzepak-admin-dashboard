"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, X, Upload, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const CITIES = ["Lahore","Karachi","Islamabad","Rawalpindi","Peshawar","Quetta","Multan","Faisalabad","Hyderabad","Sialkot","Gujranwala","Abbottabad"];
const STATUSES = ["BOOKING_OPEN","UNDER_CONSTRUCTION","LAUNCHING_SOON","COMPLETED","SOLD_OUT","DRAFT"];
const AMENITY_OPTIONS = ["Parking","Generator","CCTV","Elevator","Gym","Swimming Pool","Rooftop Café","Sauna","Security","Internet","Gas","Electricity","Water","Maintenance Staff","Concierge"];

async function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const STEPS = ["Basic Info", "Units", "Images", "Features", "Updates"];

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ? decodeURIComponent(params.slug) : "";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  /** Which upload area is active (shows spinner): gallery | fp-0 | payment | upd-0 | img-0 */
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const uploadBusy = uploadingSlot !== null;

  const [basic, setBasic] = useState({
    title: "", city: "Lahore", address: "", developer: "", marketedBy: "",
    description: "", minPrice: "", maxPrice: "", totalUnits: "",
    completionDate: "", status: "BOOKING_OPEN", isFeatured: false,
    offering: [] as string[], offeringInput: "",
    latitude: "", longitude: "",
    mapUrl: "",
    nearbyNote: "",
    contactNumber: "",
  });

  const [nearbyItems, setNearbyItems] = useState<{ label: string; mapsUrl: string }[]>([]);

  const [units, setUnits] = useState<{ name: string; minPrice: string; maxPrice: string; minArea: string; maxArea: string; areaUnit: string; bedrooms: string; bathrooms: string }[]>([]);
  const [logo, setLogo] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [floorPlans, setFloorPlans] = useState<{ label: string; image: string }[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<{ label: string; image: string }[]>([]);
  const [galleries, setGalleries] = useState<{ title: string; images: string[] }[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [features, setFeatures] = useState({
    mainFeatures: [] as string[], plotFeatures: [] as string[],
    businessComm: [] as string[], nearbyFacilities: [] as string[], otherFacilities: [] as string[],
  });
  const [featureInputs, setFeatureInputs] = useState({ mainFeatures: "", plotFeatures: "", businessComm: "", nearbyFacilities: "", otherFacilities: "" });
  const [updates, setUpdates] = useState<{ title: string; content: string; date: string; image: string }[]>([]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ success: boolean; data: Record<string, unknown> }>(
          `/admin/projects/${encodeURIComponent(slug)}`
        );
        if (cancelled || !res.success || !res.data) return;
        const p = res.data;

        setBasic({
          title: String(p.title ?? ""),
          city: String(p.city ?? "Lahore"),
          address: String(p.address ?? ""),
          developer: String(p.developer ?? ""),
          marketedBy: String(p.marketedBy ?? ""),
          description: String(p.description ?? ""),
          minPrice: p.minPrice != null ? String(p.minPrice) : "",
          maxPrice: p.maxPrice != null ? String(p.maxPrice) : "",
          totalUnits: p.totalUnits != null ? String(p.totalUnits) : "",
          completionDate: String(p.completionDate ?? ""),
          status: String(p.status ?? "BOOKING_OPEN"),
          isFeatured: Boolean(p.isFeatured),
          offering: Array.isArray(p.offering) ? (p.offering as string[]) : [],
          offeringInput: "",
          latitude: p.latitude != null ? String(p.latitude) : "",
          longitude: p.longitude != null ? String(p.longitude) : "",
          mapUrl: String(p.mapUrl ?? ""),
          nearbyNote: String(p.nearbyNote ?? ""),
          contactNumber: String(p.contactNumber ?? ""),
        });

        const rawNearby = Array.isArray(p.nearbyItems) ? p.nearbyItems as Record<string, unknown>[] : [];
        setNearbyItems(rawNearby.map((n) => ({
          label: String(n.label ?? ""),
          mapsUrl: typeof n.mapsUrl === "string" ? n.mapsUrl : "",
        })));

        const rawUnits = Array.isArray(p.units) ? p.units as Record<string, unknown>[] : [];
        setUnits(rawUnits.map((u) => ({
          name: String(u.name ?? ""),
          minPrice: u.minPrice != null ? String(u.minPrice) : "",
          maxPrice: u.maxPrice != null ? String(u.maxPrice) : "",
          minArea: u.minArea != null ? String(u.minArea) : "",
          maxArea: u.maxArea != null ? String(u.maxArea) : "",
          areaUnit: String(u.areaUnit ?? "MARLA"),
          bedrooms: u.bedrooms != null ? String(u.bedrooms) : "",
          bathrooms: u.bathrooms != null ? String(u.bathrooms) : "",
        })));

        setLogo(typeof p.logo === "string" ? p.logo : "");
        setImages(Array.isArray(p.images) ? (p.images as string[]) : []);
        setFloorPlans(Array.isArray(p.floorPlans) ? (p.floorPlans as { label: string; image: string }[]) : []);
        setPaymentPlans(Array.isArray(p.paymentPlans) ? (p.paymentPlans as { label: string; image: string }[]) : []);
        setGalleries(Array.isArray(p.galleries) ? (p.galleries as { title: string; images: string[] }[]) : []);

        setAmenities(Array.isArray(p.amenities) ? (p.amenities as string[]) : []);

        const f = p.features as Record<string, string[]> | undefined;
        setFeatures({
          mainFeatures: f?.mainFeatures ?? [],
          plotFeatures: f?.plotFeatures ?? [],
          businessComm: f?.businessComm ?? [],
          nearbyFacilities: f?.nearbyFacilities ?? [],
          otherFacilities: f?.otherFacilities ?? [],
        });

        const rawUpd = Array.isArray(p.updates) ? p.updates as Record<string, unknown>[] : [];
        setUpdates(rawUpd.map((u) => ({
          title: String(u.title ?? ""),
          content: String(u.content ?? ""),
          date: u.date ? new Date(u.date as string).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          image: String(u.image ?? ""),
        })));
      } catch {
        toast.error("Project not found");
        router.push("/dashboard/projects");
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, router]);

  const setB = (k: string, v: unknown) => setBasic(f => ({ ...f, [k]: v }));

  const uploadImages = async (
    files: FileList | null,
    onDone: (urls: string[]) => void,
    opts?: { slot: string; replaceUrl?: string; replaceUrls?: string[] }
  ) => {
    if (!files?.length) return;
    const slot = opts?.slot ?? "upload";
    setUploadingSlot(slot);
    try {
      const b64s = await Promise.all(Array.from(files).map(toBase64));
      const body: Record<string, unknown> = { images: b64s, folder: "propfind/projects" };
      if (opts?.replaceUrls?.length) body.replaceUrls = opts.replaceUrls;
      else if (opts?.replaceUrl) body.replaceUrl = opts.replaceUrl;
      const r = await api.post<{ urls: string[] }>("/upload", body);
      onDone(r.urls);
      toast.success(`${r.urls.length} image(s) uploaded`);
    } catch { toast.error("Upload failed"); }
    setUploadingSlot(null);
  };

  const addUnit = () => setUnits(u => [...u, { name: "", minPrice: "", maxPrice: "", minArea: "", maxArea: "", areaUnit: "MARLA", bedrooms: "", bathrooms: "" }]);
  const updateUnit = (i: number, k: string, v: string) => setUnits(u => u.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const removeUnit = (i: number) => setUnits(u => u.filter((_, idx) => idx !== i));

  const addNearbyRow = () => setNearbyItems((rows) => [...rows, { label: "", mapsUrl: "" }]);
  const updateNearbyRow = (i: number, k: "label" | "mapsUrl", v: string) =>
    setNearbyItems((rows) => rows.map((x, idx) => (idx === i ? { ...x, [k]: v } : x)));
  const removeNearbyRow = (i: number) => setNearbyItems((rows) => rows.filter((_, idx) => idx !== i));

  const addUpdate = () => setUpdates(u => [...u, { title: "", content: "", date: new Date().toISOString().slice(0, 10), image: "" }]);
  const updateUpd = (i: number, k: string, v: string) => setUpdates(u => u.map((x, idx) => idx === i ? { ...x, [k]: v } : x));

  const addToList = (key: keyof typeof features, val: string) => {
    if (!val.trim()) return;
    setFeatures(f => ({ ...f, [key]: [...f[key], val.trim()] }));
    setFeatureInputs(f => ({ ...f, [key]: "" }));
  };
  const removeFromList = (key: keyof typeof features, i: number) => setFeatures(f => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  const addOffering = () => {
    if (!basic.offeringInput.trim()) return;
    setB("offering", [...basic.offering, basic.offeringInput.trim()]);
    setB("offeringInput", "");
  };

  const payloadBody = () => ({
    title: basic.title, city: basic.city, address: basic.address,
    developer: basic.developer, marketedBy: basic.marketedBy,
    description: basic.description,
    minPrice: basic.minPrice ? Number(basic.minPrice) : undefined,
    maxPrice: basic.maxPrice ? Number(basic.maxPrice) : undefined,
    totalUnits: basic.totalUnits ? Number(basic.totalUnits) : undefined,
    completionDate: basic.completionDate, status: basic.status,
    isFeatured: basic.isFeatured,
    offering: basic.offering,
    latitude: basic.latitude ? Number(basic.latitude) : undefined,
    longitude: basic.longitude ? Number(basic.longitude) : undefined,
    mapUrl: basic.mapUrl.trim() || null,
    nearbyNote: basic.nearbyNote.trim() || null,
    contactNumber: basic.contactNumber.trim() || null,
    nearbyItems: nearbyItems
      .filter((n) => n.label.trim())
      .map((n) => ({
        label: n.label.trim(),
        ...(n.mapsUrl.trim() ? { mapsUrl: n.mapsUrl.trim() } : {}),
      })),
    units: units.map(u => ({
      name: u.name,
      minPrice: u.minPrice ? Number(u.minPrice) : undefined,
      maxPrice: u.maxPrice ? Number(u.maxPrice) : undefined,
      minArea: u.minArea ? Number(u.minArea) : undefined,
      maxArea: u.maxArea ? Number(u.maxArea) : undefined,
      areaUnit: u.areaUnit,
      bedrooms: u.bedrooms ? Number(u.bedrooms) : undefined,
      bathrooms: u.bathrooms ? Number(u.bathrooms) : undefined,
    })),
    logo: logo || null, images, floorPlans, paymentPlans,
    galleries: galleries.filter(g => g.title.trim()),
    amenities, features,
    updates: updates.map(u => ({ ...u, date: u.date || new Date() })),
  });

  const submit = async () => {
    if (!basic.title || !basic.city || !basic.address) return toast.error("Title, city and address are required");
    if (!slug) return;
    setLoading(true);
    try {
      await api.put(`/admin/projects/${encodeURIComponent(slug)}`, payloadBody());
      toast.success("Project updated!");
      router.push("/dashboard/projects");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    setLoading(false);
  };

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
  const lbl = "block text-sm font-medium text-gray-700 mb-1.5";

  if (initializing) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading project…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Project</h1>
          <p className="text-gray-500 text-sm">Slug: <span className="font-mono text-xs text-gray-600">{slug}</span></p>
        </div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div className="flex gap-0 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s} type="button" onClick={() => setStep(i)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${i === step ? "bg-green-600 text-white" : i < step ? "text-green-600" : "text-gray-400"}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className={lbl}>Project Title *</label><input className={inp} value={basic.title} onChange={e => setB("title", e.target.value)} placeholder="Swiss Mall Gulberg" /></div>
              <div><label className={lbl}>City *</label><select className={inp} value={basic.city} onChange={e => setB("city", e.target.value)}>{CITIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className={lbl}>Status</label><select className={inp} value={basic.status} onChange={e => setB("status", e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
              <div className="sm:col-span-2"><label className={lbl}>Address *</label><input className={inp} value={basic.address} onChange={e => setB("address", e.target.value)} placeholder="MM Alam Road, Block C2, Gulberg, Lahore" /></div>
              <div><label className={lbl}>Developer</label><input className={inp} value={basic.developer} onChange={e => setB("developer", e.target.value)} placeholder="ZSK Associates" /></div>
              <div><label className={lbl}>Marketed By</label><input className={inp} value={basic.marketedBy} onChange={e => setB("marketedBy", e.target.value)} placeholder="arzepak.com" /></div>
              <div><label className={lbl}>Min Price (PKR)</label><input type="number" className={inp} value={basic.minPrice} onChange={e => setB("minPrice", e.target.value)} placeholder="12100000" /></div>
              <div><label className={lbl}>Max Price (PKR)</label><input type="number" className={inp} value={basic.maxPrice} onChange={e => setB("maxPrice", e.target.value)} placeholder="317800000" /></div>
              <div><label className={lbl}>Total Units</label><input type="number" className={inp} value={basic.totalUnits} onChange={e => setB("totalUnits", e.target.value)} /></div>
              <div><label className={lbl}>Expected Completion</label><input className={inp} value={basic.completionDate} onChange={e => setB("completionDate", e.target.value)} placeholder="Q4 2026" /></div>
              <div className="sm:col-span-2">
                <label className={lbl}>Project Location (click map to set exact pin)</label>
                <MapPicker
                  lat={basic.latitude ? Number(basic.latitude) : undefined}
                  lng={basic.longitude ? Number(basic.longitude) : undefined}
                  onChange={(lat, lng) => { setB("latitude", String(lat)); setB("longitude", String(lng)); }}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Google Maps Embed URL / Link (Optional)</label>
                <input className={inp} value={basic.mapUrl} onChange={e => setB("mapUrl", e.target.value)} placeholder='Paste full <iframe...> code or map URL' />
              </div>
              <div className="sm:col-span-2">
                <label className={lbl}>Contact Number (WhatsApp & Call)</label>
                <input className={inp} value={basic.contactNumber} onChange={e => setB("contactNumber", e.target.value)} placeholder="+923001234567" />
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-800">Nearby (Location tab)</h3>
              <p className="text-xs text-gray-500">Shown on the public project page under <strong>Location &amp; Nearby → Nearby</strong>. Leave rows empty to use default categories.</p>
              <div>
                <label className={lbl}>Intro text (optional)</label>
                <textarea rows={2} className={`${inp} resize-none`} value={basic.nearbyNote} onChange={e => setB("nearbyNote", e.target.value)}
                  placeholder="Explore schools, hospitals, parks, and markets around this project on Google Maps." />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Quick links</span>
                <button type="button" onClick={addNearbyRow} className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700">
                  <Plus size={14} /> Add row
                </button>
              </div>
              {nearbyItems.length === 0 && (
                <p className="text-xs text-gray-400">No custom rows — site will show default nearby categories.</p>
              )}
              {nearbyItems.map((row, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end border border-gray-200 rounded-lg p-3 bg-white">
                  <div>
                    <label className={lbl}>Label</label>
                    <input className={inp} value={row.label} onChange={e => updateNearbyRow(i, "label", e.target.value)} placeholder="Schools" />
                  </div>
                  <div>
                    <label className={lbl}>Maps URL (optional)</label>
                    <input className={inp} value={row.mapsUrl} onChange={e => updateNearbyRow(i, "mapsUrl", e.target.value)}
                      placeholder="Leave empty to search by label + address" />
                  </div>
                  <button type="button" onClick={() => removeNearbyRow(i)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg self-end justify-self-end" aria-label="Remove"><X size={18} /></button>
                </div>
              ))}
            </div>

            <div>
              <label className={lbl}>Offering (e.g. Flats, Shops)</label>
              <div className="flex gap-2 mb-2">
                <input className={`${inp} flex-1`} value={basic.offeringInput} onChange={e => setB("offeringInput", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addOffering())} placeholder="Type and press Enter" />
                <button type="button" onClick={addOffering} className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold"><Plus size={15} /></button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {basic.offering.map((o, i) => (
                  <span key={i} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">
                    {o} <button type="button" onClick={() => setB("offering", basic.offering.filter((_, idx) => idx !== i))}><X size={11} /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className={lbl}>Description</label>
              <textarea rows={6} className={`${inp} resize-none`} value={basic.description} onChange={e => setB("description", e.target.value)} placeholder="Full project description..." />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={basic.isFeatured} onChange={e => setB("isFeatured", e.target.checked)} className="accent-green-600 w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">Mark as Featured Project</span>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Unit Types</h2>
              <button type="button" onClick={addUnit} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">
                <Plus size={15} /> Add Unit Type
              </button>
            </div>
            {units.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                No units added yet. Click &quot;Add Unit Type&quot; to start.
              </div>
            )}
            {units.map((u, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Unit Type {i + 1}</span>
                  <button type="button" onClick={() => removeUnit(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3"><label className={lbl}>Unit Name</label><input className={inp} value={u.name} onChange={e => updateUnit(i, "name", e.target.value)} placeholder="Studio Apartments" /></div>
                  <div><label className={lbl}>Min Price</label><input type="number" className={inp} value={u.minPrice} onChange={e => updateUnit(i, "minPrice", e.target.value)} /></div>
                  <div><label className={lbl}>Max Price</label><input type="number" className={inp} value={u.maxPrice} onChange={e => updateUnit(i, "maxPrice", e.target.value)} /></div>
                  <div><label className={lbl}>Area Unit</label><select className={inp} value={u.areaUnit} onChange={e => updateUnit(i, "areaUnit", e.target.value)}><option>MARLA</option><option>KANAL</option><option>SQFT</option><option>SQYD</option></select></div>
                  <div><label className={lbl}>Min Area</label><input type="number" step="0.01" className={inp} value={u.minArea} onChange={e => updateUnit(i, "minArea", e.target.value)} /></div>
                  <div><label className={lbl}>Max Area</label><input type="number" step="0.01" className={inp} value={u.maxArea} onChange={e => updateUnit(i, "maxArea", e.target.value)} /></div>
                  <div><label className={lbl}>Bedrooms</label><input type="number" className={inp} value={u.bedrooms} onChange={e => updateUnit(i, "bedrooms", e.target.value)} /></div>
                  <div><label className={lbl}>Bathrooms</label><input type="number" className={inp} value={u.bathrooms} onChange={e => updateUnit(i, "bathrooms", e.target.value)} /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="font-bold text-gray-800">Images & Documents</h2>

            {/* Project Logo */}
            <div>
              <label className={lbl}>Project Logo (optional)</label>
              {logo
                ? <div className="relative w-24 h-24">
                    {uploadingSlot === "logo" && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/85">
                        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                      </div>
                    )}
                    <label className="block h-full w-full cursor-pointer">
                      <img src={logo} alt="" className="w-full h-full object-contain rounded-xl border border-gray-200 bg-gray-50" />
                      <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                        onChange={e => { const f = e.target.files; e.target.value = ""; uploadImages(f, urls => setLogo(urls[0]), { slot: "logo", replaceUrl: logo }); }} />
                    </label>
                    <button type="button" onClick={() => setLogo("")} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-[5]"><X size={10} /></button>
                  </div>
                : <label className={`inline-flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-400 relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingSlot === "logo" && <Loader2 className="h-5 w-5 animate-spin text-green-600 absolute" />}
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Upload logo</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                      onChange={e => { uploadImages(e.target.files, urls => setLogo(urls[0]), { slot: "logo" }); e.target.value = ""; }} />
                  </label>}
            </div>

            <div>
              <label className={lbl}>Project Images (up to 20)</label>
              <div className="relative">
                {uploadingSlot === "gallery" && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/85 border border-green-100">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    <span className="mt-2 text-sm font-medium text-gray-600">Uploading images…</span>
                  </div>
                )}
                <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-400 transition-colors ${uploadBusy ? "pointer-events-none opacity-50" : ""}`}>
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Click to add more images</span>
                  <input type="file" multiple accept="image/*" className="hidden" disabled={uploadBusy}
                    onChange={e => { uploadImages(e.target.files, urls => setImages(im => [...im, ...urls]), { slot: "gallery" }); e.target.value = ""; }} />
                </label>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                      {uploadingSlot === `img-${i}` && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50">
                          <Loader2 className="h-7 w-7 animate-spin text-white" />
                          <span className="text-[10px] text-white mt-1">Uploading…</span>
                        </div>
                      )}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between items-center gap-0.5 p-1 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="text-[10px] text-white font-semibold cursor-pointer px-1 rounded bg-white/20 hover:bg-white/30">
                          Replace
                          <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                            onChange={e => {
                              const f = e.target.files;
                              e.target.value = "";
                              uploadImages(f, urls => setImages(im => im.map((x, idx) => (idx === i ? urls[0] : x))), { slot: `img-${i}`, replaceUrl: img });
                            }} />
                        </label>
                        <button type="button" onClick={() => setImages(im => im.filter((_, idx) => idx !== i))}
                          className="bg-red-500 text-white rounded px-1.5 py-0.5 text-[10px] font-semibold">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={lbl}>Floor Plans</label>
              <div className="space-y-2 mb-3">
                {floorPlans.map((fp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={`${inp} flex-1`} placeholder="Label e.g. Ground Floor" value={fp.label}
                      onChange={e => setFloorPlans(f => f.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                    {fp.image
                      ? <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                          {uploadingSlot === `fp-${i}` && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                            </div>
                          )}
                          <label className="block h-full w-full cursor-pointer">
                            <img src={fp.image} alt="" className="w-full h-full object-cover" />
                            <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                              onChange={e => {
                                const f = e.target.files;
                                e.target.value = "";
                                uploadImages(f, urls => setFloorPlans(prev => prev.map((x, idx) => idx === i ? { ...x, image: urls[0] } : x)), { slot: `fp-${i}`, replaceUrl: fp.image });
                              }} />
                          </label>
                          <button type="button" onClick={() => setFloorPlans(f => f.map((x, idx) => idx === i ? { ...x, image: "" } : x))}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 z-[5]"><X size={10} /></button>
                        </div>
                      : <label className={`w-12 h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-400 shrink-0 relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                          {uploadingSlot === `fp-${i}` && <Loader2 className="h-5 w-5 animate-spin text-green-600 absolute" />}
                          <Upload size={14} className="text-gray-400" />
                          <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                            onChange={e => { uploadImages(e.target.files, urls => setFloorPlans(f => f.map((x, idx) => idx === i ? { ...x, image: urls[0] } : x)), { slot: `fp-${i}` }); e.target.value = ""; }} />
                        </label>}
                    <button type="button" onClick={() => setFloorPlans(f => f.filter((_, idx) => idx !== i))} className="text-red-400"><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setFloorPlans(f => [...f, { label: "", image: "" }])}
                className="flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:underline">
                <Plus size={14} /> Add Floor Plan
              </button>
            </div>

            <div>
              <label className={lbl}>Payment Plans</label>
              <div className="space-y-2 mb-3">
                {paymentPlans.map((pp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={`${inp} flex-1`} placeholder="Label e.g. 3-Year Plan" value={pp.label}
                      onChange={e => setPaymentPlans(f => f.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                    {pp.image
                      ? <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                          {uploadingSlot === `pp-${i}` && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                              <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                            </div>
                          )}
                          <label className="block h-full w-full cursor-pointer">
                            <img src={pp.image} alt="" className="w-full h-full object-cover" />
                            <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                              onChange={e => {
                                const f = e.target.files;
                                e.target.value = "";
                                uploadImages(f, urls => setPaymentPlans(prev => prev.map((x, idx) => idx === i ? { ...x, image: urls[0] } : x)), { slot: `pp-${i}`, replaceUrl: pp.image });
                              }} />
                          </label>
                          <button type="button" onClick={() => setPaymentPlans(f => f.map((x, idx) => idx === i ? { ...x, image: "" } : x))}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-0.5 z-[5]"><X size={10} /></button>
                        </div>
                      : <label className={`w-12 h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-400 shrink-0 relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                          {uploadingSlot === `pp-${i}` && <Loader2 className="h-5 w-5 animate-spin text-green-600 absolute" />}
                          <Upload size={14} className="text-gray-400" />
                          <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                            onChange={e => { uploadImages(e.target.files, urls => setPaymentPlans(f => f.map((x, idx) => idx === i ? { ...x, image: urls[0] } : x)), { slot: `pp-${i}` }); e.target.value = ""; }} />
                        </label>}
                    <button type="button" onClick={() => setPaymentPlans(f => f.filter((_, idx) => idx !== i))} className="text-red-400"><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setPaymentPlans(f => [...f, { label: "", image: "" }])}
                className="flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:underline">
                <Plus size={14} /> Add Payment Plan
              </button>
            </div>

            {/* ── Galleries ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className={lbl}>Project Galleries</label>
                  <p className="text-xs text-gray-400 -mt-1">Named galleries e.g. Gym, Pool, Rooms</p>
                </div>
                <button type="button" onClick={() => setGalleries(g => [...g, { title: "", images: [] }])}
                  className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold">
                  <Plus size={13} /> Add Gallery
                </button>
              </div>

              {galleries.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl py-6 text-center text-sm text-gray-400">
                  No galleries yet. Click &quot;Add Gallery&quot; to create one.
                </div>
              )}

              <div className="space-y-4">
                {galleries.map((g, gi) => (
                  <div key={gi} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/40">
                    <div className="flex items-center gap-2">
                      <input className={`${inp} flex-1`} placeholder="Gallery title e.g. Swimming Pool, Gym, Kids Area"
                        value={g.title} onChange={e => setGalleries(prev => prev.map((x, idx) => idx === gi ? { ...x, title: e.target.value } : x))} />
                      <button type="button" onClick={() => setGalleries(prev => prev.filter((_, idx) => idx !== gi))}
                        className="text-red-400 hover:text-red-600 p-1"><X size={16} /></button>
                    </div>

                    {g.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {g.images.map((img, ii) => (
                          <div key={ii} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100">
                            {uploadingSlot === `gal-${gi}-${ii}` && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                              </div>
                            )}
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button type="button"
                              onClick={() => setGalleries(prev => prev.map((x, idx) => idx === gi ? { ...x, images: x.images.filter((_, ii2) => ii2 !== ii) } : x))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-green-400 transition-colors relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingSlot === `gal-${gi}` && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 z-10">
                          <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                        </div>
                      )}
                      <Upload size={15} className="text-gray-400" />
                      <span className="text-sm text-gray-500">Upload images for this gallery</span>
                      <input type="file" multiple accept="image/*" className="hidden" disabled={uploadBusy}
                        onChange={e => {
                          uploadImages(e.target.files, urls => setGalleries(prev => prev.map((x, idx) => idx === gi ? { ...x, images: [...x.images, ...urls] } : x)), { slot: `gal-${gi}` });
                          e.target.value = "";
                        }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-bold text-gray-800">Amenities & Features</h2>

            <div>
              <label className={lbl}>Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {AMENITY_OPTIONS.map(a => (
                  <label key={a} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={amenities.includes(a)} className="accent-green-600"
                      onChange={e => setAmenities(am => e.target.checked ? [...am, a] : am.filter(x => x !== a))} />
                    {a}
                  </label>
                ))}
              </div>
            </div>

            {(["mainFeatures","plotFeatures","businessComm","nearbyFacilities","otherFacilities"] as const).map(key => {
              const labels: Record<string, string> = { mainFeatures: "Main Features", plotFeatures: "Plot Features", businessComm: "Business & Communication", nearbyFacilities: "Nearby Facilities", otherFacilities: "Other Facilities" };
              return (
                <div key={key}>
                  <label className={lbl}>{labels[key]}</label>
                  <div className="flex gap-2 mb-2">
                    <input className={`${inp} flex-1`} value={featureInputs[key]} onChange={e => setFeatureInputs(f => ({ ...f, [key]: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addToList(key, featureInputs[key]))}
                      placeholder="Type and press Enter" />
                    <button type="button" onClick={() => addToList(key, featureInputs[key])} className="px-3 bg-green-600 text-white rounded-xl"><Plus size={14} /></button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {features[key].map((f, i) => (
                      <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs">
                        {f} <button type="button" onClick={() => removeFromList(key, i)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Construction Updates</h2>
              <button type="button" onClick={addUpdate} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">
                <Plus size={15} /> Add Update
              </button>
            </div>
            {updates.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                No updates yet.
              </div>
            )}
            {updates.map((u, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Update {i + 1}</span>
                  <button type="button" onClick={() => setUpdates(u => u.filter((_, idx) => idx !== i))} className="text-red-400"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Title</label><input className={inp} value={u.title} onChange={e => updateUpd(i, "title", e.target.value)} placeholder="Construction Update - Mar 2026" /></div>
                  <div><label className={lbl}>Date</label><input type="date" className={inp} value={u.date} onChange={e => updateUpd(i, "date", e.target.value)} /></div>
                  <div className="col-span-2"><label className={lbl}>Content</label><textarea rows={3} className={`${inp} resize-none`} value={u.content} onChange={e => updateUpd(i, "content", e.target.value)} /></div>
                  <div className="col-span-2">
                    <label className={lbl}>Image</label>
                    {u.image
                      ? <div className="relative w-full max-w-xs">
                          {uploadingSlot === `upd-${i}` && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/85">
                              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                              <span className="text-xs text-gray-600 mt-1">Uploading…</span>
                            </div>
                          )}
                          <label className="block cursor-pointer">
                            <img src={u.image} alt="" className="rounded-xl border border-gray-200 w-full" />
                            <span className="mt-1 inline-block text-xs font-semibold text-green-600">Click to replace</span>
                            <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                              onChange={e => {
                                const f = e.target.files;
                                e.target.value = "";
                                uploadImages(f, urls => updateUpd(i, "image", urls[0]), { slot: `upd-${i}`, replaceUrl: u.image });
                              }} />
                          </label>
                          <button type="button" onClick={() => updateUpd(i, "image", "")} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-[5]"><X size={12} /></button>
                        </div>
                      : <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-green-400 max-w-xs relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                          {uploadingSlot === `upd-${i}` && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
                            </div>
                          )}
                          <Upload size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-500">Upload image</span>
                          <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                            onChange={e => { uploadImages(e.target.files, urls => updateUpd(i, "image", urls[0]), { slot: `upd-${i}` }); e.target.value = ""; }} />
                        </label>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button type="button" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          <ChevronLeft size={15} /> Previous
        </button>
        {step < STEPS.length - 1
          ? <button type="button" onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">
              Next <ChevronRight size={15} />
            </button>
          : <button type="button" onClick={submit} disabled={loading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {loading ? "Saving…" : "Save changes"}
            </button>}
      </div>
    </div>
  );
}
