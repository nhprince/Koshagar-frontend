import React, { useState } from "react";
import { useGetRecentFiles, FileItem } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareModal } from "@/components/modals/share-modal";

export default function Recent() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { data: items, isLoading } = useGetRecentFiles();
  const [shareItem, setShareItem] = useState<FileItem | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Recent</h1>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-full h-8 w-8 ${viewMode === "grid" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-full h-8 w-8 ${viewMode === "list" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState 
          title="No recent files" 
          description="Files you've interacted with recently will appear here." 
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

      <ShareModal open={!!shareItem} onOpenChange={(val) => !val && setShareItem(null)} item={shareItem} />
    </div>
  );
}
