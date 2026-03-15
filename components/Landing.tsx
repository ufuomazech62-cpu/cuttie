
import * as React from 'react';
import { useState, useEffect } from 'react';
import { ArrowRight, Star, Sparkles, Palette, Camera, Upload, Plus, ChevronRight, ChevronLeft, Heart, Wand2 } from 'lucide-react';
import Logo from './Logo';
import Modal from './ui/Modal';

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted, onSignIn }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [currentOutfit, setCurrentOutfit] = useState(0);
  const [activeModal, setActiveModal] = useState<'about' | 'terms' | 'privacy' | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Simulation of 360 degree views (Front -> Right -> Back -> Left)
  const outfits = [
    [
        {
            src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
            label: "Front"
        },
        {
            src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=800&auto=format&fit=crop",
            label: "Side"
        },
        {
            src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800&auto=format&fit=crop",
            label: "Back"
        },
        {
            src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=800&auto=format&fit=crop",
            label: "Side"
        }
    ],
    [
        {
            src: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop",
            label: "Front"
        },
        {
            src: "https://images.unsplash.com/photo-1596704017254-5b0d2d1e8239?q=80&w=800&auto=format&fit=crop",
            label: "Side"
        },
        {
            src: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop",
            label: "Back"
        },
        {
            src: "https://images.unsplash.com/photo-1596704017254-5b0d2d1e8239?q=80&w=800&auto=format&fit=crop",
            label: "Side"
        }
    ],
    [
        {
            src: "https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c4?q=80&w=800&auto=format&fit=crop",
            label: "Front"
        },
        {
            src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
            label: "Side"
        },
        {
            src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800&auto=format&fit=crop",
            label: "Back"
        },
        {
            src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
            label: "Side"
        }
    ]
  ];

  useEffect(() => {
    const interval = setInterval(() => {
        setRotationIndex((prev) => (prev + 1) % 4);
    }, 2500); 

    return () => clearInterval(interval);
  }, []);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
       setCurrentOutfit((prev) => (prev + 1) % outfits.length);
    }
    if (isRightSwipe) {
       setCurrentOutfit((prev) => (prev - 1 + outfits.length) % outfits.length);
    }
  };

  const galleryItems = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop",
        user: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop",
        style: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop",
        fabric: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=200&auto=format&fit=crop"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1534670007418-fbb7f6cf32c4?q=80&w=800&auto=format&fit=crop",
        user: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=100&h=100&fit=crop",
        style: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop",
        fabric: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=200&auto=format&fit=crop"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop",
        user: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=100&h=100&fit=crop",
        style: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=800&auto=format&fit=crop",
        fabric: "https://images.unsplash.com/photo-1595959183082-7b570b7e08e2?q=80&w=200&auto=format&fit=crop"
    },
    {
        id: 4,
        image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=800&auto=format&fit=crop",
        user: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        style: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=800&auto=format&fit=crop",
        fabric: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=200&auto=format&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-cuttie-cream text-cuttie-charcoal font-sans overflow-x-hidden selection:bg-cuttie-purple selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cuttie-cream/90 backdrop-blur-md border-b border-cuttie-charcoal/10 px-6 py-2 flex justify-between items-center transition-all duration-300">
        <Logo size="md" />
        <div className="flex items-center">
             <button 
                onClick={onSignIn}
                className="text-cuttie-charcoal text-xs md:text-sm font-bold uppercase tracking-wider hover:bg-cuttie-charcoal hover:text-white transition-colors px-6 py-3 border border-cuttie-charcoal rounded-none"
            >
                Sign In
            </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 md:pt-40 pb-12 md:pb-20 px-4 md:px-6 min-h-[90vh] flex flex-col justify-center max-w-[1600px] mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Text Content */}
            <div className="lg:col-span-7 space-y-6 md:space-y-8 animate-fade-up z-10">
                <div className="flex items-center gap-4">
                    <span className="w-8 md:w-12 h-[1px] bg-cuttie-purple"></span>
                    <span className="text-cuttie-purple font-mono text-[10px] md:text-xs font-bold uppercase tracking-widest">AI BEAUTY & STYLING PLATFORM</span>
                </div>
                
                <h1 className="text-4xl md:text-8xl lg:text-[7.5rem] leading-[0.95] md:leading-[0.9] font-display font-bold tracking-tight text-cuttie-charcoal">
                    Your AI <br/>
                    <span className="italic font-light text-cuttie-purple">Beauty Studio.</span>
                </h1>
                
                <div className="text-base md:text-2xl text-cuttie-charcoal/80 max-w-xl font-medium leading-relaxed">
                    <p className="block mb-2 font-bold text-cuttie-charcoal text-xl md:text-3xl">Preview makeup, hairstyles & outfits on your face and body.</p>
                    <p>Test before you invest. See how you look before making real-world beauty decisions.</p>
                </div>

                <div className="flex flex-col gap-6 pt-2 items-start w-full md:w-auto">
                    
                    <button 
                        onClick={onGetStarted}
                        className="group w-full md:w-auto flex items-center justify-center gap-4 bg-cuttie-purple text-white px-10 py-5 text-sm font-bold uppercase tracking-widest hover:bg-cuttie-charcoal transition-all shadow-xl hover:shadow-2xl"
                    >
                        Start Your Glow Up <Sparkles className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                    </button>

                    {/* Social Proof */}
                    <div className="flex items-center gap-4 border-t border-cuttie-charcoal/10 pt-4 w-full max-w-sm">
                         <div className="flex -space-x-3">
                             <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                 <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&h=100&fit=crop" className="w-full h-full object-cover" alt="User" />
                             </div>
                             <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                 <img src="https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=100&h=100&fit=crop" className="w-full h-full object-cover" alt="User" />
                             </div>
                             <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                 <img src="https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=100&h=100&fit=crop" className="w-full h-full object-cover" alt="User" />
                             </div>
                         </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-cuttie-charcoal">Join 10,000+ Beauty Lovers</span>
                            <div className="flex gap-1">
                                <Star className="w-3 h-3 text-cuttie-purple fill-cuttie-purple" />
                                <Star className="w-3 h-3 text-cuttie-purple fill-cuttie-purple" />
                                <Star className="w-3 h-3 text-cuttie-purple fill-cuttie-purple" />
                                <Star className="w-3 h-3 text-cuttie-purple fill-cuttie-purple" />
                                <Star className="w-3 h-3 text-cuttie-purple fill-cuttie-purple" />
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>

            {/* Visual - 360 Simulation */}
            <div className="lg:col-span-5 relative animate-fade-up lg:translate-x-12 mt-8 lg:mt-0" style={{ animationDelay: '0.2s' }}>
                 {/* Abstract Shapes */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-cuttie-purple/10 rounded-full blur-3xl mix-blend-multiply"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-cuttie-pink/10 rounded-full blur-3xl mix-blend-multiply"></div>

                <div 
                    className="relative w-full group/slider touch-pan-y"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                     {/* Carousel Container */}
                     <div className="overflow-hidden rounded-t-[200px] md:rounded-t-[300px] cursor-pointer">
                        <div 
                            className="flex transition-transform duration-500 ease-in-out" 
                            style={{ transform: `translateX(-${currentOutfit * 100}%)` }}
                        >
                            {outfits.map((outfit, oIndex) => (
                                <div key={oIndex} className="min-w-full grid grid-cols-1">
                                    {outfit.map((img, index) => (
                                        <img 
                                            key={index}
                                            src={img.src} 
                                            alt="Cuttie Beauty Style" 
                                            className={`col-start-1 row-start-1 w-full h-auto object-cover transition-opacity duration-1000 ${index === rotationIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                     </div>
                     
                     {/* Slider Controls */}
                     <button 
                        onClick={() => setCurrentOutfit((prev) => (prev - 1 + outfits.length) % outfits.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-cuttie-charcoal hover:bg-cuttie-purple hover:text-white transition-all z-20 shadow-lg"
                     >
                        <ChevronLeft className="w-6 h-6" />
                     </button>
                     <button 
                        onClick={() => setCurrentOutfit((prev) => (prev + 1) % outfits.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-cuttie-charcoal hover:bg-cuttie-purple hover:text-white transition-all z-20 shadow-lg"
                     >
                        <ChevronRight className="w-6 h-6" />
                     </button>

                     {/* Pagination Dots */}
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {outfits.map((_, index) => (
                            <button 
                                key={index}
                                onClick={() => setCurrentOutfit(index)}
                                className={`h-2 rounded-full transition-all duration-300 shadow-sm ${index === currentOutfit ? 'bg-cuttie-purple w-8' : 'bg-white/60 hover:bg-white w-2'}`}
                            />
                        ))}
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* The Hook: Capabilities */}
      <section className="py-24 md:py-32 px-6 max-w-[1200px] mx-auto bg-white border-t border-gray-100">
          <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-up">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Preview Before You Commit</h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                  Test makeup, hairstyles, wigs, and outfits on your actual face and body in 3 simple steps.
                  <span className="text-cuttie-charcoal font-bold block mt-2">Zero regrets. 100% Confidence.</span>
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-cuttie-charcoal text-white p-10 rounded-3xl shadow-xl hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cuttie-purple/20 transition-colors"></div>
                  <Camera className="w-12 h-12 mb-6 text-cuttie-purple" />
                  <h3 className="text-xl font-bold mb-4 font-display leading-tight">Upload Your Photo</h3>
                  <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                      Add a clear face or body photo. Our AI analyzes your features to create accurate previews tailored to you.
                  </p>
              </div>

               {/* Step 2 */}
              <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <Palette className="w-12 h-12 mb-6 text-cuttie-pink group-hover:scale-110 transition-transform" />
                  <h3 className="text-2xl font-bold mb-4 font-display">Choose Your Look</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                       Browse makeup styles, hairstyles, wigs, or outfit ideas. Or describe exactly what you want to try.
                  </p>
              </div>

               {/* Step 3 */}
              <div className="bg-white p-10 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
                  <Wand2 className="w-12 h-12 mb-6 text-cuttie-charcoal group-hover:-rotate-12 transition-transform duration-700" />
                  <h3 className="text-2xl font-bold mb-4 font-display">Preview & Perfect</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                      See the look on your actual face or body. Request adjustments until it's perfect. Save or share your favorite looks.
                  </p>
              </div>
          </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-cuttie-cream border-t border-gray-100">
        <div className="px-6 max-w-[1600px] mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-6xl font-display font-bold text-cuttie-charcoal mb-4">What You Can Do</h2>
                <p className="text-gray-500 max-w-md mx-auto">Explore all the ways to preview and perfect your look</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Makeup Try-On */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all group">
                    <div className="w-16 h-16 bg-cuttie-purple/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cuttie-purple/20 transition-colors">
                        <span className="text-3xl">💄</span>
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Makeup Try-On</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Test makeup products on your face before buying. See how different looks work with your skin tone.</p>
                </div>

                {/* Hairstyle Simulator */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all group">
                    <div className="w-16 h-16 bg-cuttie-pink/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cuttie-pink/20 transition-colors">
                        <span className="text-3xl">💇</span>
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Hairstyle Simulator</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Preview haircuts, colors, and styles before your salon visit. No more haircut regrets.</p>
                </div>

                {/* Wig Preview */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all group">
                    <div className="w-16 h-16 bg-cuttie-purple/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cuttie-purple/20 transition-colors">
                        <span className="text-3xl">👩</span>
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Wig Preview</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">See how wigs look on you before purchasing. Try different lengths, colors, and textures.</p>
                </div>

                {/* Outfit Stylist */}
                <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all group">
                    <div className="w-16 h-16 bg-cuttie-pink/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cuttie-pink/20 transition-colors">
                        <span className="text-3xl">👗</span>
                    </div>
                    <h3 className="text-xl font-bold font-display mb-3">Outfit Stylist</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Upload your wardrobe and get AI-styled outfit suggestions for any occasion.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-white border-t border-gray-100 overflow-hidden">
        <div className="px-6 max-w-[1600px] mx-auto mb-16 flex justify-between items-end">
             <div>
                <h2 className="text-4xl md:text-6xl font-display font-bold text-cuttie-charcoal mb-4">AI-Generated Beauty Looks</h2>
                <p className="text-gray-500 max-w-md">Real beauty previews created by Cuttie AI. See yourself before you commit.</p>
             </div>
             <button onClick={onGetStarted} className="hidden md:flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-cuttie-purple transition-colors">
                 Try It Now <ArrowRight className="w-4 h-4" />
             </button>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-12">
            {galleryItems.map((item) => (
                <div key={item.id} className="relative aspect-[3/4] rounded-[2rem] overflow-hidden group border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300">
                    <img src={item.image} className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                </div>
            ))}
            
            {/* CTA Card */}
            <div className="aspect-[3/4] bg-cuttie-charcoal rounded-[2rem] flex flex-col items-center justify-center p-12 text-center text-white cursor-pointer hover:bg-cuttie-purple transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1" onClick={onGetStarted}>
                 <Plus className="w-16 h-16 mb-6" />
                 <h3 className="text-3xl font-display font-bold mb-2">Your Turn</h3>
                 <p className="text-white/60">Start previewing your perfect look.</p>
            </div>
        </div>
      </section>

      {/* Bold Bottom CTA (Dark Theme) */}
      <section className="bg-cuttie-charcoal text-white py-24 md:py-32 px-6 border-t border-gray-900">
          <div className="max-w-5xl mx-auto text-center">
               <h2 className="text-5xl md:text-8xl font-display font-bold tracking-tight mb-8 leading-[0.9]">
                   Your Beauty.<br/>
                   <span className="text-cuttie-purple">AI Powered.</span>
               </h2>
               <p className="text-xl md:text-2xl text-gray-400 mb-12 font-medium max-w-3xl mx-auto leading-relaxed">
                   Join thousands who preview before they commit. No more beauty regrets.
               </p>
               <button 
                    onClick={onGetStarted}
                    className="inline-flex items-center justify-center gap-4 bg-white text-cuttie-charcoal px-12 py-6 text-sm font-bold uppercase tracking-widest hover:bg-cuttie-purple hover:text-white transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/20"
                >
                    Start Your Glow Up <ArrowRight className="w-4 h-4" />
                </button>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 border-t border-gray-100">
            <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-8">
                    <Logo size="sm" className="grayscale opacity-80" />
                    <div className="hidden md:flex gap-8">
                        <button onClick={() => setActiveModal('about')} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-cuttie-purple transition-colors">About Cuttie</button>
                        <button onClick={() => setActiveModal('terms')} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-cuttie-purple transition-colors">Terms</button>
                        <button onClick={() => setActiveModal('privacy')} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-cuttie-purple transition-colors">Privacy</button>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4">
                     <div className="flex md:hidden gap-6">
                        <button onClick={() => setActiveModal('about')} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-cuttie-purple transition-colors">About</button>
                        <button onClick={() => setActiveModal('terms')} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-cuttie-purple transition-colors">Terms</button>
                        <button onClick={() => setActiveModal('privacy')} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-cuttie-purple transition-colors">Privacy</button>
                    </div>
                    <p className="text-xs font-bold text-cuttie-charcoal/50">
                        © 2025 Cuttie AI. Created for beauty lovers.
                    </p>
                </div>
            </div>
      </footer>

      {/* Info Modals */}
      {activeModal && (
            <Modal 
                isOpen={!!activeModal} 
                onClose={() => setActiveModal(null)} 
                title={activeModal === 'about' ? 'About Cuttie' : activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                size="md"
            >
                <div className="p-8 space-y-8">
                    {activeModal === 'about' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-display font-bold">Your Personal Beauty Preview Platform</h3>
                            <p className="text-lg font-medium leading-relaxed text-gray-800">
                                Cuttie is an AI-powered beauty and styling assistant that lets you preview looks before committing.
                            </p>
                            <p className="text-gray-600 leading-relaxed">
                                Our mission is simple: To eliminate beauty regrets. By letting you digitally test makeup, hairstyles, wigs, and outfits on your actual face and body, we empower you to make confident beauty decisions.
                            </p>
                        </div>
                    )}

                    {activeModal === 'terms' && (
                        <div className="space-y-6">
                            <p className="text-gray-600 leading-relaxed">
                                By using Cuttie AI, you agree to treat the community with respect. 
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                <li><strong>Credits:</strong> Credits purchased are non-refundable but do not expire.</li>
                                <li><strong>Usage:</strong> You own the rights to the looks you generate.</li>
                                <li><strong>Conduct:</strong> Do not use the platform to generate offensive or harmful content.</li>
                            </ul>
                        </div>
                    )}

                    {activeModal === 'privacy' && (
                        <div className="space-y-6">
                             <p className="text-gray-600 leading-relaxed">
                                Your privacy is paramount.
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                <li><strong>Your Photos:</strong> We use your photos solely for generating your beauty previews. They are not sold to third parties.</li>
                                <li><strong>Data Deletion:</strong> You can delete your account and all associated data at any time from the Settings menu.</li>
                            </ul>
                        </div>
                    )}
                </div>
            </Modal>
        )}
    </div>
  );
};

export default Landing;
