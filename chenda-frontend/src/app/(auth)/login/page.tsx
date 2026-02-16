import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign In — Chenda" };

export default function LoginPage() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--fresh-border)] bg-white p-6 shadow-[var(--shadow-small)]">
      {/* Logo */}
      <div className="mb-6 flex justify-center">
        <div className="flex items-center gap-2">
          <Image
            src="/chenda.png"
            alt="Chenda Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <h1 className="text-2xl font-bold text-[var(--fresh-text-primary)]">
            Chenda
          </h1>
        </div>
      </div>

      <h2 className="mb-6 text-center text-xl font-semibold text-[var(--fresh-text-primary)]">
        Sign In
      </h2>

      <LoginForm />
    </div>
  );
}
