import React from "react";
import { useGetAdminStats, useGetAdminActivity } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  Users, Database, FileText, Activity as ActivityIcon, Loader2,
  TrendingUp, Upload, Download, Trash2, Edit2, Link2, Star, FolderPlus,
  ArrowUpRight,
} from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

function StatCard({ title, value, icon, color, trend }: {
  title: string; value: string; icon: React.ReactNode; color: string; trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight text-white mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </motion.div>
  );
}

const actionConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  upload: { icon: <Upload className="w-3.5 h-3.5 text-blue-400" />, label: "Uploaded", color: "bg-blue-500/10 border-blue-500/20" },
  download: { icon: <Download className="w-3.5 h-3.5 text-emerald-400" />, label: "Downloaded", color: "bg-emerald-500/10 border-emerald-500/20" },
  trash: { icon: <Trash2 className="w-3.5 h-3.5 text-red-400" />, label: "Trashed", color: "bg-red-500/10 border-red-500/20" },
  rename: { icon: <Edit2 className="w-3.5 h-3.5 text-orange-400" />, label: "Renamed", color: "bg-orange-500/10 border-orange-500/20" },
  share: { icon: <Link2 className="w-3.5 h-3.5 text-violet-400" />, label: "Shared", color: "bg-violet-500/10 border-violet-500/20" },
  star: { icon: <Star className="w-3.5 h-3.5 text-amber-400" />, label: "Starred", color: "bg-amber-500/10 border-amber-500/20" },
  create_folder: { icon: <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />, label: "Created folder", color: "bg-cyan-500/10 border-cyan-500/20" },
};

export default function AdminOverview() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: activity, isLoading: activityLoading } = useGetAdminActivity({ limit: 15 });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time stats across all users and files.</p>
        </div>

        {statsLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={stats.totalUsers.toLocaleString()} icon={<Users className="w-5 h-5 text-blue-400" />} color="bg-blue-500/10" trend="+12%" />
            <StatCard title="Total Files" value={stats.totalFiles.toLocaleString()} icon={<FileText className="w-5 h-5 text-emerald-400" />} color="bg-emerald-500/10" trend="+8%" />
            <StatCard title="Storage Used" value={formatBytes(stats.totalStorageBytes)} icon={<Database className="w-5 h-5 text-violet-400" />} color="bg-violet-500/10" />
            <StatCard title="Active Today" value={stats.activeToday.toLocaleString()} icon={<TrendingUp className="w-5 h-5 text-amber-400" />} color="bg-amber-500/10" trend="+3%" />
          </div>
        ) : null}

        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <ActivityIcon className="w-4.5 h-4.5 text-primary" />
              Recent Platform Activity
            </h2>
            <span className="text-xs text-muted-foreground">All users</span>
          </div>
          <div className="divide-y divide-white/5">
            {activityLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : activity?.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No activity yet</div>
            ) : activity?.map((entry) => {
              const cfg = actionConfig[entry.action] || { icon: <ActivityIcon className="w-3.5 h-3.5 text-muted-foreground" />, label: entry.action, color: "bg-white/5 border-white/10" };
              return (
                <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-semibold text-white">{entry.userName}</span>
                      <span className="text-muted-foreground"> {cfg.label} </span>
                      <span className="font-medium text-white">{entry.fileName}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/60 flex-shrink-0">
                    {new Date(entry.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
