'use client';

import { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function BuyerLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedTypes={['buyer', 'both']}>
      {children}
    </ProtectedRoute>
  );
}
