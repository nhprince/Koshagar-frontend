import React, { useState } from "react";
import { useListFiles, FileItem } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Plus, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateFolderModal } from "@/components/modals/create-folder-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { RenameModal } from "@/components/modals/rename-modal";
import { MoveFolderModal } from "@/components/modals/move-folder-modal";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";
import { UploadOpenContext } from "@/components/layout/drive-layout";

export default function Drive() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data, isLoading } = useListFiles({ folderId: null });
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [moveItem, setMoveItem] = useState<FileItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);

  const uploadContext = React.useContext(UploadOpenContext);

  const folders = data?.folders || [];
  const files = data?.files || [];
  const items = [...folders, ...files];

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
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">My Drive</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {folders.length} folder{folders.length !== 1 ? "s" : ""}, {files.length} file{files.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <Button
              variant="ghost" size="icon"
              onClick={() => setViewMode("grid")}
              className={`rounded-full h-7 w-7 ${viewMode === "grid" ? "bg-white/15 text-white" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              onClick={() => setViewMode("list")}
              className={`rounded-full h-7 w-7 ${viewMode === "list" ? "bg-white/15 text-white" : "text-muted-foreground"}`}
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            className="rounded-full h-8 text-sm hover:bg-white/10 border border-white/10 px-3 gap-1.5"
            onClick={() => setCreateFolderOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            New Folder
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Your drive is empty"
          description="Upload files or create folders to get started."
          action={{ label: "Upload Files", onClick: () => uploadContext?.setUploadOpen(true) }}
        />
      ) : (
        <div className="pb-16 space-y-6">
          {folders.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Folders
              </h2>
              <FileGrid items={folders} viewMode={viewMode} actions={actions} />
            </section>
          )}
          {files.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Files
              </h2>
              <FileGrid items={files} viewMode={viewMode} actions={actions} />
            </section>
          )}
        </div>
      )}

      <CreateFolderModal open={createFolderOpen} onOpenChange={setCreateFolderOpen} folderId={null} />
      <ShareModal open={!!shareItem} onOpenChange={(v) => !v && setShareItem(null)} item={shareItem} />
      <RenameModal open={!!renameItem} onOpenChange={(v) => !v && setRenameItem(null)} item={renameItem} />
      <MoveFolderModal open={!!moveItem} onOpenChange={(v) => !v && setMoveItem(null)} item={moveItem} />
      <FilePreviewModal
        open={!!previewItem}
        onOpenChange={(v) => !v && setPreviewItem(null)}
        item={previewItem}
        onShare={setShareItem}
      />
    </div>
  );
}
