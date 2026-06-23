import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Upload, Share2, Star, Trash2, FolderPlus, Download,
  X, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  type: "upload" | "share" | "star" | "trash" | "folder" | "download" | "system";
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

const STORAGE_KEY = "koshagar_notifications";

const defaultNotifications: Notification[] = [
  {
    id: "n1",
    type: "upload",
    title: "Files uploaded",
    message: "Budget Q3.pdf was uploaded successfully",
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: "n2",
    type: "share",
    title: "File shared",
    message: "Design System.fig was shared with 3 people",
    time: new Date(Date.now() - 32 * 60 * 1000),
    read: false,
  },
  {
    id: "n3",
    type: "star",
    title: "Item starred",
    message: "Meeting Notes.txt added to starred",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "n4",
    type: "folder",
    title: "Folder created",
    message: "New folder 'Projects 2026' created",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "n5",
    type: "system",
    title: "Storage warning",
    message: "You've used 64% of your 10 GB storage",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
];

function loadNotifications(): Notification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((n: Notification & { time: string }) => ({ ...n, time: new Date(n.time) }));
    }
  } catch {}
  return defaultNotifications;
}

function saveNotifications(notifications: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
}

function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getNotifIcon(type: Notification["type"]) {
  switch (type) {
    case "upload": return <Upload className="w-3.5 h-3.5 text-blue-400" />;
    case "share": return <Share2 className="w-3.5 h-3.5 text-violet-400" />;
    case "star": return <Star className="w-3.5 h-3.5 text-amber-400" />;
    case "trash": return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
    case "folder": return <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />;
    case "download": return <Download className="w-3.5 h-3.5 text-emerald-400" />;
    default: return <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
  }
}

function getNotifColor(type: Notification["type"]) {
  switch (type) {
    case "upload": return "bg-blue-500/10 border-blue-500/20";
    case "share": return "bg-violet-500/10 border-violet-500/20";
    case "star": return "bg-amber-500/10 border-amber-500/20";
    case "trash": return "bg-red-500/10 border-red-500/20";
    case "folder": return "bg-cyan-500/10 border-cyan-500/20";
    case "download": return "bg-emerald-500/10 border-emerald-500/20";
    default: return "bg-white/5 border-white/10";
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = React.useState<Notification[]>(loadNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    saveNotifications(updated);
  };

  const markRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const dismiss = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    saveNotifications(updated);
  };

  const addNotification = (notif: Omit<Notification, "id" | "time" | "read">) => {
    const newNotif: Notification = {
      ...notif,
      id: `n${Date.now()}`,
      time: new Date(),
      read: false,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    saveNotifications(updated);
  };

  return { notifications, unreadCount, markAllRead, markRead, dismiss, addNotification };
}

export function NotificationsPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onDismiss,
}: {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute right-0 top-full mt-2 w-[clamp(17rem,22vw,22rem)] z-50 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden border border-white/8"
          style={{ background: "hsl(var(--card))" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllRead}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-white hover:bg-white/10 rounded-full gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 rounded-full hover:bg-white/10 text-muted-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="max-h-[clamp(20rem,40vh,28rem)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                <Bell className="w-8 h-8 opacity-20" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(n => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-colors group cursor-pointer",
                      !n.read ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-white/4"
                    )}
                    onClick={() => onMarkRead(n.id)}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5",
                      getNotifColor(n.type)
                    )}>
                      {getNotifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-xs font-semibold truncate", !n.read ? "text-white" : "text-muted-foreground")}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">{formatRelativeTime(n.time)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                      className="h-5 w-5 rounded-full hover:bg-white/10 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
