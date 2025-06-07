
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
import { Loader2, LogIn, UserPlus, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'; // Added new icons
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // For tabbed interface

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // For signup
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: `Welcome back!`,
        action: <CheckCircle className="text-green-500" />,
      });
      router.push('/'); // Redirect to dashboard
    } catch (err: any) {
      handleAuthError(err, 'Login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({ variant: 'destructive', title: 'Signup Failed', description: "Passwords do not match." });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.email?.split('@')[0] || 'New User',
          photoURL: null,
          joinDate: serverTimestamp(),
          isAdmin: false, // Default to not admin
        });
      }
      toast({
        title: 'Signup Successful',
        description: 'Welcome to PennyPincher AI!',
        action: <CheckCircle className="text-green-500" />,
      });
      router.push('/'); // Redirect to dashboard
    } catch (err: any) {
      handleAuthError(err, 'Signup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (err: any, action: 'Login' | 'Signup') => {
    console.error(`${action} error:`, err);
    let friendlyMessage = "An unexpected error occurred. Please try again.";
    if (err.code) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // For newer Firebase SDK versions
          friendlyMessage = 'Invalid email or password.';
          break;
        case 'auth/email-already-in-use':
          friendlyMessage = 'This email address is already in use. Try logging in.';
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
    toast({ variant: 'destructive', title: `${action} Failed`, description: friendlyMessage, action: <AlertCircle className="text-red-500" /> });
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

  const commonFormFields = (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
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
          required
        />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">PennyPincher AI</CardTitle>
          <CardDescription>
            {activeTab === 'login' ? 'Sign in to your account.' : 'Create an account to manage your finances.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="pt-6">
              <form onSubmit={handleLogin} className="space-y-6">
                {commonFormFields}
                {error && activeTab === 'login' && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                  Login
                </Button>
                <div className="text-center">
                  <Button
                    onClick={handlePasswordReset}
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary px-0"
                    disabled={isLoading || !email}
                  >
                    <KeyRound className="mr-1.5 h-4 w-4" /> Forgot Password?
                  </Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="pt-6">
              <form onSubmit={handleSignup} className="space-y-6">
                {commonFormFields}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {error && activeTab === 'signup' && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button
                  type="submit"
                  disabled={isLoading || !email || !password || !confirmPassword}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus />}
                  Sign Up
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex-col items-center justify-center text-xs text-muted-foreground pt-6">
          <Separator className="mb-4" />
          <p>&copy; {new Date().getFullYear()} PennyPincher AI. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
