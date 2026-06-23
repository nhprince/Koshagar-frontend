import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, Shield, Zap, Cloud, Hexagon, Database, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
      {/* Background styling with image */}
      <div 
        className="fixed inset-0 z-0 opacity-40 bg-cover bg-center bg-no-repeat mix-blend-screen"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      />
      <div className="fixed inset-0 z-0 bg-background/80 backdrop-blur-[100px]" />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Hexagon className="w-5 h-5 text-white fill-white/20" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">Koshagar</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/register">
            <Button className="rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">Koshagar 2.0 is now live</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.1]"
          >
            The treasury for your <span className="text-gradient">digital life.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            A calm, immersive, and premium space to store, organize, and share your most valuable files. Designed for those who appreciate the craft of software.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="mt-12 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="rounded-full h-14 px-8 text-base bg-gradient-to-r from-primary to-accent hover:opacity-90 hover-lift text-primary-foreground shadow-xl shadow-primary/25 border-0">
                Start your treasury
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-base glass hover:bg-white/10 border-white/10">
                View Demo
              </Button>
            </Link>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="mt-24 w-full max-w-5xl mx-auto"
          >
            <div className="rounded-2xl glass-card overflow-hidden border border-white/10 shadow-2xl shadow-black/50 p-2">
              <div className="rounded-xl overflow-hidden bg-background/50 backdrop-blur-3xl aspect-[16/9] flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10" />
                {/* Abstract UI representation */}
                <div className="w-full h-full flex p-4 gap-4 opacity-50 pointer-events-none">
                  <div className="w-48 rounded-lg bg-white/5 border border-white/5 hidden md:block" />
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="h-12 rounded-lg bg-white/5 border border-white/5 w-full" />
                    <div className="flex-1 rounded-lg bg-white/5 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                      {[1,2,3,4,5,6,7,8].map(i => (
                        <div key={i} className="rounded-md bg-white/5 border border-white/5 h-32" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Crafted for clarity</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every pixel, every interaction, and every motion is designed to create a sense of calm and focus.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-secondary" />}
              title="Secure by design"
              description="Your data is encrypted at rest and in transit. We treat your privacy as a fundamental human right."
              image="/feature-vault.png"
            />
            <FeatureCard 
              icon={<Cloud className="w-6 h-6 text-primary" />}
              title="Instant sync"
              description="Changes propagate globally in milliseconds. Whether you're on your phone or desktop, your files are always there."
              image="/feature-folder.png"
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-accent" />}
              title="Seamless sharing"
              description="Share folders and files with beautifully branded, password-protected links that expire when you choose."
              image="/feature-network.png"
            />
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-32 px-6 md:px-12">
          <div className="max-w-4xl mx-auto glass-card rounded-3xl p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 relative z-10">
              Ready to elevate your storage?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto relative z-10">
              Join thousands of creators, engineers, and designers who have made Koshagar their digital home.
            </p>
            <Link href="/register">
              <Button size="lg" className="rounded-full h-14 px-10 text-lg bg-white text-black hover:bg-gray-100 hover-lift relative z-10 shadow-xl">
                Create your account
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-6 md:px-12 text-center text-muted-foreground text-sm">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Hexagon className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">Koshagar</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, image }: { icon: React.ReactNode, title: string, description: string, image: string }) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass-card rounded-2xl p-6 flex flex-col border border-white/5 overflow-hidden group"
    >
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed mb-6">{description}</p>
      <div className="mt-auto pt-6 -mx-6 -mb-6">
        <div className="aspect-video relative bg-white/5 border-t border-white/5 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-105 group-hover:scale-100" />
        </div>
      </div>
    </motion.div>
  );
}
