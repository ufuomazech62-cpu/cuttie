
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, Upload, X, ArrowLeft, ArrowRight, ChevronRight, Wand2, Loader2, Sparkles, Layers, Lock, PenTool, Heart, Palette } from 'lucide-react';
import { BodyProfile, StyleItem } from '../../types';
import Logo from '../Logo';
import InfoModal from '../modals/InfoModal';

interface OnboardingProps {
  onComplete: (profile: BodyProfile, style: StyleItem | null, fabrics: string[]) => void;
  isAuthenticated?: boolean;
  initialProfile?: BodyProfile;
  onSignIn?: () => void;
  initialStep?: number;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isAuthenticated = false, initialProfile, onSignIn, initialStep = 1 }) => {
  // Navigation State
  const [step, setStep] = useState(initialStep);
  const totalSteps = 3; // 1. Inspiration, 2. Products, 3. Face/Body. (Auth is hidden Step 4)

  const [showTerms, setShowTerms] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  // Data State
  const [name, setName] = useState<string>(initialProfile?.name || ''); 
  const [selectedStyle, setSelectedStyle] = useState<StyleItem | null>(null);
  const [products, setProducts] = useState<string[]>([]); // Changed from fabrics to products
  
  // Body Profile State
  const [height, setHeight] = useState(initialProfile?.height || '');
  const [refImage, setRefImage] = useState<string | null>(initialProfile?.referenceImage || null);

  // Design Prompt State (For secondary flow)
  const [showDesignInput, setShowDesignInput] = useState(false);
  const [designPrompt, setDesignPrompt] = useState('');
  
  // Refs
  const styleInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  // Initialize state if initialProfile changes (e.g. loading in dashboard)
  useEffect(() => {
      if (initialProfile) {
          setName(initialProfile.name);
          setRefImage(initialProfile.referenceImage || null);
          setHeight(initialProfile.height || '');
      }
  }, [initialProfile]);

  const goBack = () => {
    if (showDesignInput) {
        setShowDesignInput(false);
        return;
    }
    if (step > 1) {
        setStep(step - 1);
    }
  };

  const handleStyleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = () => {
              const newStyle: StyleItem = {
                  id: `custom-${Date.now()}`,
                  name: 'My Uploaded Look',
                  description: 'Custom uploaded reference',
                  image: reader.result as string,
                  isCustom: true
              };
              setSelectedStyle(newStyle);
              setStep(2); // Go to Products
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleUseDescription = () => {
      if (!designPrompt.trim()) return;
      
      // Create style from text
      const newStyle: StyleItem = {
          id: `text-design-${Date.now()}`,
          name: 'Custom Description',
          description: designPrompt,
          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800', 
          isCustom: true,
          isTextOnly: true 
      };
      
      setSelectedStyle(newStyle);
      setStep(2); // Go to Products
  };

  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = () => {
              setProducts(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const removeProduct = (index: number) => {
      setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleBodyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = () => {
              setRefImage(reader.result as string);
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const handleFinishStep = () => {
      // Logic: If authenticated, complete immediately. If not, go to Auth Step (4).
      if (isAuthenticated) {
          submitComplete();
      } else {
          setStep(4);
      }
  };

  const handleSignIn = () => {
      if (onSignIn) {
          onSignIn();
      }
  };

  useEffect(() => {
      if (isAuthenticated && step === 4) {
          if (selectedStyle || refImage || initialProfile?.referenceImage) {
               submitComplete();
          } else {
               setStep(1);
          }
      }
  }, [isAuthenticated, step]);

  const submitComplete = () => {
      const profileData: BodyProfile = {
          name: name || "Beauty Lover",
          height: height
      };

      if (refImage) {
          profileData.referenceImage = refImage;
      }

      onComplete(profileData, selectedStyle, products);
  };

  const isBodyStepValid = () => {
      if (refImage) return true;
      return false;
  };

  const styleRecipes = [
      { label: 'Natural Glow', prompt: 'A soft, natural makeup look with glowing skin, light foundation, subtle blush, and nude lipstick. Perfect for everyday wear.' },
      { label: 'Glam Evening', prompt: 'A dramatic evening makeup look with smoky eyes, bold eyeliner, highlighter, and a statement red lip. Perfect for parties and events.' },
      { label: 'Professional Chic', prompt: 'A polished, professional makeup look with defined brows, neutral eyeshadow, light contour, and a mauve lipstick. Perfect for work and meetings.' },
      { label: 'Date Night Ready', prompt: 'A romantic makeup look with soft pink blush, shimmering eyeshadow, winged liner, and a rosy pink lip. Flattering and feminine.' },
  ];

  return (
    <div className={`h-full bg-cuttie-cream text-cuttie-charcoal font-sans flex flex-col relative ${isAuthenticated ? '' : 'overflow-hidden min-h-screen'}`}>
      
      {/* Header */}
      {step < 4 && (
        <div className="flex justify-between items-center px-6 pt-6 pb-2 shrink-0">
            <div className="w-10">
                {(step > 1 || showDesignInput) && (
                    <button onClick={goBack} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}
            </div>
            
            {/* Show Logo only for new users (not authenticated), otherwise show Title */}
            {!isAuthenticated ? (
                <Logo size="md" showText={false} />
            ) : (
                <span className="font-display font-bold text-sm uppercase tracking-widest text-cuttie-charcoal">
                    {step === 1 && (showDesignInput ? 'Describe Look' : 'Choose Style')}
                    {step === 2 && 'Products'}
                    {step === 3 && 'Your Photo'}
                </span>
            )}

            <div className="w-10 text-xs font-bold text-gray-400 flex justify-end">
                {step <= totalSteps && `${step}/${totalSteps}`}
            </div>
        </div>
      )}

      {/* Progress Bar (Hidden on Auth Step) */}
      {step < 4 && (
        <div className="flex justify-center gap-2 mb-6 px-6 shrink-0">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-12 bg-cuttie-purple' : 'w-4 bg-gray-200'}`} />
                ))}
        </div>
      )}

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 pb-12 overflow-y-auto custom-scrollbar">
        
        {/* STEP 1: INSPIRATION */}
        {step === 1 && (
            <div className="animate-slide-in flex flex-col h-full">
                
                {!showDesignInput ? (
                    <>
                        <div className="text-center mb-10 shrink-0">
                            <h2 className="text-3xl font-display font-bold">Choose Your Look</h2>
                            <p className="text-gray-500">Upload a makeup, hair, or outfit reference.</p>
                        </div>

                        <div className="flex-1 flex flex-col justify-start">
                            {/* Simple Compact Upload Card */}
                            <button 
                                onClick={() => styleInputRef.current?.click()}
                                className="w-full h-48 bg-white rounded-3xl border-2 border-dashed border-gray-300 hover:border-cuttie-charcoal flex flex-col items-center justify-center gap-4 group transition-all shadow-sm hover:shadow-lg relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-gray-50 to-white opacity-50"></div>
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-cuttie-charcoal group-hover:text-white transition-colors relative z-10">
                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-white" />
                                </div>
                                <div className="text-center relative z-10">
                                    <span className="block text-base font-bold text-cuttie-charcoal">Tap to Upload</span>
                                </div>
                                <input type="file" ref={styleInputRef} onChange={handleStyleUpload} className="hidden" accept="image/*" />
                            </button>

                            {/* Minimal Text Link for Fallback */}
                            <div className="mt-8 text-center">
                                <button 
                                    onClick={() => setShowDesignInput(true)}
                                    className="text-sm font-medium text-gray-400 hover:text-cuttie-charcoal transition-colors flex items-center justify-center gap-2 mx-auto"
                                >
                                    <PenTool className="w-3 h-3" />
                                    I don't have a photo, describe it instead
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                         <div className="text-center mb-6 shrink-0">
                            <h2 className="text-2xl font-display font-bold">Describe It</h2>
                            <p className="text-gray-500">No photo? No problem.</p>
                        </div>

                        <div className="flex-1">
                             <div className="bg-white border-2 border-cuttie-purple/20 rounded-2xl p-6 shadow-lg">
                                <textarea 
                                    value={designPrompt}
                                    onChange={(e) => setDesignPrompt(e.target.value)}
                                    placeholder="e.g., A soft glam makeup look with winged liner..."
                                    className="w-full h-40 bg-transparent border-none focus:ring-0 text-lg font-medium resize-none placeholder:text-gray-300"
                                    autoFocus
                                />
                                
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {styleRecipes.map(recipe => (
                                        <button 
                                            key={recipe.label}
                                            onClick={() => setDesignPrompt(recipe.prompt)}
                                            className="px-3 py-1.5 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-cuttie-purple hover:text-white transition-colors"
                                        >
                                            {recipe.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleUseDescription}
                                disabled={!designPrompt}
                                className="w-full py-4 mt-8 bg-cuttie-charcoal text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-cuttie-purple transition-colors disabled:opacity-50 shadow-xl"
                            >
                                Use Description <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </>
                )}

            </div>
        )}

        {/* STEP 2: PRODUCTS */}
        {step === 2 && (
             <div className="animate-slide-in flex flex-col h-full">
                <div className="text-center mb-6 shrink-0">
                    <h2 className="text-3xl font-display font-bold">Products</h2>
                    <p className="text-gray-500">Add your makeup products or fabrics.</p>
                </div>

                <div className="flex-1">
                    <div className="grid grid-cols-2 gap-4">
                         <button 
                            onClick={() => productInputRef.current?.click()}
                            className="aspect-square bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-cuttie-purple transition-colors gap-2 group"
                        >
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-purple-50 transition-colors">
                                <Layers className="w-5 h-5 text-gray-400 group-hover:text-cuttie-purple" />
                            </div>
                            <span className="text-xs font-bold text-gray-500 uppercase group-hover:text-cuttie-purple">Add Product</span>
                            <input type="file" ref={productInputRef} onChange={handleProductUpload} className="hidden" accept="image/*" />
                        </button>

                        {products.map((prod, idx) => (
                            <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group shadow-md bg-white animate-fade-up">
                                <img src={prod} className="w-full h-full object-cover" />
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur rounded text-[10px] text-white font-bold">
                                    #{idx + 1}
                                </div>
                                <button 
                                    onClick={() => removeProduct(idx)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded-full text-white hover:bg-red-500/80 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {products.length === 0 && (
                        <div className="mt-8 p-4 bg-purple-50 rounded-xl flex gap-3">
                            <Sparkles className="w-5 h-5 text-cuttie-purple flex-shrink-0" />
                            <p className="text-xs text-purple-800 leading-relaxed">
                                <strong>Tip:</strong> Upload 2-3 makeup products (e.g., lipstick, eyeshadow palette). The AI will visualize how they look on you.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-6 shrink-0">
                    <button 
                        onClick={() => setStep(3)}
                        className={`w-full py-4 font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors ${products.length > 0 ? 'bg-cuttie-charcoal text-white hover:bg-cuttie-purple' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                    >
                        {products.length > 0 ? `Use ${products.length} Product${products.length > 1 ? 's' : ''}` : 'Skip Product Selection'}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
             </div>
        )}

        {/* STEP 3: BODY/FACE PROFILE */}
        {step === 3 && (
             <div className="animate-slide-in flex flex-col h-full">
                <div className="text-center mb-6 shrink-0">
                    <h2 className="text-3xl font-display font-bold">Your Photo</h2>
                    <p className="text-gray-500">The AI applies the look to your actual face or body.</p>
                </div>

                <div className="flex-1 space-y-6">
                     {/* Photo Upload */}
                     <button 
                        onClick={() => bodyInputRef.current?.click()}
                        className={`w-full p-6 border-2 border-dashed rounded-2xl flex items-center justify-center gap-4 transition-all ${refImage ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white hover:border-cuttie-purple'}`}
                    >
                        {refImage ? (
                            <>
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-green-300 bg-white">
                                    <img src={refImage} className="w-full h-full object-cover" />
                                </div>
                                <div className="text-left flex-1">
                                    <span className="block font-bold text-green-700">Photo Added</span>
                                    <span className="text-xs text-green-600">Ready to preview</span>
                                </div>
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </>
                        ) : (
                            <>
                                <Camera className="w-8 h-8 text-gray-400" />
                                <div className="text-left">
                                     <span className="block font-bold text-gray-600">Upload Your Photo</span>
                                     <span className="text-xs text-gray-400">Clear face or body shot works best</span>
                                </div>
                            </>
                        )}
                    </button>
                    <input type="file" ref={bodyInputRef} className="hidden" accept="image/*" onChange={handleBodyUpload} />
                    
                </div>

                <div className="pt-6 border-t border-gray-100 shrink-0">
                    <button 
                        onClick={handleFinishStep}
                        disabled={!isBodyStepValid()}
                        className="w-full h-16 bg-cuttie-charcoal text-white font-bold uppercase tracking-widest rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cuttie-purple transition-colors"
                    >
                        {isAuthenticated ? 'Generate Preview' : 'Next Step'} <Wand2 className="w-5 h-5" />
                    </button>
                     {!isBodyStepValid() && (
                        <p className="text-center text-[10px] text-red-400 mt-2 font-medium">Please upload a photo to proceed.</p>
                    )}
                </div>
             </div>
        )}

        {/* STEP 4: AUTH GATE (Only for New Users) */}
        {step === 4 && !isAuthenticated && (
             <div className="flex-1 flex flex-col items-center justify-center animate-slide-in pt-6">
                 
                 <div className="mb-8">
                     <Logo size="lg" showText={false} />
                 </div>

                 <div className="text-center max-w-sm mb-8">
                    <h2 className="text-3xl font-display font-bold mb-3">Welcome to Cuttie</h2>
                    <p className="text-gray-500 leading-relaxed">Sign in to start previewing your looks.</p>
                </div>

                {selectedStyle && (
                    <div className="w-32 h-40 rounded-xl overflow-hidden shadow-2xl rotate-3 border-4 border-white mb-8">
                        <img src={selectedStyle.image} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="w-full space-y-4">
                    <button 
                        onClick={handleSignIn}
                        className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm group"
                    >
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="font-bold text-gray-700">Continue with Google</span>
                    </button>
                </div>

                {/* Terms and Disclaimer */}
                <div className="mt-8 text-center space-y-4">
                    <p className="text-[10px] text-gray-400 max-w-xs mx-auto leading-relaxed">
                        By continuing, you agree to our <button onClick={() => setShowTerms(true)} className="underline hover:text-cuttie-charcoal">Terms of Service</button> and <button onClick={() => setShowPolicy(true)} className="underline hover:text-cuttie-charcoal">Privacy Policy</button>.
                    </p>
                    
                    <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-3 max-w-xs mx-auto">
                        <p className="text-[10px] text-purple-800 font-medium">
                            <span className="font-bold">Disclaimer:</span> AI-generated previews may vary from actual results. Use as guidance, not guarantee.
                        </p>
                    </div>
                </div>
             </div>
        )}

      </div>
      
      {/* INFO MODALS */}
      <InfoModal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        title="Terms of Service"
        content={
            <>
                <h3>1. Introduction</h3>
                <p>Welcome to Cuttie. By using our service, you agree to these terms.</p>
                <h3>2. Usage</h3>
                <p>You may use Cuttie to generate personal beauty and style previews. Do not use the service for illegal activities.</p>
                <h3>3. Intellectual Property</h3>
                <p>The looks you create are yours to use. Cuttie retains rights to the underlying technology.</p>
                <h3>4. AI Limitation</h3>
                <p>The service uses Artificial Intelligence. Results are for preview purposes and may vary from actual outcomes.</p>
            </>
        }
      />
      
      <InfoModal 
        isOpen={showPolicy} 
        onClose={() => setShowPolicy(false)} 
        title="Privacy Policy"
        content={
            <>
                <h3>1. Data Collection</h3>
                <p>We collect your uploaded photos solely to generate your requested beauty previews.</p>
                <h3>2. Usage of Data</h3>
                <p>Your photos are processed by our AI and stored in your secure history. We do not sell your data.</p>
                <h3>3. Security</h3>
                <p>We use industry-standard security measures to protect your information.</p>
                <h3>4. Deletion</h3>
                <p>You can request deletion of your data at any time via the Settings menu.</p>
            </>
        }
      />

    </div>
  );
};

export default Onboarding;
