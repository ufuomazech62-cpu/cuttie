
import * as React from 'react';
import { useState } from 'react';
import { Box, Wand2, MoreVertical, Trash2, Download, Share } from 'lucide-react';
import { GeneratedLook } from '../../../types';

interface ResultViewProps {
  currentLook: GeneratedLook | null;
  isGenerating: boolean;
  loadingStep: string;
  viewIndex: number;
  onRotate: () => void;
  onShowSub: () => void;
  onPreview: (url: string) => void;
  onTweak: () => void;
  onDelete: (id: string) => void;
}

const ResultView: React.FC<ResultViewProps> = ({ 
  currentLook, isGenerating, loadingStep, viewIndex, 
  onRotate, onShowSub, onPreview, onTweak, onDelete 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Initial Loading State (No previous look)
  if (isGenerating && !currentLook) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-up h-full">
            <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-cuttie-purple rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold mb-2">{loadingStep}</h2>
        </div>
    );
  }

  if (!currentLook) return null;

  // Helper to convert base64 to File
  const dataURLtoFile = (dataurl: string, filename: string) => {
      const arr = dataurl.split(',');
      const match = arr[0].match(/:(.*?);/);
      const mime = match ? match[1] : 'image/png';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, {type:mime});
  }

  const createCollage = async (front: string, right: string, back: string, left: string): Promise<Blob | null> => {
      return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          // Use proxy for images to avoid CORS issues
          const images = [front, right, back, left].map(url => 
            url.startsWith('data:') ? url : `/api/proxy-image?url=${encodeURIComponent(url)}`
          );
          const loadedImages: HTMLImageElement[] = [];
          
          let loadedCount = 0;
          images.forEach((src, index) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.src = src;
              img.onload = () => {
                  loadedImages[index] = img;
                  loadedCount++;
                  if (loadedCount === 4) {
                      // All loaded
                      const w = loadedImages[0].width;
                      const h = loadedImages[0].height;
                      canvas.width = w * 2;
                      canvas.height = h * 2;
                      
                      // Draw 2x2 Grid
                      ctx?.drawImage(loadedImages[0], 0, 0, w, h); // Front (TL)
                      ctx?.drawImage(loadedImages[1], w, 0, w, h); // Right (TR)
                      ctx?.drawImage(loadedImages[2], 0, h, w, h); // Back (BL)
                      ctx?.drawImage(loadedImages[3], w, h, w, h); // Left (BR)
                      
                      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
                  }
              };
              img.onerror = () => {
                  console.error("Failed to load image for collage");
                  resolve(null);
              };
          });
      });
  };

  const getCurrentImageUrl = () => {
      switch(viewIndex) {
          case 1: return currentLook.right || currentLook.front;
          case 2: return currentLook.back || currentLook.front;
          case 3: return currentLook.left || currentLook.front;
          default: return currentLook.front;
      }
  };

  const shareImage = async (file: File) => {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
              await navigator.share({
                  title: 'My Cuttie Look',
                  text: `Check out this look I created with Cuttie AI!`,
                  files: [file]
              });
          } catch (e) {
              console.error("Share failed", e);
          }
      } else {
          alert("Sharing is not supported on this browser/device. Please download the images instead.");
      }
  };

  const handleShareSingle = async () => {
      if (actionLoading) return;
      setActionLoading('share-single');
      
      const timestamp = new Date().getTime();
      const currentUrl = getCurrentImageUrl();
      
      try {
          // Use proxy if it's a remote URL
          const fetchUrl = currentUrl.startsWith('data:') 
            ? currentUrl 
            : `/api/proxy-image?url=${encodeURIComponent(currentUrl)}`;
            
          const response = await fetch(fetchUrl);
          if (!response.ok) throw new Error('Network response was not ok');
          
          const blob = await response.blob();
          const file = new File([blob], `cuttie_look_${timestamp}.jpg`, { type: 'image/jpeg' });
          await shareImage(file);
      } catch (e) {
           console.error("Share failed first attempt", e);
           // Fallback for data URLs specifically or if proxy fails
           if (currentUrl.startsWith('data:')) {
               try {
                 const file = dataURLtoFile(currentUrl, `cuttie_look_${timestamp}.png`);
                 await shareImage(file);
               } catch (err) {
                 console.error("Failed to prepare image for sharing", err);
                 alert("Could not prepare image for sharing.");
               }
           } else {
               alert("Could not download image for sharing. Please try downloading instead.");
           }
      } finally {
          setActionLoading(null);
          setShowMenu(false);
      }
  };

  const handleShareCollage = async () => {
      if (actionLoading) return;
      setActionLoading('share-collage');
      
      if (!currentLook.right || !currentLook.back || !currentLook.left) {
        setActionLoading(null);
        return;
      }

      try {
        const timestamp = new Date().getTime();
        const collageBlob = await createCollage(currentLook.front, currentLook.right, currentLook.back, currentLook.left);
        
        if (collageBlob) {
            const file = new File([collageBlob], `cuttie_360_${timestamp}.jpg`, { type: 'image/jpeg' });
            await shareImage(file);
        } else {
            alert("Failed to create 360° collage for sharing.");
        }
      } catch (e) {
          console.error(e);
          alert("An error occurred while sharing.");
      } finally {
          setActionLoading(null);
          setShowMenu(false);
      }
  };

  const downloadBlob = (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = async () => {
      if (actionLoading) return;
      setActionLoading('download-single');

      const timestamp = new Date().getTime();
      const currentUrl = getCurrentImageUrl();

      try {
          // Use proxy if it's a remote URL
          const fetchUrl = currentUrl.startsWith('data:') 
            ? currentUrl 
            : `/api/proxy-image?url=${encodeURIComponent(currentUrl)}`;

          const response = await fetch(fetchUrl);
          if (!response.ok) throw new Error('Network response was not ok');
          
          const blob = await response.blob();
          downloadBlob(blob, `cuttie_look_${timestamp}.jpg`);
      } catch (e) {
          console.error("Download failed", e);
          // Fallback: try opening in new tab if it's a direct URL
          if (!currentUrl.startsWith('data:')) {
             window.open(currentUrl, '_blank');
          } else {
             alert("Failed to download image.");
          }
      } finally {
          setActionLoading(null);
          setShowMenu(false);
      }
  };

  const handleDownloadCollage = async () => {
      if (actionLoading) return;
      setActionLoading('download-collage');
      
      const timestamp = new Date().getTime();
      
      try {
          if (currentLook.right && currentLook.back && currentLook.left) {
              const collageBlob = await createCollage(currentLook.front, currentLook.right, currentLook.back, currentLook.left);
              if (collageBlob) {
                  downloadBlob(collageBlob, `cuttie_360_collage_${timestamp}.jpg`);
              } else {
                  alert("Failed to create collage.");
              }
          }
      } catch (e) {
          console.error(e);
          alert("An error occurred during download.");
      } finally {
          setActionLoading(null);
          setShowMenu(false);
      }
  };

  return (
      <div className="flex-1 flex flex-col relative h-full">
          
          {/* Seamless Loading Overlay (For Tweak Refinements) */}
          {isGenerating && (
              <div className="absolute inset-0 z-40 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-up">
                  <div className="relative w-16 h-16 mb-4">
                      <div className="absolute inset-0 border-4 border-white rounded-full shadow-md"></div>
                      <div className="absolute inset-0 border-4 border-cuttie-purple rounded-full border-t-transparent animate-spin"></div>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100">
                     <span className="text-sm font-bold text-cuttie-charcoal animate-pulse">{loadingStep}</span>
                  </div>
              </div>
          )}

          {/* Image Viewer */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-cuttie-cream">
                <div className="relative w-full h-full max-w-lg">
                    <img 
                        src={currentLook.front} 
                        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${viewIndex === 0 ? 'opacity-100 z-10' : 'opacity-0'}`}
                        onClick={() => onPreview(currentLook.front)}
                    />
                    {!!currentLook.right && (
                        <>
                            <img src={currentLook.right} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${viewIndex === 1 ? 'opacity-100 z-10' : 'opacity-0'}`} onClick={() => onPreview(currentLook.right!)} />
                            <img src={currentLook.back} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${viewIndex === 2 ? 'opacity-100 z-10' : 'opacity-0'}`} onClick={() => onPreview(currentLook.back!)} />
                            <img src={currentLook.left} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${viewIndex === 3 ? 'opacity-100 z-10' : 'opacity-0'}`} onClick={() => onPreview(currentLook.left!)} />
                        </>
                    )}
                </div>
          </div>

          {/* Controls */}
          <div className="h-32 flex items-center justify-center gap-6 md:gap-12 pb-8 bg-gradient-to-t from-cuttie-cream via-cuttie-cream to-transparent z-20">
             
             {/* Tweak Button */}
             <button onClick={onTweak} className="flex flex-col items-center gap-1 opacity-90 hover:opacity-100 group">
                 <div className="w-12 h-12 bg-cuttie-charcoal text-white rounded-full flex items-center justify-center shadow-lg group-hover:bg-cuttie-purple transition-colors group-hover:scale-110 duration-300">
                     <Wand2 className="w-5 h-5" />
                 </div>
                 <span className="text-[9px] font-bold uppercase tracking-widest">Adjust</span>
             </button>

             {/* Main Action (360) */}
             <button 
                onClick={onRotate}
                className={`
                    w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border-4
                    ${currentLook.right 
                        ? 'bg-white border-white text-cuttie-charcoal hover:scale-105 active:scale-95' 
                        : 'bg-white border-cuttie-purple text-cuttie-purple hover:bg-purple-50'
                    }
                `}
             >
                 {currentLook.right ? (
                     <Box className="w-8 h-8" />
                 ) : (
                     <div className="flex flex-col items-center">
                         <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-1">Unlock</span>
                         <span className="text-sm md:text-lg font-bold">360°</span>
                     </div>
                 )}
             </button>

             {/* More Menu Trigger */}
             <button 
                onClick={() => setShowMenu(true)} 
                className="flex flex-col items-center gap-1 opacity-70 hover:opacity-100 group"
             >
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                     <MoreVertical className="w-5 h-5 text-cuttie-charcoal" />
                 </div>
                 <span className="text-[9px] font-bold uppercase tracking-widest">More</span>
             </button>
          </div>

          {/* MOBILE ACTION SHEET (FIXED BOTTOM) */}
          {showMenu && (
             <>
                <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={() => setShowMenu(false)}></div>
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.1)] animate-fade-up overflow-hidden pb-8">
                    
                    {/* Handle Bar */}
                    <div className="w-full flex justify-center pt-3 pb-1">
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                    </div>

                    <div className="p-2">

                        {currentLook.right && currentLook.back && currentLook.left ? (
                            <>
                                <button disabled={!!actionLoading} onClick={handleShareSingle} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                                        {actionLoading === 'share-single' ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/> : <Share className="w-5 h-5 text-purple-600" />}
                                    </div>
                                     <div className="text-left">
                                        <span className="block text-sm font-bold text-cuttie-charcoal">{actionLoading === 'share-single' ? 'Sharing...' : 'Share Single View'}</span>
                                        <span className="text-xs text-gray-500">Share current view</span>
                                    </div>
                                </button>

                                <button disabled={!!actionLoading} onClick={handleShareCollage} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                                        {actionLoading === 'share-collage' ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/> : <Share className="w-5 h-5 text-purple-600" />}
                                    </div>
                                     <div className="text-left">
                                        <span className="block text-sm font-bold text-cuttie-charcoal">{actionLoading === 'share-collage' ? 'Preparing...' : 'Share 360° Grid'}</span>
                                        <span className="text-xs text-gray-500">Share all 4 angles</span>
                                    </div>
                                </button>

                                <div className="h-px bg-gray-100 mx-6 my-1"></div>

                                <button disabled={!!actionLoading} onClick={handleDownloadSingle} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                        {actionLoading === 'download-single' ? <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"/> : <Download className="w-5 h-5 text-green-600" />}
                                    </div>
                                     <div className="text-left">
                                        <span className="block text-sm font-bold text-cuttie-charcoal">{actionLoading === 'download-single' ? 'Downloading...' : 'Download Single View'}</span>
                                        <span className="text-xs text-gray-500">Save current view</span>
                                    </div>
                                </button>

                                <button disabled={!!actionLoading} onClick={handleDownloadCollage} className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                        {actionLoading === 'download-collage' ? <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"/> : <Download className="w-5 h-5 text-green-600" />}
                                    </div>
                                     <div className="text-left">
                                        <span className="block text-sm font-bold text-cuttie-charcoal">{actionLoading === 'download-collage' ? 'Preparing...' : 'Download 360° Grid'}</span>
                                        <span className="text-xs text-gray-500">Save all 4 angles</span>
                                    </div>
                                </button>
                            </>
                        ) : (
                            <>
                                <button disabled={!!actionLoading} onClick={handleShareSingle} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                                        {actionLoading === 'share-single' ? <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"/> : <Share className="w-5 h-5 text-purple-600" />}
                                    </div>
                                     <div className="text-left">
                                        <span className="block text-sm font-bold text-cuttie-charcoal">{actionLoading === 'share-single' ? 'Sharing...' : 'Share Image'}</span>
                                        <span className="text-xs text-gray-500">Send image</span>
                                    </div>
                                </button>

                                <button disabled={!!actionLoading} onClick={handleDownloadSingle} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                        {actionLoading === 'download-single' ? <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"/> : <Download className="w-5 h-5 text-green-600" />}
                                    </div>
                                     <div className="text-left">
                                        <span className="block text-sm font-bold text-cuttie-charcoal">{actionLoading === 'download-single' ? 'Downloading...' : 'Download Image'}</span>
                                        <span className="text-xs text-gray-500">Save to gallery</span>
                                    </div>
                                </button>
                            </>
                        )}

                        <div className="h-px bg-gray-100 mx-6 my-1"></div>

                        <button 
                            onClick={() => { 
                                if (window.confirm("Are you sure you want to delete this look?")) {
                                    setShowMenu(false); 
                                    onDelete(currentLook.id); 
                                }
                            }} 
                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 active:bg-red-100 rounded-xl transition-colors"
                        >
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <span className="text-sm font-bold text-red-600">Delete Look</span>
                        </button>
                        
                        <div className="px-6 pt-2">
                            <button onClick={() => setShowMenu(false)} className="w-full py-3 bg-gray-100 font-bold rounded-xl text-xs uppercase tracking-widest text-gray-500">Cancel</button>
                        </div>
                    </div>
                </div>
             </>
          )}

      </div>
  );
};

export default ResultView;
