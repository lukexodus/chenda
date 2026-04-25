"use client";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function RiderProfilePage() {
  return (
    <ProtectedRoute allowedTypes={["rider"]}>
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <ProfileForm />
      </div>
    </ProtectedRoute>
  );
}
