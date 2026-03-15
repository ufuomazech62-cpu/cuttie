"use client";

import React, { useState, useEffect } from 'react';
import Landing from '../components/Landing';
import Onboarding from '../components/onboarding/Onboarding';
import Dashboard from '../components/dashboard/Dashboard';
import Logo from '../components/Logo';
import { BodyProfile, StyleItem } from '../types';
import { auth, db, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { uploadImage } from '../services/userService';
import { INITIAL_FREE_CREDITS } from '../data/constants';

enum AppState {
  LANDING,
  ONBOARDING,
  SIGNIN,
  DASHBOARD,
  LOADING
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<BodyProfile | null>(null);
  const [initialStyle, setInitialStyle] = useState<StyleItem | null>(null);
  const [initialFabrics, setInitialFabrics] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          let profile = docSnap.data() as BodyProfile;
          
          // Ensure email is up to date
          if (currentUser.email && (!profile.email || profile.email !== currentUser.email)) {
             profile = { ...profile, email: currentUser.email };
             // We can update it in background
             setDoc(docRef, { email: currentUser.email }, { merge: true });
          }

          setUserProfile(profile);
          // If user has a profile, always go to dashboard
          setAppState(AppState.DASHBOARD);
        } else {
          // User logged in but no profile (new user), go to onboarding if not already there
          // But if they are already in onboarding (e.g. step 4), stay there
          if (appState === AppState.LOADING) {
             setAppState(AppState.LANDING); // Or Onboarding? Let's default to Landing for clarity, or straight to Onboarding if they just signed up?
             // Actually if they have no profile, they likely came from "Sign In" on Landing or are new.
          }
        }
      } else {
        setAppState(AppState.LANDING);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []); // Only run on mount

  const handleGetStarted = () => {
    if (user && userProfile) {
      setAppState(AppState.DASHBOARD);
    } else {
      // Force Sign In first before Onboarding
      setAppState(AppState.SIGNIN);
    }
  };

  const handleSignInState = () => {
      setAppState(AppState.SIGNIN);
  };

  const handleOnboardingComplete = async (profile: BodyProfile, style: StyleItem | null, fabrics: string[]) => {
    // Get the current user directly from auth (more reliable than state)
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
        console.error("User not authenticated during onboarding completion");
        alert("Please sign in to save your profile.");
        return;
    }

    // Save to Firestore
    try {
        let finalProfile = { 
            ...profile, 
            email: currentUser.email || undefined,
            credits: INITIAL_FREE_CREDITS // Give new users their free credits
        };
        
        // Upload reference image to Storage if it's base64 (too large for Firestore)
        if (finalProfile.referenceImage && finalProfile.referenceImage.startsWith('data:')) {
            console.log("Uploading reference image to Storage...");
            const imageUrl = await uploadImage(
                currentUser.uid, 
                finalProfile.referenceImage, 
                `profile/ref-${Date.now()}.jpg`
            );
            finalProfile = { ...finalProfile, referenceImage: imageUrl };
            console.log("Reference image uploaded:", imageUrl);
        }
        
        console.log("Attempting to save profile for user:", currentUser.uid);
        await setDoc(doc(db, "users", currentUser.uid), finalProfile, { merge: true });
        console.log("Profile saved successfully");
        setUserProfile(finalProfile);
        setInitialStyle(style);
        setInitialFabrics(fabrics);
        setAppState(AppState.DASHBOARD);
    } catch (e: any) {
        console.error("Error saving profile:", e);
        const errorMsg = e?.message || "Unknown error";
        alert(`Failed to save profile: ${errorMsg}. Please try again.`);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUserProfile(null);
    setInitialStyle(null);
    setInitialFabrics([]);
    setAppState(AppState.LANDING);
  };
  
  const handleGoogleSignIn = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log("Sign in successful:", result.user.uid);
        // The auth state listener will handle the rest
    } catch (error: any) {
        console.error("Error signing in", error);
        const errorMsg = error?.message || "Unknown error";
        alert(`Sign in failed: ${errorMsg}`);
    }
  };

  if (appState === AppState.LOADING) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-atelier-cream">
              <Logo size="lg" />
          </div>
      );
  }

  return (
    <>
      {appState === AppState.LANDING && (
        <Landing onGetStarted={handleGetStarted} onSignIn={handleSignInState} />
      )}

      {(appState === AppState.ONBOARDING || appState === AppState.SIGNIN) && (
        <Onboarding 
          onComplete={handleOnboardingComplete} 
          isAuthenticated={!!user}
          onSignIn={handleGoogleSignIn}
          initialProfile={userProfile || undefined}
          initialStep={appState === AppState.SIGNIN ? 4 : 1}
        />
      )}

      {appState === AppState.DASHBOARD && userProfile && (
        <Dashboard 
          userProfile={userProfile} 
          onUpdateProfile={async (newProfile) => {
              setUserProfile(newProfile);
              if (user) {
                  await setDoc(doc(db, "users", user.uid), newProfile, { merge: true });
              }
          }}
          onSignOut={handleSignOut}
          initialStyle={initialStyle}
          initialFabrics={initialFabrics}
        />
      )}
    </>
  );
};

export default App;
