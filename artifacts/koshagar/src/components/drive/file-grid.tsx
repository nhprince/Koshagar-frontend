import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileItem } from "@workspace/api-client-react";
import { FileCard } from "./file-card";
import { FileRow } from "./file-row";

export type ViewMode = "grid" | "list";

export function FileGrid({ 
  items, 
  viewMode, 
  onContextMenu 
}: { 
  items: FileItem[], 
  viewMode: ViewMode,
  onContextMenu: (e: React.MouseEvent, item: FileItem) => void
}) {
  if (items.length === 0) return null;

  if (viewMode === "list") {
    return (
      <div className="w-full">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/5 text-sm font-medium text-muted-foreground sticky top-0 bg-background/80 backdrop-blur-md z-10">
          <div className="col-span-6 md:col-span-5 flex items-center gap-3">
            <span>Name</span>
          </div>
          <div className="col-span-3 hidden md:block">Last Modified</div>
          <div className="col-span-2 hidden md:block">Size</div>
          <div className="col-span-6 md:col-span-2 flex justify-end">Actions</div>
        </div>
        <div className="flex flex-col gap-1 mt-2">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <FileRow item={item} onContextMenu={onContextMenu} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
      <AnimatePresence>
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ 
              duration: 0.3, 
              delay: i * 0.03,
              type: "spring",
              stiffness: 300,
              damping: 24
            }}
          >
            <FileCard item={item} onContextMenu={onContextMenu} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
