
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { RotateCcwIcon, ChevronLeftIcon, ChevronRightIcon, Trash2Icon } from './icons';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';

interface CanvasProps {
  displayImageUrl: string | null;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  onSelectPose: (index: number) => void;
  poseInstructions: string[];
  currentPoseIndex: number;
  availablePoseKeys: string[];
  onSaveOutfit: () => void;
  onLoadOutfit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ 
  displayImageUrl, 
  onStartOver, 
  isLoading, 
  loadingMessage, 
  onSelectPose, 
  poseInstructions, 
  currentPoseIndex, 
  availablePoseKeys,
  onSaveOutfit,
  onLoadOutfit,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [isPoseMenuOpen, setIsPoseMenuOpen] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const handleSaveAttempt = () => {
    setShowSaveModal(true);
  };

  const confirmSave = () => {
    onSaveOutfit();
    setShowSaveModal(false);
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  const handlePreviousPose = () => {
    if (isLoading || availablePoseKeys.length <= 1) return;
    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    if (currentIndexInAvailable === -1) {
        onSelectPose((currentPoseIndex - 1 + poseInstructions.length) % poseInstructions.length);
        return;
    }
    const prevIndexInAvailable = (currentIndexInAvailable - 1 + availablePoseKeys.length) % availablePoseKeys.length;
    const prevPoseInstruction = availablePoseKeys[prevIndexInAvailable];
    const newGlobalPoseIndex = poseInstructions.indexOf(prevPoseInstruction);
    if (newGlobalPoseIndex !== -1) onSelectPose(newGlobalPoseIndex);
  };

  const handleNextPose = () => {
    if (isLoading) return;
    const currentPoseInstruction = poseInstructions[currentPoseIndex];
    const currentIndexInAvailable = availablePoseKeys.indexOf(currentPoseInstruction);
    if (currentIndexInAvailable === -1 || availablePoseKeys.length === 0) {
        onSelectPose((currentPoseIndex + 1) % poseInstructions.length);
        return;
    }
    const nextIndexInAvailable = currentIndexInAvailable + 1;
    if (nextIndexInAvailable < availablePoseKeys.length) {
        const nextPoseInstruction = availablePoseKeys[nextIndexInAvailable];
        const newGlobalPoseIndex = poseInstructions.indexOf(nextPoseInstruction);
        if (newGlobalPoseIndex !== -1) onSelectPose(newGlobalPoseIndex);
    } else {
        const newGlobalPoseIndex = (currentPoseIndex + 1) % poseInstructions.length;
        onSelectPose(newGlobalPoseIndex);
    }
  };
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4 relative animate-zoom-in group">
      {/* Studio Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button 
              onClick={onStartOver}
              className="flex items-center justify-center bg-white/80 border border-gray-200 text-gray-700 font-bold py-2 px-3 rounded-full transition-all hover:bg-white text-[9px] uppercase tracking-widest backdrop-blur-md shadow-sm"
          >
              <RotateCcwIcon className="w-3 h-3 mr-2" />
              Reset
          </button>
          <div className="flex gap-1 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full p-1 shadow-sm">
            <button 
              onClick={onUndo} 
              disabled={!canUndo || isLoading}
              className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <button 
              onClick={onRedo} 
              disabled={!canRedo || isLoading}
              className="p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-all"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <button 
              onClick={handleSaveAttempt}
              className={`flex items-center justify-center font-bold py-2 px-4 rounded-full transition-all text-[9px] uppercase tracking-widest shadow-sm
                ${showSaveConfirm ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-black'}
              `}
          >
              {showSaveConfirm ? 'Archived' : 'Archive Look'}
          </button>
          <button 
              onClick={onLoadOutfit}
              className="flex items-center justify-center bg-white/80 border border-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full transition-all hover:bg-white text-[9px] uppercase tracking-widest backdrop-blur-md shadow-sm"
          >
              Restore
          </button>
        </div>
      </div>

      {/* Main Rendering Canvas */}
      <div className="relative w-full h-full flex items-center justify-center">
        {displayImageUrl ? (
          <img
            key={displayImageUrl}
            src={displayImageUrl}
            alt="Studio Model"
            className="max-w-full max-h-full object-contain transition-opacity duration-500 animate-fade-in rounded-lg shadow-2xl"
          />
        ) : (
            <div className="w-[380px] h-[550px] bg-gray-50 border border-gray-100 rounded-lg flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-6 font-bold animate-pulse">Establishing Studio Link...</p>
            </div>
        )}
        
        <AnimatePresence>
          {isLoading && (
              <motion.div
                  className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
              >
                  <Spinner />
                  {loadingMessage && (
                      <p className="text-[10px] font-bold text-gray-900 mt-6 text-center px-6 uppercase tracking-[0.3em] leading-relaxed">{loadingMessage}</p>
                  )}
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pose Navigation Bar */}
      {displayImageUrl && !isLoading && (
        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0"
          onMouseEnter={() => setIsPoseMenuOpen(true)}
          onMouseLeave={() => setIsPoseMenuOpen(false)}
        >
          <AnimatePresence>
              {isPoseMenuOpen && (
                  <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-4 w-72 bg-white/95 backdrop-blur-xl rounded-2xl p-3 border border-gray-100 shadow-2xl"
                  >
                      <h4 className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">Angle Calibration</h4>
                      <div className="grid grid-cols-2 gap-1.5">
                          {poseInstructions.map((pose, index) => (
                              <button
                                  key={pose}
                                  onClick={() => onSelectPose(index)}
                                  disabled={isLoading || index === currentPoseIndex}
                                  className="w-full text-left text-[9px] uppercase tracking-wider font-bold text-gray-500 p-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:bg-gray-900 disabled:text-white"
                              >
                                  {pose.split(',')[0]}
                              </button>
                          ))}
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
          
          <div className="flex items-center justify-center gap-2 bg-gray-900/90 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 shadow-2xl">
            <button 
              onClick={handlePreviousPose}
              className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30"
              disabled={isLoading}
            >
              <ChevronLeftIcon className="w-4 h-4 text-white" />
            </button>
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-white w-32 text-center truncate">
              {poseInstructions[currentPoseIndex].split(',')[0]}
            </span>
            <button 
              onClick={handleNextPose}
              className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30"
              disabled={isLoading}
            >
              <ChevronRightIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">Archive Look?</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">This will overwrite your currently stored studio session with the current styling stack.</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={confirmSave}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                >
                  Confirm Archive
                </button>
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Canvas;
