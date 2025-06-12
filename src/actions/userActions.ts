
'use server';

import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  deleteUser, 
  fetchSignInMethodsForEmail, 
  verifyBeforeUpdateEmail,
  signOut 
} from 'firebase/auth';

export async function deleteCurrentUserAccount(): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No user is currently signed in.");
  }

  try {
    // 1. Mark Firestore document as deleted
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      isDeletedAccount: true,
      isActive: false,
      name: "Deleted User", // Anonymize name
      photoURL: null, // Remove photoURL
      deletedAt: serverTimestamp(),
      // Email is kept for historical/auditing reasons in Firestore.
      // The actual login capability via this email is removed when Auth user is deleted.
    });

    // 2. Delete Firebase Authentication user
    await deleteUser(currentUser);
    // Note: deleteUser() automatically signs the user out.
    // Explicit signOut(auth) afterwards might not be needed or could error if user is already signed out.

  } catch (error: any) {
    console.error("Error deleting user account:", error);
    if (error.code === 'auth/requires-recent-login') {
      throw new Error("This operation is sensitive and requires recent authentication. Please log out and log back in before deleting your account.");
    }
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}

export async function requestEmailUpdate(newEmail: string): Promise<{ title: string; description: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("No user is currently signed in.");
  }

  if (currentUser.email === newEmail) {
    // This case should ideally be caught client-side before calling the action.
    return {
        title: "No Change Required",
        description: "The new email is the same as your current email."
    };
  }

  try {
    // Check if the new email is already in use by another account
    const signInMethods = await fetchSignInMethodsForEmail(auth, newEmail);
    if (signInMethods && signInMethods.length > 0) {
      throw new Error("This email address is already in use by another account. Please choose a different email.");
    }

    // Send verification email to the new email address
    await verifyBeforeUpdateEmail(currentUser, newEmail);

    return {
      title: "Verification Email Sent",
      description: `A verification link has been sent to ${newEmail}. Please click the link in that email to update your login email address.`,
    };
  } catch (error: any) {
    console.error("Error requesting email update:", error);
    if (error.code === 'auth/requires-recent-login') {
      throw new Error("This operation is sensitive and requires recent authentication. Please log out and log back in before changing your email.");
    }
    if (error.code === 'auth/invalid-email') {
        throw new Error("The new email address is not valid.");
    }
    throw new Error(`Failed to request email update: ${error.message}`);
  }
}
