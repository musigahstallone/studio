
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth'; // Firebase's User type
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface AuthContextType {
  user: FirebaseUser | null | undefined; // undefined while loading, null if not logged in
  loading: boolean;
  error?: Error;
  // You can add a function here to fetch more detailed user profile from Firestore if needed
  // e.g., userProfile: AppUser | null; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, loading, error] = useAuthState(auth);

  // Optional: Basic loading state for the whole app during auth check
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen">
  //       <Skeleton className="h-12 w-12 rounded-full" />
  //       <p className="ml-4 text-lg">Loading authentication...</p>
  //     </div>
  //   );
  // }

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
