"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Building2, Home, LogOut, Shield, FolderKanban } from "lucide-react";

const links = [
  { href: "/dashboard",          label: "Overview",   icon: LayoutDashboard },
  { href: "/dashboard/dealers",  label: "Dealers",    icon: Building2 },
  { href: "/dashboard/listings", label: "Listings",   icon: Home },
  { href: "/dashboard/projects", label: "Projects",   icon: FolderKanban },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 bg-white h-screen flex flex-col border-r border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">arzepak</div>
            <div className="text-xs text-emerald-600 font-semibold">Super Admin</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}>
              <Icon size={18} className={active ? "text-emerald-600" : "text-slate-400"} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {admin?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{admin?.name}</div>
            <div className="text-xs text-slate-500 truncate">{admin?.email}</div>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors">
          <LogOut size={16} />Logout
        </button>
      </div>
    </aside>
  );
}
