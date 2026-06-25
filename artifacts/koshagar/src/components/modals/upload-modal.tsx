import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUploadFile, getListFilesQueryKey, getGetStorageUsageQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, File, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "reading" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

export function UploadModal({
  open,
  onOpenChange,
  folderId,
  initialFiles,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: number | null;
  initialFiles?: File[];
}) {
  const [dragActive, setDragActive] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadFile[]>([]);
  const uploadMutation = useUploadFile();
  const queryClient = useQueryClient();
  const isRunning = uploads.some(u => u.status === "reading" || u.status === "uploading");
  const allDone = uploads.length > 0 && uploads.every(u => u.status === "done" || u.status === "error");
  const hasSuccess = uploads.some(u => u.status === "done");

  React.useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0) {
      addFiles(initialFiles);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) {
      setUploads([]);
    }
  }, [open]);

  function addFiles(files: File[]) {
    const newEntries: UploadFile[] = Array.from(files).map(f => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      status: "pending",
      progress: 0,
    }));
    setUploads(prev => [...prev, ...newEntries]);
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  function setUploadState(id: string, patch: Partial<UploadFile>) {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u));
  }

  const handleUpload = async () => {
    const pending = uploads.filter(u => u.status === "pending" || u.status === "error");
    if (pending.length === 0) return;

    for (const entry of pending) {
      setUploadState(entry.id, { status: "reading", progress: 10 });

      try {
        const dataUrl = await readFileAsDataUrl(entry.file, (pct) => {
          setUploadState(entry.id, { progress: Math.round(10 + pct * 0.5) });
        });

        setUploadState(entry.id, { status: "uploading", progress: 65 });

        await new Promise<void>((resolve, reject) => {
          uploadMutation.mutate(
            {
              data: {
                name: entry.file.name,
                mimeType: entry.file.type || "application/octet-stream",
                size: entry.file.size,
                folderId: folderId ?? null,
                dataUrl,
              },
            },
            {
              onSuccess: () => {
                setUploadState(entry.id, { status: "done", progress: 100 });
                queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetStorageUsageQueryKey() });
                resolve();
              },
              onError: (err) => {
                setUploadState(entry.id, { status: "error", progress: 0, error: "Upload failed" });
                reject(err);
              },
            }
          );
        });
      } catch {
        setUploadState(entry.id, { status: "error", progress: 0, error: "Upload failed" });
      }
    }

    const finalUploads = uploads.map(u =>
      pending.find(p => p.id === u.id) ? { ...u } : u
    );
    const successCount = finalUploads.filter(u => u.status === "done").length;
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount !== 1 ? "s" : ""} uploaded successfully.`);
    }
  };

  const handleClose = () => {
    if (isRunning) return;
    onOpenChange(false);
  };

  const doneCount = uploads.filter(u => u.status === "done").length;
  const errorCount = uploads.filter(u => u.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val && !isRunning) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[520px] border-white/10 p-0 overflow-hidden" style={{ background: "hsl(var(--card))" }}>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload to Treasury</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add files to your digital vault. Multiple files supported.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors relative ${dragActive ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
                disabled={isRunning}
              />
              <Upload className={`w-8 h-8 mx-auto mb-3 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm font-medium mb-1">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground">or click to browse — multiple files supported</p>
            </div>

            <AnimatePresence initial={false}>
              {uploads.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                    {uploads.map((u) => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/4"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          u.status === "done" ? "bg-emerald-500/15" :
                          u.status === "error" ? "bg-red-500/15" :
                          "bg-primary/15"
                        }`}>
                          {u.status === "done" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : u.status === "error" ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : u.status === "reading" || u.status === "uploading" ? (
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          ) : (
                            <File className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{u.file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {u.status === "reading" || u.status === "uploading" ? (
                              <>
                                <Progress value={u.progress} className="h-1 flex-1" />
                                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{u.progress}%</span>
                              </>
                            ) : u.status === "done" ? (
                              <span className="text-[11px] text-emerald-400 font-medium">Uploaded</span>
                            ) : u.status === "error" ? (
                              <span className="text-[11px] text-red-400 font-medium">{u.error ?? "Failed"}</span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">{formatBytes(u.file.size)}</span>
                            )}
                          </div>
                        </div>
                        {(u.status === "pending" || u.status === "error") && !isRunning && (
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => removeFile(u.id)}
                            className="w-6 h-6 rounded-full text-muted-foreground hover:text-white flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {allDone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 px-1">
                      {hasSuccess && <span className="text-emerald-400 font-medium">{doneCount} uploaded</span>}
                      {errorCount > 0 && <span className="text-red-400 font-medium">{errorCount} failed</span>}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {uploads.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost" onClick={handleClose} disabled={isRunning}
                  className="flex-1 text-muted-foreground text-sm"
                >
                  {allDone ? "Close" : "Cancel"}
                </Button>
                {!allDone && (
                  <Button
                    onClick={handleUpload}
                    disabled={isRunning || uploads.filter(u => u.status === "pending" || u.status === "error").length === 0}
                    className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 rounded-full"
                  >
                    {isRunning ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Upload {uploads.filter(u => u.status === "pending" || u.status === "error").length} File{uploads.filter(u => u.status === "pending" || u.status === "error").length !== 1 ? "s" : ""}</>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function readFileAsDataUrl(file: File, onProgress?: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
