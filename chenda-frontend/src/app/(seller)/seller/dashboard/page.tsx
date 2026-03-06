'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Seller Dashboard Page
 * Redirects to seller orders page (main seller interface)
 */
export default function SellerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to seller orders - the main seller interface
    router.push('/seller-orders');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Loading Seller Dashboard...</h2>
        <p className="text-muted-foreground">Redirecting to orders</p>
      </div>
    </div>
  );
}
