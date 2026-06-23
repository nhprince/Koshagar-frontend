import React, { useState } from "react";
import { useLocation } from "wouter";
import { useListFiles, FileItem } from "@workspace/api-client-react";
import { FileGrid, ViewMode } from "@/components/drive/file-grid";
import { LayoutGrid, List, Loader2, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareModal } from "@/components/modals/share-modal";

export default function Search() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [shareItem, setShareItem] = useState<FileItem | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useListFiles(
    { search: debouncedQuery || undefined },
    { query: { enabled: debouncedQuery.length > 0 } }
  );

  const items = [...(data?.folders || []), ...(data?.files || [])];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Search</h1>
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            autoFocus
            placeholder="Search for files, folders, or document contents..." 
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 text-lg transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {debouncedQuery.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? 'result' : 'results'} for "{debouncedQuery}"
          </p>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-full h-8 w-8 ${viewMode === "grid" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-full h-8 w-8 ${viewMode === "list" ? "bg-white/10 text-white" : "text-muted-foreground"}`}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {isLoading && debouncedQuery.length > 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : debouncedQuery.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
          <SearchIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium tracking-tight text-white mb-2">Search your treasury</h3>
          <p className="text-muted-foreground">Type something above to start searching</p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          title="No results found" 
          description={`We couldn't find anything matching "${debouncedQuery}".`} 
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
