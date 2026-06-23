import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { FileItem } from "@workspace/api-client-react";
import { 
  Folder, File, Image as ImageIcon, FileText, Music, Video, Code,
  MoreVertical, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function FileCard({ 
  item,
  onContextMenu
}: { 
  item: FileItem,
  onContextMenu: (e: React.MouseEvent, item: FileItem) => void
}) {
  const isFolder = item.type === "folder";
  
  const getIcon = () => {
    if (isFolder) return <Folder className="w-8 h-8 text-primary" />;
    
    if (item.mimeType.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-blue-400" />;
    if (item.mimeType.startsWith("video/")) return <Video className="w-8 h-8 text-red-400" />;
    if (item.mimeType.startsWith("audio/")) return <Music className="w-8 h-8 text-yellow-400" />;
    if (item.mimeType.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    if (item.mimeType.includes("code") || item.mimeType.includes("javascript")) return <Code className="w-8 h-8 text-green-400" />;
    
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const getCardBg = () => {
    if (isFolder) return "bg-white/5";
    if (item.mimeType.startsWith("image/")) return "bg-blue-500/5";
    if (item.mimeType.startsWith("video/")) return "bg-red-500/5";
    if (item.mimeType.startsWith("audio/")) return "bg-yellow-500/5";
    return "bg-white/5";
  };

  const content = (
    <div 
      className={`group relative flex flex-col p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer h-full hover-lift ${getCardBg()}`}
      onContextMenu={(e) => onContextMenu(e, item)}
    >
      {item.starred && (
        <div className="absolute top-3 left-3">
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500 drop-shadow-md" />
        </div>
      )}
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 rounded-full bg-background/50 hover:bg-white/10 backdrop-blur-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e, item);
          }}
        >
          <MoreVertical className="w-4 h-4 text-white" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center py-6">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {getIcon()}
        </motion.div>
      </div>
      
      <div className="mt-auto">
        <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{isFolder ? "--" : formatBytes(item.size)}</p>
          <p className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
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
