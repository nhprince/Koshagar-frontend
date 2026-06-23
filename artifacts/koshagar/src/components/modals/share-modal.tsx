import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileItem,
  useCreateShare, useDeleteShare, useUpdateShare, useGetShareStats, getGetShareStatsQueryKey,
} from "@workspace/api-client-react";
import {
  Link2, Copy, Check, Trash2, Eye, Download, Lock, Calendar,
  Loader2, AlertCircle, Globe, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

function getExpiryMs(val: string): number | null {
  if (val === "1d") return Date.now() + 86_400_000;
  if (val === "7d") return Date.now() + 7 * 86_400_000;
  if (val === "30d") return Date.now() + 30 * 86_400_000;
  return null;
}

function formatExpiry(isoStr: string | null | undefined): string {
  if (!isoStr) return "Never";
  const d = new Date(isoStr);
  if (d < new Date()) return "Expired";
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  return diff <= 1 ? "Expires tomorrow" : `Expires in ${diff} days`;
}

function expirySelectValue(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "none";
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 1) return "1d";
  if (days <= 7) return "7d";
  return "30d";
}

export function ShareModal({
  open, onOpenChange, item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null;
}) {
  const hasShare = !!item?.shareToken;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md rounded-2xl border border-white/10 p-0 overflow-hidden"
        style={{ background: "hsl(var(--card))" }}
      >
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-2.5 text-sm font-semibold">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Link2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="truncate max-w-[280px]">Share "{item?.name}"</span>
          </DialogTitle>
        </DialogHeader>

        {item && (
          <AnimatePresence mode="wait">
            {hasShare ? (
              <ManageShareView
                key="manage"
                item={item}
                open={open}
                onClose={() => onOpenChange(false)}
              />
            ) : (
              <CreateShareView
                key="create"
                item={item}
                onClose={() => onOpenChange(false)}
              />
            )}
          </AnimatePresence>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateShareView({ item, onClose }: { item: FileItem; onClose: () => void }) {
  const [allowDownload, setAllowDownload] = React.useState(true);
  const [expiry, setExpiry] = React.useState("none");
  const [usePassword, setUsePassword] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const queryClient = useQueryClient();
  const createMutation = useCreateShare();

  const handleCreate = () => {
    const ms = getExpiryMs(expiry);
    createMutation.mutate(
      {
        data: {
          fileId: item.id,
          allowDownload,
          expiresAt: ms ? new Date(ms).toISOString() : null,
          password: usePassword && password ? password : null,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          toast.success("Share link created");
        },
        onError: () => {
          toast.error("Failed to create link");
        },
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className="px-6 pb-6 pt-4 space-y-4"
    >
      <p className="text-sm text-muted-foreground">
        Create a link — anyone with it can view this file.
      </p>

      <div className="rounded-xl border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
        <SettingRow icon={<Download className="w-3.5 h-3.5" />} label="Allow download" description="Recipients can download the file" className="px-3.5 py-3">
          <Switch checked={allowDownload} onCheckedChange={setAllowDownload} />
        </SettingRow>

        <div className="px-3.5 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-white/6 flex items-center justify-center flex-shrink-0 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="text-xs font-medium text-white/90">Link expiry</Label>
          </div>
          <Select value={expiry} onValueChange={setExpiry}>
            <SelectTrigger className="w-24 h-7 text-xs border-white/10 bg-white/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: "hsl(var(--card))" }}>
              <SelectItem value="none">Never</SelectItem>
              <SelectItem value="1d">1 day</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="px-3.5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-white/6 flex items-center justify-center flex-shrink-0 text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-xs font-medium text-white/90">Password protect</Label>
            </div>
            <Switch checked={usePassword} onCheckedChange={v => { setUsePassword(v); if (!v) setPassword(""); }} />
          </div>
          <AnimatePresence>
            {usePassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.14 }}
                className="overflow-hidden"
              >
                <Input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  placeholder="Set a password…"
                  className="mt-2 h-8 text-sm bg-white/5 border-white/10"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="flex-1 text-muted-foreground">
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={createMutation.isPending || (usePassword && !password)}
          className="flex-1 bg-primary hover:bg-primary/90 text-white"
          size="sm"
        >
          {createMutation.isPending
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Creating…</>
            : <><Globe className="w-3.5 h-3.5 mr-1.5" />Create link</>}
        </Button>
      </div>
    </motion.div>
  );
}

function ManageShareView({ item, open, onClose }: { item: FileItem; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = React.useState(false);
  const [editingPassword, setEditingPassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");

  const shareLink = `${window.location.origin}/s/${item.shareToken}`;
  const token = item.shareToken!;

  const { data: stats, refetch: refetchStats } = useGetShareStats(token, {
    query: { queryKey: getGetShareStatsQueryKey(token), enabled: open && !!token, staleTime: 10_000 },
  });

  const deleteMutation = useDeleteShare();
  const updateMutation = useUpdateShare();
  const isUpdating = updateMutation.isPending;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    });
  };

  const handleRevoke = () => {
    deleteMutation.mutate(
      { token },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          toast.success("Link revoked");
          onClose();
        },
        onError: () => toast.error("Failed to revoke link"),
      }
    );
  };

  const handleToggleDownload = (val: boolean) => {
    updateMutation.mutate({ token, data: { allowDownload: val } }, { onSuccess: () => refetchStats() });
  };

  const handleUpdateExpiry = (val: string) => {
    const ms = getExpiryMs(val);
    updateMutation.mutate(
      { token, data: { expiresAt: ms ? new Date(ms).toISOString() : null } },
      { onSuccess: () => refetchStats() }
    );
  };

  const handleUpdatePassword = () => {
    updateMutation.mutate(
      { token, data: { password: newPassword || null } },
      {
        onSuccess: () => {
          refetchStats();
          setEditingPassword(false);
          setNewPassword("");
          toast.success(newPassword ? "Password updated" : "Password removed");
        },
      }
    );
  };

  const expiresAt = stats?.expiresAt ?? null;
  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className="px-6 pb-6 pt-4 space-y-4"
    >
      {isExpired && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          This link has expired and is no longer accessible.
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={shareLink}
          readOnly
          className="h-9 text-xs font-mono bg-white/5 border-white/10 text-white/80 flex-1"
          onClick={e => (e.target as HTMLInputElement).select()}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="h-9 px-3 border-white/10 hover:bg-white/8 flex-shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <div className="rounded-xl border border-white/8 bg-white/3 divide-y divide-white/5 overflow-hidden">
        <SettingRow icon={<Download className="w-3.5 h-3.5" />} label="Allow download" className="px-3.5 py-3">
          <Switch
            checked={stats?.allowDownload ?? true}
            onCheckedChange={handleToggleDownload}
            disabled={isUpdating}
          />
        </SettingRow>

        <div className="px-3.5 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-white/6 flex items-center justify-center flex-shrink-0 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="text-xs font-medium text-white/90">Expiry</Label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {expiresAt ? formatExpiry(expiresAt) : "Never expires"}
            </p>
          </div>
          <Select
            value={expirySelectValue(expiresAt)}
            onValueChange={handleUpdateExpiry}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-24 h-7 text-xs border-white/10 bg-white/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: "hsl(var(--card))" }}>
              <SelectItem value="none">Never</SelectItem>
              <SelectItem value="1d">1 day</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="px-3.5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-white/6 flex items-center justify-center flex-shrink-0 text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <Label className="text-xs font-medium text-white/90">Password</Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stats?.hasPassword ? "Password protected" : "Not protected"}
              </p>
            </div>
            <Button
              variant="ghost" size="sm"
              className="h-7 px-2.5 text-xs text-muted-foreground hover:text-white"
              onClick={() => { setEditingPassword(v => !v); setNewPassword(""); }}
              disabled={isUpdating}
            >
              {editingPassword ? "Cancel" : stats?.hasPassword ? "Change" : "Add"}
            </Button>
          </div>
          <AnimatePresence>
            {editingPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.14 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    type="password"
                    placeholder={stats?.hasPassword ? "New password (empty to remove)…" : "Set a password…"}
                    className="h-8 text-xs bg-white/5 border-white/10 flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm" onClick={handleUpdatePassword} disabled={isUpdating}
                    className="h-8 px-3 bg-primary/90 hover:bg-primary text-white text-xs"
                  >
                    {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-3 px-0.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3 h-3" />
          {stats?.viewCount ?? 0} {stats?.viewCount === 1 ? "view" : "views"}
        </span>
        <span className="flex items-center gap-1.5">
          <Download className="w-3 h-3" />
          {stats?.downloadCount ?? 0} downloads
        </span>
        {stats?.hasPassword && (
          <span className="flex items-center gap-1 text-amber-400/80">
            <ShieldCheck className="w-3 h-3" />Protected
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <Button
          variant="outline" size="sm" onClick={handleRevoke} disabled={deleteMutation.isPending}
          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
        >
          {deleteMutation.isPending
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Revoking…</>
            : <><Trash2 className="w-3.5 h-3.5 mr-1.5" />Revoke link</>}
        </Button>
        <Button size="sm" onClick={handleCopy} className="flex-1 bg-primary hover:bg-primary/90 text-white">
          {copied
            ? <><Check className="w-3.5 h-3.5 mr-1.5" />Copied!</>
            : <><Copy className="w-3.5 h-3.5 mr-1.5" />Copy link</>}
        </Button>
      </div>
    </motion.div>
  );
}

function SettingRow({
  icon, label, description, children, className,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      {icon && (
        <div className="w-7 h-7 rounded-md bg-white/6 flex items-center justify-center flex-shrink-0 text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <Label className="text-xs font-medium text-white/90">{label}</Label>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}
