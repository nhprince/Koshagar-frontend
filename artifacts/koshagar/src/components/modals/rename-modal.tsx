import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateFile, useUpdateFolder, getListFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FileItem } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
});

export function RenameModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FileItem | null;
}) {
  const queryClient = useQueryClient();
  const updateFileMutation = useUpdateFile();
  const updateFolderMutation = useUpdateFolder();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: item?.name || "" },
  });

  React.useEffect(() => {
    if (item) form.reset({ name: item.name });
  }, [item, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!item) return;
    const mutation = item.type === "folder" ? updateFolderMutation : updateFileMutation;
    (mutation as typeof updateFileMutation).mutate(
      { id: item.id, data: { name: values.name } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListFilesQueryKey() });
          toast.success(`Renamed to "${values.name}"`);
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to rename. Try again."),
      }
    );
  };

  const isPending = updateFileMutation.isPending || updateFolderMutation.isPending;

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] glass-card border-white/10 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Edit2 className="w-4 h-4" />
            </div>
            Rename {item.type === "folder" ? "Folder" : "File"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground text-sm">New name</FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      placeholder="Enter new name..."
                      className="h-11 bg-white/5 border-white/10 focus:border-primary rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="rounded-xl hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90"
              >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Rename
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
