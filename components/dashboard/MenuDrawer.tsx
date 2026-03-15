
import * as React from 'react';
import { ChevronLeft, CreditCard, LogOut, Settings2, MessageSquare, Sparkles } from 'lucide-react';
import { BodyProfile } from '../../types';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenBilling: () => void;
  onOpenFeedback: () => void;
  onSignOut: () => void;
  userProfile: BodyProfile;
}

const MenuDrawer: React.FC<MenuDrawerProps> = ({ 
  isOpen, onClose, onOpenSettings, onOpenBilling, onOpenFeedback, onSignOut, userProfile 
}) => {
  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}></div>
        <div className={`relative w-72 bg-white h-full shadow-2xl transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
             <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-lg">Menu</span>
                  <button onClick={onClose}><ChevronLeft className="w-6 h-6 rotate-180" /></button>
             </div>
             
             {/* Main Menu Items */}
             <div className="p-4 space-y-2 flex-1 overflow-y-auto">
                 <button onClick={() => { onOpenBilling(); onClose(); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group transition-colors">
                     <CreditCard className="w-5 h-5 text-gray-500 group-hover:text-cuttie-purple" />
                     <span className="font-bold text-sm text-cuttie-charcoal">Get Credits</span>
                 </button>
                 
                 <button onClick={() => { onOpenFeedback(); onClose(); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg group transition-colors">
                     <MessageSquare className="w-5 h-5 text-gray-500 group-hover:text-cuttie-pink" />
                     <span className="font-bold text-sm text-cuttie-charcoal">Feedback & Support</span>
                 </button>
             </div>

             {/* Footer Actions */}
             <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                 <button onClick={onSignOut} className="w-full flex items-center gap-3 p-3 mb-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors">
                     <LogOut className="w-5 h-5" />
                     <span className="font-bold text-sm">Sign Out</span>
                 </button>
             </div>

             {/* User Profile Footer (Acts as Settings Trigger) */}
             <div className="p-4 bg-white border-t border-gray-100">
                 <button 
                    onClick={() => { onOpenSettings(); onClose(); }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-all text-left group"
                 >
                     <div className="w-10 h-10 bg-cuttie-charcoal rounded-full flex items-center justify-center text-white font-bold overflow-hidden border-2 border-white shadow-sm group-hover:border-cuttie-purple transition-colors">
                         {userProfile.referenceImage ? (
                             <img src={userProfile.referenceImage} className="w-full h-full object-cover" />
                         ) : (
                             (userProfile.email || userProfile.name || "U").charAt(0).toUpperCase()
                         )}
                     </div>
                     <div className="flex-1">
                         <div className="font-bold text-sm text-cuttie-charcoal">
                             {userProfile.email || userProfile.name || "User"}
                         </div>
                         <div className="text-xs text-gray-400 group-hover:text-cuttie-purple transition-colors">Account Settings</div>
                     </div>
                     <Settings2 className="w-4 h-4 text-gray-400" />
                 </button>
             </div>
        </div>
    </div>
  );
};

export default MenuDrawer;
