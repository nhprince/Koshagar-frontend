import React from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Star, Clock, Trash2, Link as LinkIcon,
  Bell, Upload, Settings, Activity, Search as SearchIcon,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useGetStorageUsage } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UploadModal } from "../modals/upload-modal";

export const UploadOpenContext = React.createContext<{ setUploadOpen: (v: boolean) => void } | null>(null);

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export default function DriveLayout({ children }: { children?: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [uploadOpen, setUploadOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) return null;

  return (
    <UploadOpenContext.Provider value={{ setUploadOpen }}>
      <div className="flex h-[100dvh] w-full bg-background overflow-hidden selection:bg-primary/30">
        <Sidebar user={user} />
        <MobileBottomNav />
        <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
          <div className="absolute top-0 right-0 w-[60vw] h-[50vw] bg-primary/4 rounded-full blur-[180px] pointer-events-none -z-10" />
          <Topbar onUploadClick={() => setUploadOpen(true)} />
          <main className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-10 pb-6 z-0 h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={typeof window !== "undefined" ? window.location.pathname : ""}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="h-full pt-5"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} folderId={undefined} />
    </UploadOpenContext.Provider>
  );
}

function Sidebar({ user }: { user: { name?: string | null; email?: string | null; avatarUrl?: string | null; role?: string | null } }) {
  const [location] = useLocation();
  const { data: storage } = useGetStorageUsage();

  const navItems = [
    { href: "/drive", label: "My Drive", icon: FolderOpen },
    { href: "/drive/starred", label: "Starred", icon: Star },
    { href: "/drive/recent", label: "Recent", icon: Clock },
    { href: "/drive/shared", label: "Shared", icon: LinkIcon },
    { href: "/drive/activity", label: "Activity", icon: Activity },
    { href: "/drive/trash", label: "Trash", icon: Trash2 },
  ];

  const usedPct = storage ? (storage.usedBytes / storage.totalBytes) * 100 : 0;
  const storageColor =
    usedPct > 90 ? "from-red-500 to-rose-400" :
    usedPct > 70 ? "from-amber-500 to-yellow-400" :
    "from-primary to-violet-400";

  return (
    <aside className="w-[210px] flex-shrink-0 flex-col z-20 hidden md:flex border-r border-white/5 bg-background/60 backdrop-blur-2xl">
      <div className="h-[60px] flex items-center px-4 border-b border-white/5">
        <Link href="/drive" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-md shadow-primary/25 flex-shrink-0">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2L3 7v6l7 5 7-5V7L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="white" fillOpacity="0.15" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-gradient">Koshagar</span>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 mb-2">Drive</p>
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/drive" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 group relative text-sm
                ${isActive ? "text-white" : "text-muted-foreground hover:text-white/90 hover:bg-white/5"}
              `}>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/12 border border-primary/20 rounded-lg"
                    transition={{ type: "spring", stiffness: 350, damping: 32 }}
                  />
                )}
                <item.icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isActive ? "text-primary" : ""}`} />
                <span className="font-medium relative z-10 truncate">{item.label}</span>
              </div>
            </Link>
          );
        })}

        {user?.role === "admin" && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2">Admin</p>
            </div>
            <Link href="/admin">
              <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 group relative text-sm ${location.startsWith("/admin") ? "text-white" : "text-muted-foreground hover:text-white/90 hover:bg-white/5"}`}>
                {location.startsWith("/admin") && (
                  <motion.div layoutId="sidebar-active" className="absolute inset-0 bg-primary/12 border border-primary/20 rounded-lg" transition={{ type: "spring", stiffness: 350, damping: 32 }} />
                )}
                <Shield className={`w-4 h-4 flex-shrink-0 relative z-10 ${location.startsWith("/admin") ? "text-primary" : ""}`} />
                <span className="font-medium relative z-10">Admin Panel</span>
              </div>
            </Link>
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-white/5 space-y-3">
        {storage && (
          <div className="px-1">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Storage</span>
              <span className="text-white/70 font-medium tabular-nums">
                {formatBytes(storage.usedBytes)} / {formatBytes(storage.totalBytes)}
              </span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${storageColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, usedPct)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <Link href="/drive/settings">
          <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
            <Avatar className="w-7 h-7 border border-white/10 flex-shrink-0">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate leading-none">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-white/70 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </div>
    </aside>
  );
}

function MobileBottomNav() {
  const [location] = useLocation();

  const items = [
    { href: "/drive", label: "Drive", icon: FolderOpen },
    { href: "/drive/starred", label: "Starred", icon: Star },
    { href: "/drive/search", label: "Search", icon: SearchIcon },
    { href: "/drive/recent", label: "Recent", icon: Clock },
    { href: "/drive/settings", label: "Settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/90 backdrop-blur-xl border-t border-white/8">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== "/drive" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Topbar({ onUploadClick }: { onUploadClick: () => void }) {
  const [, setLocation] = useLocation();

  return (
    <header className="h-[60px] flex items-center justify-between px-4 md:px-8 lg:px-10 sticky top-0 z-10 bg-background/70 backdrop-blur-xl border-b border-white/5 flex-shrink-0">
      <div className="flex-1 max-w-lg">
        <div
          onClick={() => setLocation("/drive/search")}
          className="h-9 bg-white/5 border border-white/8 rounded-full flex items-center px-3.5 gap-2.5 text-muted-foreground hover:bg-white/8 hover:border-white/15 transition-all cursor-text"
        >
          <SearchIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-[13px] flex-1">Search files and folders...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/60">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1.5 pl-3">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full w-8 h-8 text-muted-foreground hover:text-white hover:bg-white/8 hidden sm:flex"
        >
          <Bell className="w-4 h-4" />
        </Button>
        <Button
          onClick={onUploadClick}
          className="rounded-full bg-gradient-to-r from-primary to-violet-500 hover:opacity-90 text-white shadow-lg shadow-primary/25 border-0 h-8 px-3 md:px-4 text-sm font-medium gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Upload</span>
        </Button>
      </div>
    </header>
  );
}
