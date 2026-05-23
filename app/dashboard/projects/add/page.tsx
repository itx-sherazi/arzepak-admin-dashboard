"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function AddProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const uploadBusy = uploadingSlot !== null;

  // Basic info
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

  /** Nearby tab rows (project detail page → Location & Nearby → Nearby) */
  const [nearbyItems, setNearbyItems] = useState<{ label: string; mapsUrl: string }[]>([]);

  // Units
  const [units, setUnits] = useState<{ name: string; minPrice: string; maxPrice: string; minArea: string; maxArea: string; areaUnit: string; bedrooms: string; bathrooms: string }[]>([]);

  // Images
  const [logo, setLogo] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [floorPlans, setFloorPlans] = useState<{ label: string; image: string }[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<{ label: string; images: string[] }[]>([]);
  const [bookingForm, setBookingForm] = useState<{ label: string; images: string[] }[]>([]);
  const [catalogue, setCatalogue] = useState<{ label: string; images: string[] }[]>([]);
  const [galleries, setGalleries] = useState<{ title: string; images: string[] }[]>([]);
  const [renders3d, setRenders3d] = useState<{ title: string; image: string }[]>([]);

  // Features
  const [amenities, setAmenities] = useState<string[]>([]);
  const [features, setFeatures] = useState({
    mainFeatures: [] as string[], plotFeatures: [] as string[],
    businessComm: [] as string[], nearbyFacilities: [] as string[], otherFacilities: [] as string[],
  });
  const [featureInputs, setFeatureInputs] = useState({ mainFeatures: "", plotFeatures: "", businessComm: "", nearbyFacilities: "", otherFacilities: "" });

  // Updates
  const [updates, setUpdates] = useState<{ title: string; content: string; date: string; image: string }[]>([]);

  const setB = (k: string, v: unknown) => setBasic(f => ({ ...f, [k]: v }));

  const deleteFromCloudinary = async (urls: string | string[]) => {
    const list = Array.isArray(urls) ? urls : [urls];
    const valid = list.filter(u => u && u.includes("res.cloudinary.com"));
    if (!valid.length) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/bulk`, {
        method: "DELETE", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: valid }),
      });
    } catch { /* silent */ }
  };

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

  const submit = async () => {
    setLoading(true);
    try {
      await api.post("/admin/projects", {
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
        mapUrl: basic.mapUrl.trim() || undefined,
        nearbyNote: basic.nearbyNote.trim() || undefined,
        contactNumber: basic.contactNumber.trim() || undefined,
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
        logo: logo || undefined, images, floorPlans, paymentPlans,
        bookingForm: bookingForm.filter(b => b.images.length > 0),
        catalogue: catalogue.filter(c => c.images.length > 0),
        renders3d: renders3d.filter(r => r.image),
        galleries: galleries.filter(g => g.title.trim()),
        amenities, features,
        updates: updates.map(u => ({ ...u, date: u.date || new Date() })),
      });
      toast.success("Project created!");
      router.push("/dashboard/projects");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    setLoading(false);
  };

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";
  const lbl = "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Add New Project</h1>
          <p className="text-gray-500 text-sm">Fill in all project details</p>
        </div>
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex gap-0 bg-white rounded-2xl border border-gray-100 p-1 shadow-sm overflow-x-auto">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${i === step ? "bg-green-600 text-white" : i < step ? "text-green-600" : "text-gray-400"}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* ── Step 0: Basic Info ─────────────────────────────────── */}
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
              <p className="text-xs text-gray-500">Shown on the public project page under <strong>Location &amp; Nearby → Nearby</strong>. Leave rows empty to use default categories (Schools, Hospitals, etc.).</p>
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
                <button onClick={addOffering} className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold"><Plus size={15} /></button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {basic.offering.map((o, i) => (
                  <span key={i} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">
                    {o} <button onClick={() => setB("offering", basic.offering.filter((_, idx) => idx !== i))}><X size={11} /></button>
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

        {/* ── Step 1: Units ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Unit Types</h2>
              <button onClick={addUnit} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">
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
                  <button onClick={() => removeUnit(i)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
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

        {/* ── Step 2: Images ─────────────────────────────────────── */}
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
                    <button type="button" onClick={() => { deleteFromCloudinary(logo); setLogo(""); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-[5]"><X size={10} /></button>
                  </div>
                : <label className={`inline-flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-400 relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingSlot === "logo" && <Loader2 className="h-5 w-5 animate-spin text-green-600 absolute" />}
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Upload logo</span>
                    <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                      onChange={e => { uploadImages(e.target.files, urls => setLogo(urls[0]), { slot: "logo" }); e.target.value = ""; }} />
                  </label>}
            </div>

            {/* Project Images */}
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
                  <span className="text-sm text-gray-500">Click to upload images</span>
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
                        <button type="button" onClick={() => { deleteFromCloudinary(img); setImages(im => im.filter((_, idx) => idx !== i)); }}
                          className="bg-red-500 text-white rounded px-1.5 py-0.5 text-[10px] font-semibold">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floor Plans */}
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
                    <button type="button" onClick={() => { if (fp.image) deleteFromCloudinary(fp.image); setFloorPlans(f => f.filter((_, idx) => idx !== i)); }} className="text-red-400"><X size={16} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setFloorPlans(f => [...f, { label: "", image: "" }])}
                className="flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:underline">
                <Plus size={14} /> Add Floor Plan
              </button>
            </div>

            {/* Payment Plans */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className={lbl}>Payment Plans</label>
                  <p className="text-xs text-gray-400 -mt-1">Add heading + upload multiple page images per plan</p>
                </div>
                <button type="button" onClick={() => setPaymentPlans(f => [...f, { label: "", images: [] }])}
                  className="flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:underline">
                  <Plus size={14} /> Add Plan
                </button>
              </div>
              <div className="space-y-4">
                {paymentPlans.map((pp, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-3">
                      <input className={`${inp} flex-1`} placeholder="Plan heading e.g. 3-Year Easy Installment Plan"
                        value={pp.label}
                        onChange={e => setPaymentPlans(f => f.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                      <button type="button"
                        onClick={() => { deleteFromCloudinary(pp.images); setPaymentPlans(f => f.filter((_, idx) => idx !== i)); }}
                        className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={18} /></button>
                    </div>

                    {/* Images grid */}
                    {pp.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                        {pp.images.map((img, ii) => (
                          <div key={ii} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-white">
                            {uploadingSlot === `pp-${i}-${ii}` && (
                              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                              </div>
                            )}
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              {ii + 1}
                            </div>
                            <button type="button"
                              onClick={() => { deleteFromCloudinary(img); setPaymentPlans(f => f.map((x, idx) => idx === i ? { ...x, images: x.images.filter((_, ii2) => ii2 !== ii) } : x)); }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    <label className={`flex items-center gap-2 border-2 border-dashed border-blue-200 rounded-xl p-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingSlot === `pp-${i}` && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 z-10">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        </div>
                      )}
                      <Upload size={15} className="text-blue-400" />
                      <span className="text-sm text-gray-500">Upload page images <span className="text-xs text-gray-400">(multiple allowed)</span></span>
                      <input type="file" multiple accept="image/*" className="hidden" disabled={uploadBusy}
                        onChange={e => {
                          uploadImages(e.target.files, urls => setPaymentPlans(f => f.map((x, idx) => idx === i ? { ...x, images: [...x.images, ...urls] } : x)), { slot: `pp-${i}` });
                          e.target.value = "";
                        }} />
                    </label>
                    {pp.images.length > 0 && (
                      <p className="text-[11px] text-gray-400 mt-1.5">{pp.images.length} page{pp.images.length > 1 ? "s" : ""} — drag to reorder not supported, delete and re-upload to change order</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Booking Form ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className={lbl}>Booking Form</label>
                  <p className="text-xs text-gray-400 -mt-1">Upload booking form pages as images</p>
                </div>
                <button type="button" onClick={() => setBookingForm(f => [...f, { label: "", images: [] }])}
                  className="flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:underline">
                  <Plus size={14} /> Add Form
                </button>
              </div>
              <div className="space-y-4">
                {bookingForm.map((bf, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <input className={`${inp} flex-1`} placeholder="Label e.g. Standard Booking Form"
                        value={bf.label}
                        onChange={e => setBookingForm(f => f.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                      <button type="button"
                        onClick={() => { deleteFromCloudinary(bf.images); setBookingForm(f => f.filter((_, idx) => idx !== i)); }}
                        className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={18} /></button>
                    </div>
                    {bf.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                        {bf.images.map((img, ii) => (
                          <div key={ii} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{ii + 1}</div>
                            <button type="button"
                              onClick={() => { deleteFromCloudinary(img); setBookingForm(f => f.map((x, idx) => idx === i ? { ...x, images: x.images.filter((_, ii2) => ii2 !== ii) } : x)); }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className={`flex items-center gap-2 border-2 border-dashed border-orange-200 rounded-xl p-3 cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingSlot === `bf-${i}` && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 z-10">
                          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                        </div>
                      )}
                      <Upload size={15} className="text-orange-400" />
                      <span className="text-sm text-gray-500">Upload pages <span className="text-xs text-gray-400">(multiple allowed)</span></span>
                      <input type="file" multiple accept="image/*" className="hidden" disabled={uploadBusy}
                        onChange={e => { uploadImages(e.target.files, urls => setBookingForm(f => f.map((x, idx) => idx === i ? { ...x, images: [...x.images, ...urls] } : x)), { slot: `bf-${i}` }); e.target.value = ""; }} />
                    </label>
                    {bf.images.length > 0 && <p className="text-[11px] text-gray-400 mt-1.5">{bf.images.length} page{bf.images.length > 1 ? "s" : ""} uploaded</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Catalogue ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className={lbl}>Catalogue</label>
                  <p className="text-xs text-gray-400 -mt-1">Upload catalogue pages as images</p>
                </div>
                <button type="button" onClick={() => setCatalogue(f => [...f, { label: "", images: [] }])}
                  className="flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:underline">
                  <Plus size={14} /> Add Catalogue
                </button>
              </div>
              <div className="space-y-4">
                {catalogue.map((cat, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <input className={`${inp} flex-1`} placeholder="Label e.g. Project Catalogue 2025"
                        value={cat.label}
                        onChange={e => setCatalogue(f => f.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} />
                      <button type="button"
                        onClick={() => { deleteFromCloudinary(cat.images); setCatalogue(f => f.filter((_, idx) => idx !== i)); }}
                        className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={18} /></button>
                    </div>
                    {cat.images.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                        {cat.images.map((img, ii) => (
                          <div key={ii} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <div className="absolute top-1 left-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{ii + 1}</div>
                            <button type="button"
                              onClick={() => { deleteFromCloudinary(img); setCatalogue(f => f.map((x, idx) => idx === i ? { ...x, images: x.images.filter((_, ii2) => ii2 !== ii) } : x)); }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className={`flex items-center gap-2 border-2 border-dashed border-teal-200 rounded-xl p-3 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors relative ${uploadBusy ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingSlot === `cat-${i}` && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80 z-10">
                          <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                        </div>
                      )}
                      <Upload size={15} className="text-teal-400" />
                      <span className="text-sm text-gray-500">Upload pages <span className="text-xs text-gray-400">(multiple allowed)</span></span>
                      <input type="file" multiple accept="image/*" className="hidden" disabled={uploadBusy}
                        onChange={e => { uploadImages(e.target.files, urls => setCatalogue(f => f.map((x, idx) => idx === i ? { ...x, images: [...x.images, ...urls] } : x)), { slot: `cat-${i}` }); e.target.value = ""; }} />
                    </label>
                    {cat.images.length > 0 && <p className="text-[11px] text-gray-400 mt-1.5">{cat.images.length} page{cat.images.length > 1 ? "s" : ""} uploaded</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Galleries ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className={lbl}>Project Galleries</label>
                  <p className="text-xs text-gray-400 -mt-1">Create named galleries e.g. Gym, Pool, Rooms</p>
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

                    {/* Images grid */}
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
                              onClick={() => { deleteFromCloudinary(img); setGalleries(prev => prev.map((x, idx) => idx === gi ? { ...x, images: x.images.filter((_, ii2) => ii2 !== ii) } : x)); }}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
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

            {/* ── 3D Renders ── */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <label className={lbl}>3D Renders</label>
                  <p className="text-xs text-gray-400 -mt-1 mb-3">Upload architectural 3D renders / visualisations of the project</p>
                </div>
              </div>

              <div className="relative">
                {uploadingSlot === "renders3d" && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/85 border border-green-100">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    <span className="mt-2 text-sm font-medium text-gray-600">Uploading renders…</span>
                  </div>
                )}
                <label className={`flex items-center gap-3 border-2 border-dashed border-purple-200 rounded-xl p-4 cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-colors ${uploadBusy ? "pointer-events-none opacity-50" : ""}`}>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="w-5 h-5 text-purple-600">
                      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">Upload 3D Renders</div>
                    <div className="text-xs text-gray-400">Architectural visualisations, exterior &amp; interior renders — PNG, JPG</div>
                  </div>
                  <input type="file" multiple accept="image/*" className="hidden" disabled={uploadBusy}
                    onChange={e => { uploadImages(e.target.files, urls => setRenders3d(r => [...r, ...urls.map(u => ({ title: "", image: u }))]), { slot: "renders3d" }); e.target.value = ""; }} />
                </label>
              </div>

              {renders3d.length > 0 && (
                <div className="space-y-3 mt-3">
                  {renders3d.map((r3d, i) => (
                    <div key={i} className="flex items-center gap-3 border border-purple-100 rounded-xl p-2 bg-purple-50/30">
                      {uploadingSlot === `r3d-${i}` && (
                        <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-black/20">
                          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                        </div>
                      )}
                      {!uploadingSlot || uploadingSlot !== `r3d-${i}` ? (
                        <img src={r3d.image} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-purple-200" />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Title e.g. Studio Apartment Type A"
                          value={r3d.title}
                          onChange={e => setRenders3d(arr => arr.map((x, idx) => idx === i ? { ...x, title: e.target.value } : x))}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                        />
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <label className="text-[10px] text-purple-700 font-semibold cursor-pointer px-2 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-center">
                          Replace
                          <input type="file" accept="image/*" className="hidden" disabled={uploadBusy}
                            onChange={e => {
                              const f = e.target.files; e.target.value = "";
                              uploadImages(f, urls => setRenders3d(arr => arr.map((x, idx) => idx === i ? { ...x, image: urls[0] } : x)), { slot: `r3d-${i}`, replaceUrl: r3d.image });
                            }} />
                        </label>
                        <button type="button" onClick={() => { deleteFromCloudinary(r3d.image); setRenders3d(arr => arr.filter((_, idx) => idx !== i)); }}
                          className="bg-red-500 text-white rounded-lg px-2 py-1 text-[10px] font-semibold">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Step 3: Features & Amenities ──────────────────────── */}
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
                    <button onClick={() => addToList(key, featureInputs[key])} className="px-3 bg-green-600 text-white rounded-xl"><Plus size={14} /></button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {features[key].map((f, i) => (
                      <span key={i} className="flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-xs">
                        {f} <button onClick={() => removeFromList(key, i)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Step 4: Construction Updates ──────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Construction Updates</h2>
              <button onClick={addUpdate} className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold">
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
                  <button onClick={() => setUpdates(u => u.filter((_, idx) => idx !== i))} className="text-red-400"><X size={16} /></button>
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

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
          <ChevronLeft size={15} /> Previous
        </button>
        {step < STEPS.length - 1
          ? <button onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold">
              Next <ChevronRight size={15} />
            </button>
          : <button onClick={submit} disabled={loading}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {loading ? "Creating..." : "Create Project"}
            </button>}
      </div>
    </div>
  );
}
