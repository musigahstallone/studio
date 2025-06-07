
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase'; // Renamed import for clarity
import type { User as FirebaseUser } from 'firebase/auth';
// Skeleton or other loading components can be used if desired
// import { Skeleton } from '@/components/ui/skeleton'; 

interface AuthContextType {
  user: FirebaseUser | null | undefined;
  loading: boolean;
  error?: Error | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is a helper component to ensure useAuthState is only called when firebaseAuthInstance is valid.
// Hooks should not be called conditionally at the top level of a component.
const AuthStateController: React.FC<{ children: (authCtx: AuthContextType) => ReactNode }> = ({ children }) => {
  // We can safely assume firebaseAuthInstance is valid here because AuthProvider checks it.
  const [user, loading, error] = useAuthState(firebaseAuthInstance!); 
  return <>{children({ user, loading, error })}</>;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  if (!firebaseAuthInstance) {
    // This indicates a critical failure in Firebase initialization.
    // Likely, src/lib/firebase.ts could not initialize 'app' or 'auth' correctly.
    // This is typically due to missing or incorrect Firebase config values.
    console.error(
      "CRITICAL: Firebase auth object from '@/lib/firebase' is not initialized. This usually means your Firebase configuration (apiKey, projectId, etc.) is missing or incorrect. Please check src/lib/firebase.ts and your environment variables (e.g., NEXT_PUBLIC_FIREBASE_API_KEY)."
    );
    
    const errorState: AuthContextType = {
      user: null, // No user
      loading: false, // Not loading, it failed
      error: new Error("Firebase Authentication service is not available. Please check your project configuration and ensure all NEXT_PUBLIC_FIREBASE_* environment variables are correctly set."),
    };

    return (
      <AuthContext.Provider value={errorState}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background">
          <h1 className="text-2xl font-bold text-destructive mb-3 font-headline">Authentication System Error</h1>
          <p className="text-md text-foreground">
            The application cannot connect to the authentication service.
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            This is likely due to a misconfiguration of the Firebase project settings. Please ensure that your Firebase API keys, Project ID, Auth Domain, and other necessary details are correctly provided in the application's setup (<code>src/lib/firebase.ts</code> or <code>.env</code> file).
          </p>
          <p className="text-xs text-muted-foreground mt-4">
             Refer to the browser console for more specific error messages if available.
          </p>
        </div>
      </AuthContext.Provider>
    );
  }

  // If firebaseAuthInstance is valid, proceed to use hooks that depend on it.
  return (
    <AuthStateController>
      {(authContextValue) => (
        <AuthContext.Provider value={authContextValue}>
          {children}
        </AuthContext.Provider>
      )}
    </AuthStateController>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
