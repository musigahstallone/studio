
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';
// import { auth } from '@/lib/firebase'; // Not needed for this specific action if admin role is checked client-side or via rules

export async function markAllUsersActive(): Promise<{ title: string; description: string }> {
  // In a production app, you'd add robust admin role verification here,
  // possibly by checking custom claims from auth.currentUser if using Firebase Admin SDK server-side,
  // or by ensuring this server action is only callable from admin-protected routes.
  // For now, we rely on the client-side AdminShell protection.

  try {
    const usersColRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersColRef);
    
    if (usersSnapshot.empty) {
      return {
        title: "No Users Found",
        description: "There are no user documents in the database to update.",
      };
    }

    const batch = writeBatch(db);
    let usersUpdatedCount = 0;

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      // Only update if the user is not already marked as deleted
      // and if the isActive field is not already true or is undefined.
      if (!userData.isDeletedAccount && userData.isActive !== true) {
        batch.update(userDoc.ref, {
          isActive: true,
          updatedAt: serverTimestamp(),
        });
        usersUpdatedCount++;
      }
    });

    if (usersUpdatedCount > 0) {
      await batch.commit();
      return {
        title: "Users Updated",
        description: `${usersUpdatedCount} user(s) marked as active.`,
      };
    } else {
      return {
        title: "No Users to Update",
        description: "All non-deleted users are already active or no users required an update.",
      };
    }
  } catch (error: any) {
    console.error("Error marking all users active:", error);
    // It's better to throw the error so the client can handle it specifically if needed
    throw new Error(`Failed to mark users as active. ${error.message || 'Unknown error occurred.'}`);
  }
}
