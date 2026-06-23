import React, { useState } from "react";
import { useListFiles, useEmptyTrash, FileItem, getListFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { ShareModal } from "@/components/modals/share-modal";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";
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
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);

  const items = [...(data?.folders || []), ...(data?.files || [])];

  const handleEmptyTrash = () => {
    emptyTrashMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Trash emptied completely.");
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
        setAlertOpen(false);
      },
    });
  };

  const actions = {
    onShare: setShareItem,
    onMove: () => {},
    onRename: () => {},
    onPreview: setPreviewItem,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Trash</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-400/50 h-8 px-3 text-xs gap-1.5"
              onClick={() => setAlertOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Empty Trash
            </Button>
          )}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-full h-7 w-7 ${viewMode === "grid" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-full h-7 w-7 ${viewMode === "list" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">Items in trash are permanently deleted after 30 days.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Trash is empty"
          description="Nothing to see here — your trash is completely clean ✨"
        />
      ) : (
        <div className="pb-16 opacity-80 saturate-50">
          <FileGrid items={items} viewMode={viewMode} actions={actions} />
        </div>
      )}

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="glass-card border-white/10 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently empty trash?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete all {items.length} item{items.length !== 1 ? "s" : ""} in the trash. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-white/10 hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleEmptyTrash(); }}
              className="rounded-full bg-red-500 text-white hover:bg-red-600 border-0"
              disabled={emptyTrashMutation.isPending}
            >
              {emptyTrashMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareModal open={!!shareItem} onOpenChange={(v) => !v && setShareItem(null)} item={shareItem} />
      <FilePreviewModal open={!!previewItem} onOpenChange={(v) => !v && setPreviewItem(null)} item={previewItem} />
    </div>
  );
}
