// Mock User Service for Development
// Uses localStorage instead of Firebase

import { BodyProfile, GeneratedLook } from "../types";

// Storage keys
const HISTORY_KEY = 'cuttie_mock_history';
const CREDITS_KEY = 'cuttie_mock_credits';

// Get user history from localStorage
export const getUserHistory = async (uid: string): Promise<GeneratedLook[]> => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Save generated look to localStorage
export const saveGeneratedLook = async (uid: string, look: GeneratedLook): Promise<GeneratedLook> => {
  if (typeof window === 'undefined') return look;
  
  const history = await getUserHistory(uid);
  const existingIndex = history.findIndex(l => l.id === look.id);
  
  if (existingIndex >= 0) {
    history[existingIndex] = look;
  } else {
    history.unshift(look);
  }
  
  // Keep only last 50 looks
  const trimmedHistory = history.slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
  
  return look;
};

// Delete generated look from localStorage
export const deleteGeneratedLook = async (uid: string, lookId: string, look: GeneratedLook): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  const history = await getUserHistory(uid);
  const filteredHistory = history.filter(l => l.id !== lookId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
};

// Get user credits from localStorage
export const getUserCredits = async (uid: string): Promise<number> => {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(CREDITS_KEY);
  return stored ? parseInt(stored, 10) : 999; // Default dev credits
};

// Update user credits in localStorage
export const updateUserCredits = async (uid: string, credits: number): Promise<void> => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CREDITS_KEY, credits.toString());
};

// Get user profile (delegates to mockAuth)
export const getUserProfile = async (uid: string): Promise<BodyProfile | null> => {
  if (typeof window === 'undefined') return null;
  const { getMockProfile } = await import('../lib/mockAuth');
  return getMockProfile();
};

// Update user profile (delegates to mockAuth)
export const updateUserProfile = async (uid: string, profile: BodyProfile): Promise<void> => {
  if (typeof window === 'undefined') return;
  const { setMockProfile } = await import('../lib/mockAuth');
  setMockProfile(profile);
};

// Mock upload image - just returns the data URL or URL as-is
// In development, we don't actually upload to storage
export const uploadImage = async (uid: string, dataUrl: string, path: string): Promise<string> => {
  console.log("Mock uploadImage - returning as-is:", path);
  
  // If it's already a URL, return it
  if (!dataUrl || dataUrl.startsWith('http')) {
    return dataUrl;
  }
  
  // For base64 images, we could store them in localStorage
  // But for now, just return the base64 string directly
  // This keeps images in memory/localStorage for dev
  return dataUrl;
};

// Mock submit feedback - just logs to console
export const submitFeedback = async (uid: string, type: string, message: string): Promise<void> => {
  console.log("Mock feedback submitted:", { uid, type, message });
  // Could store in localStorage if needed
  const feedbackKey = 'cuttie_mock_feedback';
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(feedbackKey) || '[]';
    const feedback = JSON.parse(stored);
    feedback.push({ uid, type, message, timestamp: Date.now() });
    localStorage.setItem(feedbackKey, JSON.stringify(feedback));
  }
};
