
import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Sparkles, Bug, Handshake } from 'lucide-react';
import Modal from '../ui/Modal';
import { auth } from '../../lib/firebase';
import { submitFeedback } from '../../services/userService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'FEATURE' | 'BUG' | 'PARTNERSHIP';

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !message.trim()) return;

    setIsSubmitting(true);

    try {
        if (auth.currentUser) {
            await submitFeedback(auth.currentUser.uid, selectedType, message);
        }
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            setMessage('');
            setSelectedType(null);
            onClose();
        }, 2000);
    } catch (e) {
        console.error("Feedback failed", e);
        alert("Could not send feedback. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const categories: { id: FeedbackType; label: string; icon: React.ReactNode }[] = [
    { id: 'FEATURE', label: 'Feature Request', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'BUG', label: 'Issue / Bug', icon: <Bug className="w-4 h-4" /> },
    { id: 'PARTNERSHIP', label: 'Partnership', icon: <Handshake className="w-4 h-4" /> }
  ];

  if (isSuccess) {
      return (
          <Modal isOpen={isOpen} onClose={onClose} title="Thank You" size="sm">
              <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-up">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">Message Sent!</h3>
                  <p className="text-gray-500 text-sm">We appreciate your feedback. It helps us shape the future of beauty preview technology.</p>
              </div>
          </Modal>
      );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Feedback & Support" size="sm">
      <div className="p-6">
          <div className="text-center mb-8">
              <div className="w-12 h-12 bg-cuttie-clay rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-cuttie-charcoal" />
              </div>
              <p className="text-gray-600 font-medium text-sm leading-relaxed max-w-xs mx-auto">
                  We value your input! Let us know if you have ideas, found a bug, or want to partner with us.
              </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
              {/* Intelligent Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedType(cat.id)}
                        className={`
                            flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200
                            ${selectedType === cat.id 
                                ? 'border-cuttie-charcoal bg-cuttie-charcoal text-white shadow-lg scale-105' 
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                            }
                        `}
                      >
                          <div className={`mb-2 ${selectedType === cat.id ? 'text-cuttie-purple' : 'text-gray-400'}`}>
                              {cat.icon}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-center">{cat.label}</span>
                      </button>
                  ))}
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Your Message</label>
                  <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                          selectedType === 'FEATURE' ? "I wish the AI could..." :
                          selectedType === 'BUG' ? "Something went wrong when..." :
                          selectedType === 'PARTNERSHIP' ? "I'm a brand/creator interested in..." :
                          "How can we help?"
                      }
                      className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cuttie-charcoal/10 focus:border-cuttie-charcoal transition-all text-sm font-medium resize-none placeholder:text-gray-400"
                  />
              </div>

              <button
                  type="submit"
                  disabled={!selectedType || !message.trim() || isSubmitting}
                  className="w-full py-4 bg-cuttie-charcoal text-white font-bold uppercase tracking-widest rounded-xl hover:bg-cuttie-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
              >
                  {isSubmitting ? (
                      <span className="animate-pulse">Sending...</span>
                  ) : (
                      <>Submit Feedback <Send className="w-4 h-4" /></>
                  )}
              </button>
          </form>
      </div>
    </Modal>
  );
};

export default FeedbackModal;
