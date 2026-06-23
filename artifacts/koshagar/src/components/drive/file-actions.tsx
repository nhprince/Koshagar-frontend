import React from "react";
import { FileItem, useStarFile, useTrashFile, useDeleteFile, getListFilesQueryKey, getGetStorageUsageQueryKey, useMoveFile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Star, Trash2, FolderInput, Download, Share2, Info, Loader2, Edit2 } from "lucide-react";

export function FileActionsMenu({ 
  item, 
  children,
  onShare,
  onMove
}: { 
  item: FileItem, 
  children: React.ReactNode,
  onShare: (item: FileItem) => void,
  onMove: (item: FileItem) => void
}) {
  const queryClient = useQueryClient();
  const starMutation = useStarFile();
  const trashMutation = useTrashFile();
  const deleteMutation = useDeleteFile();

  const handleStar = () => {
    starMutation.mutate({ id: item.id, data: { starred: !item.starred } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        toast.success(item.starred ? "Removed from starred" : "Added to starred");
      }
    });
  };

  const handleTrash = () => {
    trashMutation.mutate({ id: item.id, data: { trashed: !item.trashed } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        toast.success(item.trashed ? "Restored from trash" : "Moved to trash");
      }
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: item.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStorageUsageQueryKey() });
        toast.success("File permanently deleted");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 glass-card border-white/10 bg-card/80 backdrop-blur-3xl p-1 rounded-xl shadow-2xl">
        <DropdownMenuItem onClick={handleStar} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
          <Star className={`w-4 h-4 mr-2 ${item.starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
          {item.starred ? "Unstar" : "Star"}
        </DropdownMenuItem>
        
        {!item.trashed && (
          <>
            <DropdownMenuItem onClick={() => onShare(item)} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
              <Share2 className="w-4 h-4 mr-2 text-primary" />
              Share
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-white/10 my-1" />
            
            <DropdownMenuItem onClick={() => onMove(item)} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
              <FolderInput className="w-4 h-4 mr-2" />
              Move to...
            </DropdownMenuItem>
          </>
        )}
        
        {item.type === "file" && !item.trashed && (
          <DropdownMenuItem onClick={() => {}} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer">
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator className="bg-white/10 my-1" />
        
        <DropdownMenuItem onClick={handleTrash} className={`rounded-lg cursor-pointer ${item.trashed ? "focus:bg-primary/20 text-primary" : "focus:bg-destructive/20 text-destructive"}`}>
          <Trash2 className="w-4 h-4 mr-2" />
          {item.trashed ? "Restore" : "Move to Trash"}
        </DropdownMenuItem>
        
        {item.trashed && (
          <DropdownMenuItem onClick={handleDelete} className="focus:bg-destructive/20 text-destructive rounded-lg cursor-pointer">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete permanently
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
