import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileItem } from "@workspace/api-client-react";
import { FileCard, FileCardActions } from "./file-card";
import { FileRow } from "./file-row";

export type ViewMode = "grid" | "list";

export function FileGrid({
  items,
  viewMode,
  actions,
}: {
  items: FileItem[];
  viewMode: ViewMode;
  actions: FileCardActions;
}) {
  if (items.length === 0) return null;

  if (viewMode === "list") {
    return (
      <div className="w-full">
        <div className="grid grid-cols-12 gap-3 px-3 py-2 border-b border-white/5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background/80 backdrop-blur-md z-10 rounded-t-xl">
          <div className="col-span-6 md:col-span-5">Name</div>
          <div className="col-span-3 hidden md:block">Modified</div>
          <div className="col-span-2 hidden md:block">Size</div>
          <div className="col-span-6 md:col-span-2 text-right">Actions</div>
        </div>
        <div className="flex flex-col gap-0.5 mt-1">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18, delay: i * 0.015 }}
              >
                <FileRow item={item} actions={actions} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{
              duration: 0.25,
              delay: i * 0.025,
              type: "spring",
              stiffness: 320,
              damping: 28,
            }}
          >
            <FileCard item={item} actions={actions} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
