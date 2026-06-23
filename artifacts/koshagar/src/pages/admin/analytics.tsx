import React, { useState } from "react";
import { useGetAdminStats, useGetAdminActivity } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, Upload, Download, Trash2, Share2,
  Star, FolderPlus, Loader2, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import AdminLayout from "@/components/layout/admin-layout";

function formatBytes(bytes: number) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#3b82f6"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: activity, isLoading: activityLoading } = useGetAdminActivity({ limit: 100 });

  const actionCounts = React.useMemo(() => {
    if (!activity) return [];
    const counts: Record<string, number> = {};
    activity.forEach((e) => { counts[e.action] = (counts[e.action] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [activity]);

  const dailyActivity = React.useMemo(() => {
    if (!activity) return [];
    const days: Record<string, { day: string; uploads: number; downloads: number; other: number }> = {};
    activity.forEach((e) => {
      const day = new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (!days[day]) days[day] = { day, uploads: 0, downloads: 0, other: 0 };
      if (e.action === "upload") days[day].uploads++;
      else if (e.action === "download") days[day].downloads++;
      else days[day].other++;
    });
    return Object.values(days).slice(-7);
  }, [activity]);

  const fileTypeData = React.useMemo(() => {
    return [
      { name: "Images", value: 35 },
      { name: "Documents", value: 28 },
      { name: "Videos", value: 18 },
      { name: "Audio", value: 10 },
      { name: "Code", value: 6 },
      { name: "Other", value: 3 },
    ];
  }, []);

  const metrics = [
    { label: "Uploads today", value: activity?.filter(a => a.action === "upload").length || 0, icon: Upload, color: "text-blue-400", bg: "bg-blue-500/10", trend: "+12%", up: true },
    { label: "Downloads today", value: activity?.filter(a => a.action === "download").length || 0, icon: Download, color: "text-emerald-400", bg: "bg-emerald-500/10", trend: "+8%", up: true },
    { label: "Shares created", value: activity?.filter(a => a.action === "share").length || 0, icon: Share2, color: "text-violet-400", bg: "bg-violet-500/10", trend: "+5%", up: true },
    { label: "Files trashed", value: activity?.filter(a => a.action === "trash").length || 0, icon: Trash2, color: "text-red-400", bg: "bg-red-500/10", trend: "-3%", up: false },
  ];

  return (
    <AdminLayout>
      <div className="space-y-7">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform usage metrics and trends.</p>
        </div>

        {statsLoading || activityLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass-card rounded-2xl p-4 border border-white/5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center`}>
                      <m.icon className={`w-4 h-4 ${m.color}`} />
                    </div>
                    <span className={`flex items-center text-xs font-semibold ${m.up ? "text-emerald-400" : "text-red-400"}`}>
                      {m.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {m.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{m.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-2xl border border-white/5 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Activity by Day
                </h3>
                {dailyActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={dailyActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="uploadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="downloadGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="uploads" stroke="#8b5cf6" strokeWidth={2} fill="url(#uploadGrad)" name="Uploads" />
                      <Area type="monotone" dataKey="downloads" stroke="#06b6d4" strokeWidth={2} fill="url(#downloadGrad)" name="Downloads" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Not enough data yet</div>
                )}
              </div>

              <div className="glass-card rounded-2xl border border-white/5 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  File Types Distribution
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={fileTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {fileTypeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.85} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {actionCounts.length > 0 && (
              <div className="glass-card rounded-2xl border border-white/5 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Top Actions
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={actionCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Count">
                      {actionCounts.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl border border-white/5 p-5 text-center">
                  <p className="text-3xl font-bold text-white">{((stats.usedStorageBytes / stats.totalStorageBytes) * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Storage utilization</p>
                  <div className="h-1.5 bg-white/8 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full" style={{ width: `${(stats.usedStorageBytes / stats.totalStorageBytes) * 100}%` }} />
                  </div>
                </div>
                <div className="glass-card rounded-2xl border border-white/5 p-5 text-center">
                  <p className="text-3xl font-bold text-white">
                    {stats.totalUsers > 0 ? (stats.totalFiles / stats.totalUsers).toFixed(1) : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Avg files per user</p>
                </div>
                <div className="glass-card rounded-2xl border border-white/5 p-5 text-center">
                  <p className="text-3xl font-bold text-white">
                    {stats.totalUsers > 0 ? formatBytes(stats.usedStorageBytes / stats.totalUsers) : "0 B"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Avg storage per user</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
