import { NextResponse } from 'next/server';
import { generateStyleDraft, generateTryOnFront, generateTryOn360 } from '@/lib/byteplus';
import { verifyIdToken, getUserData, getAdminDb } from '@/lib/firebaseAdmin';

export const maxDuration = 60; // Max duration for serverless functions

// Credit cost for each action
const CREDIT_COSTS = {
  generateStyleDraft: 1,
  generateTryOnFront: 2,
  generateTryOn360: 4, // 360 generates 3 additional angles
};

// Free credits for new users
const INITIAL_FREE_CREDITS = 5;

/**
 * Verify user authentication and return user info
 */
async function authenticateUser(request: Request): Promise<{ uid: string; userData: any } | NextResponse> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Missing authentication token' },
      { status: 401 }
    );
  }

  const decodedToken = await verifyIdToken(authHeader);

  if (!decodedToken) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or expired authentication token' },
      { status: 401 }
    );
  }

  const userData = await getUserData(decodedToken.uid);

  if (!userData) {
    return NextResponse.json(
      { error: 'User not found', message: 'User profile does not exist' },
      { status: 404 }
    );
  }

  return { uid: decodedToken.uid, userData };
}

/**
 * Check if user has enough credits
 */
function hasEnoughCredits(userData: any, cost: number): boolean {
  const credits = userData.credits ?? 0;
  return credits >= cost;
}

/**
 * Initialize credits for users who don't have any
 */
async function initializeCreditsIfNeeded(uid: string, userData: any): Promise<number> {
  // If user has no credits field or it's undefined, initialize with free credits
  if (userData.credits === undefined || userData.credits === null) {
    console.log(`Initializing credits for user ${uid} with ${INITIAL_FREE_CREDITS} free credits`);
    const db = getAdminDb();
    await db.collection('users').doc(uid).update({ credits: INITIAL_FREE_CREDITS });
    return INITIAL_FREE_CREDITS;
  }
  return userData.credits;
}

/**
 * Decrement user credits atomically
 */
async function decrementCredits(uid: string, cost: number): Promise<void> {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(uid);

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const currentCredits = userDoc.data().credits || 0;
    const newCredits = Math.max(0, currentCredits - cost);

    transaction.update(userRef, { credits: newCredits });
  });
}

/**
 * Log API usage for analytics and audit
 */
async function logApiUsage(uid: string, action: string, success: boolean, cost: number): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('api_logs').add({
      uid,
      action,
      success,
      cost,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0], // For daily aggregation
    });
  } catch (error) {
    console.error('Failed to log API usage:', error);
    // Don't throw - logging is non-critical
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Step 1: Authenticate user
    const authResult = await authenticateUser(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { uid, userData } = authResult;

    // Step 2: Parse request body
    const body = await request.json();
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Missing action or payload' },
        { status: 400 }
      );
    }

    // Step 3: Validate action
    const validActions = ['generateStyleDraft', 'generateTryOnFront', 'generateTryOn360'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid action' },
        { status: 400 }
      );
    }

    // Step 4: Initialize credits for new users if needed, then check credits
    const creditCost = CREDIT_COSTS[action as keyof typeof CREDIT_COSTS];
    const currentCredits = await initializeCreditsIfNeeded(uid, userData);
    userData.credits = currentCredits; // Update local copy

    if (!hasEnoughCredits(userData, creditCost)) {
      return NextResponse.json(
        {
          error: 'Insufficient Credits',
          message: `You need ${creditCost} credits for this action. You have ${currentCredits} credits.`,
          creditsRequired: creditCost,
          creditsAvailable: currentCredits,
        },
        { status: 402 } // Payment Required
      );
    }

    // Step 5: Execute the requested action
    let result;

    switch (action) {
      case 'generateStyleDraft':
        result = await generateStyleDraft(payload.prompt);
        break;
      case 'generateTryOnFront':
        result = await generateTryOnFront(
          payload.userProfile,
          payload.styleItem,
          payload.fabricImages,
          payload.refinement,
          payload.previousImageBase64,
          payload.targetAngle
        );
        break;
      case 'generateTryOn360':
        result = await generateTryOn360(
          payload.currentLook,
          payload.userProfile,
          payload.styleItem,
          payload.fabricImages
        );
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Step 6: Deduct credits only on success
    if (result) {
      await decrementCredits(uid, creditCost);
      await logApiUsage(uid, action, true, creditCost);
    } else {
      await logApiUsage(uid, action, false, 0);
    }

    const duration = Date.now() - startTime;
    console.log(`API Action Completed: ${action} | User: ${uid} | Duration: ${duration}ms | Cost: ${creditCost} credits`);

    return NextResponse.json({
      result,
      creditsUsed: result ? creditCost : 0,
      creditsRemaining: result ? (userData.credits || 0) - creditCost : userData.credits || 0,
    });

  } catch (error: any) {
    console.error('API Error:', error);

    // Log error (without uid since auth might have failed)
    await logApiUsage('unknown', 'error', false, 0).catch(() => {});

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
