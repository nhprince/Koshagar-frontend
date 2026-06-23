import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem } from "@workspace/api-client-react";
import {
  X, Download, Share2, Star, ZoomIn, ZoomOut, RotateCcw,
  FileText, Image as ImageIcon, Video, Music, Code, File,
  ChevronLeft, ChevronRight,
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
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("python") ||
    mimeType.includes("ruby") ||
    mimeType.includes("rust")
  ) return "code";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

function getFileIcon(mimeType: string, size = "w-16 h-16") {
  const type = getFileType(mimeType);
  const cls = `${size} opacity-40`;
  switch (type) {
    case "image": return <ImageIcon className={`${cls} text-blue-400`} />;
    case "video": return <Video className={`${cls} text-red-400`} />;
    case "audio": return <Music className={`${cls} text-yellow-400`} />;
    case "pdf": return <FileText className={`${cls} text-red-500`} />;
    case "code": return <Code className={`${cls} text-green-400`} />;
    case "text": return <FileText className={`${cls} text-blue-300`} />;
    default: return <File className={`${cls} text-muted-foreground`} />;
  }
}

function ImageViewer({ item }: { item: FileItem }) {
  const [zoom, setZoom] = React.useState(1);
  const src = item.thumbnailUrl || null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center overflow-hidden relative bg-black/20 rounded-xl">
        {src ? (
          <motion.img
            src={src}
            alt={item.name}
            style={{ scale: zoom }}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ImageIcon className="w-20 h-20 opacity-20" />
            <div className="text-center">
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-sm mt-1 opacity-60">Preview not available</p>
              <p className="text-xs mt-1">Image would render here with actual file storage</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3">
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="rounded-full w-8 h-8 hover:bg-white/10">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" onClick={() => setZoom(1)} className="rounded-full h-8 px-3 text-xs hover:bg-white/10 tabular-nums">
          {Math.round(zoom * 100)}%
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="rounded-full w-8 h-8 hover:bg-white/10">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="rounded-full w-8 h-8 hover:bg-white/10">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function VideoViewer({ item }: { item: FileItem }) {
  const src = item.thumbnailUrl || null;
  return (
    <div className="flex-1 flex items-center justify-center bg-black/30 rounded-xl overflow-hidden">
      {src ? (
        <video controls className="max-w-full max-h-full rounded-lg" src={src} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground p-8">
          <Video className="w-20 h-20 opacity-20" />
          <div className="text-center">
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-sm mt-1 opacity-60">Video preview not available</p>
            <p className="text-xs mt-1">Upload real files to enable video playback</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AudioViewer({ item }: { item: FileItem }) {
  const src = item.thumbnailUrl || null;
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20 flex items-center justify-center">
          <Music className="w-16 h-16 text-yellow-400 opacity-60" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg">{item.name}</p>
          <p className="text-sm text-muted-foreground mt-1">{formatBytes(item.size)}</p>
        </div>
        {src && <audio controls src={src} className="w-full max-w-sm" />}
        {!src && <p className="text-sm text-muted-foreground">Audio playback requires file storage integration</p>}
      </div>
    </div>
  );
}

function TextViewer({ item }: { item: FileItem }) {
  const [content] = React.useState("# Sample Content\n\nThis file's content would appear here once connected to object storage.\n\nKoshagar currently stores file metadata. Connect object storage (e.g. Replit Object Storage) to enable actual file reading and editing.");

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <pre className="text-sm text-muted-foreground font-mono p-4 bg-black/20 rounded-xl h-full whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}

function OtherViewer({ item }: { item: FileItem }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-muted-foreground p-8">
        {getFileIcon(item.mimeType, "w-20 h-20")}
        <div className="text-center">
          <p className="font-semibold text-lg text-foreground">{item.name}</p>
          <p className="text-sm mt-1">{item.mimeType}</p>
          <p className="text-sm mt-1 opacity-60">{formatBytes(item.size)}</p>
          <p className="text-xs mt-4 max-w-xs text-center">
            Preview not supported for this file type. Download the file to view it.
          </p>
        </div>
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

  const handleStar = () => {
    if (!item) return;
    starMutation.mutate(
      { id: item.id, data: { starred: !item.starred } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
          toast.success(item.starred ? "Removed from starred" : "Added to starred");
        },
      }
    );
  };

  if (!item) return null;

  const fileType = getFileType(item.mimeType);

  const renderContent = () => {
    switch (fileType) {
      case "image": return <ImageViewer item={item} />;
      case "video": return <VideoViewer item={item} />;
      case "audio": return <AudioViewer item={item} />;
      case "text":
      case "code": return <TextViewer item={item} />;
      default: return <OtherViewer item={item} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[90vh] glass-card border-white/10 rounded-2xl p-0 overflow-hidden flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {getFileIcon(item.mimeType, "w-5 h-5")}
            <div className="min-w-0">
              <p className="font-semibold truncate text-sm sm:text-base">{item.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(item.size)} · {item.mimeType}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleStar}
              className="rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-white/10"
              title={item.starred ? "Unstar" : "Star"}
            >
              <Star className={`w-4 h-4 ${item.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
            </Button>
            {onShare && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onShare(item)}
                className="rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-white/10"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-white/10"
              title="Download"
              onClick={() => toast.info("Download requires file storage integration")}
            >
              <Download className="w-4 h-4" />
            </Button>
            <div className="w-px h-5 bg-white/10 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full w-8 h-8 sm:w-9 sm:h-9 hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-h-0 h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-t border-white/5 flex-shrink-0 text-xs text-muted-foreground">
          <span>Modified {new Date(item.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
          <span>Created {new Date(item.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
