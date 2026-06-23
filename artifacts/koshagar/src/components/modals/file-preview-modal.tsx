import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem } from "@workspace/api-client-react";
import {
  X, Download, Share2, Star, ZoomIn, ZoomOut, RotateCcw,
  FileText, Image as ImageIcon, Video, Music, Code, File,
  Edit3, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStarFile, getListFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function formatBytes(bytes: number) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileType(mimeType: string): "image" | "video" | "audio" | "text" | "code" | "pdf" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (
    mimeType.includes("javascript") || mimeType.includes("typescript") ||
    mimeType.includes("json") || mimeType.includes("xml") ||
    mimeType.includes("html") || mimeType.includes("css") ||
    mimeType.includes("python") || mimeType.includes("ruby") || mimeType.includes("rust")
  ) return "code";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

function getFileIcon(mimeType: string, cls = "w-5 h-5") {
  const type = getFileType(mimeType);
  switch (type) {
    case "image": return <ImageIcon className={`${cls} text-blue-400`} />;
    case "video": return <Video className={`${cls} text-rose-400`} />;
    case "audio": return <Music className={`${cls} text-amber-400`} />;
    case "pdf": return <FileText className={`${cls} text-red-500`} />;
    case "code": return <Code className={`${cls} text-emerald-400`} />;
    case "text": return <FileText className={`${cls} text-blue-300`} />;
    default: return <File className={`${cls} text-muted-foreground`} />;
  }
}

function ImageViewer({ item }: { item: FileItem }) {
  const [zoom, setZoom] = React.useState(1);
  const src = item.thumbnailUrl || null;

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
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-muted-foreground p-8 text-center">
            <ImageIcon className="w-16 h-16 opacity-20" />
            <div>
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="text-sm mt-1 opacity-60">Image preview unavailable</p>
              <p className="text-xs mt-1 opacity-40">Connect object storage to enable previews</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="rounded-full w-8 h-8 hover:bg-white/10">
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" onClick={() => setZoom(1)} className="rounded-full h-8 px-3 text-xs hover:bg-white/10 tabular-nums min-w-[52px]">
          {Math.round(zoom * 100)}%
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="rounded-full w-8 h-8 hover:bg-white/10">
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="rounded-full w-8 h-8 hover:bg-white/10">
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function VideoViewer({ item }: { item: FileItem }) {
  const src = item.thumbnailUrl || null;
  return (
    <div className="flex-1 flex items-center justify-center bg-black/40 rounded-xl overflow-hidden min-h-0">
      {src ? (
        <video controls className="max-w-full max-h-full rounded-lg" src={src} />
      ) : (
        <div className="flex flex-col items-center gap-3 text-muted-foreground p-8 text-center">
          <Video className="w-16 h-16 opacity-20" />
          <div>
            <p className="font-semibold text-foreground">{item.name}</p>
            <p className="text-sm opacity-60 mt-1">Video preview unavailable</p>
            <p className="text-xs opacity-40 mt-1">Connect object storage to enable playback</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AudioViewer({ item }: { item: FileItem }) {
  const src = item.thumbnailUrl || null;
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="flex flex-col items-center gap-5 p-8 w-full max-w-sm">
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
          <Music className="w-14 h-14 text-amber-400/60" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">{item.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{formatBytes(item.size)}</p>
        </div>
        {src ? (
          <audio controls src={src} className="w-full" />
        ) : (
          <p className="text-sm text-muted-foreground/60 text-center">Audio playback requires file storage</p>
        )}
      </div>
    </div>
  );
}

function TextEditor({ item, isEditing, onEditingChange }: { item: FileItem; isEditing: boolean; onEditingChange: (v: boolean) => void }) {
  const placeholder = `# ${item.name}\n\nThis is where your file content would appear once connected to object storage.\n\nKoshagar stores file metadata. To enable real text editing and viewing, connect Replit Object Storage.\n\nIn the meantime, you can freely edit this text — it simulates the editing experience.`;
  const [content, setContent] = React.useState(placeholder);
  const [saved, setSaved] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setSaved(true);
    onEditingChange(false);
    toast.success("Changes saved.");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-hidden">
      {isEditing && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">Editing mode — changes are local only</span>
          <Button size="sm" onClick={handleSave} className="rounded-full h-7 px-3 text-xs bg-primary/20 text-primary hover:bg-primary/30 border-0 gap-1.5">
            <Save className="w-3 h-3" />
            Save
          </Button>
        </div>
      )}
      <div className="flex-1 overflow-hidden rounded-xl bg-black/20 border border-white/5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={!isEditing}
          className={`w-full h-full p-4 text-sm font-mono leading-relaxed bg-transparent text-foreground resize-none outline-none scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 ${
            isEditing ? "text-white" : "text-muted-foreground"
          }`}
          style={{ minHeight: "100%" }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function OtherViewer({ item }: { item: FileItem }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-0">
      <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 text-center">
        {getFileIcon(item.mimeType, "w-16 h-16 opacity-30")}
        <div>
          <p className="font-semibold text-lg text-foreground">{item.name}</p>
          <p className="text-sm mt-1 opacity-60">{item.mimeType}</p>
          <p className="text-sm mt-1">{formatBytes(item.size)}</p>
          <p className="text-xs mt-4 max-w-xs opacity-50">
            Preview not supported for this file type. Download to view.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full glass mt-2" onClick={() => toast.info("Download requires file storage")}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}

export function FilePreviewModal({
  open,
  onOpenChange,
  item,
  onShare,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null;
  onShare?: (item: FileItem) => void;
}) {
  const queryClient = useQueryClient();
  const starMutation = useStarFile();
  const [isEditing, setIsEditing] = React.useState(false);

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

  if (!item) return null;
  const fileType = getFileType(item.mimeType);
  const canEdit = fileType === "text" || fileType === "code";

  const renderContent = () => {
    switch (fileType) {
      case "image": return <ImageViewer item={item} />;
      case "video": return <VideoViewer item={item} />;
      case "audio": return <AudioViewer item={item} />;
      case "text":
      case "code": return <TextEditor item={item} isEditing={isEditing} onEditingChange={setIsEditing} />;
      default: return <OtherViewer item={item} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setIsEditing(false); onOpenChange(v); }}>
      <DialogContent hideClose className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] glass-card border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col gap-0">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {getFileIcon(item.mimeType)}
            <div className="min-w-0">
              <p className="font-semibold truncate text-sm">{item.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(item.size)} · {item.mimeType}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {canEdit && (
              <Button
                variant="ghost" size="icon"
                onClick={() => setIsEditing(!isEditing)}
                className={`rounded-full w-8 h-8 hover:bg-white/10 ${isEditing ? "text-primary bg-primary/10" : ""}`}
                title={isEditing ? "Stop editing" : "Edit file"}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost" size="icon"
              onClick={handleStar}
              className="rounded-full w-8 h-8 hover:bg-white/10"
              title={item.starred ? "Unstar" : "Star"}
            >
              <Star className={`w-4 h-4 ${item.starred ? "fill-amber-400 text-amber-400" : ""}`} />
            </Button>
            {onShare && (
              <Button
                variant="ghost" size="icon"
                onClick={() => { onShare(item); onOpenChange(false); }}
                className="rounded-full w-8 h-8 hover:bg-white/10"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost" size="icon"
              className="rounded-full w-8 h-8 hover:bg-white/10"
              title="Download"
              onClick={() => toast.info("Download requires file storage integration")}
            >
              <Download className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-white/10 mx-0.5" />
            <Button
              variant="ghost" size="icon"
              onClick={() => { setIsEditing(false); onOpenChange(false); }}
              className="rounded-full w-8 h-8 hover:bg-white/10"
              title="Close"
            >
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
