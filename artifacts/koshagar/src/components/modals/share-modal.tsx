import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileItem, useCreateShare, useGetShareStats } from "@workspace/api-client-react";
import { Link2, Copy, CheckCircle2, Shield, Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function ShareModal({ 
  open, 
  onOpenChange, 
  item 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  item: FileItem | null 
}) {
  const [copied, setCopied] = React.useState(false);
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null);
  
  const shareMutation = useCreateShare();

  React.useEffect(() => {
    if (!open) {
      setGeneratedLink(null);
      setCopied(false);
    } else if (item && item.shareToken) {
      setGeneratedLink(`${window.location.origin}/s/${item.shareToken}`);
    }
  }, [open, item]);

  const handleGenerateLink = () => {
    if (!item) return;
    
    shareMutation.mutate({
      data: {
        fileId: item.id,
        allowDownload: true
      }
    }, {
      onSuccess: (data) => {
        setGeneratedLink(`${window.location.origin}/s/${data.token}`);
        toast.success("Share link created.");
      }
    });
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Link copied — ready to share.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] glass-card border-white/10 p-6 overflow-hidden rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            Share "{item.name}"
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Anyone with the link can view this {item.type}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {!generatedLink ? (
            <div className="text-center py-6">
              <Button 
                onClick={handleGenerateLink}
                disabled={shareMutation.isPending}
                className="rounded-full px-8 h-12 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 shadow-lg shadow-primary/20 hover-lift"
              >
                {shareMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Link2 className="w-5 h-5 mr-2" />
                )}
                Create Share Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  value={generatedLink}
                  readOnly
                  className="bg-white/5 border-white/10 focus-visible:ring-0 text-white font-mono text-sm h-12 rounded-xl"
                />
                <Button 
                  onClick={copyToClipboard}
                  className="h-12 w-12 shrink-0 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>Public link active</span>
                </div>
                {item.shareToken && (
                  <ShareStats token={item.shareToken} />
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareStats({ token }: { token: string }) {
  const { data } = useGetShareStats(token, {
    query: {
      enabled: !!token,
      queryKey: ["shareStats", token]
    }
  });

  if (!data) return null;

  return (
    <div className="flex items-center gap-6 pt-3 border-t border-white/10 mt-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Eye className="w-4 h-4" />
        <span>{data.viewCount} views</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Download className="w-4 h-4" />
        <span>{data.downloadCount} downloads</span>
      </div>
    </div>
  );
}
