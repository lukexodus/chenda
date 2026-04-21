"use client";

import { TopHeader, BottomNav } from "@/components/layout/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function RiderProfilePage() {
  return (
    <ProtectedRoute allowedTypes={["rider"]}>
      <div className="flex min-h-screen flex-col bg-fresh-surface">
        <TopHeader />
        <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
          <div className="container max-w-2xl mx-auto">
            <ProfileForm />
          </div>
        </main>
        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}
