import { BodyProfile, StyleItem, GeneratedLook } from "../types";
import { getAdminStorage } from "./firebaseAdmin";
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

// Qwen API Configuration
const DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const IMAGE_MODEL = "qwen-image-2.0-2026-03-03";
const VL_MODEL = "qwen-vl-max"; // Vision-Language model for image analysis

// 9:16 Portrait Aspect Ratio
const PORTRAIT_SIZE = "1080*1920";

// Cache for the API key
let cachedApiKey: string | null = null;

/**
 * Get API key from Secret Manager
 */
const getApiKey = async (): Promise<string> => {
    if (cachedApiKey) {
        return cachedApiKey;
    }

    try {
        const client = new SecretManagerServiceClient();
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'fashiony';
        const secretName = `projects/${projectId}/secrets/ARK_API_KEY/versions/latest`;
        
        const [version] = await client.accessSecretVersion({ name: secretName });
        const payload = version.payload?.data?.toString();
        
        if (payload) {
            cachedApiKey = payload;
            return payload;
        }
        
        throw new Error("No API key found in Secret Manager");
    } catch (error) {
        console.error("Failed to fetch API key:", error);
        throw new Error("API Key configuration error.");
    }
};

/**
 * Helper: Convert URL to Base64
 */
const urlToBase64 = async (url: string): Promise<string> => {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(url, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'Fashiony-AI-Backend/1.0' }
        });
        clearTimeout(id);

        if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get('content-type') || 'image/png';
        return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (error) {
        console.error("Failed to convert URL to base64", error);
        throw error;
    }
};

/**
 * Helper: Upload Base64 to Firebase Storage
 */
const uploadTempImage = async (base64Data: string): Promise<string> => {
    try {
        if (!base64Data.includes(',')) {
            return base64Data;
        }

        const bucket = getAdminStorage().bucket();
        const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        
        let mimeType = 'image/png';
        let base64Content = '';

        if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Content = matches[2];
        } else {
            const parts = base64Data.split(',');
            mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            base64Content = parts[1];
        }
        
        const extension = mimeType.split('/')[1] || 'png';
        const fileName = `temp/input-${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const file = bucket.file(fileName);
        
        const buffer = Buffer.from(base64Content, 'base64');

        await file.save(buffer, {
            contentType: mimeType,
            metadata: { metadata: { temporary: 'true' } }
        });

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60,
        });

        return url;
    } catch (error) {
        console.error("Failed to upload temp image", error);
        throw new Error("Failed to process input image");
    }
};

// ============================================================
// STEP 1: VISION ANALYSIS WITH QWEN-VL
// ============================================================

interface ImageAnalysis {
    role: string;
    description: string;
    details: {
        // For person images
        gender?: string;
        skinTone?: string;
        bodyType?: string;
        hairStyle?: string;
        faceFeatures?: string;
        pose?: string;
        // For outfit images
        outfitType?: string;
        outfitStyle?: string;
        outfitLength?: string;
        outfitDetails?: string;
        // For fabric images
        fabricColor?: string;
        fabricPattern?: string;
        fabricTexture?: string;
    };
}

/**
 * Analyze a single image with Qwen-VL
 */
const analyzeImageWithVL = async (
    imageUrl: string, 
    role: "PERSON" | "STYLE" | "FABRIC"
): Promise<ImageAnalysis> => {
    const apiKey = await getApiKey();

    let analysisPrompt = "";

    switch (role) {
        case "PERSON":
            analysisPrompt = `You are analyzing a photo of a PERSON for a virtual try-on application.

Carefully examine this image and describe the person in detail:

1. GENDER: Male or Female?
2. SKIN TONE: Describe the skin color/tone
3. BODY TYPE: Slim, average, athletic, plus-size, etc.
4. HAIR: Color and style
5. FACE: Shape and notable features
6. POSE: Standing, sitting, facing direction
7. CLOTHING: What are they currently wearing (briefly)

CRITICAL: Be very specific about facial features and body shape. This person's identity must be preserved exactly.

Format your response as:
GENDER: [answer]
SKIN_TONE: [answer]
BODY_TYPE: [answer]
HAIR: [answer]
FACE: [answer]
POSE: [answer]
CURRENT_OUTFIT: [answer]
SUMMARY: [One sentence describing this person's key identifying features]`;
            break;

        case "STYLE":
            analysisPrompt = `You are analyzing a STYLE REFERENCE image for a virtual try-on application.

Carefully examine this outfit/clothing image:

1. OUTFIT TYPE: What kind of outfit is this? (dress, suit, gown, etc.)
2. STYLE: How would you describe the style? (formal, casual, traditional, modern, etc.)
3. LENGTH: How long is it? (mini, knee-length, floor-length, etc.)
4. CUT/SHAPE: Describe the silhouette (fitted, flowing, A-line, mermaid, etc.)
5. DETAILS: Notable features (sleeves, neckline, embroidery, etc.)
6. COLOR: What color(s) is the outfit?

Format your response as:
OUTFIT_TYPE: [answer]
STYLE: [answer]
LENGTH: [answer]
CUT_SHAPE: [answer]
DETAILS: [answer]
COLOR: [answer]
SUMMARY: [One sentence describing this outfit's key design elements]`;
            break;

        case "FABRIC":
            analysisPrompt = `You are analyzing a FABRIC MATERIAL image for a virtual try-on application.

Carefully examine this fabric:

1. COLOR: What is the primary color?
2. PATTERN: Solid, printed, embroidered, sequined, etc.?
3. TEXTURE: Smooth, rough, shiny, matte, etc.?
4. MATERIAL TYPE: Lace, silk, cotton, velvet, etc. (if identifiable)

Format your response as:
COLOR: [answer]
PATTERN: [answer]
TEXTURE: [answer]
MATERIAL_TYPE: [answer]
SUMMARY: [One sentence describing this fabric's key characteristics]`;
            break;
    }

    const requestBody = {
        model: VL_MODEL,
        input: {
            messages: [{
                role: "user",
                content: [
                    { image: imageUrl },
                    { text: analysisPrompt }
                ]
            }]
        }
    };

    console.log(`[VL] Analyzing ${role} image...`);

    try {
        const response = await fetch(DASHSCOPE_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.code) {
            console.error("[VL] API Error:", data.code, data.message);
            throw new Error(data.message);
        }

        const analysisText = data.output?.choices?.[0]?.message?.content?.[0]?.text || "";
        console.log(`[VL] Analysis result for ${role}:`, analysisText.substring(0, 200));

        // Parse the structured response
        const analysis: ImageAnalysis = {
            role,
            description: analysisText,
            details: {}
        };

        // Extract key details from the response
        const lines = analysisText.split('\n');
        for (const line of lines) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim().toUpperCase();
                const value = line.substring(colonIndex + 1).trim();

                switch (key) {
                    case 'GENDER': analysis.details.gender = value; break;
                    case 'SKIN_TONE': analysis.details.skinTone = value; break;
                    case 'BODY_TYPE': analysis.details.bodyType = value; break;
                    case 'HAIR': analysis.details.hairStyle = value; break;
                    case 'FACE': analysis.details.faceFeatures = value; break;
                    case 'POSE': analysis.details.pose = value; break;
                    case 'OUTFIT_TYPE': analysis.details.outfitType = value; break;
                    case 'STYLE': analysis.details.outfitStyle = value; break;
                    case 'LENGTH': analysis.details.outfitLength = value; break;
                    case 'CUT_SHAPE': analysis.details.outfitDetails = value; break;
                    case 'COLOR': 
                        if (role === "FABRIC") analysis.details.fabricColor = value;
                        break;
                    case 'PATTERN': analysis.details.fabricPattern = value; break;
                    case 'TEXTURE': analysis.details.fabricTexture = value; break;
                    case 'SUMMARY': analysis.description = value; break;
                }
            }
        }

        return analysis;

    } catch (error) {
        console.error(`[VL] Failed to analyze ${role} image:`, error);
        // Return a basic analysis if VL fails
        return {
            role,
            description: `${role} image provided`,
            details: {}
        };
    }
};

/**
 * Analyze all input images and return structured context
 */
const analyzeAllImages = async (
    personImageUrl: string,
    styleImageUrl: string | null,
    fabricImageUrls: string[]
): Promise<{
    personAnalysis: ImageAnalysis;
    styleAnalysis: ImageAnalysis | null;
    fabricAnalyses: ImageAnalysis[];
}> => {
    console.log("=== STEP 1: VISION ANALYSIS ===");

    // Analyze person image (always required)
    const personAnalysis = await analyzeImageWithVL(personImageUrl, "PERSON");

    // Analyze style image if provided
    let styleAnalysis: ImageAnalysis | null = null;
    if (styleImageUrl) {
        styleAnalysis = await analyzeImageWithVL(styleImageUrl, "STYLE");
    }

    // Analyze fabric images
    const fabricAnalyses: ImageAnalysis[] = [];
    for (let i = 0; i < fabricImageUrls.length; i++) {
        const fabricAnalysis = await analyzeImageWithVL(fabricImageUrls[i], "FABRIC");
        fabricAnalyses.push(fabricAnalysis);
    }

    console.log("=== VISION ANALYSIS COMPLETE ===");
    console.log("Person:", personAnalysis.description);
    if (styleAnalysis) console.log("Style:", styleAnalysis.description);
    fabricAnalyses.forEach((f, i) => console.log(`Fabric ${i + 1}:`, f.description));

    return { personAnalysis, styleAnalysis, fabricAnalyses };
};

// ============================================================
// STEP 2: IMAGE GENERATION WITH CONTEXT
// ============================================================

/**
 * Call Qwen Image API with context-aware prompt
 */
const generateImage = async (
    personImageUrl: string,
    styleImageUrl: string | null,
    fabricImageUrls: string[],
    analyses: {
        personAnalysis: ImageAnalysis;
        styleAnalysis: ImageAnalysis | null;
        fabricAnalyses: ImageAnalysis[];
    },
    styleDescription?: string
): Promise<string | null> => {
    const apiKey = await getApiKey();

    // Build images array
    const images: string[] = [personImageUrl];
    if (styleImageUrl) images.push(styleImageUrl);
    fabricImageUrls.forEach(url => images.push(url));

    // Build context-aware prompt using the VL analysis
    const { personAnalysis, styleAnalysis, fabricAnalyses } = analyses;

    // ═══════════════════════════════════════════════════════════
    // BUILD THE GENERATION PROMPT WITH REAL CONTEXT
    // ═══════════════════════════════════════════════════════════

    let prompt = `╔═══════════════════════════════════════════════════════════════╗
║           VIRTUAL TRY-ON PHOTO GENERATION                      ║
╚═══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE PERSON TO DRESS (Image 1) - PRESERVE EXACTLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${personAnalysis.description}

IMPORTANT DETAILS:
• Gender: ${personAnalysis.details.gender || 'Not specified'}
• Skin Tone: ${personAnalysis.details.skinTone || 'Not specified'}
• Body Type: ${personAnalysis.details.bodyType || 'Not specified'}
• Hair: ${personAnalysis.details.hairStyle || 'Not specified'}
• Face Features: ${personAnalysis.details.faceFeatures || 'Not specified'}

⚠️ THE OUTPUT MUST SHOW THIS EXACT PERSON - NOT A DIFFERENT PERSON!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE OUTFIT TO CREATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    if (styleAnalysis) {
        prompt += `
REFERENCE: Image 2
${styleAnalysis.description}

• Outfit Type: ${styleAnalysis.details.outfitType || 'Not specified'}
• Style: ${styleAnalysis.details.outfitStyle || 'Not specified'}
• Length: ${styleAnalysis.details.outfitLength || 'Not specified'}
• Cut/Shape: ${styleAnalysis.details.outfitDetails || 'Not specified'}
`;
    } else if (styleDescription) {
        prompt += `
DESCRIPTION PROVIDED:
"${styleDescription}"

Create an outfit matching this description.`;
    }

    if (fabricAnalyses.length > 0) {
        const fabricStartIndex = styleImageUrl ? 3 : 2;
        prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FABRIC MATERIALS TO USE (Images ${fabricStartIndex}-${fabricStartIndex + fabricAnalyses.length - 1}):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        fabricAnalyses.forEach((fabric, i) => {
            prompt += `
Fabric ${i + 1}: ${fabric.description}
• Color: ${fabric.details.fabricColor || 'Not specified'}
• Pattern: ${fabric.details.fabricPattern || 'Not specified'}
• Texture: ${fabric.details.fabricTexture || 'Not specified'}
`;
        });
    }

    prompt += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GENERATION TASK:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create a professional fashion photograph showing:
THE PERSON described above (from Image 1)
WEARING the outfit described above
${fabricAnalyses.length > 0 ? 'MADE WITH the fabrics described above' : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABSOLUTE REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ MUST DO:
• Show THE EXACT SAME PERSON from Image 1 - same face, body, skin
• Full body visible from HEAD TO TOE (do not crop legs/feet)
• Natural standing pose facing the camera
• Light grey background (#E0E0E0)
• Photorealistic quality
• 9:16 portrait aspect ratio

❌ MUST NOT DO:
• DO NOT generate a different/random person
• DO NOT change the face or body
• DO NOT crop or cut off any body part
• DO NOT change skin tone
• DO NOT use a model that "looks similar"

╔═══════════════════════════════════════════════════════════════╗
║ OUTPUT: A full-body fashion photo of the person from Image 1  ║
║ wearing the described outfit, head to toe visible.            ║
╚═══════════════════════════════════════════════════════════════╝`;

    // Build the request
    const content: any[] = images.map(img => ({ image: img }));
    content.push({ text: prompt });

    const requestBody = {
        model: IMAGE_MODEL,
        input: {
            messages: [{
                role: "user",
                content: content
            }]
        },
        parameters: {
            n: 1,
            watermark: false,
            negative_prompt: "different person, wrong face, changed identity, random model, stock photo model, different body, different skin, cropped legs, missing feet, missing head, blurry, low quality, deformed, distorted, cartoon, anime, illustration, watermark, text, logo",
            prompt_extend: true,
            size: PORTRAIT_SIZE
        }
    };

    console.log("=== STEP 2: IMAGE GENERATION ===");
    console.log("Sending request to Qwen Image API...");
    console.log("Prompt length:", prompt.length);

    try {
        const response = await fetch(DASHSCOPE_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.code) {
            console.error("[Image] API Error:", data.code, data.message);
            throw new Error(data.message);
        }

        const resultUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
        
        if (resultUrl) {
            console.log("[Image] Generation successful!");
            return resultUrl;
        }
        
        console.warn("[Image] No image in response");
        return null;

    } catch (error) {
        console.error("[Image] Generation failed:", error);
        throw error;
    }
};

// ============================================================
// MAIN EXPORT FUNCTIONS
// ============================================================

/**
 * GENERATE STYLE DRAFT (Text-to-Image)
 */
export const generateStyleDraft = async (prompt: string): Promise<string | null> => {
    const apiKey = await getApiKey();

    const generationPrompt = `Create a professional fashion design photograph.

STYLE DESCRIPTION: ${prompt}

REQUIREMENTS:
• Full body front view of a model
• Professional fashion photography
• Light grey background (#E0E0E0)
• Photorealistic quality
• Standing naturally, facing camera
• Head to toe visible
• 9:16 portrait format`;

    const requestBody = {
        model: IMAGE_MODEL,
        input: {
            messages: [{
                role: "user",
                content: [
                    { image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" },
                    { text: generationPrompt }
                ]
            }]
        },
        parameters: {
            n: 1,
            watermark: false,
            negative_prompt: "blurry, low quality, deformed, cropped, missing parts, cartoon, anime",
            prompt_extend: true,
            size: PORTRAIT_SIZE
        }
    };

    try {
        const response = await fetch(DASHSCOPE_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        const resultUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
        
        if (resultUrl) {
            return await urlToBase64(resultUrl);
        }
    } catch (error) {
        console.error("Style draft failed:", error);
        throw error;
    }

    return null;
};

/**
 * GENERATE TRY ON FRONT
 * Main function: Two-step agentic approach
 */
export const generateTryOnFront = async (
    userProfile: BodyProfile,
    styleItem: StyleItem,
    fabricImages: string[] = [],
    refinement?: string,
    previousImageBase64?: string,
    targetAngle: string = 'Full Frontal'
): Promise<GeneratedLook | null> => {
    
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("FASHIONY AI - AGENTIC VIRTUAL TRY-ON");
    console.log("═══════════════════════════════════════════════════════════════");

    // Handle edit mode separately
    if (refinement && previousImageBase64) {
        return handleEditMode(previousImageBase64, refinement, fabricImages, styleItem);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 0: PREPARE IMAGE URLS
    // ═══════════════════════════════════════════════════════════════

    // Get person image URL (REQUIRED)
    if (!userProfile.referenceImage) {
        throw new Error("User body photo is required");
    }

    const personImageUrl = userProfile.referenceImage.startsWith('data:')
        ? await uploadTempImage(userProfile.referenceImage)
        : userProfile.referenceImage;

    // Get style image URL (optional - can be text description)
    const hasStyleImage = styleItem.image && !styleItem.isTextOnly;
    const styleImageUrl = hasStyleImage
        ? (styleItem.image!.startsWith('data:')
            ? await uploadTempImage(styleItem.image!)
            : styleItem.image)
        : null;

    // Get fabric image URLs (optional)
    const fabricImageUrls: string[] = [];
    for (const fabric of fabricImages) {
        const url = fabric.startsWith('data:')
            ? await uploadTempImage(fabric)
            : fabric;
        fabricImageUrls.push(url);
    }

    console.log("Images prepared:");
    console.log("  - Person: ✅");
    console.log("  - Style:", hasStyleImage ? "✅" : "Text description");
    console.log("  - Fabrics:", fabricImageUrls.length);

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: ANALYZE IMAGES WITH VISION MODEL
    // ═══════════════════════════════════════════════════════════════

    const analyses = await analyzeAllImages(
        personImageUrl,
        styleImageUrl,
        fabricImageUrls
    );

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: GENERATE IMAGE WITH CONTEXT
    // ═══════════════════════════════════════════════════════════════

    const styleDescription = styleItem.description;

    const resultUrl = await generateImage(
        personImageUrl,
        styleImageUrl,
        fabricImageUrls,
        analyses,
        styleDescription
    );

    if (resultUrl) {
        let finalImage = resultUrl;
        try {
            finalImage = await urlToBase64(resultUrl);
        } catch (e) {
            console.warn("Using raw URL");
        }

        console.log("═══════════════════════════════════════════════════════════════");
        console.log("GENERATION COMPLETE");
        console.log("═══════════════════════════════════════════════════════════════");

        return {
            id: `look-${Date.now()}`,
            timestamp: Date.now(),
            styleName: styleItem.name,
            front: finalImage,
            seed: Math.floor(Math.random() * 1000000)
        };
    }

    return null;
};

/**
 * Handle edit mode (tweaks/refinements)
 */
const handleEditMode = async (
    previousImageBase64: string,
    refinement: string,
    fabricImages: string[],
    styleItem: StyleItem
): Promise<GeneratedLook | null> => {
    
    const apiKey = await getApiKey();

    const prevUrl = previousImageBase64.startsWith('data:')
        ? await uploadTempImage(previousImageBase64)
        : previousImageBase64;

    const images: string[] = [prevUrl];
    
    for (const fabric of fabricImages) {
        const url = fabric.startsWith('data:')
            ? await uploadTempImage(fabric)
            : fabric;
        images.push(url);
    }

    const prompt = `╔═══════════════════════════════════════════════════════════════╗
║              IMAGE EDITING - FASHION REFINEMENT                ║
╚═══════════════════════════════════════════════════════════════╝

EDIT REQUEST: "${refinement}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ MUST PRESERVE:
• THE EXACT SAME PERSON (same face, body, skin, identity)
• Same pose (unless specifically asked to change)
• Same background color
• Full body visible HEAD TO TOE

✅ ONLY CHANGE:
• What the user specifically requested in the edit

❌ MUST NOT:
• Change the person's identity
• Crop or cut any body part
• Change unrelated elements

OUTPUT: The edited image with ONLY the requested changes applied.`;

    const content: any[] = images.map(img => ({ image: img }));
    content.push({ text: prompt });

    const requestBody = {
        model: IMAGE_MODEL,
        input: {
            messages: [{ role: "user", content }]
        },
        parameters: {
            n: 1,
            watermark: false,
            negative_prompt: "different person, wrong face, changed identity, cropped body, missing feet, blurry, low quality",
            prompt_extend: true,
            size: PORTRAIT_SIZE
        }
    };

    try {
        const response = await fetch(DASHSCOPE_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        const resultUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image;
        
        if (resultUrl) {
            let finalImage = resultUrl;
            try {
                finalImage = await urlToBase64(resultUrl);
            } catch (e) {
                console.warn("Using raw URL");
            }

            return {
                id: `look-${Date.now()}`,
                timestamp: Date.now(),
                styleName: styleItem.name + " (Edited)",
                front: finalImage,
                seed: Math.floor(Math.random() * 1000000)
            };
        }
    } catch (error) {
        console.error("Edit failed:", error);
        throw error;
    }

    return null;
};

/**
 * GENERATE TRY ON 360
 */
export const generateTryOn360 = async (
    currentLook: GeneratedLook,
    userProfile: BodyProfile,
    styleItem: StyleItem,
    fabricImages: string[] = []
): Promise<GeneratedLook | null> => {
    
    const apiKey = await getApiKey();

    const frontUrl = currentLook.front.startsWith('data:') 
        ? await uploadTempImage(currentLook.front) 
        : currentLook.front;

    // First analyze the front view
    const frontAnalysis = await analyzeImageWithVL(frontUrl, "PERSON");

    const generateAngle = async (angleName: string, rotationDesc: string): Promise<string | null> => {
        
        const prompt = `╔═══════════════════════════════════════════════════════════════╗
║              360° VIEW GENERATION - ${angleName.toUpperCase().padEnd(17)}║
╚═══════════════════════════════════════════════════════════════╝

THE PERSON TO PRESERVE (from Image 1):
${frontAnalysis.description}

TRANSFORMATION: ${rotationDesc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ MUST BE IDENTICAL:
• Same person (same face, body, skin, identity)
• Same outfit (same clothes, just viewed from different angle)
• Same pose (natural standing, just rotated)
• Same background (light grey #E0E0E0)

❌ MUST NOT CHANGE:
• The person's identity
• The outfit design
• Any body features

✅ OUTPUT REQUIREMENTS:
• Full body visible HEAD TO TOE
• View from ${angleName}
• 9:16 portrait format
• Photorealistic quality`;

        const requestBody = {
            model: IMAGE_MODEL,
            input: {
                messages: [{
                    role: "user",
                    content: [
                        { image: frontUrl },
                        { text: prompt }
                    ]
                }]
            },
            parameters: {
                n: 1,
                watermark: false,
                negative_prompt: "different person, wrong face, changed identity, different outfit, cropped body, missing feet, blurry, deformed",
                prompt_extend: true,
                size: PORTRAIT_SIZE
            }
        };

        try {
            const response = await fetch(DASHSCOPE_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            return data.output?.choices?.[0]?.message?.content?.[0]?.image || null;

        } catch (error) {
            console.error(`${angleName} generation failed:`, error);
            return null;
        }
    };

    try {
        console.log("=== GENERATING 360° VIEWS ===");

        const [rightUrl, backUrl, leftUrl] = await Promise.all([
            generateAngle("Right Side Profile", "Rotate camera 90 degrees to show right side of person"),
            generateAngle("Back View", "Rotate camera 180 degrees to show back of person"),
            generateAngle("Left Side Profile", "Rotate camera 90 degrees to show left side of person")
        ]);

        const [right, back, left] = await Promise.all([
            rightUrl ? urlToBase64(rightUrl) : Promise.resolve(null),
            backUrl ? urlToBase64(backUrl) : Promise.resolve(null),
            leftUrl ? urlToBase64(leftUrl) : Promise.resolve(null)
        ]);

        console.log("=== 360° GENERATION COMPLETE ===");

        return {
            ...currentLook,
            right: right || undefined,
            back: back || undefined,
            left: left || undefined
        };

    } catch (error) {
        console.error("360 generation failed:", error);
        throw error;
    }
};
