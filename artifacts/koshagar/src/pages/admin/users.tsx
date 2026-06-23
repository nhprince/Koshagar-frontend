import React, { useState } from "react";
import { useListAdminUsers } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  Users, Search, Loader2, MoreVertical, Shield, User,
  FileText, Database, Calendar, ChevronDown,
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
import { toast } from "sonner";

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
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground/60 tabular-nums">{Math.round(pct)}%</span>
    </div>
  );
}

export default function AdminUsers() {
  const { data: users, isLoading } = useListAdminUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");

  const filtered = (users || []).filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">User Management</h1>
            <p className="text-sm text-muted-foreground">
              {users?.length || 0} total user{(users?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            className="rounded-full bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20 shadow-none text-sm"
            onClick={() => toast.info("Invite flow coming soon")}
          >
            <Users className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9 h-9 bg-white/5 border-white/10 rounded-full text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {(["all", "admin", "user"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all capitalize ${
                  roleFilter === r ? "bg-white/15 text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {r === "all" ? "All roles" : r}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-2.5 border-b border-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-white/3">
            <div className="col-span-4">User</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Files</div>
            <div className="col-span-2">Storage</div>
            <div className="col-span-1">Joined</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No users found</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-white/3 transition-colors"
                >
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <Avatar className="w-8 h-8 border border-white/10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-white truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 ${
                      user.role === "admin"
                        ? "text-primary border-primary/30 bg-primary/10"
                        : "text-muted-foreground border-white/15 bg-white/5"
                    }`}>
                      {user.role === "admin" ? (
                        <><Shield className="w-2.5 h-2.5 mr-1 inline" />Admin</>
                      ) : (
                        <><User className="w-2.5 h-2.5 mr-1 inline" />User</>
                      )}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground/50" />
                      <span className="text-sm tabular-nums">{user.fileCount}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tabular-nums">{formatBytes(user.storageBytes)}</p>
                      <StorageBar used={user.storageBytes} total={10 * 1024 * 1024 * 1024} />
                    </div>
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 glass-card border-white/10 rounded-xl p-1.5 shadow-2xl">
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-white/10" onClick={() => toast.info("View profile — coming soon")}>
                          <User className="w-3.5 h-3.5 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-white/10" onClick={() => toast.info("Role change — coming soon")}>
                          <Shield className="w-3.5 h-3.5 mr-2" /> Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-white/10" onClick={() => toast.info("Storage details — coming soon")}>
                          <Database className="w-3.5 h-3.5 mr-2" /> Storage Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/8 my-1" />
                        <DropdownMenuItem className="rounded-lg text-xs cursor-pointer focus:bg-red-500/10 text-red-400" onClick={() => toast.error("Suspend user — coming soon")}>
                          Suspend Account
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
    </AdminLayout>
  );
}
