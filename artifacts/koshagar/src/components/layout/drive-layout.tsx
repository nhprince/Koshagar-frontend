import React from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderOpen, Star, Clock, Trash2, Link as LinkIcon, 
  Bell, Upload, Settings, Hexagon, Activity, LayoutGrid, List, SearchIcon
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useGetStorageUsage } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UploadModal } from "../modals/upload-modal";

export default function DriveLayout({ children }: { children?: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading || !user) return null;

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden selection:bg-primary/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Subtle background glow for the content area */}
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[150px] pointer-events-none -z-10" />
        <Topbar />
        <main className="flex-1 overflow-y-auto px-4 md:px-10 pb-10 z-0 h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full pt-6"
            >
              {children || <div className="pt-8">Work in progress</div>}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: storage } = useGetStorageUsage();

  const navItems = [
    { href: "/drive", label: "My Drive", icon: FolderOpen },
    { href: "/drive/starred", label: "Starred", icon: Star },
    { href: "/drive/recent", label: "Recent", icon: Clock },
    { href: "/drive/shared", label: "Shared", icon: LinkIcon },
    { href: "/drive/activity", label: "Activity", icon: Activity },
    { href: "/drive/trash", label: "Trash", icon: Trash2 },
  ];

  return (
    <div className="w-[240px] flex-shrink-0 glass-panel border-r border-white/5 flex flex-col z-20 hidden md:flex">
      <div className="h-16 flex items-center px-6 mb-4 mt-2">
        <Link href="/drive" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-lg font-bold tracking-tight text-gradient">Koshagar</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group relative
                ${isActive ? 'text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}
              `}>
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />
                <span className="font-medium relative z-10">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 pb-4">
        <Link href="/drive/settings">
          <div className="flex items-center gap-3 mb-6 p-2 -mx-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <Avatar className="w-10 h-10 border border-white/10 group-hover:border-primary/50 transition-colors">
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/20 text-primary">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
          </div>
        </Link>

        {storage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Storage</span>
              <span className="text-white font-medium">
                {formatBytes(storage.usedBytes)} / {formatBytes(storage.totalBytes)}
              </span>
            </div>
            <Progress 
              value={(storage.usedBytes / storage.totalBytes) * 100} 
              className="h-1.5 bg-white/5" 
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Topbar() {
  const [location, setLocation] = useLocation();
  const [uploadOpen, setUploadOpen] = React.useState(false);

  return (
    <>
      <header className="h-20 flex items-center justify-between px-4 md:px-10 sticky top-0 z-10 bg-background/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex-1 max-w-xl">
          <div 
            onClick={() => setLocation('/drive/search')}
            className="h-10 bg-white/5 border border-white/10 rounded-full flex items-center px-4 gap-3 text-muted-foreground hover:bg-white/10 hover:border-white/20 transition-all cursor-text"
          >
            <SearchIcon className="w-4 h-4" />
            <span className="text-sm">Search your treasury...</span>
            <div className="ml-auto flex items-center gap-1">
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4">
          <Button size="icon" variant="ghost" className="rounded-full w-10 h-10 text-muted-foreground hover:text-white hover:bg-white/10 hidden sm:flex">
            <Bell className="w-5 h-5" />
          </Button>
          <Button 
            onClick={() => setUploadOpen(true)}
            className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/20 border-0 h-10 px-4 md:px-5 font-medium hover-lift"
          >
            <Upload className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Upload</span>
          </Button>
        </div>
      </header>
      <UploadOpenContext.Provider value={{ setUploadOpen }}>
        <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} folderId={undefined} />
      </UploadOpenContext.Provider>
    </>
  );
}

export const UploadOpenContext = React.createContext<{ setUploadOpen: (v: boolean) => void } | null>(null);

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
