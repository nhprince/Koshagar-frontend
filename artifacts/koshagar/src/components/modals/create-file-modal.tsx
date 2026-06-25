import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadFile, getListFilesQueryKey, getGetStorageUsageQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface FileType {
  ext: string;
  label: string;
  mime: string;
  content: string;
  color: string;
  bg: string;
  icon?: React.ReactNode;
}

function TypeIcon({ ext, color, bg }: { ext: string; color: string; bg: string }) {
  return (
    <span
      className={`text-[11px] font-black font-mono leading-none px-1.5 py-1 rounded-md ${bg} ${color} select-none`}
    >
      {ext.length > 4 ? ext.slice(0, 4) : ext}
    </span>
  );
}

const FILE_TYPES: FileType[] = [
  { ext: "html", label: "HTML", mime: "text/html", content: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>\n", color: "text-orange-400", bg: "bg-orange-500/15" },
  { ext: "css",  label: "CSS",  mime: "text/css",  content: "/* styles */\n\nbody {\n  margin: 0;\n  padding: 0;\n}\n", color: "text-blue-400", bg: "bg-blue-500/15" },
  { ext: "js",   label: "JS",   mime: "text/javascript", content: "// JavaScript\n\n", color: "text-yellow-400", bg: "bg-yellow-500/15" },
  { ext: "ts",   label: "TS",   mime: "text/typescript", content: "// TypeScript\n\n", color: "text-sky-400", bg: "bg-sky-500/15" },
  { ext: "json", label: "JSON", mime: "application/json", content: "{\n  \n}\n", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  { ext: "md",   label: "MD",   mime: "text/markdown", content: "# Untitled\n\n", color: "text-teal-400", bg: "bg-teal-500/15" },
  { ext: "txt",  label: "TXT",  mime: "text/plain", content: "", color: "text-muted-foreground", bg: "bg-white/8" },
  { ext: "csv",  label: "CSV",  mime: "text/csv", content: "column1,column2,column3\n", color: "text-cyan-400", bg: "bg-cyan-500/15" },
  { ext: "yaml", label: "YAML", mime: "text/yaml", content: "# YAML\n\nkey: value\n", color: "text-violet-400", bg: "bg-violet-500/15" },
  { ext: "xml",  label: "XML",  mime: "text/xml", content: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<root>\n  \n</root>\n", color: "text-rose-400", bg: "bg-rose-500/15" },
  { ext: "py",   label: "PY",   mime: "text/x-python", content: "# Python\n\n", color: "text-blue-300", bg: "bg-blue-500/15" },
  { ext: "sh",   label: "SH",   mime: "text/x-shellscript", content: "#!/bin/bash\n\n", color: "text-green-400", bg: "bg-green-500/15" },
  { ext: "sql",  label: "SQL",  mime: "text/x-sql", content: "-- SQL\n\nSELECT * FROM table;\n", color: "text-amber-400", bg: "bg-amber-500/15" },
  { ext: "svg",  label: "SVG",  mime: "image/svg+xml", content: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">\n  \n</svg>\n", color: "text-pink-400", bg: "bg-pink-500/15" },
];

const CUSTOM_TYPE: FileType = {
  ext: "custom", label: "Custom", mime: "text/plain", content: "",
  color: "text-purple-400", bg: "bg-purple-500/15",
  icon: <Settings className="w-3 h-3" />,
};

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
  const [selectedType, setSelectedType] = React.useState<FileType>(FILE_TYPES[0]);
  const [isCustom, setIsCustom] = React.useState(false);
  const [customExt, setCustomExt] = React.useState("");
  const queryClient = useQueryClient();
  const uploadMutation = useUploadFile();

  React.useEffect(() => {
    if (!open) {
      setName("");
      setSelectedType(FILE_TYPES[0]);
      setIsCustom(false);
      setCustomExt("");
    }
  }, [open]);

  const effectiveExt = isCustom ? (customExt.trim().replace(/^\./, "") || "txt") : selectedType.ext;
  const effectiveMime = isCustom ? "text/plain" : selectedType.mime;
  const effectiveContent = isCustom ? "" : selectedType.content;

  const handleCreate = () => {
    const fileName = name.trim() || "Untitled";
    const ext = effectiveExt;
    const fullName = fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;
    const base64 = btoa(unescape(encodeURIComponent(effectiveContent)));
    const dataUrl = `data:${effectiveMime};base64,${base64}`;

    uploadMutation.mutate(
      {
        data: {
          name: fullName,
          mimeType: effectiveMime,
          size: effectiveContent.length,
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
        className="sm:max-w-[520px] border-white/10 p-0 overflow-hidden"
        style={{ background: "hsl(var(--card))" }}
      >
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <span className="text-[10px] font-black text-emerald-400 font-mono">NEW</span>
              </div>
              Create New File
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Choose a file type or set a custom extension.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-white/80">File type</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {FILE_TYPES.map((type) => (
                  <motion.button
                    key={type.ext}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => { setSelectedType(type); setIsCustom(false); }}
                    title={type.label}
                    className={`flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-xl border text-center transition-all ${
                      !isCustom && selectedType.ext === type.ext
                        ? "border-primary/50 bg-primary/10"
                        : "border-white/6 bg-white/3 hover:border-white/12 hover:bg-white/6"
                    }`}
                  >
                    <TypeIcon ext={type.ext} color={type.color} bg={type.bg} />
                    <span className="text-[9px] leading-tight text-muted-foreground">{type.label}</span>
                  </motion.button>
                ))}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setIsCustom(true)}
                  title="Custom extension"
                  className={`flex flex-col items-center gap-1.5 px-1 py-2.5 rounded-xl border text-center transition-all ${
                    isCustom
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/6 bg-white/3 hover:border-white/12 hover:bg-white/6"
                  }`}
                >
                  <span className={`text-[11px] font-black font-mono leading-none px-1.5 py-1 rounded-md bg-purple-500/15 text-purple-400 select-none`}>
                    ···
                  </span>
                  <span className="text-[9px] leading-tight text-muted-foreground">Custom</span>
                </motion.button>
              </div>
            </div>

            {isCustom && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-white/80">Custom extension</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm font-mono">.</span>
                  <Input
                    value={customExt}
                    onChange={e => setCustomExt(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                    placeholder="ext"
                    className="flex-1 bg-white/5 border-white/10 h-9 text-sm font-mono"
                    maxLength={20}
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-white/80">File name</Label>
              <div className="flex items-center">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Untitled"
                  className="rounded-r-none border-r-0 bg-white/5 border-white/10 h-9 text-sm"
                  onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                  autoFocus={!isCustom}
                />
                <div className="h-9 px-3 flex items-center rounded-r-xl border border-white/10 bg-white/8 text-sm text-muted-foreground font-mono border-l-0 flex-shrink-0">
                  .{effectiveExt || "txt"}
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
                disabled={uploadMutation.isPending || (isCustom && !customExt.trim())}
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
