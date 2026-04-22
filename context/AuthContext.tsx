"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Admin { _id: string; name: string; email: string; role: string; }
interface AuthCtx { admin: Admin | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => void; }

const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get<{ success: boolean; user?: Admin } & Record<string, unknown>>("/auth/me")
      .then(r => { 
        if (r.success && r.user?.role === "ADMIN") setAdmin(r.user); 
        else setAdmin(null); 
      })
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const r = await api.post<{ user?: Admin } & Record<string, unknown>>("/auth/login", { email, password });
    if (r.user?.role !== "ADMIN") throw new Error("Not authorized");
    setAdmin(r.user);
    router.push("/dashboard");
  };

  const logout = async () => {
    await api.post("/auth/logout", {});
    setAdmin(null);
    router.push("/login");
  };

  return <Ctx.Provider value={{ admin, loading, login, logout }}>{children}</Ctx.Provider>;
}
