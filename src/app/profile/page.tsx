
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, UserCircle, Edit3, UploadCloud, Mail, User, AlertTriangle, Trash2, Copy, Link as LinkIcon, SendHorizontal } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth'; 
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Image from 'next/image'; 
import Link from 'next/link';
import { Form } from '@/components/ui/form';
import { deleteCurrentUserAccount as deleteCurrentUserAccountAction, requestEmailUpdate as requestEmailUpdateAction } from '@/actions/userActions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  email: z.string().email("Invalid email address."),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, appUser, loading: authLoading, isAdminUser } = useAuth();
  const { toast } = useToast();
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isRequestingEmailUpdate, setIsRequestingEmailUpdate] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [sendMoneyLink, setSendMoneyLink] = useState('');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
    },
  });

  useEffect(() => {
    if (appUser || user) {
      const name = appUser?.name || user?.displayName || '';
      const emailValue = appUser?.email || user?.email || '';
      form.reset({
        displayName: name,
        email: emailValue,
      });
      setInitialDisplayName(name);
      setInitialEmail(emailValue);
      if (appUser?.photoURL || user?.photoURL) {
        setPreviewImage(appUser?.photoURL || user?.photoURL || null);
      }

      if (appUser?.transactionTag && appUser?.name) {
        const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
        const tag = appUser.transactionTag;
        const recipientName = encodeURIComponent(appUser.name);
        setSendMoneyLink(`${appBaseUrl}/send-money?toTag=${tag}&recipientName=${recipientName}`);
      } else {
        setSendMoneyLink(''); 
      }
    }
  }, [appUser, user, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(appUser?.photoURL || user?.photoURL || null);
      setSelectedFile(null);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    setIsUpdatingProfile(true);
    setIsRequestingEmailUpdate(false); 

    let nameUpdated = false;
    let emailChangeRequestedSuccessfully = false;
    let photoUpdated = false;

    try {
      if (data.displayName !== initialDisplayName) {
        if (auth.currentUser) {
          await updateFirebaseAuthProfile(auth.currentUser, { displayName: data.displayName });
        }
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { name: data.displayName });
        setInitialDisplayName(data.displayName); 
        nameUpdated = true;
      }

      if (isEditingEmail && data.email !== initialEmail) {
        setIsRequestingEmailUpdate(true);
        try {
          const result = await requestEmailUpdateAction(data.email);
          toast({ title: result.title, description: result.description });
          emailChangeRequestedSuccessfully = true;
        } catch (error: any) {
          toast({ variant: "destructive", title: "Email Update Failed", description: error.message });
        } finally {
          setIsRequestingEmailUpdate(false);
        }
      }

      if (selectedFile) {
        const fileExtension = selectedFile.name.split('.').pop();
        const storageRef = ref(storage, `profilePictures/${user.uid}/profileImage.${fileExtension}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed', null, 
            (error) => reject(error), 
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                if (auth.currentUser) {
                  await updateFirebaseAuthProfile(auth.currentUser, { photoURL: downloadURL });
                }
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { photoURL: downloadURL });
                setPreviewImage(downloadURL); 
                photoUpdated = true;
                resolve();
              } catch (innerError) { reject(innerError); }
            }
          );
        });
        setSelectedFile(null); 
      }

      if (nameUpdated || photoUpdated) {
        toast({ title: "Profile Updated", description: "Your display name and/or photo have been updated." });
      } else if (!emailChangeRequestedSuccessfully && !nameUpdated && !photoUpdated && !(isEditingEmail && data.email !== initialEmail)) {
        toast({ title: "No Changes", description: "No direct changes were made to your profile." });
      }
      
      if (!isEditingEmail || (isEditingEmail && emailChangeRequestedSuccessfully)) {
        form.reset({ displayName: data.displayName, email: initialEmail }); 
      }
      setIsEditingEmail(false); 
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your profile changes." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      await deleteCurrentUserAccountAction();
      toast({ title: "Account Deletion Processed", description: "Your account is being deleted. You will be logged out shortly."});
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      setIsDeletingAccount(false); 
    }
  };
  
  const copyToClipboard = (text: string, successMessage: string) => {
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast({ title: "Copied!", description: successMessage });
        })
        .catch(err => {
          toast({ variant: "destructive", title: "Copy Failed", description: "Could not copy to clipboard." });
        });
    }
  };

  const currentPhotoURL = previewImage || appUser?.photoURL || user?.photoURL || undefined;
  const watchedDisplayName = form.watch('displayName');
  const watchedEmail = form.watch('email');
  
  const isDirty = (watchedDisplayName !== initialDisplayName) || 
                  (isEditingEmail && watchedEmail !== initialEmail) || 
                  selectedFile !== null;

  if (authLoading && !appUser) { 
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h1 className="font-headline text-2xl md:text-3xl font-semibold text-foreground">
            My Profile
          </h1>
          {isAdminUser && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">Admin Panel</Link>
              </Button>
          )}
        </div>

        <Card className="shadow-lg rounded-xl">
          <CardHeader className="items-center">
            <div className="relative group w-28 h-28 sm:w-32 sm:h-32">
              <Avatar className="h-full w-full border-4 border-primary/20 text-4xl sm:text-5xl">
                <AvatarImage src={currentPhotoURL} alt={appUser?.name || user?.displayName || 'User'} className="object-cover" data-ai-hint="user avatar"/>
                <AvatarFallback>
                  {appUser?.name ? appUser.name.charAt(0).toUpperCase() : 
                   user?.displayName ? user.displayName.charAt(0).toUpperCase() : 
                   user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle />}
                </AvatarFallback>
              </Avatar>
              <Label 
                htmlFor="photo-upload-input" 
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                title="Change profile picture"
              >
                <Edit3 className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </Label>
            </div>
            <Input
              id="photo-upload-input"
              type="file"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <CardTitle className="text-xl sm:text-2xl mt-4">{form.watch('displayName') || 'Your Name'}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{form.watch('email') || 'your@email.com'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div>
                  <Label htmlFor="displayName" className="flex items-center mb-1 text-xs sm:text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground"/> Display Name
                  </Label>
                  <Input
                    id="displayName"
                    {...form.register('displayName')}
                    className="flex-grow"
                    placeholder="Enter your display name"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="email" className="flex items-center text-xs sm:text-sm">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground"/> Email Address
                    </Label>
                    {!isEditingEmail && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingEmail(true)} className="text-xs h-auto p-1">
                        <Edit3 className="mr-1 h-3 w-3"/> Edit
                      </Button>
                    )}
                  </div>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    className="flex-grow"
                    placeholder="your@email.com"
                    disabled={!isEditingEmail || isUpdatingProfile || isRequestingEmailUpdate}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                  )}
                   {!isEditingEmail && (
                    <p className="text-xs text-muted-foreground mt-1">
                      To change your login email, click &quot;Edit&quot;. A verification email will be sent to the new address.
                    </p>
                   )}
                   {isEditingEmail && (
                    <p className="text-xs text-muted-foreground mt-1">
                      A verification link will be sent to your new email address. Your login email will change after verification.
                    </p>
                   )}
                </div>
                
                {selectedFile && (
                  <p className="text-xs text-primary text-center">New profile picture selected. Click &quot;Update Profile&quot; to save.</p>
                )}

                <CardFooter className="px-0 pt-6 pb-0">
                  <Button type="submit" disabled={isUpdatingProfile || isRequestingEmailUpdate || !isDirty || isDeletingAccount} className="w-full">
                    {(isUpdatingProfile || isRequestingEmailUpdate) ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Profile
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl">
            <CardHeader>
                <CardTitle className="flex items-center text-lg md:text-xl">
                    <SendHorizontal className="mr-2 h-5 w-5 text-primary"/> P2P Transactions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Your unique tag for receiving money and a link to share.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {(authLoading && !appUser) ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading P2P details...
                    </div>
                ) : appUser?.transactionTag ? (
                    <>
                        <div>
                            <Label className="text-xs sm:text-sm font-medium">Your Transaction Tag</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-sm font-mono tracking-wider py-1 px-3">
                                    {appUser.transactionTag}
                                </Badge>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8" 
                                    onClick={() => copyToClipboard(appUser.transactionTag || '', "Transaction Tag copied to clipboard.")}
                                    title="Copy Tag"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                         {sendMoneyLink ? (
                            <div>
                                <Label className="text-xs sm:text-sm font-medium">Shareable &quot;Send Me Money&quot; Link</Label>
                                {/* The Input field for showing the link is now commented out
                                <div className="flex items-center gap-2 mt-1">
                                    <Input type="text" value={sendMoneyLink} readOnly className="text-xs h-8"/>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8" 
                                        onClick={() => copyToClipboard(sendMoneyLink, "Link copied to clipboard.")}
                                        title="Copy Link"
                                    >
                                        <LinkIcon className="h-4 w-4" />
                                    </Button>
                                </div>
                                */}
                                <div className="mt-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(sendMoneyLink, "Link copied to clipboard.")}
                                        title="Copy Send Me Money Link"
                                    >
                                        <LinkIcon className="mr-2 h-4 w-4" /> Copy Your Send Money Link
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Share this link to allow others to send money directly to you.
                                </p>
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground">Shareable link will be available once your display name is set and transaction tag is loaded.</p>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Transaction Tag not available. It should be assigned upon account creation. 
                        If this user existed before tags were implemented, an admin can assign one via the Admin Panel &gt; User Management section.
                    </p>
                )}
            </CardContent>
        </Card>


        <Card className="shadow-lg border-destructive rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive text-lg md:text-xl">
              <AlertTriangle className="mr-2 h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              These actions are permanent and cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isDeletingAccount || isUpdatingProfile}>
                  {isDeletingAccount ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    authentication record and mark your data for removal.
                    Are you sure you want to proceed?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeletingAccount} className="bg-destructive hover:bg-destructive/90">
                    {isDeletingAccount ? <Loader2 className="animate-spin mr-2" /> : null}
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

