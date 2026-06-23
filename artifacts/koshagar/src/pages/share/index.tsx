import React, { useState } from "react";
import { useViewPublicShare, getViewPublicShareQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Hexagon, Download, File, Image as ImageIcon, FileText, Music, Video, Code, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export default function PublicShare({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [submitPassword, setSubmitPassword] = useState("");
  
  const { data, isLoading, isError, error } = useViewPublicShare(token, {
    query: {
      enabled: !!token,
      queryKey: getViewPublicShareQueryKey(token)
    }
  });

  // If the query returns a 401 with an error message saying password required, we might need a custom approach or handle via error state. 
  // We'll simulate a simple password prompt if `requiresPassword` is flagged.

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-16 h-16 text-blue-400" />;
    if (mimeType.startsWith("video/")) return <Video className="w-16 h-16 text-red-400" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-16 h-16 text-yellow-400" />;
    if (mimeType.includes("pdf")) return <FileText className="w-16 h-16 text-red-500" />;
    if (mimeType.includes("code") || mimeType.includes("javascript")) return <Code className="w-16 h-16 text-green-400" />;
    return <File className="w-16 h-16 text-muted-foreground" />;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-20 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-background/90 backdrop-blur-[100px]" />
      
      <div className="relative z-10 w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Koshagar</span>
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 border border-white/10 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading shared file...</p>
          </div>
        ) : isError ? (
          <div className="glass-card rounded-2xl p-12 border border-destructive/20 flex flex-col items-center justify-center text-center bg-destructive/5">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Unavailable</h2>
            <p className="text-muted-foreground">This share link is invalid or has expired.</p>
          </div>
        ) : data?.requiresPassword ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 border border-white/10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Protected</h2>
            <p className="text-muted-foreground mb-8">This shared file requires a password to view.</p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              setSubmitPassword(password);
              // re-trigger query with password or custom handling
            }} className="space-y-4">
              <Input 
                type="password" 
                placeholder="Enter password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-14 bg-white/5 border-white/10 text-center text-lg rounded-xl focus:border-primary"
              />
              <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base border-0">
                Unlock
              </Button>
            </form>
          </motion.div>
        ) : data?.file ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-white/10 overflow-hidden"
          >
            <div className="p-10 flex flex-col items-center justify-center bg-white/5 border-b border-white/5">
              <div className="mb-6 drop-shadow-2xl">
                {getIcon(data.file.mimeType)}
              </div>
              <h2 className="text-2xl font-bold text-white text-center break-all mb-2">{data.file.name}</h2>
              <p className="text-muted-foreground">{formatBytes(data.file.size)}</p>
            </div>
            
            <div className="p-6 bg-card/40 flex flex-col gap-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <span>Shared by <strong>{data.sharedBy}</strong></span>
                <span>{new Date(data.file.createdAt).toLocaleDateString()}</span>
              </div>
              
              <Button 
                className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground text-lg shadow-xl shadow-primary/20 hover-lift border-0 font-medium"
                disabled={!data.allowDownload}
              >
                <Download className="w-5 h-5 mr-2" />
                {data.allowDownload ? "Download File" : "View Only"}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
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
