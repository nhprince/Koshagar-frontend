import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, MoreVertical, Shield, User,
  FileText, UserPlus, Trash2,
  Edit2, AlertCircle, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/layout/admin-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  fileCount: number;
  storageBytes: number;
  status: "active" | "suspended";
  createdAt: string;
}

const DEFAULT_USERS: MockUser[] = [
  { id: "u1", name: "Admin User", email: "admin@koshagar.io", role: "admin", fileCount: 42, storageBytes: 1.2 * 1024 ** 3, status: "active", createdAt: "2026-01-15T00:00:00Z" },
  { id: "u2", name: "Sarah Chen", email: "sarah.chen@company.com", role: "user", fileCount: 128, storageBytes: 3.8 * 1024 ** 3, status: "active", createdAt: "2026-02-03T00:00:00Z" },
  { id: "u3", name: "Marcus Webb", email: "m.webb@design.studio", role: "user", fileCount: 67, storageBytes: 892 * 1024 ** 2, status: "active", createdAt: "2026-02-20T00:00:00Z" },
  { id: "u4", name: "Priya Sharma", email: "priya@startup.io", role: "user", fileCount: 203, storageBytes: 7.1 * 1024 ** 3, status: "active", createdAt: "2026-03-01T00:00:00Z" },
  { id: "u5", name: "Tom Okafor", email: "thomas.okafor@corp.com", role: "user", fileCount: 15, storageBytes: 234 * 1024 ** 2, status: "suspended", createdAt: "2026-03-12T00:00:00Z" },
  { id: "u6", name: "Lena Müller", email: "l.muller@eu.design", role: "user", fileCount: 89, storageBytes: 2.4 * 1024 ** 3, status: "active", createdAt: "2026-03-28T00:00:00Z" },
  { id: "u7", name: "James Park", email: "jpark@techfirm.co", role: "admin", fileCount: 311, storageBytes: 9.2 * 1024 ** 3, status: "active", createdAt: "2026-04-05T00:00:00Z" },
  { id: "u8", name: "Fatima Al-Hassan", email: "fatima@creative.ae", role: "user", fileCount: 54, storageBytes: 1.1 * 1024 ** 3, status: "active", createdAt: "2026-04-18T00:00:00Z" },
];

const STORAGE_KEY = "koshagar_admin_users";

function loadUsers(): MockUser[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_USERS;
}

function saveUsers(users: MockUser[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {}
}

function formatBytes(bytes: number) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function StorageBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? (used / total) * 100 : 0;
  const color = pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground/60 tabular-nums">{Math.round(pct)}%</span>
    </div>
  );
}

function InviteUserModal({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (user: MockUser) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"user" | "admin">("user");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const newUser: MockUser = {
      id: `u${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role,
      fileCount: 0,
      storageBytes: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    onInvite(newUser);
    setName(""); setEmail(""); setRole("user");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] glass-card border-white/10 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            Invite New User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
              className="bg-white/5 border-white/10 focus:border-primary rounded-xl h-11" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Email Address</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@company.com"
              className="bg-white/5 border-white/10 focus:border-primary rounded-xl h-11" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Role</label>
            <div className="flex gap-2">
              {(["user", "admin"] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border capitalize ${role === r ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl hover:bg-white/10">Cancel</Button>
            <Button type="submit" className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90">Send Invite</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserModal({ user, open, onClose, onSave }: { user: MockUser | null; open: boolean; onClose: () => void; onSave: (u: MockUser) => void }) {
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<"user" | "admin">("user");

  React.useEffect(() => { if (user) { setName(user.name); setRole(user.role); } }, [user]);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px] glass-card border-white/10 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            Edit User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSave({ ...user, name: name.trim(), role }); onClose(); }} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Full Name</label>
            <Input value={name} onChange={e => setName(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary rounded-xl h-11" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Email (read-only)</label>
            <Input value={user.email} readOnly className="bg-white/5 border-white/10 h-11 rounded-xl text-muted-foreground cursor-not-allowed" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Role</label>
            <div className="flex gap-2">
              {(["user", "admin"] as const).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border capitalize ${role === r ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl hover:bg-white/10">Cancel</Button>
            <Button type="submit" className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<MockUser[]>(loadUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<MockUser | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (roleFilter === "all" || u.role === roleFilter) && (statusFilter === "all" || u.status === statusFilter);
  });

  const updateUsers = (updated: MockUser[]) => { setUsers(updated); saveUsers(updated); };

  const handleInvite = (u: MockUser) => { updateUsers([...users, u]); toast.success(`Invited ${u.name} as ${u.role}`); };
  const handleEditSave = (u: MockUser) => { updateUsers(users.map(x => x.id === u.id ? u : x)); toast.success(`Updated ${u.name}`); };
  const handleRoleChange = (id: string, role: "admin" | "user") => {
    const u = users.find(x => x.id === id); if (!u) return;
    updateUsers(users.map(x => x.id === id ? { ...x, role } : x));
    toast.success(`${u.name} is now ${role}`);
  };
  const handleToggleSuspend = (id: string) => {
    const u = users.find(x => x.id === id); if (!u) return;
    const s = u.status === "active" ? "suspended" : "active";
    updateUsers(users.map(x => x.id === id ? { ...x, status: s } : x));
    toast.success(`${u.name} ${s === "suspended" ? "suspended" : "reactivated"}`);
  };
  const handleDelete = (id: string) => {
    const u = users.find(x => x.id === id); if (!u) return;
    updateUsers(users.filter(x => x.id !== id));
    toast.success(`Deleted ${u.name}`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">User Management</h1>
            <p className="text-sm text-muted-foreground">
              {users.length} total · {users.filter(u => u.status === "active").length} active · {users.filter(u => u.role === "admin").length} admin{users.filter(u => u.role === "admin").length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button className="rounded-full bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 shadow-none text-sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Invite User
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9 h-9 bg-white/5 border-white/10 rounded-full text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {(["all", "admin", "user"] as const).map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${roleFilter === r ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"}`}>
                {r === "all" ? "All roles" : r}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {(["all", "active", "suspended"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${statusFilter === s ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"}`}>
                {s === "all" ? "All status" : s}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-2.5 border-b border-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-white/3">
            <div className="col-span-3">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-1">Files</div>
            <div className="col-span-2">Storage</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {search ? `No users matching "${search}"` : "No users found"}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((user, i) => (
                <motion.div key={user.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                  className={`flex lg:grid lg:grid-cols-12 gap-3 lg:gap-4 px-5 py-3.5 items-center transition-colors ${user.status === "suspended" ? "opacity-60" : "hover:bg-white/3"}`}>
                  <div className="flex-1 lg:col-span-3 flex items-center gap-3 min-w-0">
                    <Avatar className="w-8 h-8 border border-white/10 flex-shrink-0">
                      <AvatarFallback className={`text-xs font-semibold ${user.role === "admin" ? "bg-primary/15 text-primary" : "bg-white/10 text-muted-foreground"}`}>
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-white truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-2 hidden lg:block">
                    <Badge variant="outline" className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 ${user.role === "admin" ? "text-primary border-primary/30 bg-primary/10" : "text-muted-foreground border-white/15 bg-white/5"}`}>
                      {user.role === "admin" ? <><Shield className="w-2.5 h-2.5 mr-1 inline" />Admin</> : <><User className="w-2.5 h-2.5 mr-1 inline" />User</>}
                    </Badge>
                  </div>
                  <div className="lg:col-span-1 hidden lg:flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
                    <span className="text-sm tabular-nums">{user.fileCount}</span>
                  </div>
                  <div className="lg:col-span-2 hidden lg:block space-y-1">
                    <p className="text-xs text-muted-foreground tabular-nums">{formatBytes(user.storageBytes)}</p>
                    <StorageBar used={user.storageBytes} total={10 * 1024 * 1024 * 1024} />
                  </div>
                  <div className="lg:col-span-2 hidden lg:block">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${user.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                      {user.status === "active" ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                      {user.status}
                    </span>
                  </div>
                  <div className="lg:col-span-1 hidden lg:block text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                  <div className="lg:col-span-1 flex justify-end flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 glass-card border-white/10 rounded-xl p-1.5 shadow-2xl">
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-white/10" onClick={() => setEditUser(user)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-white/10" onClick={() => handleRoleChange(user.id, user.role === "admin" ? "user" : "admin")}>
                          <Shield className="w-3.5 h-3.5 mr-2" /> Make {user.role === "admin" ? "User" : "Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-white/10" onClick={() => handleToggleSuspend(user.id)}>
                          {user.status === "active"
                            ? <><AlertCircle className="w-3.5 h-3.5 mr-2 text-amber-400" />Suspend</>
                            : <><Check className="w-3.5 h-3.5 mr-2 text-emerald-400" />Reactivate</>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/8 my-1" />
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-red-500/10 text-red-400" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <InviteUserModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} />
      <EditUserModal user={editUser} open={!!editUser} onClose={() => setEditUser(null)} onSave={handleEditSave} />
    </AdminLayout>
  );
}
