import React, { useState } from "react";
import { useListFiles, useEmptyTrash, FileItem, getListFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Trash() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data, isLoading } = useListFiles({ trash: true });
  const emptyTrashMutation = useEmptyTrash();
  const queryClient = useQueryClient();
  const [alertOpen, setAlertOpen] = useState(false);

  const items = [...(data?.folders || []), ...(data?.files || [])];

  const handleEmptyTrash = () => {
    emptyTrashMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Trash emptied completely.");
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        setAlertOpen(false);
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
        </div>
        <div className="flex items-center gap-4">
          {items.length > 0 && (
            <Button 
              variant="destructive" 
              className="rounded-full shadow-lg shadow-destructive/20 border-0 h-9"
              onClick={() => setAlertOpen(true)}
            >
              Empty Trash
            </Button>
          )}
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-full h-8 w-8 ${viewMode === "grid" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-full h-8 w-8 ${viewMode === "list" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          title="Trash is clean" 
          description="Nothing to see here. Your trash is completely empty." 
        />
      ) : (
        <div className="pb-20 opacity-70 grayscale-[0.5]">
          <FileGrid 
            items={items} 
            viewMode={viewMode} 
            onContextMenu={() => {}} 
          />
        </div>
      )}

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="glass-card border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all items in the trash. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleEmptyTrash();
              }} 
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0"
              disabled={emptyTrashMutation.isPending}
            >
              {emptyTrashMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
