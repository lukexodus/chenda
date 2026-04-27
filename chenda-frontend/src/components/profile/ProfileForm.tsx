"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { UserProfile, ProfileFormData } from "@/lib/types/profile";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlgorithmPreferences } from "./AlgorithmPreferences";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { FormSkeleton } from "@/components/layout/states";

// Dynamically import LocationSettings with SSR disabled (uses Leaflet maps which require window)
const LocationSettings = dynamic(() => import("./LocationSettings").then(mod => ({ default: mod.LocationSettings })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
});

interface ProfileFormProps {
  children?: React.ReactNode; // For tab content from parent
}

export function ProfileForm({ children }: ProfileFormProps) {
  const { user, updateProfile, logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    type: "buyer",
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone and all data will be lost.")) {
      return;
    }

    try {
      setIsDeleting(true);
      await api.delete("/users/account");
      await logout();
      toast.success("Account deleted");
      router.push("/");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account", {
        description: error.response?.data?.message || "Please try again later",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      const profileData: UserProfile = response.data.data || response.data;
      setProfile(profileData);
      setFormData({
        name: profileData.name ?? "",
        type: profileData.type ?? "buyer",
      });
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      toast.error("Error", {
        description: error.response?.data?.message || "Failed to load profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Validation Error", {
        description: "Name is required",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile(formData as unknown as Record<string, unknown>);

      // Re-fetch profile to update UI with latest data
      await fetchProfile();

      toast.success("Profile updated", {
        description: "Your changes have been saved successfully",
      });
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to update profile", {
        description: error.response?.data?.message || "Please try again later",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate initials from name
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (isLoading) {
    return <FormSkeleton rows={4} />;
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="flex w-full md:grid md:grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="location">Location</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal information and account settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {getInitials(formData.name || profile?.name || "User")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Profile Picture</p>
                <p className="text-sm text-muted-foreground">
                  Initials are displayed as your avatar
                </p>
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>

            {/* Logout */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={async () => {
                  setIsLoggingOut(true);
                  await logout();
                  toast.success("Logged out");
                  router.push("/");
                }}
                disabled={isLoggingOut}
              >
                {isLoggingOut
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <LogOut className="mr-2 h-4 w-4" />}
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Location Tab */}
      <TabsContent value="location">
        <LocationSettings />
      </TabsContent>

      {/* Preferences Tab */}
      <TabsContent value="preferences">
        <AlgorithmPreferences />
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
        <PasswordChangeForm />

        <Card className="border-red-200 bg-red-50/30">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
            <CardDescription>
              Once you delete your account, there is no going back. Please be certain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
