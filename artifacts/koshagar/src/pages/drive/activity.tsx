import React from "react";
import { useGetActivity } from "@workspace/api-client-react";
import { Loader2, Activity as ActivityIcon, Upload, Download, Trash2, Edit2, Link2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Activity() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetActivity();

  if (isLoading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const entries = data?.pages.flatMap(page => page.entries) || [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "upload": return <Upload className="w-4 h-4 text-blue-400" />;
      case "download": return <Download className="w-4 h-4 text-green-400" />;
      case "trash": return <Trash2 className="w-4 h-4 text-red-400" />;
      case "rename": return <Edit2 className="w-4 h-4 text-orange-400" />;
      case "share": return <Link2 className="w-4 h-4 text-purple-400" />;
      case "star": return <Star className="w-4 h-4 text-yellow-400" />;
      default: return <ActivityIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatAction = (action: string, fileName: string) => {
    switch (action) {
      case "upload": return <span>Uploaded <strong>{fileName}</strong></span>;
      case "download": return <span>Downloaded <strong>{fileName}</strong></span>;
      case "trash": return <span>Moved <strong>{fileName}</strong> to trash</span>;
      case "rename": return <span>Renamed <strong>{fileName}</strong></span>;
      case "share": return <span>Created share link for <strong>{fileName}</strong></span>;
      case "star": return <span>Starred <strong>{fileName}</strong></span>;
      default: return <span>Performed {action} on <strong>{fileName}</strong></span>;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <ActivityIcon className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
      </div>

      <div className="relative pl-6 border-l border-white/10 space-y-8">
        {entries.map((entry) => (
          <div key={entry.id} className="relative">
            <div className="absolute -left-[35px] top-1 w-6 h-6 rounded-full bg-card border-2 border-background flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                {getActionIcon(entry.action)}
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 border border-white/5">
              <p className="text-sm text-foreground mb-1">
                {formatAction(entry.action, entry.fileName)}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{entry.userName}</span>
                <span>•</span>
                <span>{new Date(entry.createdAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No recent activity.
          </div>
        )}
      </div>

      {hasNextPage && (
        <div className="mt-8 text-center">
          <Button 
            variant="outline" 
            className="rounded-full glass"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Load Older Activity
          </Button>
        </div>
      )}
    </div>
  );
}
