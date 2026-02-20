"use client";

import { ProfileForm } from "@/components/profile/ProfileForm";

export default function SellerProfilePage() {
  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
