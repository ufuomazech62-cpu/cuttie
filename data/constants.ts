import { StyleItem } from '../types';

// --- ECONOMY CONFIG ---
export const COST_STYLE_DRAFT = 1; // 1 credit for style draft
export const COST_IMAGE_GEN = 2; // 2 credits for makeup/hairstyle preview
export const COST_360_VIEW = 4; // 4 credits for 360 view (3 additional angles)
export const INITIAL_FREE_CREDITS = 5; // Free credits for new users

// --- PRICING ---
export const PRICING_PLANS = {
    SUBSCRIPTION: {
        NAME: 'Pro Beauty Plan',
        PRICE: '₦5,000',
        CREDITS: 1000 
    },
    TOP_UP: {
        STARTER: { NAME: '40 Credits', CREDITS: 40, PRICE: '₦3,000' }, 
        POPULAR: { NAME: "125 Credits", CREDITS: 125, PRICE: '₦7,500', SAVE: '20%' },    
        BEST_VALUE: { NAME: '200 Credits', CREDITS: 200, PRICE: '₦10,000', SAVE: '33%' } 
    }
};

// --- BEAUTY & STYLE CATALOG ---
export const STYLE_CATALOG: StyleItem[] = [
  {
    id: '1',
    name: 'Natural Glam Makeup',
    description: 'Soft, natural makeup look with glowing skin and subtle highlights.',
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '2',
    name: 'Sleek Ponytail',
    description: 'Elegant sleek ponytail hairstyle for a polished look.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '3',
    name: 'Bold Lip & Winged Liner',
    description: 'Classic bold red lip with sharp winged eyeliner.',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '4',
    name: 'Curly Afro Wig',
    description: 'Beautiful natural curly afro wig style.',
    image: 'https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c4?q=80&w=800&auto=format&fit=crop' 
  },
  {
    id: '5',
    name: 'Smoky Eye Evening',
    description: 'Dramatic smoky eye look perfect for evening events.',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop'
  },
  {
    id: '6',
    name: 'Braided Style',
    description: 'Elegant braided hairstyle with modern twists.',
    image: 'https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?q=80&w=800&auto=format&fit=crop'
  }
];

// --- OCCASION TYPES ---
export const OCCASION_TYPES = [
  { id: 'wedding', name: 'Wedding Guest', description: 'Elegant looks for wedding celebrations' },
  { id: 'business', name: 'Business Meeting', description: 'Professional and polished styles' },
  { id: 'party', name: 'Party', description: 'Glamorous party-ready looks' },
  { id: 'date', name: 'Date Night', description: 'Romantic and flattering styles' },
  { id: 'casual', name: 'Casual Day', description: 'Relaxed everyday beauty' },
];

// --- BEAUTY CATEGORIES ---
export const BEAUTY_CATEGORIES = [
  { id: 'makeup', name: 'Makeup', icon: '💄' },
  { id: 'hair', name: 'Hairstyle', icon: '💇' },
  { id: 'wig', name: 'Wigs', icon: '👩' },
  { id: 'outfit', name: 'Outfit', icon: '👗' },
];
