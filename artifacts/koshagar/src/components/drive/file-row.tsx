import React from "react";
import { Link } from "wouter";
import { FileItem } from "@workspace/api-client-react";
import { 
  Folder, File, Image as ImageIcon, FileText, Music, Video, Code,
  MoreVertical, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FileRow({ 
  item,
  onContextMenu
}: { 
  item: FileItem,
  onContextMenu: (e: React.MouseEvent, item: FileItem) => void
}) {
  const isFolder = item.type === "folder";
  
  const getIcon = () => {
    if (isFolder) return <Folder className="w-5 h-5 text-primary fill-primary/20" />;
    
    if (item.mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-400" />;
    if (item.mimeType.startsWith("video/")) return <Video className="w-5 h-5 text-red-400" />;
    if (item.mimeType.startsWith("audio/")) return <Music className="w-5 h-5 text-yellow-400" />;
    if (item.mimeType.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
    if (item.mimeType.includes("code") || item.mimeType.includes("javascript")) return <Code className="w-5 h-5 text-green-400" />;
    
    return <File className="w-5 h-5 text-muted-foreground" />;
  };

  const content = (
    <div 
      className="grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors cursor-pointer group"
      onContextMenu={(e) => onContextMenu(e, item)}
    >
      <div className="col-span-6 md:col-span-5 flex items-center gap-3 overflow-hidden">
        <div className="flex-shrink-0 relative">
          {getIcon()}
          {item.starred && (
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-[2px]">
              <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
            </div>
          )}
        </div>
        <span className="font-medium text-sm text-foreground truncate">{item.name}</span>
      </div>
      
      <div className="col-span-3 hidden md:block text-sm text-muted-foreground truncate">
        {new Date(item.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>
      
      <div className="col-span-2 hidden md:block text-sm text-muted-foreground">
        {isFolder ? "--" : formatBytes(item.size)}
      </div>
      
      <div className="col-span-6 md:col-span-2 flex justify-end items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e, item);
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  if (isFolder) {
    return <Link href={`/drive/folder/${item.id}`}>{content}</Link>;
  }

  return content;
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
