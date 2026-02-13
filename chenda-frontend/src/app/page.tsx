import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPin, Leaf, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--fresh-surface)] px-4">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        {/* Logo */}
        <Image
          src="/chenda.png"
          alt="Chenda"
          width={80}
          height={80}
          className="rounded-2xl shadow-[var(--shadow-medium)]"
          priority
        />

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--fresh-text-primary)]">
            Chenda
          </h1>
          <p className="text-lg text-[var(--fresh-text-muted)]">
            Fresh Market — Proximity &amp; Freshness
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm shadow-[var(--shadow-small)]">
            <MapPin className="h-4 w-4 text-[var(--fresh-primary)]" />
            <span className="text-[var(--fresh-text-primary)]">Nearby</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm shadow-[var(--shadow-small)]">
            <Leaf className="h-4 w-4 text-[var(--fresh-primary)]" />
            <span className="text-[var(--fresh-text-primary)]">Fresh</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm shadow-[var(--shadow-small)]">
            <Clock className="h-4 w-4 text-[var(--fresh-warning)]" />
            <span className="text-[var(--fresh-text-primary)]">
              Time-Aware
            </span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex w-full flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="w-full bg-[var(--fresh-primary)] text-white hover:bg-[var(--fresh-primary)]/90 h-12 text-base rounded-[var(--radius-button)]"
          >
            <Link href="/login">Sign In</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full h-12 text-base rounded-[var(--radius-button)] border-[var(--fresh-border)]"
          >
            <Link href="/register">Create Account</Link>
          </Button>
        </div>

        {/* Tagline */}
        <p className="text-xs text-[var(--fresh-text-muted)]">
          Find the freshest products closest to you.
        </p>
      </main>
    </div>
  );
}
