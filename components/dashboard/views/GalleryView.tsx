
import * as React from 'react';
import { Layers, Plus, Sparkles } from 'lucide-react';
import { GeneratedLook } from '../../../types';

interface GalleryViewProps {
  history: GeneratedLook[];
  onSelectLook: (look: GeneratedLook) => void;
  onCreateNew: () => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ history, onSelectLook, onCreateNew }) => {
  return (
    <>
      <div className="p-6 pb-24 space-y-8 animate-fade-up">
          <div className="flex justify-between items-end">
              <h1 className="text-4xl font-display font-bold">My Looks</h1>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{history.length} ITEMS</span>
          </div>

          {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                  <Sparkles className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="font-bold text-gray-400 mb-8">No looks yet. Start previewing!</p>
                  <button 
                    onClick={onCreateNew}
                    className="px-8 py-4 bg-cuttie-charcoal text-white font-bold uppercase tracking-widest rounded-xl hover:bg-cuttie-purple transition-colors shadow-xl flex items-center gap-2"
                  >
                      Create New Look <Plus className="w-4 h-4" />
                  </button>
              </div>
          ) : (
              <div className="grid grid-cols-2 gap-1">
                  {history.map(look => (
                      <button 
                        key={look.id} 
                        onClick={() => onSelectLook(look)}
                        className="relative aspect-[3/4] bg-white rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                      >
                          <img src={look.front} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                              <span className="text-white text-xs font-bold">{look.styleName}</span>
                              <span className="text-white/70 text-[10px]">{new Date(look.timestamp).toLocaleDateString()}</span>
                          </div>
                      </button>
                  ))}
              </div>
          )}
      </div>

      {/* FAB */}
      {history.length > 0 && (
        <button 
            onClick={onCreateNew}
            className="fixed bottom-8 right-6 w-14 h-14 bg-cuttie-charcoal text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
        >
            <Plus className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

export default GalleryView;
