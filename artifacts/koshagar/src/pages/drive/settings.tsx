import React from "react";
import { useAuth } from "@/contexts/auth";
import { useUpdateProfile, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, LogOut, User as UserIcon, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  const onSubmitProfile = (values: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast.success("Profile updated");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      }
    });
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-8 w-full justify-start h-auto">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white/10 py-2.5 px-4 text-sm gap-2">
            <UserIcon className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white/10 py-2.5 px-4 text-sm gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/5">
            <div className="flex items-center gap-6 mb-8">
              <Avatar className="w-24 h-24 border-2 border-white/10">
                <AvatarImage src={user?.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/20 text-primary text-2xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-medium">{user?.name}</h3>
                <p className="text-muted-foreground mb-3">{user?.email}</p>
                <Button variant="outline" size="sm" className="rounded-full glass">
                  Change Avatar
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-6 max-w-md">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Display Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-12" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  disabled={updateProfileMutation.isPending}
                  className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 shadow-lg shadow-primary/20 px-8"
                >
                  Save Changes
                </Button>
              </form>
            </Form>
          </div>

          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/5 border-t-red-500/20 bg-gradient-to-b from-transparent to-red-500/5">
            <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-6">Permanently delete your account and all associated data.</p>
            <Button variant="destructive" className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover-lift">
              Delete Account
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/5">
            <h3 className="text-xl font-medium mb-6">Account Security</h3>
            
            <div className="space-y-6 max-w-md">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-medium">Email Address</label>
                <div className="flex gap-4">
                  <Input value={user?.email} readOnly className="bg-white/5 border-white/10 h-12 rounded-xl text-muted-foreground cursor-not-allowed" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <h4 className="font-medium mb-2">Password</h4>
                <p className="text-sm text-muted-foreground mb-4">It's a good idea to use a strong password that you're not using elsewhere.</p>
                <Button variant="outline" className="rounded-full glass">
                  Change Password
                </Button>
              </div>

              <div className="pt-6 mt-6 border-t border-white/5">
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white border-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
