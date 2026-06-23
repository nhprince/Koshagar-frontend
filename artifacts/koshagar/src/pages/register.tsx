import React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Hexagon, ArrowRight, Loader2 } from "lucide-react";

import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    registerMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast.success("Welcome to Koshagar.");
          setLocation("/drive");
        },
        onError: () => {
          toast.error("Registration failed. Email might be in use.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 opacity-30 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-background/80 backdrop-blur-[100px]" />
      
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 right-1/4 w-[40vw] h-[40vw] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[30vw] h-[30vw] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 mb-6 hover:scale-105 transition-transform">
            <Hexagon className="w-7 h-7 text-white fill-white/20" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Create your treasury</h1>
          <p className="text-muted-foreground mt-2">Start storing your valuables</p>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@example.com" 
                        type="email"
                        className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground">Password</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="••••••••" 
                        type="password" 
                        className="h-12 bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground text-base shadow-lg shadow-primary/20 mt-6 border-0"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
