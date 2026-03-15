
export interface AiMeasurements {
  bust: string;
  waist: string;
  hips: string;
  shoulder: string;
  gownLength: string;
}

export interface BodyProfile {
  name: string;
  email?: string;
  height?: string;
  size?: string;
  referenceImage?: string; // Face/Body photo of the user
  measurements?: {
    bust?: string;
    waist?: string;
    hips?: string;
    height?: string;
  } | AiMeasurements;
  // New fields for Cuttie
  facePhoto?: string; // Face photo for makeup/hairstyle try-on
  wardrobeItems?: string[]; // User's uploaded wardrobe items
}

export interface StyleItem {
  id: string;
  name: string;
  description: string;
  image: string; // URL or Base64
  isCustom?: boolean;
  fabric?: string; // Optional custom fabric/product
  isTextOnly?: boolean; // If true, rely on description, ignore image for generation
  category?: 'makeup' | 'hair' | 'wig' | 'outfit'; // Beauty category
}

export interface GeneratedLook {
  id: string;
  timestamp: number;
  styleName: string;
  front: string;
  right?: string;
  back?: string;
  left?: string;
  seed: number; // Critical for ensuring 360 views match the front view
  measurements?: AiMeasurements;
  category?: 'makeup' | 'hair' | 'wig' | 'outfit'; // What type of look was generated
}

export interface UserSession {
  credits: number;
}
