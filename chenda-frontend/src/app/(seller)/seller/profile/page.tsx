'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Seller Profile Page
 * Redirects to the buyer profile page which handles both roles
 */
export default function SellerProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Profile is shared between buyer and seller
    // Redirect to the main profile page
    router.push('/buyer/profile');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Loading Profile...</h2>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
