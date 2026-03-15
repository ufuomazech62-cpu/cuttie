import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Paperclip, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import { COST_IMAGE_GEN } from '../../data/constants';
import { GeneratedLook } from '../../types';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  text: string;
  image?: string;
}

interface TweakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (instruction: string, angle: string, image?: string) => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  credits: number;
  currentLook: GeneratedLook | null;
}

const TweakModal: React.FC<TweakModalProps> = ({ 
    isOpen, onClose, onSubmit, messages, setMessages, credits, currentLook 
}) => {
  const [instruction, setInstruction] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<string>('front');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Reset to front when opening
  useEffect(() => {
      if (isOpen) setSelectedAngle('front');
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() && !attachedImage) return;

    // Add User Message
    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        text: instruction,
        image: attachedImage || undefined
    };
    setMessages(prev => [...prev, userMsg]);

    // Trigger Parent Action
    onSubmit(instruction, selectedAngle, attachedImage || undefined);

    // Reset Input
    setInstruction('');
    setAttachedImage(null);
    
    // Simulate Assistant Reply
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            text: 'I\'m working on that now. Hang tight...'
        }]);
    }, 500);
  };

  const hasCredits = credits >= COST_IMAGE_GEN;

  // Input Footer Component
  const InputFooter = (
    <div className="w-full">
        {/* Economy Indicator */}
        <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <Zap className={`w-3 h-3 ${hasCredits ? 'text-cuttie-purple' : 'text-red-400'}`} />
                <span>{credits} Credits</span>
            </div>
        </div>

        {attachedImage && (
            <div className="flex items-center gap-3 mb-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-fit animate-fade-up">
                <img src={attachedImage} className="w-10 h-10 rounded-md object-cover" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Attached</span>
                    <span className="text-xs font-bold text-gray-800">Ref. Image</span>
                </div>
                <button onClick={() => setAttachedImage(null)} className="ml-2 p-1 hover:bg-gray-200 rounded-full text-gray-500">
                    <X className="w-4 h-4" />
                </button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-3xl p-2 focus-within:ring-2 focus-within:ring-cuttie-charcoal/10 transition-shadow">
            <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-400 hover:text-cuttie-charcoal hover:bg-white rounded-full transition-colors"
                title="Attach Reference Image"
            >
                <Paperclip className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            
            <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={hasCredits ? "Type your adjustment..." : "Please get credits to continue"}
                disabled={!hasCredits}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400 h-10 disabled:opacity-50"
            />

            <button 
                type="submit" 
                disabled={(!instruction.trim() && !attachedImage) || !hasCredits}
                className="p-3 bg-cuttie-charcoal text-white rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-md disabled:bg-gray-300"
            >
                <Send className="w-4 h-4 ml-0.5" />
            </button>
        </form>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Beauty Assistant" size="sm" footer={InputFooter}>
        
        {/* View Selection Area - Fixed at top of scroll view effectively */}
        {currentLook && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-col gap-2 sticky top-0 z-10">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select view to adjust</span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {/* Front */}
                    <button 
                        onClick={() => setSelectedAngle('front')}
                        className={`
                            relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all
                            ${selectedAngle === 'front' ? 'border-cuttie-charcoal ring-1 ring-cuttie-charcoal scale-105 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'}
                        `}
                    >
                        <img src={currentLook.front} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5">FRONT</div>
                    </button>

                    {/* Right */}
                    {currentLook.right && (
                        <button 
                            onClick={() => setSelectedAngle('right')}
                            className={`
                                relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all
                                ${selectedAngle === 'right' ? 'border-cuttie-charcoal ring-1 ring-cuttie-charcoal scale-105 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'}
                            `}
                        >
                            <img src={currentLook.right} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5">RIGHT</div>
                        </button>
                    )}

                    {/* Back */}
                    {currentLook.back && (
                        <button 
                            onClick={() => setSelectedAngle('back')}
                            className={`
                                relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all
                                ${selectedAngle === 'back' ? 'border-cuttie-charcoal ring-1 ring-cuttie-charcoal scale-105 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'}
                            `}
                        >
                            <img src={currentLook.back} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5">BACK</div>
                        </button>
                    )}

                    {/* Left */}
                    {currentLook.left && (
                        <button 
                            onClick={() => setSelectedAngle('left')}
                            className={`
                                relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all
                                ${selectedAngle === 'left' ? 'border-cuttie-charcoal ring-1 ring-cuttie-charcoal scale-105 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'}
                            `}
                        >
                            <img src={currentLook.left} className="w-full h-full object-cover" />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold py-0.5">LEFT</div>
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* Chat Messages */}
        <div className="p-4 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                        className={`
                            max-w-[85%] p-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-cuttie-charcoal text-white rounded-tr-sm' 
                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                            }
                        `}
                    >
                        {msg.image && (
                            <img src={msg.image} className="w-full h-32 object-cover rounded-lg mb-2 border border-white/10" />
                        )}
                        <p>{msg.text}</p>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    </Modal>
  );
};

export default TweakModal;
