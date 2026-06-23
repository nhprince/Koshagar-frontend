import React from "react";
import { useGetAdminStats, useListAdminUsers, useGetAdminActivity } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Hexagon, Users, Database, FileText, Activity as ActivityIcon, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: users, isLoading: usersLoading } = useListAdminUsers();
  const { data: activity, isLoading: activityLoading } = useGetAdminActivity({ limit: 10 });

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative pb-20">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-20 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-background/90 backdrop-blur-3xl" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 h-20 border-b border-white/5 bg-background/50 backdrop-blur-xl">
        <Link href="/drive" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">Koshagar Admin</span>
        </Link>
        <Link href="/drive">
          <Button variant="ghost" className="text-muted-foreground hover:text-white rounded-full">
            Back to Drive
          </Button>
        </Link>
      </nav>

      <main className="relative z-10 px-6 md:px-12 py-10 max-w-7xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Platform Overview</h1>

        {statsLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Users" 
              value={stats.totalUsers.toLocaleString()} 
              icon={<Users className="w-5 h-5 text-blue-400" />} 
              bg="bg-blue-500/10" 
            />
            <StatCard 
              title="Total Files" 
              value={stats.totalFiles.toLocaleString()} 
              icon={<FileText className="w-5 h-5 text-green-400" />} 
              bg="bg-green-500/10" 
            />
            <StatCard 
              title="Storage Used" 
              value={formatBytes(stats.totalStorageBytes)} 
              icon={<Database className="w-5 h-5 text-purple-400" />} 
              bg="bg-purple-500/10" 
            />
            <StatCard 
              title="Active Today" 
              value={stats.activeToday.toLocaleString()} 
              icon={<ActivityIcon className="w-5 h-5 text-yellow-400" />} 
              bg="bg-yellow-500/10" 
            />
          </div>
        ) : null}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Users Table */}
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Recent Users
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Files</TableHead>
                    <TableHead className="text-muted-foreground">Storage</TableHead>
                    <TableHead className="text-muted-foreground text-right">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersLoading ? (
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableCell colSpan={4} className="text-center h-32"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></TableCell>
                    </TableRow>
                  ) : users?.map((user) => (
                    <TableRow key={user.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.fileCount}</TableCell>
                      <TableCell>{formatBytes(user.storageBytes)}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Activity Log */}
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 bg-white/5">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-accent" />
                Platform Activity
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {activityLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : activity?.map((entry) => (
                <div key={entry.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{entry.userName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-white">{entry.userName}</span>
                      {" "}
                      <span className="text-muted-foreground">{entry.action}</span>
                      {" "}
                      <span className="font-medium text-white">{entry.fileName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: { title: string, value: string, icon: React.ReactNode, bg: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 border border-white/5"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <h3 className="font-medium text-muted-foreground">{title}</h3>
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
    </motion.div>
  );
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
