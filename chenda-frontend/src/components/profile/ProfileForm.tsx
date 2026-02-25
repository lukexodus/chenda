"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { LocationSettings } from "./LocationSettings";
import { AlgorithmPreferences } from "./AlgorithmPreferences";
import { PasswordChangeForm } from "./PasswordChangeForm";
import { FormSkeleton } from "@/components/layout/states";

interface ProfileFormProps {
  children?: React.ReactNode; // For tab content from parent
}

export function ProfileForm({ children }: ProfileFormProps) {
  const { user, updateProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    type: "buyer",
  });

  // Fetch user profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      const profileData: UserProfile = response.data;
      setProfile(profileData);
      setFormData({
        name: profileData.name,
        type: profileData.type,
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
      <TabsList className="grid w-full grid-cols-4">
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

            {/* User Type Radio Buttons */}
            <div className="space-y-3">
              <Label>Account Type</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => 
                  setFormData({ ...formData, type: value as "buyer" | "seller" | "both" })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="buyer" id="buyer" />
                  <Label htmlFor="buyer" className="font-normal">
                    Buyer - I want to buy fresh products
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="seller" id="seller" />
                  <Label htmlFor="seller" className="font-normal">
                    Seller - I want to sell fresh products
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="font-normal">
                    Both - I want to buy and sell
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
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
      <TabsContent value="security">
        <PasswordChangeForm />
      </TabsContent>
    </Tabs>
  );
}
