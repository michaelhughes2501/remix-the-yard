import React, { useState } from 'react';
import { Phone, AlertTriangle, X, Heart, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SOSButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:bg-red-700 hover:scale-105 transition-all flex items-center justify-center animate-pulse"
        title="Emergency Help & Crisis Support"
      >
        <ShieldAlert size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md border-2 border-red-600 shadow-2xl overflow-hidden"
            >
              <div className="bg-red-600 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-serif italic tracking-tighter flex items-center gap-2">
                  <AlertTriangle size={24} /> Crisis Support
                </h2>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <p className="text-sm opacity-80 leading-relaxed">
                  If you or someone you know is in immediate danger, please call <strong>911</strong> immediately. For other crises, use the resources below.
                </p>

                <div className="space-y-4">
                  <a href="tel:988" className="block border-2 border-[#141414] p-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors rounded-full">
                        <Heart size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Suicide & Crisis Lifeline</h3>
                        <p className="text-sm opacity-80 font-mono mt-1 flex items-center gap-2">
                          <Phone size={14} /> Call or Text 988
                        </p>
                      </div>
                    </div>
                  </a>

                  <a href="tel:18006624357" className="block border-2 border-[#141414] p-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors rounded-full">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Substance Abuse (SAMHSA)</h3>
                        <p className="text-sm opacity-80 font-mono mt-1 flex items-center gap-2">
                          <Phone size={14} /> 1-800-662-4357
                        </p>
                      </div>
                    </div>
                  </a>

                  <a href="tel:211" className="block border-2 border-[#141414] p-4 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors rounded-full">
                        <Phone size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Essential Community Services</h3>
                        <p className="text-sm opacity-80 font-mono mt-1 flex items-center gap-2">
                          <Phone size={14} /> Call 211
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
