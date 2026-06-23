import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { FileItem } from "@workspace/api-client-react";
import {
  Folder, File, Image as ImageIcon, FileText, Music, Video, Code,
  MoreVertical, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileActionsMenu } from "./file-actions";

export interface FileCardActions {
  onShare: (item: FileItem) => void;
  onMove: (item: FileItem) => void;
  onRename: (item: FileItem) => void;
  onPreview?: (item: FileItem) => void;
}

export function FileCard({
  item,
  actions,
}: {
  item: FileItem;
  actions: FileCardActions;
}) {
  const isFolder = item.type === "folder";

  const getIcon = () => {
    if (isFolder) return <Folder className="w-9 h-9 text-primary fill-primary/15" />;
    if (item.mimeType.startsWith("image/")) return <ImageIcon className="w-9 h-9 text-blue-400" />;
    if (item.mimeType.startsWith("video/")) return <Video className="w-9 h-9 text-rose-400" />;
    if (item.mimeType.startsWith("audio/")) return <Music className="w-9 h-9 text-amber-400" />;
    if (item.mimeType.includes("pdf")) return <FileText className="w-9 h-9 text-red-500" />;
    if (
      item.mimeType.includes("javascript") || item.mimeType.includes("typescript") ||
      item.mimeType.includes("json") || item.mimeType.includes("html") ||
      item.mimeType.includes("css") || item.mimeType.includes("python")
    ) return <Code className="w-9 h-9 text-emerald-400" />;
    return <File className="w-9 h-9 text-muted-foreground" />;
  };

  const getCardAccent = () => {
    if (isFolder) return "hover:border-primary/30 hover:shadow-primary/10";
    if (item.mimeType.startsWith("image/")) return "hover:border-blue-500/30 hover:shadow-blue-500/10";
    if (item.mimeType.startsWith("video/")) return "hover:border-rose-500/30 hover:shadow-rose-500/10";
    if (item.mimeType.startsWith("audio/")) return "hover:border-amber-500/30 hover:shadow-amber-500/10";
    return "hover:border-white/15 hover:shadow-white/5";
  };

  const getCardBg = () => {
    if (isFolder) return "bg-primary/5";
    if (item.mimeType.startsWith("image/")) return "bg-blue-500/5";
    if (item.mimeType.startsWith("video/")) return "bg-rose-500/5";
    if (item.mimeType.startsWith("audio/")) return "bg-amber-500/5";
    if (item.mimeType.includes("pdf")) return "bg-red-500/5";
    return "bg-white/3";
  };

  const cardContent = (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group relative flex flex-col rounded-2xl border border-white/8 cursor-pointer transition-all duration-200 overflow-hidden shadow-sm hover:shadow-lg ${getCardBg()} ${getCardAccent()}`}
    >
      {item.starred && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow" />
        </div>
      )}

      <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <FileActionsMenu
          item={item}
          onShare={actions.onShare}
          onMove={actions.onMove}
          onRename={actions.onRename}
          onPreview={actions.onPreview}
        >
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 rounded-full bg-background/70 hover:bg-white/15 backdrop-blur-sm"
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="w-3.5 h-3.5 text-white" />
          </Button>
        </FileActionsMenu>
      </div>

      <div className="flex items-center justify-center py-7 px-4">
        <motion.div
          whileHover={{ scale: 1.08 }}
          transition={{ type: "spring", stiffness: 400, damping: 12 }}
        >
          {getIcon()}
        </motion.div>
      </div>

      <div className="px-3 pb-3 border-t border-white/5 pt-2.5 bg-white/3">
        <p className="font-medium text-sm text-foreground truncate leading-tight">{item.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground/70">
            {isFolder ? "Folder" : formatBytes(item.size)}
          </p>
          <p className="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(item.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>
    </motion.div>
  );

  if (isFolder) {
    return <Link href={`/drive/folder/${item.id}`}>{cardContent}</Link>;
  }

  return (
    <div onClick={() => actions.onPreview?.(item)}>
      {cardContent}
    </div>
  );
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
