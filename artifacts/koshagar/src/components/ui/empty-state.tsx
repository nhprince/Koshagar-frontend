import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px]">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="w-48 h-48 mb-8 opacity-80"
      >
        <img src="/empty-state.png" alt="Empty state" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
      </motion.div>
      <h3 className="text-xl font-medium tracking-tight text-white mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8">{description}</p>
      {action && (
        <Button 
          onClick={action.onClick}
          className="rounded-full px-6 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md hover-lift"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
