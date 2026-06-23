import React, { useState } from "react";
import { Link } from "wouter";
import { useGetFolder, useListFiles, FileItem, getGetFolderQueryKey } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Plus, Loader2, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateFolderModal } from "@/components/modals/create-folder-modal";
import { ShareModal } from "@/components/modals/share-modal";
import { UploadOpenContext } from "@/components/layout/drive-layout";

export default function Folder({ id }: { id: number }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data: folderData, isLoading: folderLoading } = useGetFolder(id, {
    query: {
      enabled: !!id,
      queryKey: getGetFolderQueryKey(id)
    }
  });
  
  const { data: filesData, isLoading: filesLoading } = useListFiles({ folderId: id });
  
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  
  const uploadContext = React.useContext(UploadOpenContext);

  const items = [...(filesData?.folders || []), ...(filesData?.files || [])];
  const isLoading = folderLoading || filesLoading;

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <nav className="flex items-center text-sm font-medium text-muted-foreground mb-4 overflow-x-auto whitespace-nowrap pb-2 hide-scrollbar">
          <Link href="/drive" className="hover:text-white transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4 mx-1" />
          {folderData?.breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx === folderData.breadcrumb.length - 1 ? (
                <span className="text-white">{crumb.name}</span>
              ) : (
                <Link href={`/drive/folder/${crumb.id}`} className="hover:text-white transition-colors">
                  {crumb.name}
                </Link>
              )}
              {idx < folderData.breadcrumb.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-1" />
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{folderData?.folder.name}</h1>
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
      </div>

      {items.length === 0 ? (
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
            onContextMenu={() => {}} 
          />
        </div>
      )}

      <CreateFolderModal open={createFolderOpen} onOpenChange={setCreateFolderOpen} folderId={id} />
      <ShareModal open={!!shareItem} onOpenChange={(val) => !val && setShareItem(null)} item={shareItem} />
    </div>
  );
}
