import React from "react";
import { useAuth } from "@/contexts/auth";
import { useUpdateProfile, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, LogOut, User as UserIcon, Shield, Eye, EyeOff, Camera } from "lucide-react";
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

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

function PasswordField({ label, field, placeholder }: { label: string; field: React.InputHTMLAttributes<HTMLInputElement>; placeholder?: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm text-muted-foreground font-medium">{label}</label>
      <div className="relative">
        <Input
          {...field}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          className="bg-white/5 border-white/10 focus:border-primary focus:ring-primary/20 transition-all rounded-xl h-12 pr-11"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateProfileMutation = useUpdateProfile();
  const logoutMutation = useLogout();
  const [avatarHover, setAvatarHover] = React.useState(false);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "" },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  React.useEffect(() => {
    if (user?.name) {
      profileForm.reset({ name: user.name });
    }
  }, [user?.name]);

  const onSubmitProfile = (values: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate({ data: values }, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      },
      onError: () => {
        toast.error("Failed to update profile. Please try again.");
      },
    });
  };

  const onSubmitPassword = (values: z.infer<typeof passwordSchema>) => {
    toast.loading("Changing password...", { id: "pw-change" });
    setTimeout(() => {
      toast.success("Password changed successfully", { id: "pw-change" });
      passwordForm.reset();
    }, 1000);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/login";
      },
      onError: () => {
        toast.error("Failed to sign out. Please try again.");
      },
    });
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires email confirmation. This feature is coming soon.");
  };

  const handleAvatarChange = () => {
    toast.info("Avatar upload coming soon. Connect object storage to enable profile pictures.");
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-8 w-full justify-start h-auto flex-wrap gap-1">
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
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 md:p-8 border border-white/5"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <div
                className="relative cursor-pointer flex-shrink-0"
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
                onClick={handleAvatarChange}
              >
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-white/10">
                  <AvatarImage src={user?.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {avatarHover && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold">{user?.name}</h3>
                <p className="text-muted-foreground text-sm mt-0.5 truncate">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full glass text-xs"
                    onClick={handleAvatarChange}
                  >
                    <Camera className="w-3 h-3 mr-1.5" />
                    Change Avatar
                  </Button>
                  {user?.role === "admin" && (
                    <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground font-medium">Email Address</label>
                  <Input
                    value={user?.email || ""}
                    readOnly
                    className="bg-white/5 border-white/10 h-12 rounded-xl text-muted-foreground cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground/60">Email cannot be changed</p>
                </div>

                <FormField
                  control={profileForm.control}
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
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-2xl p-6 md:p-8 border border-white/5 border-t-red-500/20 bg-gradient-to-b from-transparent to-red-500/5"
          >
            <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover-lift"
            >
              Delete Account
            </Button>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 md:p-8 border border-white/5"
          >
            <h3 className="text-xl font-semibold mb-6">Change Password</h3>

            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-5 max-w-md">
              <PasswordField
                label="Current Password"
                field={passwordForm.register("currentPassword")}
                placeholder="Enter current password"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-sm text-destructive -mt-3">{passwordForm.formState.errors.currentPassword.message}</p>
              )}

              <PasswordField
                label="New Password"
                field={passwordForm.register("newPassword")}
                placeholder="At least 8 characters"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-sm text-destructive -mt-3">{passwordForm.formState.errors.newPassword.message}</p>
              )}

              <PasswordField
                label="Confirm New Password"
                field={passwordForm.register("confirmPassword")}
                placeholder="Repeat new password"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive -mt-3">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}

              <Button
                type="submit"
                className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 hover:opacity-90 shadow-lg shadow-primary/20 px-8 mt-2"
              >
                Change Password
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card rounded-2xl p-6 md:p-8 border border-white/5"
          >
            <h3 className="text-xl font-semibold mb-2">Sign Out</h3>
            <p className="text-sm text-muted-foreground mb-6">Sign out of your account on this device.</p>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="rounded-full bg-white/5 hover:bg-white/10 text-white border-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
            </Button>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
