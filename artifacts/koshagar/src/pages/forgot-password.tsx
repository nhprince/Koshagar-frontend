import React, { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
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

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await new Promise((r) => setTimeout(r, 1200));
    setSubmittedEmail(values.email);
    setSubmitted(true);
    toast.success("Reset link sent! Check your inbox.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
      <div className="fixed inset-0 z-0 opacity-30 bg-[url('/hero-bg.png')] bg-cover bg-center bg-no-repeat mix-blend-screen" />
      <div className="fixed inset-0 z-0 bg-background/80 backdrop-blur-[100px]" />

      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

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
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
                <p className="text-muted-foreground mt-2 max-w-xs">
                  We've sent a reset link to <span className="text-foreground font-medium">{submittedEmail}</span>
                </p>
              </motion.div>
            ) : (
              <motion.div key="form-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
                <p className="text-muted-foreground mt-2">
                  Enter your email and we'll send a reset link
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success-body"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-6 py-2"
              >
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try a different address.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => { setSubmitted(false); form.reset(); }}
                >
                  Try a different email
                </Button>
                <Link href="/login" className="text-sm text-primary hover:text-primary/80 transition-colors">
                  Back to sign in
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-muted-foreground">Email address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <Input
                                placeholder="you@example.com"
                                type="email"
                                className="h-12 pl-10 bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground text-base shadow-lg shadow-primary/20 border-0"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "Send reset link"
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-8 text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground font-medium hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
