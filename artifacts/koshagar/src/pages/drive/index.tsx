import React, { useState } from "react";
import { useListFiles, FileItem } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { FileActionsMenu } from "@/components/drive/file-actions";
import { LayoutGrid, List, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateFolderModal } from "@/components/modals/create-folder-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { UploadOpenContext } from "@/components/layout/drive-layout";

export default function Drive() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data, isLoading } = useListFiles({ folderId: null });
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  
  const uploadContext = React.useContext(UploadOpenContext);

  const items = [...(data?.folders || []), ...(data?.files || [])];

  const handleShare = (item: FileItem) => {
    setShareItem(item);
  };

  const handleMove = (item: FileItem) => {
    // TODO: implement move dialog
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Drive</h1>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-full h-8 w-8 ${viewMode === "grid" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-full h-8 w-8 ${viewMode === "list" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
            <List className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <Button variant="ghost" className="rounded-full h-8 text-sm hover:bg-white/10" onClick={() => setCreateFolderOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Folder
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          title="This folder is empty" 
          description="Drag files here or use the upload button to get started." 
          action={{ label: "Upload File", onClick: () => uploadContext?.setUploadOpen(true) }}
        />
      ) : (
        <div className="pb-20">
          <FileGrid 
            items={items} 
            viewMode={viewMode} 
            onContextMenu={(e, item) => {
              // Wrap actions trigger
            }} 
          />
        </div>
      )}

      <CreateFolderModal open={createFolderOpen} onOpenChange={setCreateFolderOpen} folderId={null} />
      <ShareModal open={!!shareItem} onOpenChange={(val) => !val && setShareItem(null)} item={shareItem} />
    </div>
  );
}
