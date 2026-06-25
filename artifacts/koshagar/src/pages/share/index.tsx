import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Hexagon, Download, File, Image as ImageIcon, FileText, Music, Video, Code,
  Lock, Loader2, AlertCircle, Folder, ChevronRight, Home, Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface ShareData {
  requiresPassword?: boolean;
  file: null | {
    id: number; name: string; type: string; mimeType: string; size: number;
    thumbnailUrl: string | null; createdAt: string; updatedAt: string;
  };
  allowDownload: boolean;
  sharedBy: string | null;
  expiresAt: string | null;
}

function formatBytes(bytes: number, d = 1) {
  if (!+bytes) return "0 B";
  const k = 1024, s = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(d))} ${s[i]}`;
}

function triggerDownload(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function getFileIcon(mimeType: string, cls = "w-5 h-5") {
  if (mimeType.startsWith("image/")) return <ImageIcon className={`${cls} text-blue-400`} />;
  if (mimeType.startsWith("video/")) return <Video className={`${cls} text-rose-400`} />;
  if (mimeType.startsWith("audio/")) return <Music className={`${cls} text-amber-400`} />;
  if (mimeType.includes("pdf")) return <FileText className={`${cls} text-red-500`} />;
  if (mimeType.includes("javascript") || mimeType.includes("html") || mimeType.includes("css") || mimeType.includes("typescript")) return <Code className={`${cls} text-emerald-400`} />;
  return <File className={`${cls} text-muted-foreground`} />;
}

export default function PublicShare({ token }: { token: string }) {
  const [passwordInput, setPasswordInput] = useState("");
  const [submittedPassword, setSubmittedPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, isError, error } = useQuery<ShareData>({
    queryKey: ["share", token, submittedPassword],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (submittedPassword) params.set("password", submittedPassword);
      const resp = await fetch(`/api/share/${token}?${params.toString()}`);
      const json = await resp.json();
      if (resp.status === 401) {
        setPasswordError(true);
        const err: any = new Error("Invalid password");
        err.status = 401; err.data = json;
        throw err;
      }
      if (!resp.ok) throw Object.assign(new Error("Not found"), { status: resp.status });
      setPasswordError(false);
      return json;
    },
    enabled: !!token,
    retry: false,
    staleTime: 30_000,
  });

  const handlePasswordSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setSubmittedPassword(passwordInput);
  }, [passwordInput]);

  const handleDownload = async () => {
    if (!data?.allowDownload || !data?.file) return;
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      if (submittedPassword) params.set("password", submittedPassword);
      const resp = await fetch(`/api/share/${token}/download?${params.toString()}`);
      if (!resp.ok) { toast.error((await resp.json().catch(() => ({}))).error ?? "Download failed"); return; }
      const result = await resp.json();
      if (!result.dataUrl) { toast.error("No file data available."); return; }
      triggerDownload(result.dataUrl, result.name);
    } catch { toast.error("Download failed."); }
    finally { setIsDownloading(false); }
  };

  const isFolder = data?.file?.type === "folder";
  const showPasswordForm = data?.requiresPassword || (passwordError && (error as any)?.status === 401);
  const isGenuineError = isError && (error as any)?.status !== 401;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-15 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-background/90 backdrop-blur-[80px]" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Koshagar</span>
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 border border-white/10 flex flex-col items-center justify-center text-center" style={{ background: "hsl(var(--card))" }}>
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading shared content…</p>
          </div>

        ) : isGenuineError ? (
          <div className="glass-card rounded-2xl p-12 border border-destructive/20 flex flex-col items-center justify-center text-center bg-destructive/5" style={{ background: "hsl(var(--card))" }}>
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Unavailable</h2>
            <p className="text-muted-foreground">This share link is invalid or has expired.</p>
          </div>

        ) : showPasswordForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 border border-white/10 text-center max-w-lg mx-auto"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Protected</h2>
            <p className="text-muted-foreground mb-8">Enter the password to access this shared content.</p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={passwordInput}
                  onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  className={`h-14 bg-white/5 text-center text-lg rounded-xl focus:border-primary ${passwordError ? "border-destructive" : "border-white/10"}`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-destructive text-xs mt-2">Incorrect password. Please try again.</p>
                )}
              </div>
              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base border-0">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock"}
              </Button>
            </form>
          </motion.div>

        ) : data?.file && isFolder ? (
          <SharedFolderView token={token} rootFile={data.file} sharedBy={data.sharedBy ?? "Unknown"} allowDownload={data.allowDownload} password={submittedPassword} />

        ) : data?.file ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/10 overflow-hidden max-w-lg mx-auto"
            style={{ background: "hsl(var(--card))" }}
          >
            <div className="p-10 flex flex-col items-center justify-center bg-white/5 border-b border-white/5">
              {data.file.mimeType.startsWith("image/") && data.file.thumbnailUrl ? (
                <div className="mb-6 w-full max-w-xs rounded-xl overflow-hidden shadow-2xl">
                  <img src={data.file.thumbnailUrl} alt={data.file.name} className="w-full h-auto object-cover" />
                </div>
              ) : (
                <div className="mb-6 w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  {getFileIcon(data.file.mimeType, "w-10 h-10")}
                </div>
              )}
              <h2 className="text-2xl font-bold text-white text-center break-all mb-2">{data.file.name}</h2>
              <p className="text-muted-foreground">{formatBytes(data.file.size)}</p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Shared by <strong className="text-white/80">{data.sharedBy}</strong></span>
                <span>{new Date(data.file.createdAt).toLocaleDateString()}</span>
              </div>
              <Button
                onClick={data.allowDownload ? handleDownload : undefined}
                disabled={!data.allowDownload || isDownloading}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground text-lg shadow-xl shadow-primary/20 border-0 font-medium disabled:opacity-60"
              >
                {isDownloading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Preparing…</> : data.allowDownload ? <><Download className="w-5 h-5 mr-2" />Download File</> : "View Only"}
              </Button>
              {!data.allowDownload && <p className="text-center text-xs text-muted-foreground">The owner has disabled downloading for this file.</p>}
            </div>
          </motion.div>
        ) : null}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by <Link href="/drive" className="text-primary hover:underline">Koshagar</Link>
        </p>
      </div>
    </div>
  );
}

interface BrowseItem {
  id: number; name: string; type: string; mimeType: string; size: number;
  thumbnailUrl: string | null; createdAt: string; updatedAt: string;
}
interface BrowseResult {
  rootFolder: { id: number; name: string };
  currentFolder: { id: number; name: string };
  breadcrumb: { id: number; name: string }[];
  folders: BrowseItem[]; files: BrowseItem[];
  allowDownload: boolean; sharedBy: string;
}

function SharedFolderView({ token, rootFile, sharedBy, allowDownload, password }: {
  token: string;
  rootFile: { id: number; name: string; type: string; mimeType: string; size: number; thumbnailUrl: string | null; createdAt: string; updatedAt: string; };
  sharedBy: string; allowDownload: boolean; password: string;
}) {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isZipping, setIsZipping] = useState(false);

  const { data: browseData, isLoading } = useQuery<BrowseResult>({
    queryKey: ["share-browse", token, currentFolderId, password],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentFolderId) params.set("folderId", String(currentFolderId));
      if (password) params.set("password", password);
      const resp = await fetch(`/api/share/${token}/browse?${params.toString()}`);
      if (!resp.ok) throw new Error("Failed to load");
      return resp.json();
    },
    staleTime: 30_000,
  });

  const goTo = (folderId: number | null) => setCurrentFolderId(folderId);

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    if (!allowDownload) return;
    setDownloadingId(fileId);
    try {
      const params = new URLSearchParams();
      if (password) params.set("password", password);
      const resp = await fetch(`/api/share/${token}/file/${fileId}/download?${params.toString()}`);
      if (!resp.ok) { toast.error("Download failed"); return; }
      const result = await resp.json();
      if (result.dataUrl) triggerDownload(result.dataUrl, result.name ?? fileName);
      else toast.error("No file data available.");
    } catch { toast.error("Download failed."); }
    finally { setDownloadingId(null); }
  };

  const handleDownloadZip = async () => {
    if (!allowDownload) return;
    setIsZipping(true);
    try {
      const params = new URLSearchParams();
      if (password) params.set("password", password);
      const resp = await fetch(`/api/share/${token}/download-zip?${params.toString()}`);
      if (!resp.ok) { toast.error("ZIP download failed"); return; }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${rootFile.name}.zip`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success("Folder downloaded as ZIP");
    } catch { toast.error("ZIP download failed."); }
    finally { setIsZipping(false); }
  };

  const isAtRoot = currentFolderId === null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "hsl(var(--card))" }}>
      <div className="px-5 py-4 bg-white/5 border-b border-white/8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Folder className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{rootFile.name}</p>
          <p className="text-xs text-muted-foreground">Shared by {sharedBy}</p>
        </div>
        {allowDownload && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="h-8 px-3 text-xs gap-1.5 text-muted-foreground hover:text-white hover:bg-white/10 flex-shrink-0"
            title="Download entire folder as ZIP"
          >
            {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            {isZipping ? "Zipping…" : "Download ZIP"}
          </Button>
        )}
      </div>

      <div className="px-5 py-2.5 border-b border-white/5 flex items-center gap-1 text-sm overflow-x-auto">
        <button onClick={() => goTo(null)} className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors flex-shrink-0">
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">{rootFile.name}</span>
        </button>
        {browseData?.breadcrumb.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
            <button onClick={() => goTo(crumb.id)} className="text-xs text-muted-foreground hover:text-white transition-colors truncate max-w-[80px] flex-shrink-0">
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
        {!isAtRoot && browseData && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
            <span className="text-xs text-white font-medium truncate max-w-[100px] flex-shrink-0">{browseData.currentFolder.name}</span>
          </>
        )}
      </div>

      <div className="min-h-[280px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : browseData && browseData.folders.length + browseData.files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Folder className="w-10 h-10 text-muted-foreground/25 mb-3" />
            <p className="text-muted-foreground text-sm">This folder is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {browseData?.folders.map((folder, i) => (
                <motion.button key={folder.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => goTo(folder.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group text-left"
                >
                  <Folder className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="flex-1 text-sm text-white truncate">{folder.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </motion.button>
              ))}
              {browseData?.files.map((file, i) => (
                <motion.div key={file.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (browseData.folders.length + i) * 0.03 }}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors group"
                >
                  {file.mimeType.startsWith("image/") && file.thumbnailUrl ? (
                    <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                      <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0">{getFileIcon(file.mimeType, "w-5 h-5")}</div>
                  )}
                  <span className="flex-1 text-sm text-white/80 group-hover:text-white truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground/50 flex-shrink-0 hidden sm:block">{formatBytes(file.size)}</span>
                  {allowDownload && (
                    <Button size="icon" variant="ghost"
                      onClick={() => handleDownloadFile(file.id, file.name)}
                      disabled={downloadingId === file.id}
                      className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground hover:text-white hover:bg-white/10"
                    >
                      {downloadingId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!allowDownload && (
        <div className="px-5 py-3 border-t border-white/5 text-center">
          <p className="text-xs text-muted-foreground">View only — downloads disabled by the owner</p>
        </div>
      )}
    </motion.div>
  );
}
