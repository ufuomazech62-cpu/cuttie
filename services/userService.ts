
import { db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, deleteDoc, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { BodyProfile, GeneratedLook, StyleItem } from "../types";

export const getUserProfile = async (uid: string): Promise<BodyProfile | null> => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as BodyProfile;
    }
    return null;
};

export const updateUserProfile = async (uid: string, profile: BodyProfile) => {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, profile, { merge: true });
};

export const getUserCredits = async (uid: string): Promise<number> => {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().credits || 0;
    }
    return 0;
};

export const updateUserCredits = async (uid: string, credits: number) => {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, { credits });
};

export const uploadImage = async (uid: string, dataUrl: string, path: string): Promise<string> => {
    console.log("uploadImage called for path:", path);
    // If it's already a remote URL (http/https), don't upload it, just return it.
    if (!dataUrl || dataUrl.startsWith('http')) {
        console.log("Skipping upload for remote URL or empty data:", dataUrl);
        return dataUrl;
    }

    // Validation for Data URL
    if (!dataUrl.startsWith('data:') || !dataUrl.includes(',')) {
        console.warn("Invalid Data URL passed to uploadImage:", dataUrl.substring(0, 50));
        throw new Error("Invalid image format detected. Please re-upload the image.");
    }

    // Sanitize: Remove any whitespace (newlines, spaces) which can cause "string did not match expected pattern"
    const sanitizedDataUrl = dataUrl.replace(/\s/g, '');

    console.log("Uploading base64 data to Storage (v2)...");
    try {
        const storageRef = ref(storage, `users/${uid}/${path}`);
        await uploadString(storageRef, sanitizedDataUrl, 'data_url');
        const url = await getDownloadURL(storageRef);
        console.log("Upload complete, URL:", url);
        return url;
    } catch (error: any) {
        console.error("Firebase Storage Upload Error:", error);
        
        // GENERIC FALLBACK: If 'data_url' upload fails for ANY reason (including decoding errors),
        // try to extract the base64 content and upload it directly as 'base64' format.
        // This handles "string did not match expected pattern" and other browser-specific decoding issues.
        try {
            const parts = sanitizedDataUrl.split(',');
            if (parts.length >= 2) {
                // Join parts in case there were multiple commas (unlikely for data url but possible)
                // Actually, standard data URL has one comma. 
                const base64Content = parts.slice(1).join(','); 
                const storageRef = ref(storage, `users/${uid}/${path}`);
                // Try raw base64 upload
                await uploadString(storageRef, base64Content, 'base64');
                const url = await getDownloadURL(storageRef);
                console.log("Fallback upload successful.");
                return url;
            }
        } catch (retryError) {
            console.error("Fallback upload also failed:", retryError);
        }

        // If we reach here, both attempts failed.
        // We throw the ORIGINAL error message if it's descriptive, or a generic one.
        // The user reported seeing "The string did not match...", which is helpful actually.
        // But we want to wrap it.
        const msg = error?.message || "Unknown error";
        throw new Error(`Image upload failed (${msg}). Please try another photo.`);
    }
};

export const saveGeneratedLook = async (uid: string, look: GeneratedLook) => {
    // 1. Upload images to Storage
    const frontUrl = await uploadImage(uid, look.front, `looks/${look.id}/front.jpg`);
    let rightUrl = look.right ? await uploadImage(uid, look.right, `looks/${look.id}/right.jpg`) : undefined;
    let backUrl = look.back ? await uploadImage(uid, look.back, `looks/${look.id}/back.jpg`) : undefined;
    let leftUrl = look.left ? await uploadImage(uid, look.left, `looks/${look.id}/left.jpg`) : undefined;

    const lookData = {
        ...look,
        front: frontUrl,
        right: rightUrl,
        back: backUrl,
        left: leftUrl,
        timestamp: Date.now()
    };

    // 2. Save metadata to Firestore
    const looksRef = collection(db, "users", uid, "looks");

    // Convert undefined to null for Firestore
    const sanitizedLookData = JSON.parse(JSON.stringify(lookData));
    
    // Use look.id as doc ID if possible, or just addDoc
    await setDoc(doc(looksRef, look.id), sanitizedLookData);
    
    return lookData;
};

export const getUserHistory = async (uid: string): Promise<GeneratedLook[]> => {
    const looksRef = collection(db, "users", uid, "looks");
    const q = query(looksRef, orderBy("timestamp", "desc"), limit(50));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data() as GeneratedLook);
};

export const submitFeedback = async (uid: string, type: string, message: string) => {
    const feedbackRef = collection(db, "feedback");
    await addDoc(feedbackRef, {
        uid,
        type,
        message,
        timestamp: Date.now(),
        status: 'new'
    });
};

export const deleteGeneratedLook = async (uid: string, lookId: string, look: GeneratedLook) => {
    // 1. Delete from Firestore
    const lookRef = doc(db, "users", uid, "looks", lookId);
    await deleteDoc(lookRef);

    // 2. Delete from Storage (Best effort)
    // We reconstruct the path based on how we saved it in saveGeneratedLook
    const filesToDelete = [
        `looks/${lookId}/front.jpg`,
        look.right ? `looks/${lookId}/right.jpg` : null,
        look.back ? `looks/${lookId}/back.jpg` : null,
        look.left ? `looks/${lookId}/left.jpg` : null,
    ].filter(Boolean) as string[];

    await Promise.all(filesToDelete.map(async (path) => {
        try {
            // Note: uploadImage helper prefixes with users/${uid}/
            const fileRef = ref(storage, `users/${uid}/${path}`);
            await deleteObject(fileRef);
        } catch (e) {
            console.warn(`Failed to delete file ${path}`, e);
        }
    }));
};
