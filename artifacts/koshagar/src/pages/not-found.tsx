import { motion } from "framer-motion";
import { Link } from "wouter";
import { Hexagon, ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
      <div className="fixed inset-0 z-0 opacity-20 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-background/80 backdrop-blur-[80px]" />

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-xl w-full"
      >
        <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30 mb-8 hover:scale-105 transition-transform">
          <Hexagon className="w-8 h-8 text-white fill-white/20" />
        </Link>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative mb-6 select-none"
        >
          <span className="text-[8rem] sm:text-[10rem] font-black leading-none tracking-tighter text-gradient opacity-80">
            404
          </span>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-2xl sm:text-3xl font-bold mb-3"
        >
          Page not found
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="text-muted-foreground text-base sm:text-lg mb-10 max-w-sm"
        >
          The page you're looking for doesn't exist or has been moved.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <Button
            asChild
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground shadow-lg shadow-primary/20 border-0 gap-2"
          >
            <Link href="/drive">
              <Home className="w-4 h-4" />
              Go to Drive
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 px-6 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-colors gap-2"
          >
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="mt-16 glass-card rounded-2xl border border-white/10 p-5 flex items-center gap-4 max-w-xs text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Looking for a file?</p>
            <Link href="/drive/search" className="text-xs text-primary hover:underline">
              Search your drive →
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
