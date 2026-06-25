import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem, useStarFile, useGetFile, getListFilesQueryKey, getGetFileQueryKey } from "@workspace/api-client-react";
import {
  X, Download, Share2, Star, ZoomIn, ZoomOut, RotateCcw,
  FileText, Image as ImageIcon, Video, Music, Code, File, Loader2, Edit2, Check, XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function formatBytes(bytes: number) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileCategory(mimeType: string): "image" | "video" | "audio" | "text" | "code" | "markdown" | "pdf" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("markdown") || mimeType.includes("md")) return "markdown";
  if (
    mimeType.includes("javascript") || mimeType.includes("typescript") ||
    mimeType.includes("json") || mimeType.includes("xml") ||
    mimeType.includes("html") || mimeType.includes("css") ||
    mimeType.includes("python") || mimeType.includes("shellscript") ||
    mimeType.includes("sql") || mimeType.includes("yaml") ||
    mimeType.includes("rust") || mimeType.includes("go") || mimeType.includes("java")
  ) return "code";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

function getFileIcon(mimeType: string, cls = "w-4.5 h-4.5") {
  const cat = getFileCategory(mimeType);
  switch (cat) {
    case "image": return <ImageIcon className={`${cls} text-blue-400`} />;
    case "video": return <Video className={`${cls} text-rose-400`} />;
    case "audio": return <Music className={`${cls} text-amber-400`} />;
    case "pdf": return <FileText className={`${cls} text-red-500`} />;
    case "code": return <Code className={`${cls} text-emerald-400`} />;
    case "text":
    case "markdown": return <FileText className={`${cls} text-sky-300`} />;
    default: return <File className={`${cls} text-muted-foreground`} />;
  }
}

function decodeBase64Text(dataUrl: string): string {
  try {
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
    if (match) {
      const decoded = atob(match[1]);
      return decodeURIComponent(escape(decoded));
    }
    if (dataUrl.startsWith("data:")) {
      const content = dataUrl.split(",").slice(1).join(",");
      return decodeURIComponent(content);
    }
    return dataUrl;
  } catch {
    try { return atob(dataUrl.split(",")[1] ?? ""); } catch { return dataUrl; }
  }
}

function encodeToDataUrl(content: string, mime: string): string {
  try {
    return `data:${mime};base64,` + btoa(unescape(encodeURIComponent(content)));
  } catch {
    return `data:${mime};base64,` + btoa(content);
  }
}

function dataUrlToBlobUrl(dataUrl: string, mime: string): string {
  try {
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
    const b64 = match ? match[1] : dataUrl.split(",").slice(1).join(",");
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  } catch {
    return dataUrl;
  }
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hHlbp])(.+)$/gm, "<p>$1</p>");
}

function ImageViewer({ item, dataUrl }: { item: FileItem; dataUrl: string | null }) {
  const [zoom, setZoom] = React.useState(1);
  const src = dataUrl || item.thumbnailUrl || null;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-black/30 rounded-xl min-h-0">
        {src ? (
          <motion.img
            src={src}
            alt={item.name}
            style={{ scale: zoom }}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        ) : (
          <PlaceholderView icon={<ImageIcon className="w-14 h-14 opacity-15" />} label={item.name} note="Image preview unavailable" />
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5 flex-shrink-0">
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="rounded-full w-8 h-8 hover:bg-white/10"><ZoomOut className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" onClick={() => setZoom(1)} className="rounded-full h-8 px-3 text-xs hover:bg-white/10 tabular-nums min-w-[52px]">{Math.round(zoom * 100)}%</Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="rounded-full w-8 h-8 hover:bg-white/10"><ZoomIn className="w-3.5 h-3.5" /></Button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="rounded-full w-8 h-8 hover:bg-white/10" title="Reset"><RotateCcw className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

function VideoViewer({ item }: { item: FileItem }) {
  const [error, setError] = React.useState(false);

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black rounded-xl min-h-0">
        <PlaceholderView icon={<Video className="w-14 h-14 opacity-15" />} label={item.name} note="Video preview unavailable" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-black rounded-xl overflow-hidden min-h-0">
      <video
        controls
        preload="metadata"
        className="max-w-full max-h-full w-full h-full object-contain"
        src={`/api/files/${item.id}/stream`}
        playsInline
        onError={() => setError(true)}
      />
    </div>
  );
}

function AudioViewer({ item, dataUrl }: { item: FileItem; dataUrl: string | null }) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!dataUrl) return;
    const url = dataUrlToBlobUrl(dataUrl, item.mimeType);
    setBlobUrl(url);
    return () => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); };
  }, [dataUrl, item.mimeType]);

  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="flex flex-col items-center gap-5 p-8 w-full max-w-sm">
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
          <Music className="w-12 h-12 text-amber-400/60" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-base">{item.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{formatBytes(item.size)}</p>
        </div>
        {(blobUrl || dataUrl) ? (
          <audio controls src={blobUrl ?? dataUrl ?? undefined} className="w-full" preload="metadata" />
        ) : (
          <p className="text-sm text-muted-foreground/60">Audio preview unavailable</p>
        )}
      </div>
    </div>
  );
}

function TextViewer({
  item, dataUrl, category, onSaved,
}: { item: FileItem; dataUrl: string | null; category: "text" | "code" | "markdown"; onSaved?: () => void }) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editContent, setEditContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const content = React.useMemo(() => {
    if (!dataUrl) return null;
    return decodeBase64Text(dataUrl);
  }, [dataUrl]);

  const startEdit = () => {
    setEditContent(content ?? "");
    setIsEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const cancelEdit = () => { setIsEditing(false); setEditContent(""); };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const newDataUrl = encodeToDataUrl(editContent, item.mimeType);
      const resp = await fetch(`/api/files/${item.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dataUrl: newDataUrl, size: new Blob([editContent]).size }),
      });
      if (!resp.ok) throw new Error("Save failed");
      toast.success("File saved");
      setIsEditing(false);
      onSaved?.();
    } catch {
      toast.error("Failed to save file");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <div className="flex items-center justify-between px-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">Editing — changes are not auto-saved</span>
          <div className="flex gap-1.5">
            <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving} className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-white">
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button size="sm" onClick={saveEdit} disabled={isSaving} className="h-7 px-2.5 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={e => setEditContent(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full p-4 text-sm font-mono leading-relaxed bg-black/25 border border-primary/30 rounded-xl text-foreground resize-none focus:outline-none focus:border-primary/60 min-h-0"
          style={{ tabSize: 2 }}
        />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <PlaceholderView icon={<FileText className="w-14 h-14 opacity-15" />} label={item.name} note="Text content unavailable" />
      </div>
    );
  }

  if (category === "markdown") {
    return (
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        <div className="flex justify-end flex-shrink-0 px-1">
          <Button variant="ghost" size="sm" onClick={startEdit} className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-white">
            <Edit2 className="w-3 h-3" /> Edit
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto rounded-xl bg-black/20 border border-white/5 p-5 min-h-0">
          <div
            className="prose prose-invert prose-sm max-w-none prose-headings:font-semibold prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-blockquote:border-l-primary/50"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <div className="flex justify-end flex-shrink-0 px-1">
        <Button variant="ghost" size="sm" onClick={startEdit} className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-white">
          <Edit2 className="w-3 h-3" /> Edit
        </Button>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl bg-black/20 border border-white/5 min-h-0">
        <pre className="w-full h-full p-5 text-sm font-mono leading-relaxed text-muted-foreground overflow-auto whitespace-pre-wrap break-all scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {content}
        </pre>
      </div>
    </div>
  );
}

function PdfViewer({ item, dataUrl }: { item: FileItem; dataUrl: string | null }) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!dataUrl) return;
    const url = dataUrlToBlobUrl(dataUrl, "application/pdf");
    setBlobUrl(url);
    return () => { if (url.startsWith("blob:")) URL.revokeObjectURL(url); };
  }, [dataUrl]);

  if (!blobUrl && !dataUrl) {
    return <PlaceholderView icon={<FileText className="w-14 h-14 opacity-15 text-red-400" />} label={item.name} note="PDF preview unavailable" />;
  }

  if (!blobUrl) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <iframe
      src={`${blobUrl}#toolbar=1&navpanes=1`}
      className="flex-1 w-full rounded-xl border border-white/5 min-h-0"
      title={item.name}
    />
  );
}

function PlaceholderView({ icon, label, note }: { icon: React.ReactNode; label: string; note?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-muted-foreground p-8 text-center flex-1 justify-center">
      {icon}
      <div>
        <p className="font-semibold text-foreground text-sm">{label}</p>
        {note && <p className="text-xs mt-1 opacity-60">{note}</p>}
      </div>
    </div>
  );
}

function OtherViewer({ item }: { item: FileItem }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 text-center">
        {getFileIcon(item.mimeType, "w-16 h-16 opacity-20")}
        <div>
          <p className="font-semibold text-base text-foreground">{item.name}</p>
          <p className="text-sm mt-1 opacity-60">{item.mimeType}</p>
          <p className="text-sm mt-0.5">{formatBytes(item.size)}</p>
          <p className="text-xs mt-4 max-w-xs opacity-50">Preview not supported for this file type.</p>
        </div>
      </div>
    </div>
  );
}

export function FilePreviewModal({
  open, onOpenChange, item, onShare,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null;
  onShare?: (item: FileItem) => void;
}) {
  const queryClient = useQueryClient();
  const starMutation = useStarFile();

  const { data: fullFile, isLoading: isLoadingContent, refetch } = useGetFile(item?.id ?? 0, {
    query: {
      queryKey: getGetFileQueryKey(item?.id ?? 0),
      enabled: open && !!item?.id,
      staleTime: 30_000,
    },
  });

  const dataUrl = (fullFile as (FileItem & { dataUrl?: string | null }) | undefined)?.dataUrl ?? null;

  const handleStar = () => {
    if (!item) return;
    starMutation.mutate(
      { id: item.id, data: { starred: !item.starred } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
          toast.success(item.starred ? "Removed from starred" : "Added to starred ⭐");
        },
      }
    );
  };

  const handleDownload = () => {
    const src = dataUrl ?? item?.thumbnailUrl ?? null;
    if (!src) { toast.info("File content not available for download"); return; }
    const a = document.createElement("a");
    a.href = src;
    a.download = item?.name ?? "download";
    a.click();
  };

  const handleSaved = () => {
    if (item) {
      queryClient.invalidateQueries({ queryKey: getGetFileQueryKey(item.id) });
      queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
      refetch();
    }
  };

  if (!item) return null;
  const category = getFileCategory(item.mimeType);
  const isEditable = category === "text" || category === "code" || category === "markdown";

  const renderContent = () => {
    if (isLoadingContent && category !== "image" && category !== "video") {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/40" />
        </div>
      );
    }
    switch (category) {
      case "image":    return <ImageViewer item={item} dataUrl={dataUrl} />;
      case "video":    return <VideoViewer item={item} />;
      case "audio":    return <AudioViewer item={item} dataUrl={dataUrl} />;
      case "pdf":      return <PdfViewer item={item} dataUrl={dataUrl} />;
      case "text":
      case "code":
      case "markdown": return <TextViewer item={item} dataUrl={dataUrl} category={category} onSaved={handleSaved} />;
      default:         return <OtherViewer item={item} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] glass-card border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col gap-0"
      >
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {getFileIcon(item.mimeType, "w-5 h-5")}
            <div className="min-w-0">
              <p className="font-semibold truncate text-sm leading-tight">{item.name}</p>
              <p className="text-xs text-muted-foreground leading-tight">{formatBytes(item.size)} · {item.mimeType}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Button variant="ghost" size="icon" onClick={handleStar} className="rounded-full w-8 h-8 hover:bg-white/10" title={item.starred ? "Unstar" : "Star"}>
              <Star className={`w-4 h-4 ${item.starred ? "fill-amber-400 text-amber-400" : ""}`} />
            </Button>
            {onShare && (
              <Button variant="ghost" size="icon" onClick={() => { onShare(item); onOpenChange(false); }} className="rounded-full w-8 h-8 hover:bg-white/10" title="Share">
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 hover:bg-white/10" title="Download" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full w-8 h-8 hover:bg-white/10" title="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0 h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-4 sm:px-5 py-2 border-t border-white/5 flex-shrink-0 text-xs text-muted-foreground/60">
          <span>Modified {new Date(item.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
          <span>Created {new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
