'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function Navigation() {
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const demoMode = localStorage.getItem('demo-mode');
    setIsDemoMode(demoMode === 'true');
  }, []);

  const handleSignOut = () => {
    if (isDemoMode) {
      localStorage.removeItem('demo-mode');
      window.location.href = '/auth/signin';
    } else {
      signOut();
    }
  };

  if (!session && !isDemoMode) return null;

  const user = session?.user || { name: 'Demo User', email: 'demo@example.com', image: null };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              AI Playground {isDemoMode && <span className="text-sm text-blue-600">(Demo Mode)</span>}
            </h1>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {user.image ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.image}
                    alt={user.name || 'User'}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name?.[0] || user.email?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <span className="text-gray-700">{user.name || user.email}</span>
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {isDemoMode ? 'Exit Demo Mode' : 'Sign out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 