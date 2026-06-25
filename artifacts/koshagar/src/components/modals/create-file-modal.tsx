import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadFile, getListFilesQueryKey, getGetStorageUsageQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const FILE_TYPES = [
  { ext: "txt", label: "Text file", mime: "text/plain", content: "" },
  { ext: "md", label: "Markdown", mime: "text/markdown", content: "# Untitled\n\n" },
  { ext: "csv", label: "CSV", mime: "text/csv", content: "column1,column2,column3\n" },
  { ext: "json", label: "JSON", mime: "application/json", content: "{\n  \n}\n" },
];

export function CreateFileModal({
  open,
  onOpenChange,
  folderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: number | null;
}) {
  const [name, setName] = React.useState("");
  const [selectedType, setSelectedType] = React.useState(FILE_TYPES[0]);
  const queryClient = useQueryClient();
  const uploadMutation = useUploadFile();

  React.useEffect(() => {
    if (!open) {
      setName("");
      setSelectedType(FILE_TYPES[0]);
    }
  }, [open]);

  const handleCreate = () => {
    const fileName = name.trim() || "Untitled";
    const fullName = fileName.endsWith(`.${selectedType.ext}`) ? fileName : `${fileName}.${selectedType.ext}`;
    const content = selectedType.content;
    const base64 = btoa(unescape(encodeURIComponent(content)));
    const dataUrl = `data:${selectedType.mime};base64,${base64}`;

    uploadMutation.mutate(
      {
        data: {
          name: fullName,
          mimeType: selectedType.mime,
          size: content.length,
          folderId: folderId ?? null,
          dataUrl,
        },
      },
      {
        onSuccess: () => {
          toast.success(`"${fullName}" created.`);
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStorageUsageQueryKey() });
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to create file.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploadMutation.isPending) onOpenChange(v); }}>
      <DialogContent
        className="sm:max-w-[420px] border-white/10 p-0 overflow-hidden"
        style={{ background: "hsl(var(--card))" }}
      >
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              Create New File
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Create an empty file in your drive.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/80">File type</Label>
              <div className="grid grid-cols-4 gap-2">
                {FILE_TYPES.map((type) => (
                  <motion.button
                    key={type.ext}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedType(type)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${
                      selectedType.ext === type.ext
                        ? "border-primary/50 bg-primary/10 text-white"
                        : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/15 hover:bg-white/6"
                    }`}
                  >
                    <span className="text-[13px] font-bold font-mono">.{type.ext}</span>
                    <span className="text-[9px] leading-tight">{type.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/80">File name</Label>
              <div className="flex items-center gap-0">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Untitled"
                  className="rounded-r-none border-r-0 bg-white/5 border-white/10 h-9 text-sm"
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                  autoFocus
                />
                <div className="h-9 px-3 flex items-center rounded-r-xl border border-white/10 bg-white/8 text-sm text-muted-foreground font-mono border-l-0">
                  .{selectedType.ext}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={uploadMutation.isPending}
                className="flex-1 text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={uploadMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-white"
              >
                {uploadMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                ) : (
                  "Create File"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
