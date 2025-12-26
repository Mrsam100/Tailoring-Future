
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPG, PNG).');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrl(dataUrl);
        setIsGenerating(true);
        setGeneratedModelUrl(null);
        setError(null);
        try {
            const result = await generateModelImage(file);
            setGeneratedModelUrl(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'creating your studio model'));
        } finally {
            setIsGenerating(false);
        }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const reset = () => {
    setUserImageUrl(null);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
  };

  const screenVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <AnimatePresence mode="wait">
      {!userImageUrl ? (
        <motion.div
          key="uploader"
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-12 px-6"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="max-w-xl">
              <span className="inline-block px-3 py-1 mb-6 text-[10px] font-bold tracking-[0.3em] uppercase bg-black text-white rounded-full">Pro Studio v1.1 | Nano Optimized</span>
              <h1 className="text-6xl md:text-7xl font-serif font-bold text-gray-900 leading-[1.1] tracking-tight">
                Digital Tailoring <br/><span className="italic font-normal text-gray-400">Perfected.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-md">
                Experience high-fidelity virtual try-on powered by our latest Nano Studio Engine. Transform portraits into digital twins instantly.
              </p>
              <div className="mt-10 flex flex-col items-center lg:items-start w-full gap-4">
                <label htmlFor="image-upload-start" className="w-full max-w-sm relative flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-black rounded-xl cursor-pointer group hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl active:scale-95 uppercase tracking-widest">
                  <UploadCloudIcon className="w-5 h-5 mr-3" />
                  Launch Studio
                </label>
                <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-medium">Recommended: High-res portrait with neutral background</p>
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold uppercase tracking-wider">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-gray-200 to-gray-50 rounded-[2.5rem] -z-10 opacity-50 blur-2xl group-hover:opacity-100 transition-opacity duration-1000"></div>
              <Compare
                firstImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon.jpg"
                secondImage="https://storage.googleapis.com/gemini-95-icons/asr-tryon-model.png"
                slideMode="drag"
                className="w-[320px] h-[480px] lg:w-[400px] lg:h-[600px] rounded-[2rem] bg-gray-100 shadow-2xl overflow-hidden grayscale-[0.1]"
              />
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="compare"
          className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-12 px-6"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4">Studio Rendering</h1>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">Nano-Powered Digital Tailoring...</p>
            
            {isGenerating && (
              <div className="flex items-center gap-4 text-lg text-gray-900 font-serif mt-10 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Spinner />
                <span className="italic">Nano Banana Engine synchronizing silhouette...</span>
              </div>
            )}

            {error && (
              <div className="mt-10 p-6 bg-red-50 rounded-2xl border border-red-100 max-w-md">
                <p className="text-red-600 font-bold uppercase tracking-widest text-xs mb-2">Studio Error</p>
                <p className="text-red-500 text-sm mb-6 leading-relaxed">{error}</p>
                <button onClick={reset} className="w-full py-3 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors">Return & Retry</button>
              </div>
            )}
            
            {!isGenerating && !error && generatedModelUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center gap-4 mt-12 w-full"
              >
                <button onClick={reset} className="w-full sm:w-auto px-8 py-4 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest">Discard</button>
                <button 
                  onClick={() => onModelFinalized(generatedModelUrl)}
                  className="w-full sm:w-auto px-10 py-4 text-xs font-bold text-white bg-black rounded-xl hover:bg-gray-800 transition-all shadow-xl uppercase tracking-widest"
                >
                  Enter Studio &rarr;
                </button>
              </motion.div>
            )}
          </div>
          <div className="md:w-1/2 flex items-center justify-center">
             <div className="relative rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-gray-100">
                <Compare
                  firstImage={userImageUrl}
                  secondImage={generatedModelUrl ?? userImageUrl}
                  slideMode="drag"
                  className="w-[300px] h-[450px] sm:w-[350px] sm:h-[525px] lg:w-[440px] lg:h-[660px] bg-gray-50"
                />
                {isGenerating && (
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm animate-pulse flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                  </div>
                )}
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartScreen;
