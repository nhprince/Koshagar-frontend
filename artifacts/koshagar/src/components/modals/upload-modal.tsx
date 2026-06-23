import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUploadFile, getListFilesQueryKey, getGetStorageUsageQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function UploadModal({ open, onOpenChange, folderId }: { open: boolean, onOpenChange: (open: boolean) => void, folderId?: number | null }) {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const uploadMutation = useUploadFile();
  const queryClient = useQueryClient();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Convert file to base64 data URL for our mock backend
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      
      uploadMutation.mutate({
        data: {
          name: selectedFile.name,
          mimeType: selectedFile.type || "application/octet-stream",
          size: selectedFile.size,
          folderId: folderId || null,
          dataUrl: dataUrl
        }
      }, {
        onSuccess: () => {
          toast.success("Uploaded and safe.");
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStorageUsageQueryKey() });
          setSelectedFile(null);
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Failed to upload file. Please try again.");
        }
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setSelectedFile(null);
    }}>
      <DialogContent className="sm:max-w-[500px] glass-card border-white/10 p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload to Treasury</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add files to your digital vault. They'll be encrypted and synced instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {!selectedFile ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`
                    border-2 border-dashed rounded-2xl p-12 text-center transition-colors
                    ${dragActive ? "border-primary bg-primary/10" : "border-white/10 bg-white/5 hover:border-white/20"}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className={`w-10 h-10 mx-auto mb-4 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-base font-medium mb-1">Drag and drop your files here</p>
                  <p className="text-sm text-muted-foreground mb-6">or click to browse from your computer</p>
                  
                  <div className="relative">
                    <Input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleChange}
                    />
                    <Button variant="secondary" className="pointer-events-none rounded-full px-6">
                      Browse Files
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedFile(null)}
                      disabled={uploadMutation.isPending}
                      className="text-muted-foreground hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedFile(null)}
                      disabled={uploadMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                      className="rounded-full px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 shadow-lg shadow-primary/20"
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        "Upload File"
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
