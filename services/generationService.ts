import { BodyProfile, StyleItem, GeneratedLook } from "../types";
import { auth } from "../lib/firebase";

/**
 * Get the current user's ID token for authentication
 */
const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
};

const callApi = async (action: string, payload: any) => {
    try {
        // Get authentication token
        const token = await getAuthToken();

        if (!token) {
            throw new Error("Authentication required. Please sign in again.");
        }

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ action, payload })
        });

        const data = await response.json();

        // Handle specific error cases
        if (!response.ok) {
            // Handle insufficient credits
            if (response.status === 402) {
                throw new Error(data.message || "Insufficient credits. Please top up to continue.");
            }

            // Handle authentication errors
            if (response.status === 401) {
                throw new Error("Session expired. Please sign in again.");
            }

            // Handle other errors
            throw new Error(data.message || data.error || 'API Request Failed');
        }

        // Return result with credits info
        return {
          result: data.result,
          creditsUsed: data.creditsUsed,
          creditsRemaining: data.creditsRemaining,
        };
    } catch (error) {
        console.error(`API Call failed for ${action}:`, error);
        throw error;
    }
};

export const generateStyleDraft = async (prompt: string): Promise<{ result: string | null; creditsRemaining?: number }> => {
    const response = await callApi('generateStyleDraft', { prompt });
    return { result: response.result, creditsRemaining: response.creditsRemaining };
};

export const generateTryOnFront = async (
  userProfile: BodyProfile,
  styleItem: StyleItem,
  fabricImages: string[] = [],
  refinement?: string,
  previousImageBase64?: string,
  targetAngle: string = 'Full Frontal'
): Promise<{ result: GeneratedLook | null; creditsRemaining?: number }> => {
    const response = await callApi('generateTryOnFront', {
        userProfile,
        styleItem,
        fabricImages,
        refinement,
        previousImageBase64,
        targetAngle
    });
    return { result: response.result, creditsRemaining: response.creditsRemaining };
};

export const generateTryOn360 = async (
    currentLook: GeneratedLook,
    userProfile: BodyProfile,
    styleItem: StyleItem,
    fabricImages: string[] = []
): Promise<{ result: GeneratedLook | null; creditsRemaining?: number }> => {
    const response = await callApi('generateTryOn360', {
        currentLook,
        userProfile,
        styleItem,
        fabricImages
    });
    return { result: response.result, creditsRemaining: response.creditsRemaining };
};
