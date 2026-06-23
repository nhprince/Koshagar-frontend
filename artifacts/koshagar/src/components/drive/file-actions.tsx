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
import { Star, Trash2, FolderInput, Download, Share2, Loader2, Edit2, Eye } from "lucide-react";

export function FileActionsMenu({ 
  item, 
  children,
  onShare,
  onMove,
  onRename,
  onPreview,
}: { 
  item: FileItem, 
  children: React.ReactNode,
  onShare: (item: FileItem) => void,
  onMove: (item: FileItem) => void,
  onRename: (item: FileItem) => void,
  onPreview?: (item: FileItem) => void,
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
      <DropdownMenuContent align="end" className="w-52 glass-card border-white/10 bg-card/90 backdrop-blur-3xl p-1.5 rounded-xl shadow-2xl z-50">
        {item.type === "file" && onPreview && (
          <>
            <DropdownMenuItem onClick={() => onPreview(item)} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer text-sm">
              <Eye className="w-4 h-4 mr-2.5 text-primary" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10 my-1" />
          </>
        )}

        <DropdownMenuItem onClick={handleStar} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer text-sm">
          <Star className={`w-4 h-4 mr-2.5 ${item.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
          {item.starred ? "Unstar" : "Star"}
        </DropdownMenuItem>

        {!item.trashed && (
          <>
            <DropdownMenuItem onClick={() => onRename(item)} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer text-sm">
              <Edit2 className="w-4 h-4 mr-2.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onShare(item)} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer text-sm">
              <Share2 className="w-4 h-4 mr-2.5 text-primary" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(item)} className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer text-sm">
              <FolderInput className="w-4 h-4 mr-2.5" />
              Move to...
            </DropdownMenuItem>
          </>
        )}

        {item.type === "file" && !item.trashed && (
          <DropdownMenuItem className="focus:bg-white/10 focus:text-white rounded-lg cursor-pointer text-sm">
            <Download className="w-4 h-4 mr-2.5" />
            Download
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-white/10 my-1" />

        <DropdownMenuItem onClick={handleTrash} className={`rounded-lg cursor-pointer text-sm ${item.trashed ? "focus:bg-primary/20 text-primary" : "focus:bg-red-500/10 text-red-400"}`}>
          <Trash2 className="w-4 h-4 mr-2.5" />
          {item.trashed ? "Restore" : "Move to Trash"}
        </DropdownMenuItem>

        {item.trashed && (
          <DropdownMenuItem onClick={handleDelete} className="focus:bg-red-500/10 text-red-400 rounded-lg cursor-pointer text-sm">
            <Trash2 className="w-4 h-4 mr-2.5" />
            Delete permanently
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
