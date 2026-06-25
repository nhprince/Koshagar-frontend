import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import {
  LayoutDashboard, Users, BarChart3, Shield,
  ChevronRight, ArrowLeft, Server, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/health", label: "Platform Health", icon: Server },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {}
    toast.success("Signed out successfully");
    logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <div className="fixed inset-0 z-0 opacity-15 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-background/90 backdrop-blur-3xl pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/8 blur-[120px] rounded-full pointer-events-none z-0" />

      <aside className="relative z-10 w-[220px] flex-shrink-0 border-r border-white/5 bg-background/50 backdrop-blur-2xl flex flex-col h-screen sticky top-0 overflow-hidden">
        <div className="h-[60px] flex items-center px-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-md shadow-primary/25 flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[14px] font-bold tracking-tight text-gradient">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 min-h-0 px-2.5 py-3 space-y-0.5 overflow-y-auto">
          <Link href="/drive">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-all text-xs cursor-pointer mb-3">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Drive
            </div>
          </Link>
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 mb-2">Management</p>
          {navItems.map((item) => {
            const isActive = item.exact
              ? location === item.href
              : location.startsWith(item.href) && item.href !== "/admin";
            const exactActive = item.exact && location === "/admin";
            const active = item.exact ? exactActive : isActive;

            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 text-sm ${
                  active ? "bg-primary/12 border border-primary/20 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}>
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                  <span className="font-medium truncate">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5 space-y-3">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5 mt-1">
              <Shield className="w-2.5 h-2.5" /> ADMIN
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/8 rounded-lg h-8 px-2.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="relative z-10 flex-1 flex flex-col overflow-auto">
        <header className="h-[60px] flex items-center px-8 border-b border-white/5 bg-background/50 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Admin</span>
            {location !== "/admin" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                <span className="text-white font-medium">
                  {navItems.find(n => location.startsWith(n.href) && !n.exact)?.label}
                </span>
              </>
            )}
          </div>
        </header>
        <div className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
