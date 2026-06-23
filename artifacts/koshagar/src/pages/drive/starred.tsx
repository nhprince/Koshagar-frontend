import React, { useState } from "react";
import { useListFiles, FileItem } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareModal } from "@/components/modals/share-modal";
import { RenameModal } from "@/components/modals/rename-modal";
import { MoveFolderModal } from "@/components/modals/move-folder-modal";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";

export default function Starred() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data, isLoading } = useListFiles({ starred: true });
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [moveItem, setMoveItem] = useState<FileItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);

  const items = [...(data?.folders || []), ...(data?.files || [])];

  const actions = {
    onShare: setShareItem,
    onMove: setMoveItem,
    onRename: setRenameItem,
    onPreview: setPreviewItem,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Starred</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-full h-7 w-7 ${viewMode === "grid" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-full h-7 w-7 ${viewMode === "list" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>
            <List className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No starred items"
          description="Mark important files and folders with a star to find them quickly here."
        />
      ) : (
        <div className="pb-16">
          <FileGrid items={items} viewMode={viewMode} actions={actions} />
        </div>
      )}

      <ShareModal open={!!shareItem} onOpenChange={(v) => !v && setShareItem(null)} item={shareItem} />
      <RenameModal open={!!renameItem} onOpenChange={(v) => !v && setRenameItem(null)} item={renameItem} />
      <MoveFolderModal open={!!moveItem} onOpenChange={(v) => !v && setMoveItem(null)} item={moveItem} />
      <FilePreviewModal open={!!previewItem} onOpenChange={(v) => !v && setPreviewItem(null)} item={previewItem} onShare={setShareItem} />
    </div>
  );
}
