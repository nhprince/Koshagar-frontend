import React from "react";
import { useGetActivity } from "@workspace/api-client-react";
import { Loader2, Activity as ActivityIcon, Upload, Download, Trash2, Edit2, Link2, Star, FolderPlus, Move } from "lucide-react";

export default function Activity() {
  const { data, isLoading } = useGetActivity();
  const entries = data?.entries || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "upload": return <Upload className="w-3.5 h-3.5 text-blue-400" />;
      case "download": return <Download className="w-3.5 h-3.5 text-green-400" />;
      case "trash": return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case "rename": return <Edit2 className="w-3.5 h-3.5 text-orange-400" />;
      case "share": return <Link2 className="w-3.5 h-3.5 text-purple-400" />;
      case "star": return <Star className="w-3.5 h-3.5 text-yellow-400" />;
      case "create_folder": return <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />;
      case "move": return <Move className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <ActivityIcon className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "upload": return "bg-blue-500/10 border-blue-500/20";
      case "download": return "bg-green-500/10 border-green-500/20";
      case "trash": return "bg-red-500/10 border-red-500/20";
      case "rename": return "bg-orange-500/10 border-orange-500/20";
      case "share": return "bg-purple-500/10 border-purple-500/20";
      case "star": return "bg-yellow-500/10 border-yellow-500/20";
      case "create_folder": return "bg-cyan-500/10 border-cyan-500/20";
      default: return "bg-white/5 border-white/10";
    }
  };

  const formatAction = (action: string, fileName: string) => {
    const name = <strong className="text-foreground">{fileName}</strong>;
    switch (action) {
      case "upload": return <span>Uploaded {name}</span>;
      case "download": return <span>Downloaded {name}</span>;
      case "trash": return <span>Moved {name} to trash</span>;
      case "restore": return <span>Restored {name} from trash</span>;
      case "rename": return <span>Renamed {name}</span>;
      case "share": return <span>Created share link for {name}</span>;
      case "star": return <span>Starred {name}</span>;
      case "unstar": return <span>Unstarred {name}</span>;
      case "create_folder": return <span>Created folder {name}</span>;
      case "move": return <span>Moved {name}</span>;
      case "delete": return <span>Permanently deleted {name}</span>;
      default: return <span>Performed {action} on {name}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <ActivityIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Activity</h1>
          <p className="text-sm text-muted-foreground">{entries.length} event{entries.length !== 1 ? "s" : ""} recorded</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No recent activity</p>
          <p className="text-sm mt-1 opacity-60">Activity will appear here as you use Koshagar</p>
        </div>
      ) : (
        <div className="relative pl-5 sm:pl-8 border-l border-white/10 space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="relative">
              <div className={`absolute -left-[1.35rem] sm:-left-[2.1rem] top-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center ${getActionColor(entry.action)}`}>
                {getActionIcon(entry.action)}
              </div>
              <div className="glass-card rounded-xl p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-colors">
                <p className="text-sm text-muted-foreground mb-1">
                  {formatAction(entry.action, entry.fileName)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <span className="font-medium text-muted-foreground">{entry.userName}</span>
                  <span>·</span>
                  <span>{new Date(entry.createdAt).toLocaleString(undefined, {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                  })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
