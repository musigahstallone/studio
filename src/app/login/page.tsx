
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2, LogIn, UserPlus, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthAction = async (action: 'login' | 'signup') => {
    setIsLoading(true);
    setError(null);
    try {
      let userCredential;
      if (action === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Login Successful', description: `Welcome back!` });
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Create a user document in Firestore
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            name: user.email?.split('@')[0] || 'New User', // Basic name from email
            photoURL: null,
            joinDate: serverTimestamp(),
            isAdmin: false, // Default to not admin
          });
        }
        toast({ title: 'Signup Successful', description: 'Welcome to PennyPincher AI!' });
      }
      router.push('/'); // Redirect to dashboard
    } catch (err: any) {
      console.error(`${action} error:`, err);
      let friendlyMessage = "An unexpected error occurred. Please try again.";
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            friendlyMessage = 'Invalid email or password.';
            break;
          case 'auth/email-already-in-use':
            friendlyMessage = 'This email address is already in use.';
            break;
          case 'auth/weak-password':
            friendlyMessage = 'Password should be at least 6 characters.';
            break;
          case 'auth/invalid-email':
            friendlyMessage = 'Please enter a valid email address.';
            break;
          default:
            friendlyMessage = err.message || friendlyMessage;
        }
      }
      setError(friendlyMessage);
      toast({ variant: 'destructive', title: `${action === 'login' ? 'Login' : 'Signup'} Failed`, description: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Email Required', description: 'Please enter your email address to reset password.' });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for instructions to reset your password.' });
    } catch (err: any) {
      let friendlyMessage = "Failed to send password reset email. Please try again.";
      if (err.code === 'auth/user-not-found') {
        friendlyMessage = "No user found with this email address.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
      toast({ variant: 'destructive', title: 'Password Reset Failed', description: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">PennyPincher AI</CardTitle>
          <CardDescription>Sign in or create an account to manage your finances.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <div className="space-y-3">
            <Button
              onClick={() => handleAuthAction('login')}
              disabled={isLoading || !email || !password}
              className="w-full"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
              Login
            </Button>
            <Button
              onClick={() => handleAuthAction('signup')}
              disabled={isLoading || !email || !password}
              variant="outline"
              className="w-full"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus />}
              Sign Up
            </Button>
          </div>
          <Separator className="my-6" />
          <div className="text-center">
            <Button
              onClick={handlePasswordReset}
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary"
              disabled={isLoading || !email}
            >
              <KeyRound className="mr-1.5 h-4 w-4" /> Forgot Password?
            </Button>
          </div>
        </CardContent>
         <CardFooter className="justify-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PennyPincher AI. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
