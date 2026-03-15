// Mock Authentication Module for Development
// This simulates Firebase auth using localStorage

import { BodyProfile } from '../types';
import { INITIAL_FREE_CREDITS } from '../data/constants';

// Mock User type matching Firebase User interface
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerId: string;
  // Add any other properties needed
}

// Storage keys
const MOCK_USER_KEY = 'cuttie_mock_user';
const MOCK_PROFILE_KEY = 'cuttie_mock_profile';

// Generate a random UID
const generateUID = () => 'mock_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

// Create a default mock user
const createMockUser = (email?: string): MockUser => ({
  uid: generateUID(),
  email: email || `dev-user@cuttie.app`,
  displayName: 'Dev User',
  photoURL: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
  emailVerified: true,
  isAnonymous: false,
  providerId: 'mock',
});

// Get stored mock user
export const getMockUser = (): MockUser | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(MOCK_USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Store mock user
const setMockUser = (user: MockUser | null) => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
  }
};

// Get stored mock profile
export const getMockProfile = (): BodyProfile | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(MOCK_PROFILE_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Store mock profile
export const setMockProfile = (profile: BodyProfile | null) => {
  if (typeof window === 'undefined') return;
  if (profile) {
    localStorage.setItem(MOCK_PROFILE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(MOCK_PROFILE_KEY);
  }
};

// Mock sign in - simulates Google sign in
export const mockSignIn = async (email?: string): Promise<MockUser> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const user = createMockUser(email);
  setMockUser(user);
  return user;
};

// Mock sign out
export const mockSignOut = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  setMockUser(null);
  // Optionally clear profile on sign out
  // setMockProfile(null);
};

// Mock save profile
export const mockSaveProfile = async (uid: string, profile: BodyProfile): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  setMockProfile(profile);
};

// Auth state listener type
type AuthStateCallback = (user: MockUser | null) => void;

// Simple auth state listener
const listeners: Set<AuthStateCallback> = new Set();

export const onMockAuthStateChanged = (callback: AuthStateCallback): (() => void) => {
  listeners.add(callback);
  
  // Immediately call with current state
  const user = getMockUser();
  setTimeout(() => callback(user), 0);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
};

// Notify all listeners of auth state change
const notifyAuthStateChange = (user: MockUser | null) => {
  listeners.forEach(callback => callback(user));
};

// Export a function to simulate auth state changes (useful for testing)
export const simulateAuthChange = (user: MockUser | null) => {
  setMockUser(user);
  notifyAuthStateChange(user);
};

// Check if we're in mock mode
export const isMockAuth = (): boolean => {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
};

// Create a default dev profile for quick testing
export const createDefaultDevProfile = (): BodyProfile => ({
  id: 'dev-profile',
  name: 'Dev User',
  email: 'dev-user@cuttie.app',
  credits: 999, // Generous credits for dev
  referenceImage: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&h=800&fit=crop',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
