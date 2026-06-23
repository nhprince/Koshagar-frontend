import React, { useState } from "react";
import { Link } from "wouter";
import { useGetFolder, useListFiles, FileItem, getGetFolderQueryKey } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Plus, Loader2, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateFolderModal } from "@/components/modals/create-folder-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { RenameModal } from "@/components/modals/rename-modal";
import { MoveFolderModal } from "@/components/modals/move-folder-modal";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";
import { UploadOpenContext } from "@/components/layout/drive-layout";

export default function Folder({ id }: { id: number }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data: folderData, isLoading: folderLoading } = useGetFolder(id, {
    query: { enabled: !!id, queryKey: getGetFolderQueryKey(id) },
  });
  const { data: filesData, isLoading: filesLoading } = useListFiles({ folderId: id });

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [moveItem, setMoveItem] = useState<FileItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);

  const uploadContext = React.useContext(UploadOpenContext);
  const folders = filesData?.folders || [];
  const files = filesData?.files || [];
  const items = [...folders, ...files];
  const isLoading = folderLoading || filesLoading;

  const actions = {
    onShare: setShareItem,
    onMove: setMoveItem,
    onRename: setRenameItem,
    onPreview: setPreviewItem,
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[50vh]">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-3 overflow-x-auto whitespace-nowrap">
          <Link href="/drive" className="hover:text-white transition-colors flex items-center gap-1 flex-shrink-0">
            <Home className="w-3.5 h-3.5" />
          </Link>
          {folderData?.breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
              {idx === folderData.breadcrumb.length - 1 ? (
                <span className="text-white font-medium">{crumb.name}</span>
              ) : (
                <Link href={`/drive/folder/${crumb.id}`} className="hover:text-white transition-colors truncate max-w-[120px]">
                  {crumb.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{folderData?.folder.name}</h1>
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
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="This folder is empty"
          description="Drag files here or use the upload button to get started."
          action={{ label: "Upload Files", onClick: () => uploadContext?.setUploadOpen(true) }}
        />
      ) : (
        <div className="pb-16 space-y-6">
          {folders.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Folders</h2>
              <FileGrid items={folders} viewMode={viewMode} actions={actions} />
            </section>
          )}
          {files.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Files</h2>
              <FileGrid items={files} viewMode={viewMode} actions={actions} />
            </section>
          )}
        </div>
      )}

      <CreateFolderModal open={createFolderOpen} onOpenChange={setCreateFolderOpen} folderId={id} />
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
