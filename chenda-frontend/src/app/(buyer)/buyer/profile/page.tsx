import type { Metadata } from "next";
import { TopHeader, BottomNav } from "@/components/layout/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = { title: "Profile — Chenda" };

export default function BuyerProfilePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--fresh-surface)]">
      <TopHeader />

      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <div className="container max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--fresh-text-primary)]">My Profile</h1>
            <p className="text-[var(--fresh-text-muted)] mt-1">
              Manage your account settings and preferences
            </p>
          </div>
          <ProfileForm />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
