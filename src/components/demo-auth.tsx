'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function DemoAuth({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for demo mode or session
    const demoMode = localStorage.getItem('demo-mode');
    if (demoMode === 'true') {
      setIsAuthenticated(true);
    } else {
      // Check if we're on the signin page
      if (window.location.pathname === '/auth/signin') {
        setIsAuthenticated(true);
      } else {
        router.push('/auth/signin');
      }
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 