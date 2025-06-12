
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
import { Loader2, Save, UserCircle, Edit3, UploadCloud, Mail, User } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import Link from 'next/link';
import { Form } from '@/components/ui/form'; // Added Form import

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters."),
  email: z.string().email("Invalid email address."),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, appUser, loading: authLoading, isAdminUser } = useAuth(); // Added isAdminUser
  const { toast } = useToast();
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // Store initial values to compare for enabling update button
  const [initialDisplayName, setInitialDisplayName] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  // We don't need initialPhotoURL state as selectedFile !== null handles this

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
      const email = appUser?.email || user?.email || '';
      form.reset({
        displayName: name,
        email: email,
      });
      setInitialDisplayName(name);
      setInitialEmail(email);
      if (appUser?.photoURL || user?.photoURL) {
        setPreviewImage(appUser?.photoURL || user?.photoURL || null);
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
      // If deselected, reset preview to current user photo or null
      setPreviewImage(appUser?.photoURL || user?.photoURL || null);
      setSelectedFile(null);
    }
  };

  const handleProfileUpdate = async (data: ProfileFormData) => {
    if (!user) return;
    setIsUpdatingProfile(true);
    let nameUpdated = false;
    let emailUpdatedInFirestore = false;
    let photoUpdated = false;

    try {
      // Update Display Name
      if (data.displayName !== initialDisplayName) {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: data.displayName });
        }
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { name: data.displayName });
        setInitialDisplayName(data.displayName); // Update initial state
        nameUpdated = true;
      }

      // Update Email (Firestore only)
      if (data.email !== initialEmail && isEditingEmail) { // Check if email editing was enabled
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { email: data.email });
        setInitialEmail(data.email); // Update initial state
        emailUpdatedInFirestore = true;
        // Note: Firebase Auth email update is complex and skipped here.
        // UI will reflect Firestore change.
      }

      // Update Profile Photo
      if (selectedFile) {
        const fileExtension = selectedFile.name.split('.').pop();
        const storageRef = ref(storage, `profilePictures/${user.uid}/profileImage.${fileExtension}`);
        const uploadTask = uploadBytesResumable(storageRef, selectedFile);
        
        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null, // snapshot
            (error) => reject(error), // error
            async () => { // complete
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                if (auth.currentUser) {
                  await updateProfile(auth.currentUser, { photoURL: downloadURL });
                }
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { photoURL: downloadURL });
                setPreviewImage(downloadURL); // Update preview to new uploaded image
                photoUpdated = true;
                resolve();
              } catch (innerError) {
                reject(innerError);
              }
            }
          );
        });
        setSelectedFile(null); // Reset file selection
      }

      if (nameUpdated || emailUpdatedInFirestore || photoUpdated) {
        toast({ title: "Profile Updated", description: "Your profile details have been saved." });
      } else {
        toast({ title: "No Changes", description: "No changes were made to your profile." });
      }
      form.reset({ displayName: data.displayName, email: data.email }); // Reset form dirty state
      setIsEditingEmail(false); // Disable email editing after update
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your profile changes." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  const currentPhotoURL = previewImage || appUser?.photoURL || user?.photoURL;
  const watchedDisplayName = form.watch('displayName');
  const watchedEmail = form.watch('email');
  
  const isDirty = (watchedDisplayName !== initialDisplayName) || 
                  (isEditingEmail && watchedEmail !== initialEmail) || 
                  selectedFile !== null;


  if (authLoading) {
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
        <div className="flex justify-between items-center">
          <h1 className="font-headline text-3xl font-semibold text-foreground">
            My Profile
          </h1>
          {isAdminUser && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin">Admin Panel</Link>
              </Button>
          )}
        </div>


        <Card className="shadow-lg">
          <CardHeader className="items-center">
            <div className="relative group w-32 h-32">
              <Avatar className="h-full w-full border-4 border-primary/20 text-5xl">
                <AvatarImage src={currentPhotoURL || undefined} alt={appUser?.name || user?.displayName || 'User'} data-ai-hint="user avatar"/>
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
                <Edit3 className="h-8 w-8 text-white" />
              </Label>
            </div>
            <Input
              id="photo-upload-input"
              type="file"
              accept="image/png, image/jpeg, image/gif"
              onChange={handleFileChange}
              className="hidden" // Visually hide the input
            />
            <CardTitle className="text-2xl mt-4">{form.watch('displayName') || 'Your Name'}</CardTitle>
            <CardDescription>{form.watch('email') || 'your@email.com'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileUpdate)} className="space-y-4">
                <div>
                  <Label htmlFor="displayName" className="flex items-center mb-1">
                    <User className="mr-2 h-4 w-4 text-muted-foreground"/> Display Name
                  </Label>
                  <Input
                    id="displayName"
                    {...form.register('displayName')}
                    className="flex-grow"
                    placeholder="Enter your display name"
                  />
                  {form.formState.errors.displayName && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground"/> Email Address
                    </Label>
                    {!isEditingEmail && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingEmail(true)} className="text-xs h-auto p-1">
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
                    disabled={!isEditingEmail}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                  )}
                   {!isEditingEmail && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change your login email. Your display email can be updated here.
                    </p>
                   )}
                </div>
                
                {selectedFile && (
                  <p className="text-xs text-primary text-center">New profile picture selected. Click "Update Profile" to save.</p>
                )}

                <CardFooter className="px-0 pt-6">
                  <Button type="submit" disabled={isUpdatingProfile || !isDirty} className="w-full">
                    {isUpdatingProfile ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Profile
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

