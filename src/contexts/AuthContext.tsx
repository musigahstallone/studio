
"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth as firebaseAuthInstance, db } from '@/lib/firebase'; 
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import type { AppUser } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null | undefined; // Firebase auth user
  appUser: AppUser | null | undefined; // Firestore user profile data
  isAdminUser: boolean;
  loading: boolean; // Combined loading state
  error?: Error | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthStateController: React.FC<{ children: (authCtxValue: AuthContextType) => ReactNode }> = ({ children }) => {
  const [firebaseUser, firebaseLoading, firebaseError] = useAuthState(firebaseAuthInstance!);
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [appUserLoading, setAppUserLoading] = useState<boolean>(true);

  useEffect(() => {
    if (firebaseLoading) {
      setAppUserLoading(true);
      return;
    }

    if (!firebaseUser) {
      setAppUser(null);
      setIsAdminUser(false);
      setAppUserLoading(false);
      return;
    }

    setAppUserLoading(true);
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as Omit<AppUser, 'uid' | 'transactionCount' | 'totalSpent'>; 
        
        const completeAppUser: AppUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || userData.name || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || userData.email,
          photoURL: firebaseUser.photoURL || userData.photoURL,
          joinDate: userData.joinDate || (firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          isAdmin: userData.isAdmin || false,
          transactionTag: userData.transactionTag || undefined, // Explicitly include transactionTag
          transactionCount: (userData as AppUser).transactionCount || 0,
          totalSpent: (userData as AppUser).totalSpent || 0,
          isActive: userData.isActive === undefined ? true : userData.isActive, 
          isDeletedAccount: userData.isDeletedAccount || false, 
          deletedAt: userData.deletedAt || undefined,
        };
        setAppUser(completeAppUser);
        setIsAdminUser(completeAppUser.isAdmin === true);

      } else {
        console.warn(`User document not found for UID: ${firebaseUser.uid}. Treating as non-admin and creating a default AppUser object.`);
        setAppUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          joinDate: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          isAdmin: false,
          transactionTag: undefined, // Ensure it's part of the default object too
          transactionCount: 0,
          totalSpent: 0,
          isActive: true,
          isDeletedAccount: false,
        });
        setIsAdminUser(false);
      }
      setAppUserLoading(false);
    }, (error) => {
      console.error("Error fetching user document:", error);
      setAppUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          joinDate: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          isAdmin: false,
          transactionTag: undefined, // And here
          transactionCount: 0,
          totalSpent: 0,
          isActive: true,
          isDeletedAccount: false,
        });
      setIsAdminUser(false);
      setAppUserLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser, firebaseLoading]);

  const combinedLoading = firebaseLoading || appUserLoading;

  return (
    <>
      {children({ 
        user: firebaseUser, 
        appUser, 
        isAdminUser, 
        loading: combinedLoading, 
        error: firebaseError 
      })}
    </>
  );
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  if (!firebaseAuthInstance) {
    console.error(
      "CRITICAL: Firebase auth object from '@/lib/firebase' is not initialized. This usually means your Firebase configuration (apiKey, projectId, etc.) is missing or incorrect. Please check src/lib/firebase.ts and your environment variables (e.g., NEXT_PUBLIC_FIREBASE_API_KEY)."
    );
    
    const errorState: AuthContextType = {
      user: null,
      appUser: null,
      isAdminUser: false,
      loading: false,
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

