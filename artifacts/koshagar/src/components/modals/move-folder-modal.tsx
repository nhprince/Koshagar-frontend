import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMoveFile, useListFolders, getListFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FolderInput, Folder, Loader2, Home } from "lucide-react";
import { toast } from "sonner";
import { FileItem } from "@workspace/api-client-react";

export function MoveFolderModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null;
}) {
  const queryClient = useQueryClient();
  const moveMutation = useMoveFile();
  const { data: foldersData } = useListFolders();
  const [selectedFolder, setSelectedFolder] = React.useState<number | null>(null);
  const [selectedLabel, setSelectedLabel] = React.useState("My Drive (root)");

  const folders = foldersData?.folders || [];
  const filteredFolders = folders.filter((f) => f.id !== item?.id);

  React.useEffect(() => {
    if (!open) {
      setSelectedFolder(null);
      setSelectedLabel("My Drive (root)");
    }
  }, [open]);

  const handleMove = () => {
    if (!item) return;
    moveMutation.mutate(
      { id: item.id, data: { folderId: selectedFolder } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
          toast.success(`Moved to "${selectedLabel}"`);
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to move. Try again."),
      }
    );
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] glass-card border-white/10 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <FolderInput className="w-4 h-4" />
            </div>
            Move "{item.name}"
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-1 max-h-72 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => { setSelectedFolder(null); setSelectedLabel("My Drive (root)"); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
              selectedFolder === null
                ? "bg-primary/10 border border-primary/20 text-primary"
                : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">My Drive (root)</span>
          </button>

          {filteredFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => { setSelectedFolder(folder.id); setSelectedLabel(folder.name); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                selectedFolder === folder.id
                  ? "bg-primary/10 border border-primary/20 text-primary"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Folder className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{folder.name}</span>
            </button>
          ))}

          {filteredFolders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No folders available</p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={moveMutation.isPending}
            className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90"
          >
            {moveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Move Here
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
