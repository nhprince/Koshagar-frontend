import React, { useState } from "react";
import { useViewPublicShare, getViewPublicShareQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Hexagon, Download, File, Image as ImageIcon, FileText, Music, Video, Code,
  Lock, Loader2, AlertCircle, Folder, ChevronRight, Home, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PublicShare({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [submitPassword, setSubmitPassword] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, isError } = useViewPublicShare(token, {
    query: {
      enabled: !!token,
      queryKey: getViewPublicShareQueryKey(token),
    }
  });

  const getIcon = (mimeType: string, size = 16) => {
    const cls = `w-${size} h-${size}`;
    if (mimeType.startsWith("image/")) return <ImageIcon className={`${cls} text-blue-400`} />;
    if (mimeType.startsWith("video/")) return <Video className={`${cls} text-red-400`} />;
    if (mimeType.startsWith("audio/")) return <Music className={`${cls} text-yellow-400`} />;
    if (mimeType.includes("pdf")) return <FileText className={`${cls} text-red-500`} />;
    if (mimeType.includes("code") || mimeType.includes("javascript")) return <Code className={`${cls} text-green-400`} />;
    return <File className={`${cls} text-muted-foreground`} />;
  };

  const handleDownload = async () => {
    if (!data?.allowDownload || !data?.file) return;
    setIsDownloading(true);
    try {
      const params = new URLSearchParams();
      if (submitPassword) params.set("password", submitPassword);
      const resp = await fetch(`/api/share/${token}/download?${params.toString()}`, {
        credentials: "include",
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error ?? "Download failed");
        return;
      }
      const result = await resp.json();
      if (!result.dataUrl) {
        toast.error("No file data available for download.");
        return;
      }
      triggerDownload(result.dataUrl, result.name);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isFolder = data?.file?.type === "folder";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 z-0 opacity-20 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-background/90 backdrop-blur-[100px]" />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Koshagar</span>
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 border border-white/10 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading shared content...</p>
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
            className="glass-card rounded-2xl p-8 border border-white/10 text-center max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Protected</h2>
            <p className="text-muted-foreground mb-8">This shared content requires a password to view.</p>

            <form onSubmit={(e) => { e.preventDefault(); setSubmitPassword(password); }} className="space-y-4">
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
        ) : data?.file && isFolder ? (
          <SharedFolderView token={token} rootFile={{ ...data.file, thumbnailUrl: data.file.thumbnailUrl ?? null }} sharedBy={data.sharedBy} allowDownload={data.allowDownload} submitPassword={submitPassword} />
        ) : data?.file ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl border border-white/10 overflow-hidden max-w-lg mx-auto"
          >
            <div className="p-10 flex flex-col items-center justify-center bg-white/5 border-b border-white/5">
              {data.file.mimeType.startsWith("image/") && data.file.thumbnailUrl ? (
                <div className="mb-6 w-full max-w-xs rounded-xl overflow-hidden shadow-2xl">
                  <img src={data.file.thumbnailUrl} alt={data.file.name} className="w-full h-auto object-cover" />
                </div>
              ) : (
                <div className="mb-6 drop-shadow-2xl">{getIcon(data.file.mimeType, 16)}</div>
              )}
              <h2 className="text-2xl font-bold text-white text-center break-all mb-2">{data.file.name}</h2>
              <p className="text-muted-foreground">{formatBytes(data.file.size)}</p>
            </div>

            <div className="p-6 bg-card/40 flex flex-col gap-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <span>Shared by <strong className="text-white/80">{data.sharedBy}</strong></span>
                <span>{new Date(data.file.createdAt).toLocaleDateString()}</span>
              </div>

              <Button
                onClick={data.allowDownload ? handleDownload : undefined}
                disabled={!data.allowDownload || isDownloading}
                className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground text-lg shadow-xl shadow-primary/20 border-0 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Preparing download…</>
                ) : data.allowDownload ? (
                  <><Download className="w-5 h-5 mr-2" />Download File</>
                ) : (
                  "View Only"
                )}
              </Button>

              {!data.allowDownload && (
                <p className="text-center text-xs text-muted-foreground">
                  The owner has disabled downloading for this file.
                </p>
              )}
            </div>
          </motion.div>
        ) : null}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Powered by{" "}
          <Link href="/drive" className="text-primary hover:underline">Koshagar</Link>
        </p>
      </div>
    </div>
  );
}

interface BrowseItem {
  id: number;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BrowseResult {
  rootFolder: { id: number; name: string };
  currentFolder: { id: number; name: string };
  breadcrumb: { id: number; name: string }[];
  folders: BrowseItem[];
  files: BrowseItem[];
  allowDownload: boolean;
  sharedBy: string;
}

function SharedFolderView({
  token,
  rootFile,
  sharedBy,
  allowDownload,
  submitPassword,
}: {
  token: string;
  rootFile: { id: number; name: string; type: string; mimeType: string; size: number; thumbnailUrl: string | null; createdAt: string; updatedAt: string; };
  sharedBy: string;
  allowDownload: boolean;
  submitPassword: string;
}) {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [browseData, setBrowseData] = useState<BrowseResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchContents = async (folderId: number | null) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", String(folderId));
      if (submitPassword) params.set("password", submitPassword);
      const resp = await fetch(`/api/share/${token}/browse?${params.toString()}`);
      if (!resp.ok) {
        toast.error("Failed to load folder contents.");
        return;
      }
      const data: BrowseResult = await resp.json();
      setBrowseData(data);
      setCurrentFolderId(folderId);
    } catch {
      toast.error("Failed to load folder contents.");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchContents(null);
  }, [token]);

  const handleFolderClick = (folderId: number) => {
    fetchContents(folderId);
  };

  const handleBreadcrumbClick = (folderId: number | null) => {
    fetchContents(folderId);
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    if (!allowDownload) return;
    setDownloadingId(fileId);
    try {
      const params = new URLSearchParams();
      if (submitPassword) params.set("password", submitPassword);
      const resp = await fetch(`/api/share/${token}/file/${fileId}/download?${params.toString()}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error ?? "Download failed");
        return;
      }
      const result = await resp.json();
      if (!result.dataUrl) {
        toast.error("No file data available.");
        return;
      }
      triggerDownload(result.dataUrl, result.name);
    } catch {
      toast.error("Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (mimeType.startsWith("video/")) return <Video className="w-5 h-5 text-rose-400" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-5 h-5 text-amber-400" />;
    if (mimeType.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const isAtRoot = currentFolderId === null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-white/10 overflow-hidden"
    >
      <div className="px-6 py-4 bg-white/5 border-b border-white/8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Folder className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white truncate">{rootFile.name}</p>
          <p className="text-xs text-muted-foreground">Shared by {sharedBy}</p>
        </div>
      </div>

      <div className="px-6 py-3 border-b border-white/5 flex items-center gap-1.5 text-sm overflow-x-auto">
        <button
          onClick={() => handleBreadcrumbClick(null)}
          className="flex items-center gap-1 text-muted-foreground hover:text-white transition-colors flex-shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{rootFile.name}</span>
        </button>
        {browseData?.breadcrumb.map((crumb) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
            <button
              onClick={() => handleBreadcrumbClick(crumb.id)}
              className="text-muted-foreground hover:text-white transition-colors truncate max-w-[100px] flex-shrink-0"
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
        {!isAtRoot && browseData && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
            <span className="text-white font-medium truncate max-w-[120px] flex-shrink-0">
              {browseData.currentFolder.name}
            </span>
          </>
        )}
      </div>

      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : browseData && (browseData.folders.length + browseData.files.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Folder className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">This folder is empty</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {browseData?.folders.map((folder, i) => (
                <motion.button
                  key={folder.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => handleFolderClick(folder.id)}
                  className="w-full flex items-center gap-3 px-6 py-3.5 hover:bg-white/5 transition-colors group text-left"
                >
                  <Folder className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="flex-1 text-sm text-white group-hover:text-white truncate">{folder.name}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                </motion.button>
              ))}
              {browseData?.files.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ((browseData.folders.length + i) * 0.03) }}
                  className="flex items-center gap-3 px-6 py-3.5 hover:bg-white/5 transition-colors group"
                >
                  {file.mimeType.startsWith("image/") && file.thumbnailUrl ? (
                    <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                      <img src={file.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0">{getFileIcon(file.mimeType)}</div>
                  )}
                  <span className="flex-1 text-sm text-white/80 group-hover:text-white truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground/60 flex-shrink-0 hidden sm:block">
                    {formatBytes(file.size)}
                  </span>
                  {allowDownload && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownloadFile(file.id, file.name)}
                      disabled={downloadingId === file.id}
                      className="w-7 h-7 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title="Download"
                    >
                      {downloadingId === file.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {!allowDownload && (
        <div className="px-6 py-3 border-t border-white/5 bg-white/3 text-center">
          <p className="text-xs text-muted-foreground">View only — downloads disabled by the owner</p>
        </div>
      )}
    </motion.div>
  );
}

function triggerDownload(dataUrl: string, name: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
