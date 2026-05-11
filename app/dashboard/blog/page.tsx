"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Upload, Loader2, Search } from "lucide-react";
import dynamic from "next/dynamic";

const RichEditor = dynamic(() => import("@/components/RichEditor"), { ssr: false,
  loading: () => <div className="h-72 bg-gray-50 rounded-xl border border-gray-200 animate-pulse" />,
});

const API = process.env.NEXT_PUBLIC_API_URL!;

interface Post {
  _id: string; title: string; slug: string; category: string;
  image?: string; createdAt: string; tags: string[];
}

const CATEGORIES = ["General","Real Estate","Investment","Market Trends","Legal & Finance","Property Tips","Projects","Interior Design"];

async function toBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function BlogPage() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [search, setSearch]     = useState("");

  const [form, setForm] = useState({
    title: "", slug: "", category: "General", tags: "",
    metaTitle: "", metaDescription: "", body: "",
  });
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImg, setUploadingImg] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const r = await api.get<{ data: Post[] }>("/blog/all?limit=100");
      setPosts(r.data || []);
    } catch { toast.error("Failed to load posts"); }
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const autoSlug = (title: string) =>
    title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s\W-]+/g, "-").replace(/^-+|-+$/g, "");

  const openAdd = () => {
    setEditId(null);
    setForm({ title: "", slug: "", category: "General", tags: "", metaTitle: "", metaDescription: "", body: "" });
    setImageFile(null); setImagePreview("");
    setShowForm(true);
  };

  const openEdit = async (p: Post) => {
    setEditId(p._id);
    try {
      const r = await api.get<{ data: { body: string; metaTitle?: string; metaDescription?: string; tags: string[] } }>(`/blog/${p.slug}`);
      const d = r.data;
      setForm({
        title: p.title, slug: p.slug, category: p.category,
        tags: (d.tags || []).join(", "),
        metaTitle: d.metaTitle || "", metaDescription: d.metaDescription || "",
        body: d.body || "",
      });
      setImagePreview(p.image || ""); setImageFile(null);
    } catch { toast.error("Failed to load post"); }
    setShowForm(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const b64 = await toBase64(file);
    setImagePreview(b64);
  };

  const submit = async () => {
    if (!form.title) return toast.error("Title is required");
    if (!form.body.trim()) return toast.error("Content is required");
    setSaving(true);
    try {
      const body = form.body;
      let imageBase64: string | undefined;
      if (imageFile) { setUploadingImg(true); imageBase64 = await toBase64(imageFile); setUploadingImg(false); }

      const payload = {
        title: form.title,
        slug: form.slug || autoSlug(form.title),
        body, category: form.category,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        metaTitle: form.metaTitle, metaDescription: form.metaDescription,
        ...(imageBase64 ? { imageBase64 } : {}),
      };

      if (editId) {
        await api.put(`/blog/${editId}`, payload);
        toast.success("Post updated!");
      } else {
        await api.post("/blog", payload);
        toast.success("Post published!");
      }
      setShowForm(false); fetchPosts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    setSaving(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try { await api.delete(`/blog/${id}`); toast.success("Deleted"); fetchPosts(); }
    catch { toast.error("Delete failed"); }
  };

  const filtered = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blog Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{posts.length} posts published</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-600 h-8 w-8" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No posts found</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {["Post", "Category", "Tags", "Date", ""].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.image && <img src={p.image} alt="" className="w-12 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />}
                      <div>
                        <div className="font-semibold text-gray-800 line-clamp-1">{p.title}</div>
                        <div className="text-xs text-gray-400 font-mono">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full">{p.category}</span></td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{(p.tags || []).slice(0,3).join(", ")}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString("en-PK",{day:"numeric",month:"short",year:"numeric"})}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-500"><Pencil size={14} /></button>
                      <button onClick={() => deletePost(p._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex overflow-y-auto bg-black/50">
          <div className="relative bg-white rounded-2xl m-auto w-full max-w-5xl mx-4 my-6 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{editId ? "Edit Post" : "New Blog Post"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              {/* Title + Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Title *</label>
                  <input className={inp} value={form.title}
                    onChange={e => { setF("title", e.target.value); if (!editId) setF("slug", autoSlug(e.target.value)); }} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Slug</label>
                  <input className={inp} value={form.slug} onChange={e => setF("slug", e.target.value)} />
                </div>
              </div>

              {/* Category + Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Category</label>
                  <select className={inp} value={form.category} onChange={e => setF("category", e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Tags (comma separated)</label>
                  <input className={inp} value={form.tags} onChange={e => setF("tags", e.target.value)} placeholder="real estate, investment, lahore" />
                </div>
              </div>

              {/* Cover image */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Cover Image</label>
                <label className={`flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-400 transition-colors ${uploadingImg ? "opacity-50" : ""}`}>
                  {imagePreview
                    ? <img src={imagePreview} alt="" className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />
                    : <div className="w-24 h-16 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0"><Upload size={18} className="text-gray-400" /></div>}
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{imagePreview ? "Change image" : "Upload cover image"}</div>
                    <div className="text-xs text-gray-400">JPG, PNG — recommended 1200×630px</div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>

              {/* Rich Text Editor */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Content *</label>
                <RichEditor value={form.body} onChange={v => setF("body", v)} />
              </div>

              {/* Meta */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-700">SEO / Meta</h3>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Meta Title</label>
                  <input className={inp} value={form.metaTitle} onChange={e => setF("metaTitle", e.target.value)} placeholder="Leave empty to use post title" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Meta Description</label>
                  <textarea rows={3} className={`${inp} resize-none`} value={form.metaDescription} onChange={e => setF("metaDescription", e.target.value)} placeholder="150–160 characters recommended" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={submit} disabled={saving || uploadingImg}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : editId ? "Update Post" : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
