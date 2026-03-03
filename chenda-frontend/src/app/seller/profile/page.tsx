import { ProfileForm } from "@/components/profile/ProfileForm";

export default function SellerProfilePage() {
  return (
    <div className="px-4 pt-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--fresh-text-primary)]">My Profile</h1>
          <p className="mt-1 text-[var(--fresh-text-muted)]">
            Manage your account settings and preferences
          </p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}
