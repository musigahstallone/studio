
"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth as firebaseAuthInstance, db } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore'; 
import type { AppUser } from '@/lib/types';

const APP_USER_CACHE_KEY = 'smCashAppUserCache';

interface AuthContextType {
  user: FirebaseUser | null | undefined;
  appUser: AppUser | null | undefined;
  isAdminUser: boolean;
  loading: boolean; // True if firebase auth is loading OR initial appUser fetch is pending
  error?: Error | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthStateController: React.FC<{ children: (authCtxValue: AuthContextType) => ReactNode }> = ({ children }) => {
  const [firebaseUser, firebaseAuthLoading, firebaseAuthError] = useAuthState(firebaseAuthInstance!);
  const [appUser, setAppUser] = useState<AppUser | null | undefined>(undefined);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [appUserLoading, setAppUserLoading] = useState<boolean>(true); // True until first Firestore data (or confirmed no user)

  // Try to load appUser from cache on initial mount if firebaseUser is already available
  useEffect(() => {
    if (!firebaseAuthLoading && firebaseUser) { // Firebase auth state is resolved and there's a user
      try {
        const cachedAppUserString = localStorage.getItem(APP_USER_CACHE_KEY);
        if (cachedAppUserString) {
          const cachedAppUser = JSON.parse(cachedAppUserString) as AppUser;
          if (cachedAppUser.uid === firebaseUser.uid) {
            // Use cached data for faster initial render
            setAppUser(cachedAppUser);
            setIsAdminUser(cachedAppUser.isAdmin || false);
            // appUserLoading will be set to false by the onSnapshot listener when it gets its first data
          } else {
            // Cache is for a different user, clear it
            localStorage.removeItem(APP_USER_CACHE_KEY);
          }
        }
      } catch (e) {
        console.warn("Failed to parse cached appUser", e);
        localStorage.removeItem(APP_USER_CACHE_KEY);
      }
    }
  }, [firebaseUser, firebaseAuthLoading]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (firebaseAuthLoading) {
      // If Firebase auth is still loading, we wait.
      // appUserLoading is true by default.
      return;
    }

    if (!firebaseUser) {
      // No Firebase user, so no appUser, not an admin.
      setAppUser(null);
      setIsAdminUser(false);
      setAppUserLoading(false); // App user loading is complete (no user)
      localStorage.removeItem(APP_USER_CACHE_KEY);
      return;
    }

    // Firebase user exists, set up Firestore listener for appUser.
    // appUserLoading is true until the first snapshot provides data.
    setAppUserLoading(true); 
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as Omit<AppUser, 'uid' | 'transactionCount' | 'totalSpent'>;
        const completeAppUser: AppUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || userData.name || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || userData.email,
          photoURL: firebaseUser.photoURL || userData.photoURL,
          joinDate: userData.joinDate || (firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
          isAdmin: userData.isAdmin || false,
          transactionTag: userData.transactionTag || undefined,
          transactionCount: (userData as AppUser).transactionCount || 0,
          totalSpent: (userData as AppUser).totalSpent || 0,
          isActive: userData.isActive === undefined ? true : userData.isActive,
          isDeletedAccount: userData.isDeletedAccount || false,
          deletedAt: userData.deletedAt || undefined,
        };
        setAppUser(completeAppUser);
        setIsAdminUser(completeAppUser.isAdmin || false);
        localStorage.setItem(APP_USER_CACHE_KEY, JSON.stringify(completeAppUser));
      } else {
        console.warn(`User document not found for UID: ${firebaseUser.uid}. Creating default and caching.`);
        const defaultAppUser: AppUser = { 
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          joinDate: firebaseUser.metadata.creationTime ? new Date(firebaseUser.metadata.creationTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          isAdmin: false,
          transactionTag: undefined,
          transactionCount: 0,
          totalSpent: 0,
          isActive: true,
          isDeletedAccount: false,
        };
        setAppUser(defaultAppUser);
        setIsAdminUser(false);
        localStorage.setItem(APP_USER_CACHE_KEY, JSON.stringify(defaultAppUser));
      }
      setAppUserLoading(false); // Firestore data (or confirmation of none/default created) received.
    }, (error) => {
      console.error("Error fetching user document from Firestore:", error);
      // Attempt to use cached data if Firestore fetch fails but firebaseUser exists
       const cachedAppUserString = localStorage.getItem(APP_USER_CACHE_KEY);
       if (cachedAppUserString && firebaseUser) { // Check firebaseUser to ensure cache relevance
           try {
               const cachedAppUser = JSON.parse(cachedAppUserString) as AppUser;
               if (cachedAppUser.uid === firebaseUser.uid) {
                   setAppUser(cachedAppUser);
                   setIsAdminUser(cachedAppUser.isAdmin || false);
               } else { // Cache for different user, clear it
                   setAppUser(null); 
                   setIsAdminUser(false);
                   localStorage.removeItem(APP_USER_CACHE_KEY);
               }
           } catch (e) { // Failed to parse cache
               setAppUser(null);
               setIsAdminUser(false);
               localStorage.removeItem(APP_USER_CACHE_KEY);
           }
       } else { // No cache or no firebaseUser, clear appUser
           setAppUser(null); 
           setIsAdminUser(false);
           if (firebaseUser) { // If firebaseUser exists but no cache, still remove key
             localStorage.removeItem(APP_USER_CACHE_KEY);
           }
       }
      setAppUserLoading(false); // Error occurred, stop appUser loading.
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [firebaseUser, firebaseAuthLoading]); 

  const combinedLoading = firebaseAuthLoading || appUserLoading;

  return (
    <>
      {children({
        user: firebaseUser,
        appUser,
        isAdminUser,
        loading: combinedLoading,
        error: firebaseAuthError
      })}
    </>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  if (!firebaseAuthInstance) {
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
