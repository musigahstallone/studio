
"use client";

import { useState, useEffect } from 'react'; // Added useEffect
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2, LogIn, UserPlus, KeyRound, CheckCircle, AlertCircle, Eye, EyeOff, Info } from 'lucide-react'; // Added Info
import { generateTransactionTag } from '@/lib/types'; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const loginReason = sessionStorage.getItem('loginReason');
    if (loginReason === 'authRedirect') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in or sign up to continue to your destination.',
        action: <Info className="text-blue-500" />,
        duration: 7000,
      });
      sessionStorage.removeItem('loginReason');
    }
  }, [toast]);

  const handleAuthError = (err: any, action: 'Login' | 'Signup' | 'Password Reset') => {
    console.error(`${action} error:`, err);
    let friendlyMessage = "An unexpected error occurred. Please try again.";
    if (err.code) {
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          friendlyMessage = 'Invalid email or password.';
          break;
        case 'auth/email-already-in-use':
          friendlyMessage = 'This email address is already in use. Try logging in.';
          setAuthMode('login');
          break;
        case 'auth/weak-password':
          friendlyMessage = 'Password should be at least 6 characters.';
          break;
        case 'auth/invalid-email':
          friendlyMessage = 'Please enter a valid email address.';
          break;
        case 'auth/visibility-check-was-unavailable':
          friendlyMessage = 'Login check failed. This can be due to network issues or browser extensions. Please try again. If it persists, check your internet connection or try disabling browser extensions.';
          break;
        default:
          friendlyMessage = err.message || friendlyMessage;
      }
    }
    setError(friendlyMessage);
    toast({ variant: 'destructive', title: `${action} Failed`, description: friendlyMessage, action: <AlertCircle className="text-red-500" /> });
  };

  const redirectToIntendedPathOrDashboard = () => {
    const intendedPath = sessionStorage.getItem('intendedPath');
    sessionStorage.removeItem('intendedPath'); // Clear it after use
    router.push(intendedPath || '/'); // Or '/dashboard' if preferred
  };

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
      redirectToIntendedPathOrDashboard();
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
      toast({ variant: 'destructive', title: 'Signup Failed', description: "Passwords do not match.", action: <AlertCircle className="text-red-500" /> });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        let uniqueTransactionTag = '';
        let tagExists = true;
        const usersRef = collection(db, 'users');
        let attempts = 0;
        const maxAttempts = 20;

        while (tagExists && attempts < maxAttempts) {
          uniqueTransactionTag = generateTransactionTag();
          const q = query(usersRef, where('transactionTag', '==', uniqueTransactionTag));
          const querySnapshot = await getDocs(q);
          tagExists = !querySnapshot.empty;
          attempts++;
        }
        if (attempts >= maxAttempts && tagExists) {
           console.error("Failed to generate a unique transaction tag after multiple attempts.");
           throw new Error("Could not generate a unique user identifier. Please try again.");
        }
        
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          name: user.email?.split('@')[0] || 'New User',
          photoURL: user.photoURL,
          joinDate: Timestamp.fromDate(new Date()),
          isAdmin: false,
          transactionTag: uniqueTransactionTag, 
          isActive: true, 
          isDeletedAccount: false, 
        });
      }
      toast({
        title: 'Signup Successful!',
        description: 'Your account has been created. Welcome to SM Cash!',
        action: <CheckCircle className="text-green-500" />,
      });
      redirectToIntendedPathOrDashboard();
    } catch (err: any) {
      handleAuthError(err, 'Signup');
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
      toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for instructions to reset your password.', action: <CheckCircle className="text-green-500" /> });
    } catch (err: any) {
      handleAuthError(err, 'Password Reset');
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
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">SM Cash</CardTitle>
          <CardDescription>
            {authMode === 'login' ? 'Sign in to your account.' : 'Create an account to manage your finances.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {commonFormFields}
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
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
              <p className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => {
                    setAuthMode('signup');
                    setError(null);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  type="button"
                >
                  Sign up
                </Button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
              {commonFormFields}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button
                type="submit"
                disabled={isLoading || !email || !password || !confirmPassword}
                className="w-full"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Sign Up
              </Button>
              <p className="text-center text-sm">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  type="button"
                >
                  Log in
                </Button>
              </p>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex-col items-center justify-center text-xs text-muted-foreground pt-6">
          <Separator className="mb-4" />
          <p>&copy; {new Date().getFullYear()} SM Cash. All rights reserved.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
