import React, { useState } from "react";
import { useListFiles, FileItem, getListFilesQueryKey } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Loader2, Search as SearchIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareModal } from "@/components/modals/share-modal";
import { RenameModal } from "@/components/modals/rename-modal";
import { MoveFolderModal } from "@/components/modals/move-folder-modal";
import { FilePreviewModal } from "@/components/modals/file-preview-modal";

export default function Search() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [shareItem, setShareItem] = useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = useState<FileItem | null>(null);
  const [moveItem, setMoveItem] = useState<FileItem | null>(null);
  const [previewItem, setPreviewItem] = useState<FileItem | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 280);
    return () => clearTimeout(timer);
  }, [query]);

  const searchParams = { search: debouncedQuery || undefined };
  const { data, isLoading } = useListFiles(
    searchParams,
    { query: { queryKey: getListFilesQueryKey(searchParams), enabled: debouncedQuery.length > 0 } }
  );

  const items = [...(data?.folders || []), ...(data?.files || [])];

  const actions = {
    onShare: setShareItem,
    onMove: setMoveItem,
    onRename: setRenameItem,
    onPreview: setPreviewItem,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight mb-4">Search</h1>
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus
            placeholder="Search files and folders..."
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 text-base transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {debouncedQuery.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Searching..." : `${items.length} result${items.length !== 1 ? "s" : ""} for "${debouncedQuery}"`}
          </p>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-full h-7 w-7 ${viewMode === "grid" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-full h-7 w-7 ${viewMode === "list" ? "bg-white/15 text-white" : "text-muted-foreground"}`}>
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {isLoading && debouncedQuery.length > 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : debouncedQuery.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
            <SearchIcon className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-white mb-2">Search your treasury</h3>
          <p className="text-muted-foreground text-sm max-w-xs">Type a filename or keyword above to find your files and folders instantly.</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No results found"
          description={`Nothing matched "${debouncedQuery}". Try a different search term.`}
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
