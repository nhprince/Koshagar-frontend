import React from "react";
import { Link } from "wouter";
import { FileItem } from "@workspace/api-client-react";
import {
  Folder, File, Image as ImageIcon, FileText, Music, Video, Code,
  MoreVertical, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileActionsMenu } from "./file-actions";
import { FileCardActions } from "./file-card";

export function FileRow({
  item,
  actions,
}: {
  item: FileItem;
  actions: FileCardActions;
}) {
  const isFolder = item.type === "folder";

  const getIcon = () => {
    if (isFolder) return <Folder className="w-4.5 h-4.5 text-primary fill-primary/20" />;
    if (item.mimeType.startsWith("image/")) return <ImageIcon className="w-4.5 h-4.5 text-blue-400" />;
    if (item.mimeType.startsWith("video/")) return <Video className="w-4.5 h-4.5 text-rose-400" />;
    if (item.mimeType.startsWith("audio/")) return <Music className="w-4.5 h-4.5 text-amber-400" />;
    if (item.mimeType.includes("pdf")) return <FileText className="w-4.5 h-4.5 text-red-500" />;
    if (
      item.mimeType.includes("javascript") || item.mimeType.includes("typescript") ||
      item.mimeType.includes("json") || item.mimeType.includes("html") ||
      item.mimeType.includes("css")
    ) return <Code className="w-4.5 h-4.5 text-emerald-400" />;
    return <File className="w-4.5 h-4.5 text-muted-foreground" />;
  };

  const handleClick = () => {
    if (!isFolder && actions.onPreview) {
      actions.onPreview(item);
    }
  };

  const rowContent = (
    <div
      className="grid grid-cols-12 gap-3 px-3 py-2.5 items-center rounded-xl hover:bg-white/5 border border-transparent hover:border-white/8 transition-all duration-150 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center relative">
          {getIcon()}
          {item.starred && (
            <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-[2px]">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            </div>
          )}
        </div>
        <span className="font-medium text-sm text-foreground truncate">{item.name}</span>
      </div>

      <div className="col-span-3 hidden md:block text-sm text-muted-foreground truncate">
        {new Date(item.updatedAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
      </div>

      <div className="col-span-2 hidden md:block text-sm text-muted-foreground">
        {isFolder ? "—" : formatBytes(item.size)}
      </div>

      <div className="col-span-6 md:col-span-2 flex justify-end items-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
              className="w-7 h-7 rounded-full text-muted-foreground hover:text-white hover:bg-white/10"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </FileActionsMenu>
        </div>
      </div>
    </div>
  );

  if (isFolder) {
    return <Link href={`/drive/folder/${item.id}`}>{rowContent}</Link>;
  }
  return rowContent;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
