import React from 'react';
import { Zap, Star, Trophy } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import Modal from '../ui/Modal';
import { PRICING_PLANS } from '../../data/constants';
import { auth } from '../../lib/firebase';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleTopUp: (amount: number) => void;
}

const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, handleTopUp }) => {
  const userEmail = auth.currentUser?.email || "customer@cuttie.com";
  
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  const onSuccess = (reference: any, credits: number) => {
      handleTopUp(credits);
  };

  const onClosePayment = () => {
      console.log('Payment closed');
  }

  // Helper to create payment hook for a plan
  const usePlanPayment = (priceStr: string, credits: number) => {
      const amount = parseInt(priceStr.replace(/[^0-9]/g, '')) * 100; // Convert to kobo
      const config = {
          reference: (new Date()).getTime().toString(),
          email: userEmail,
          amount,
          publicKey,
          currency: 'NGN',
      };
      const initializePayment = usePaystackPayment(config);
      return () => {
          if (!publicKey) {
              alert("Paystack key not found. Please contact support.");
              return;
          }
          console.log("Paystack Config:", config);
          initializePayment({
              onSuccess: (ref: any) => onSuccess(ref, credits),
              onClose: onClosePayment
          });
      };
  };

  const payStarter = usePlanPayment(PRICING_PLANS.TOP_UP.STARTER.PRICE, PRICING_PLANS.TOP_UP.STARTER.CREDITS);
  const payPopular = usePlanPayment(PRICING_PLANS.TOP_UP.POPULAR.PRICE, PRICING_PLANS.TOP_UP.POPULAR.CREDITS);
  const payBestValue = usePlanPayment(PRICING_PLANS.TOP_UP.BEST_VALUE.PRICE, PRICING_PLANS.TOP_UP.BEST_VALUE.CREDITS);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Your Bundle" size="md">
      <div className="p-6">
          <div className="text-center mb-8">
              <div className="w-16 h-16 bg-cuttie-clay rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-cuttie-charcoal" />
              </div>
              <h3 className="text-2xl font-display font-bold mb-2">Get Credits</h3>
              <p className="text-gray-600 font-medium text-sm">2 Credits = 1 Preview. Credits never expire.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
              
              {/* Starter */}
              <button onClick={payStarter} className="w-full flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-cuttie-purple hover:bg-purple-50/50 transition-all group relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-cuttie-charcoal group-hover:bg-white group-hover:text-cuttie-purple transition-colors">
                          <Zap className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                          <span className="block font-bold text-lg text-cuttie-charcoal">{PRICING_PLANS.TOP_UP.STARTER.NAME}</span>
                      </div>
                  </div>
                  <span className="font-display font-bold text-xl text-gray-800">{PRICING_PLANS.TOP_UP.STARTER.PRICE}</span>
              </button>

              {/* Popular */}
              <button onClick={payPopular} className="w-full flex items-center justify-between p-5 border-2 border-cuttie-charcoal bg-cuttie-charcoal text-white rounded-xl shadow-lg transform scale-105 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-cuttie-purple text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-bl-lg">
                      Most Popular
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
                          <Star className="w-5 h-5 fill-white" />
                      </div>
                      <div className="text-left">
                          <span className="block font-bold text-lg">{PRICING_PLANS.TOP_UP.POPULAR.NAME}</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="block font-display font-bold text-xl">{PRICING_PLANS.TOP_UP.POPULAR.PRICE}</span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-bold">Save {PRICING_PLANS.TOP_UP.POPULAR.SAVE}</span>
                  </div>
              </button>

              {/* Best Value */}
              <button onClick={payBestValue} className="w-full flex items-center justify-between p-5 border border-gray-200 rounded-xl hover:border-cuttie-purple hover:bg-purple-50/50 transition-all group relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 bg-cuttie-purple/10 rounded-full flex items-center justify-center text-cuttie-purple group-hover:bg-cuttie-purple group-hover:text-white transition-colors">
                          <Trophy className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                          <span className="block font-bold text-lg text-cuttie-charcoal">{PRICING_PLANS.TOP_UP.BEST_VALUE.NAME}</span>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="block font-display font-bold text-xl text-gray-800">{PRICING_PLANS.TOP_UP.BEST_VALUE.PRICE}</span>
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Save {PRICING_PLANS.TOP_UP.BEST_VALUE.SAVE}</span>
                  </div>
              </button>
          </div>
          
          <div className="mt-8 text-center flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Secured by Paystack</p>
          </div>
      </div>
    </Modal>
  );
};

export default TopUpModal;
