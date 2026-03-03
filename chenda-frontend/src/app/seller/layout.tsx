import { ReactNode } from 'react';
import { TopHeader } from '@/components/layout/navigation';
import { BottomNav } from '@/components/layout/navigation';

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--fresh-bg,#F7F9FA)]">
      <TopHeader />
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

