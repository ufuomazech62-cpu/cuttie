
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Zap, ChevronLeft, Menu } from 'lucide-react';
import { BodyProfile, StyleItem, GeneratedLook } from '../../types';
import { generateTryOnFront, generateTryOn360, generateStyleDraft } from '../../services/generationService';
import { getUserCredits, getUserHistory, saveGeneratedLook, updateUserCredits, updateUserProfile, uploadImage, deleteGeneratedLook } from '../../services/userService';
import { auth } from '../../lib/firebase';
import { COST_IMAGE_GEN, INITIAL_FREE_CREDITS } from '../../data/constants';
import Logo from '../Logo';
import dynamic from 'next/dynamic';

const TopUpModal = dynamic(() => import('../modals/TopUpModal'), { ssr: false });
import TweakModal, { Message } from '../modals/TweakModal';
import FeedbackModal from '../modals/FeedbackModal';

// Views
import GalleryView from './views/GalleryView';
import CreateView from './views/CreateView';
import ResultView from './views/ResultView';
import MenuDrawer from './MenuDrawer';

interface DashboardProps {
  userProfile: BodyProfile;
  onSignOut: () => void;
  onUpdateProfile: (profile: BodyProfile) => void;
  initialStyle?: StyleItem | null;
  initialFabrics?: string[];
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onSignOut, onUpdateProfile, initialStyle, initialFabrics = [] }) => {
  // Navigation & Views
  const [view, setView] = useState<'gallery' | 'create' | 'result'>('gallery');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Data State
  const [history, setHistory] = useState<GeneratedLook[]>([]);
  
  // Selection State
  const [selectedStyle, setSelectedStyle] = useState<StyleItem | null>(initialStyle || null);
  const [currentProducts, setCurrentProducts] = useState<string[]>(initialFabrics);

  // Chat Memory State (Transient for session)
  const [tweakMessages, setTweakMessages] = useState<Message[]>([
    { id: '1', role: 'system', text: 'Hello! I am your AI Beauty Assistant. How would you like to adjust this look?' }
  ]);

  // Economy
  const [credits, setCredits] = useState(INITIAL_FREE_CREDITS);

  // Modals
  const [showTopUp, setShowTopUp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTweak, setShowTweak] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [currentLook, setCurrentLook] = useState<GeneratedLook | null>(null);
  const [viewIndex, setViewIndex] = useState(0); // 0=Front, 1=Right, 2=Back, 3=Left

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    const fetchData = async () => {
        if (auth.currentUser) {
            try {
                const [userHistory, userCredits] = await Promise.all([
                    getUserHistory(auth.currentUser.uid),
                    getUserCredits(auth.currentUser.uid)
                ]);
                setHistory(userHistory);
                setCredits(userCredits || INITIAL_FREE_CREDITS);
            } catch (e) {
                console.error("Failed to fetch user data", e);
            }
        }
    };
    fetchData();
  }, []);

  // --- INITIAL HOOK FOR PROPS ---
  useEffect(() => {
      if (initialStyle && history.length === 0) {
          setSelectedStyle(initialStyle);
          setCurrentProducts(initialFabrics);
          handleGeneration(initialStyle, initialFabrics);
      }
  }, [initialStyle]);

  const handleCreateNew = () => {
      setSelectedStyle(null);
      setCurrentProducts([]);
      // Reset chat memory for new creation
      setTweakMessages([{ id: '1', role: 'system', text: 'Hello! I am your AI Beauty Assistant. How would you like to adjust this look?' }]);
      setView('create');
  };

  const handleGenerationRequest = (style: StyleItem, products: string[], newProfile?: BodyProfile) => {
      setSelectedStyle(style);
      setCurrentProducts(products);
      
      if (newProfile) {
          onUpdateProfile(newProfile);
          handleGeneration(style, products, undefined, newProfile);
      } else {
          handleGeneration(style, products);
      }
  };

  const handleGenerateStyleDraft = async (prompt: string): Promise<StyleItem | null> => {
    try {
        const { result: image, creditsRemaining } = await generateStyleDraft(prompt);
        if (creditsRemaining !== undefined) {
            setCredits(creditsRemaining);
        }
        if (image) {
            return {
                id: `ai-design-${Date.now()}`,
                name: 'AI Designed Look',
                description: prompt,
                image: image,
                isCustom: true
            };
        }
    } catch (e: any) {
        console.error("Design Draft Error", e);
    }
    return null;
  };

  const checkEconomy = (cost: number = COST_IMAGE_GEN): boolean => {
      if (credits < cost) {
          setShowTopUp(true);
          return false;
      }
      return true;
  };

  const handleGeneration = async (
      styleToUse: StyleItem | null = selectedStyle, 
      productsToUse: string[] = currentProducts, 
      refinement?: string, 
      profileToUse: BodyProfile = userProfile, 
      previousLookImage?: string, 
      targetAngle: string = 'Full Frontal'
  ) => {
      if (!styleToUse) return;
      if (!auth.currentUser) return; 

      // Note: Credit check is done on server, this is just for early UI feedback
      if (!checkEconomy(COST_IMAGE_GEN)) return;

      setIsGenerating(true);
      setLoadingStep('Uploading assets...');
      
      // If it's a completely new creation (not refinement), clear the view
      if (!refinement) {
          setCurrentLook(null); 
          setViewIndex(0);
          setView('result');
      }

      try {
          // --- PRE-UPLOAD ASSETS TO AVOID PAYLOAD LIMITS ---
          const uid = auth.currentUser.uid;
          const finalProfile = { ...profileToUse };
          if (finalProfile.referenceImage && finalProfile.referenceImage.startsWith('data:')) {
               const url = await uploadImage(uid, finalProfile.referenceImage!, `uploads/${Date.now()}_ref.jpg`);
               finalProfile.referenceImage = url;
               // Update global state/DB so we don't upload again
               onUpdateProfile(finalProfile);
               updateUserProfile(uid, finalProfile);
          }

          const finalStyle = { ...styleToUse };
          if (finalStyle.image && finalStyle.image.startsWith('data:') && !finalStyle.isTextOnly) {
               const url = await uploadImage(uid, finalStyle.image!, `uploads/${Date.now()}_style.jpg`);
               finalStyle.image = url;
          }

          const finalProducts = await Promise.all(productsToUse.map(async (prod, idx) => {
              if (prod.startsWith('data:')) {
                  return await uploadImage(uid, prod, `uploads/${Date.now()}_product_${idx}.jpg`);
              }
              return prod;
          }));

          setLoadingStep(refinement ? 'Applying adjustments...' : 'Creating your preview...');

          const response = await generateTryOnFront(
              finalProfile, 
              finalStyle, 
              finalProducts, 
              refinement, 
              previousLookImage, 
              targetAngle // Pass the correct angle
          );

          const result = response.result;
          
          // Update credits from server (source of truth)
          if (response.creditsRemaining !== undefined) {
              setCredits(response.creditsRemaining);
          }

          console.log("Generation Result Received:", result);
          
          if (result) {
              let lookToSave = result;
              
              // Smart Logic for Updating the Correct View after Tweak
              if (refinement && currentLook) {
                  // Create a NEW ID for the tweaked look to separate it from the original
                  const updatedLook = { 
                      ...currentLook, 
                      id: `look-${Date.now()}`, // New Unique ID
                      timestamp: Date.now() 
                  };
                  
                  // Map the result to the correct angle property based on what we tweaked
                  if (targetAngle === 'Full Frontal') updatedLook.front = result.front;
                  else if (targetAngle === 'Right Side Profile') updatedLook.right = result.front;
                  else if (targetAngle === 'Full Back') updatedLook.back = result.front;
                  else if (targetAngle === 'Left Side Profile') updatedLook.left = result.front;

                  updatedLook.styleName = `${result.styleName} (Adjusted)`;
                  setCurrentLook(updatedLook);
                  setHistory(prev => [updatedLook, ...prev]);
                  lookToSave = updatedLook;
              } else {
                  // Standard New Front Generation
                  setCurrentLook(result);
                  setHistory(prev => [result, ...prev]);
              }
              
              // Sync to Firestore
              if (auth.currentUser) {
                  // Upload to Storage and save URL to Firestore
                  console.log("Saving generated look to cloud...");
                  saveGeneratedLook(auth.currentUser.uid, lookToSave).then(savedLook => {
                      console.log("Look saved successfully:", savedLook);
                      // Update local history with the version containing URLs (to save memory and persistent references)
                      setHistory(prev => prev.map(l => l.id === savedLook.id ? savedLook : l));
                      // If the user is still viewing this look, update it to use URLs too
                      setCurrentLook(prev => (prev && prev.id === savedLook.id) ? savedLook : prev);
                  }).catch(err => {
                      console.error("Failed to save to cloud:", err);
                      alert("Preview generated but failed to save to gallery. Please screenshot!");
                  });
              }

          } else {
             // This block might not be reached if generateTryOnFront throws on failure now
             console.warn("Result was null/undefined");
             // Refresh credits from server
             if (auth.currentUser) {
                 const serverCredits = await getUserCredits(auth.currentUser.uid);
                 setCredits(serverCredits || INITIAL_FREE_CREDITS);
             }
             alert("The beauty studio is busy (Server Error). Please try again.");
             if (!refinement) setView('create');
          }
      } catch (e: any) {
          console.error("Generation Error Detailed:", e);
          
          // Refresh credits from server on error
          if (auth.currentUser) {
              const serverCredits = await getUserCredits(auth.currentUser.uid);
              setCredits(serverCredits || INITIAL_FREE_CREDITS);
          }
          
          const errorMessage = e?.message || "Unknown error";
          alert(`The AI encountered an issue: ${errorMessage}. Please try again.`);
          if (!refinement) setView('create');
      } finally {
          setIsGenerating(false);
          setLoadingStep('');
      }
  };

  const handleTweakSubmit = (instruction: string, angle: string, image?: string) => {
      // Tweak = 1 Credit
      if (!checkEconomy(COST_IMAGE_GEN)) return;
      
      setShowTweak(false);
      
      // 1. Determine which image to edit based on selected angle
      let previousImage = currentLook?.front; // Default
      let angleToEdit = 'Full Frontal';

      if (angle === 'right' && currentLook?.right) {
          previousImage = currentLook.right;
          angleToEdit = 'Right Side Profile';
      } else if (angle === 'back' && currentLook?.back) {
          previousImage = currentLook.back;
          angleToEdit = 'Full Back';
      } else if (angle === 'left' && currentLook?.left) {
          previousImage = currentLook.left;
          angleToEdit = 'Left Side Profile';
      }

      // 2. Add any new product to the context
      const updatedProducts = image ? [...currentProducts, image] : currentProducts;
      
      // 3. Trigger Edit Logic
      handleGeneration(
          selectedStyle, 
          updatedProducts, 
          instruction, 
          userProfile, 
          previousImage, 
          angleToEdit
      );
  };

  const handleGenerate360 = async () => {
      if (!currentLook) return;

      // Note: Credit check is done on server, this is just for early UI feedback
      const cost = COST_IMAGE_GEN * 3;
      if (!checkEconomy(cost)) return;

      setIsGenerating(true);
      setLoadingStep('Generating 360° Views...');

      // If we are restoring from history, selectedStyle might be null.
      // We create a fallback style object since generateTryOn360 doesn't actually use it for generation (it uses the front view image).
      const styleToUse = selectedStyle || {
          id: 'history-fallback',
          name: currentLook.styleName || 'Look',
          description: '',
          image: ''
      } as StyleItem;
      
      try {
          const response = await generateTryOn360(currentLook, userProfile, styleToUse, currentProducts);
          const result = response.result;
          
          // Update credits from server (source of truth)
          if (response.creditsRemaining !== undefined) {
              setCredits(response.creditsRemaining);
          }
          
          if (result) {
              setCurrentLook(result);
              setHistory(prev => prev.map(l => l.id === result.id ? result : l));
              
              if (auth.currentUser) {
                  saveGeneratedLook(auth.currentUser.uid, result).then(savedLook => {
                       setHistory(prev => prev.map(l => l.id === savedLook.id ? savedLook : l));
                       setCurrentLook(prev => (prev && prev.id === savedLook.id) ? savedLook : prev);
                  });
              }

          } else {
             // Refresh credits from server
             if (auth.currentUser) {
                 const serverCredits = await getUserCredits(auth.currentUser.uid);
                 setCredits(serverCredits || INITIAL_FREE_CREDITS);
             }
             alert("Could not complete 360 view. Try again.");
          }
      } catch (e: any) {
          console.error(e);
          // Refresh credits from server on error
          if (auth.currentUser) {
              const serverCredits = await getUserCredits(auth.currentUser.uid);
              setCredits(serverCredits || INITIAL_FREE_CREDITS);
          }
          alert(`The AI encountered an error: ${e.message}. Please try again.`);
      } finally {
          setIsGenerating(false);
          setLoadingStep('');
      }
  };

  const rotateView = () => {
      if (!currentLook?.right) {
          handleGenerate360();
          return;
      }
      setViewIndex((prev) => (prev + 1) % 4);
  };

  const handleDeleteLook = async (lookId: string) => {
      let lookToDelete = history.find(l => l.id === lookId);
      
      // Fallback: If not found in history, check if it's the current look
      if (!lookToDelete && currentLook?.id === lookId) {
          lookToDelete = currentLook;
      }

      // Optimistic update
      setHistory(prev => prev.filter(l => l.id !== lookId));
      
      if (currentLook?.id === lookId) {
          setView('gallery');
          setCurrentLook(null);
      }

      if (auth.currentUser && lookToDelete) {
          try {
              await deleteGeneratedLook(auth.currentUser.uid, lookId, lookToDelete);
          } catch (e) {
              console.error("Failed to delete look from cloud", e);
              // Optionally revert state here if critical
          }
      } else {
          console.warn("Could not find look to delete in history or currentLook", lookId);
      }
  };

  return (
    <div className="flex flex-col h-screen bg-cuttie-cream text-cuttie-charcoal font-sans overflow-hidden relative">
      <MenuDrawer 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenBilling={() => setShowTopUp(true)}
        onOpenFeedback={() => setShowFeedback(true)}
        onSignOut={onSignOut}
        userProfile={userProfile}
      />
      
      {/* HEADER */}
      <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-2 flex justify-between items-center z-30">
            {view !== 'gallery' ? (
                <button onClick={() => setView('gallery')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            ) : (
                <Logo size="sm" />
            )}
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowTopUp(true)}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <Zap className="w-3 h-3 text-cuttie-purple fill-cuttie-purple" />
                    <span className="text-xs font-bold">{formatNumber(credits)}</span>
                </button>
                <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-100">
                    <Menu className="w-6 h-6" />
                </button>
            </div>
      </header>

      {/* MAIN CONTENT */}
      <main className={`flex-1 relative h-full bg-cuttie-cream ${view === 'create' ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden custom-scrollbar'}`}>
          {view === 'gallery' && (
              <GalleryView 
                history={history} 
                onSelectLook={(look) => { setCurrentLook(look); setView('result'); setViewIndex(0); }} 
                onCreateNew={handleCreateNew} 
              />
          )}

          {view === 'create' && (
              <CreateView 
                onGenerate={handleGenerationRequest}
                onGenerateDraft={handleGenerateStyleDraft}
                userProfile={userProfile}
              />
          )}

          {view === 'result' && (
              <ResultView 
                currentLook={currentLook}
                isGenerating={isGenerating}
                loadingStep={loadingStep}
                viewIndex={viewIndex}
                onRotate={rotateView}
                onShowSub={() => setShowTopUp(true)}
                onPreview={setPreviewImage}
                onTweak={() => setShowTweak(true)}
                onDelete={handleDeleteLook}
              />
          )}
      </main>

      {/* MODALS */}
      <TopUpModal isOpen={showTopUp} onClose={() => setShowTopUp(false)} handleTopUp={(amount) => { 
          const newCredits = credits + amount;
          setCredits(newCredits); 
          if (auth.currentUser) updateUserCredits(auth.currentUser.uid, newCredits);
          setShowTopUp(false); 
      }} />
      <FeedbackModal 
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
      />
      <TweakModal 
          isOpen={showTweak} 
          onClose={() => setShowTweak(false)} 
          onSubmit={handleTweakSubmit} 
          messages={tweakMessages}
          setMessages={setTweakMessages}
          credits={credits}
          currentLook={currentLook}
      />
    </div>
  );
};

export default Dashboard;
