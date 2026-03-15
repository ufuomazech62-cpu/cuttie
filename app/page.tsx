"use client";

import React, { useState, useEffect } from 'react';
import Landing from '../components/Landing';
import Onboarding from '../components/onboarding/Onboarding';
import Dashboard from '../components/dashboard/Dashboard';
import Logo from '../components/Logo';
import { BodyProfile, StyleItem } from '../types';
import { INITIAL_FREE_CREDITS } from '../data/constants';

// Mock Auth Imports
import { 
  MockUser, 
  getMockUser, 
  getMockProfile, 
  mockSignIn, 
  mockSignOut, 
  mockSaveProfile,
  onMockAuthStateChanged,
  createDefaultDevProfile
} from '../lib/mockAuth';

enum AppState {
  LANDING,
  ONBOARDING,
  SIGNIN,
  DASHBOARD,
  LOADING
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [user, setUser] = useState<MockUser | null>(null);
  const [userProfile, setUserProfile] = useState<BodyProfile | null>(null);
  const [initialStyle, setInitialStyle] = useState<StyleItem | null>(null);
  const [initialFabrics, setInitialFabrics] = useState<string[]>([]);

  useEffect(() => {
    // Mock auth state listener
    const unsubscribe = onMockAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Get stored profile from localStorage
        const profile = getMockProfile();
        
        if (profile) {
          setUserProfile(profile);
          setAppState(AppState.DASHBOARD);
        } else {
          // User logged in but no profile - go to onboarding
          if (appState === AppState.LOADING) {
            setAppState(AppState.LANDING);
          }
        }
      } else {
        setAppState(AppState.LANDING);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
    if (!user) {
        console.error("User not authenticated during onboarding completion");
        alert("Please sign in to save your profile.");
        return;
    }

    try {
        let finalProfile: BodyProfile = { 
            ...profile, 
            email: user.email || undefined,
            credits: INITIAL_FREE_CREDITS
        };
        
        // In mock mode, we don't upload to storage, just keep the base64 or URL
        // For very large base64 strings, we could simulate a URL
        if (finalProfile.referenceImage && finalProfile.referenceImage.startsWith('data:')) {
            // Keep as base64 for mock - in production this would be uploaded
            console.log("Mock: Keeping reference image as base64");
        }
        
        console.log("Mock: Saving profile for user:", user.uid);
        await mockSaveProfile(user.uid, finalProfile);
        console.log("Mock: Profile saved successfully");
        
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
    await mockSignOut();
    setUser(null);
    setUserProfile(null);
    setInitialStyle(null);
    setInitialFabrics([]);
    setAppState(AppState.LANDING);
  };
  
  const handleGoogleSignIn = async () => {
    try {
        const result = await mockSignIn();
        console.log("Mock sign in successful:", result.uid);
        setUser(result);
        // Auth state listener will handle navigation to onboarding
    } catch (error: any) {
        console.error("Error signing in", error);
        const errorMsg = error?.message || "Unknown error";
        alert(`Sign in failed: ${errorMsg}`);
    }
  };

  if (appState === AppState.LOADING) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-cuttie-cream">
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
                  await mockSaveProfile(user.uid, newProfile);
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
