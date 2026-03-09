'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyerOrdersPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/buyer/orders');
  }, [router]);
  return null;
}
