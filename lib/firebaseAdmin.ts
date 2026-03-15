import * as admin from 'firebase-admin';

const initAdmin = () => {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                storageBucket: "fashiony.firebasestorage.app"
            });
        } catch (error) {
            console.error('Firebase Admin Initialization Error:', error);
            throw error;
        }
    }
    return admin;
};

const getAdminStorage = () => {
    initAdmin();
    return admin.storage();
};

const getAdminDb = () => {
    initAdmin();
    return admin.firestore();
};

const getAdminAuth = () => {
    initAdmin();
    return admin.auth();
};

/**
 * Verify Firebase ID token from request headers
 * Returns the decoded token with user info, or null if invalid
 */
const verifyIdToken = async (authHeader: string | null): Promise<admin.auth.DecodedIdToken | null> => {
    if (!authHeader) {
        return null;
    }

    // Extract token from "Bearer <token>" format
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
        return null;
    }

    const idToken = match[1];

    try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};

/**
 * Get user data from Firestore
 */
const getUserData = async (uid: string) => {
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.exists ? userDoc.data() : null;
};

export { admin, getAdminStorage, getAdminDb, getAdminAuth, verifyIdToken, getUserData };
