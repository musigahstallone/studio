
"use client";

import { useState, useEffect } from 'react';
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
import { Loader2, Save, UserCircle, Edit3, UploadCloud } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name cannot exceed 50 characters.").optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, appUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: appUser?.name || user?.displayName || '',
    },
  });

  useEffect(() => {
    if (appUser || user) {
      form.reset({
        displayName: appUser?.name || user?.displayName || '',
      });
    }
  }, [appUser, user, form]);

  const handleNameSubmit = async (data: ProfileFormData) => {
    if (!user || !data.displayName) return;
    setIsSavingName(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.displayName });
      }
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { name: data.displayName });
      toast({ title: "Profile Updated", description: "Your display name has been saved." });
    } catch (error) {
      console.error("Error updating display name:", error);
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save your display name." });
    } finally {
      setIsSavingName(false);
    }
  };

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
      setSelectedFile(null);
      setPreviewImage(null);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile || !user) {
      toast({ variant: "destructive", title: "No File", description: "Please select an image to upload." });
      return;
    }
    setIsUploadingPhoto(true);
    const fileExtension = selectedFile.name.split('.').pop();
    const storageRef = ref(storage, `profilePictures/${user.uid}/profileImage.${fileExtension}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Optional: Handle progress
      },
      (error) => {
        console.error("Error uploading profile photo:", error);
        toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload your profile picture." });
        setIsUploadingPhoto(false);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (auth.currentUser) {
            await updateProfile(auth.currentUser, { photoURL: downloadURL });
          }
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, { photoURL: downloadURL });
          toast({ title: "Profile Picture Updated", description: "Your new profile picture is saved." });
          setSelectedFile(null);
          setPreviewImage(null);
        } catch (error) {
          console.error("Error updating photo URL:", error);
          toast({ variant: "destructive", title: "Update Failed", description: "Could not save profile picture URL." });
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    );
  };

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full py-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  const currentPhotoURL = appUser?.photoURL || user?.photoURL;

  return (
    <AppShell>
      <div className="space-y-8 max-w-2xl mx-auto">
        <h1 className="font-headline text-3xl font-semibold text-foreground">
          My Profile
        </h1>

        <Card className="shadow-lg">
          <CardHeader className="items-center">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-primary/20 text-5xl">
                <AvatarImage src={currentPhotoURL || undefined} alt={appUser?.name || user?.displayName || 'User'} data-ai-hint="user avatar"/>
                <AvatarFallback>
                  {appUser?.name ? appUser.name.charAt(0).toUpperCase() : 
                   user?.displayName ? user.displayName.charAt(0).toUpperCase() : 
                   user?.email ? user.email.charAt(0).toUpperCase() : <UserCircle />}
                </AvatarFallback>
              </Avatar>
               {/* Future edit icon overlay for direct click on image:
               <Label htmlFor="photo-upload-input" className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <Edit3 className="h-8 w-8 text-white" />
              </Label> 
              */}
            </div>
            <CardTitle className="text-2xl mt-4">{appUser?.name || user?.displayName || 'Your Name'}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={form.handleSubmit(handleNameSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="displayName"
                    {...form.register('displayName')}
                    className="flex-grow"
                    placeholder="Enter your display name"
                  />
                  <Button type="submit" disabled={isSavingName}>
                    {isSavingName ? <Loader2 className="animate-spin" /> : <Save />}
                    <span className="ml-2 hidden sm:inline">Save Name</span>
                  </Button>
                </div>
                {form.formState.errors.displayName && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                )}
              </div>
            </form>

            <div className="space-y-2">
              <Label htmlFor="photo-upload-input">Profile Picture</Label>
              {previewImage && (
                <div className="my-2 relative w-40 h-40 mx-auto rounded-md overflow-hidden border shadow-sm">
                    <Image src={previewImage} alt="Selected profile preview" layout="fill" objectFit="cover" data-ai-hint="profile preview"/>
                </div>
              )}
              <Input
                id="photo-upload-input"
                type="file"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {selectedFile && (
                 <Button onClick={handlePhotoUpload} disabled={isUploadingPhoto} className="w-full mt-2">
                  {isUploadingPhoto ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                  <span className="ml-2">Upload New Picture</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
