
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import { 
  generateVirtualTryOnImage, 
  generatePoseVariation, 
  generateStyleScore, 
  generateColorway 
} from './services/geminiService';
import { OutfitLayer, WardrobeItem } from './types';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';

const POSE_INSTRUCTIONS = [
  "Full frontal view, hands on hips",
  "Slightly turned, 3/4 view",
  "Side profile view",
  "Jumping in the air, mid-action shot",
  "Walking towards camera",
  "Leaning against a wall",
];

const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<OutfitLayer[][]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [styleScore, setStyleScore] = useState<{ score: number; review: string } | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  const currentOutfitHistory = useMemo(() => {
    return history[historyStep] || [];
  }, [history, historyStep]);

  const currentOutfitIndex = currentOutfitHistory.length - 1;

  const displayImageUrl = useMemo(() => {
    if (currentOutfitHistory.length === 0) return modelImageUrl;
    const currentLayer = currentOutfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;
    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    return (currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0]) || null;
  }, [currentOutfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const activeGarmentIds = useMemo(() => {
    return currentOutfitHistory.map(l => l.garment?.id).filter(Boolean) as string[];
  }, [currentOutfitHistory]);

  const availablePoseKeys = useMemo(() => {
    if (currentOutfitHistory.length === 0) return [];
    const currentLayer = currentOutfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [currentOutfitHistory, currentOutfitIndex]);

  const addToHistory = useCallback((newOutfitHistory: OutfitLayer[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newOutfitHistory);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  }, [history, historyStep]);

  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(prev => prev - 1);
      setCurrentPoseIndex(0);
      setStyleScore(null);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(prev => prev + 1);
      setCurrentPoseIndex(0);
      setStyleScore(null);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('gregorious_studio_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.modelImageUrl) {
          setModelImageUrl(parsed.modelImageUrl);
          setHistory([parsed.outfitHistory || []]);
          setHistoryStep(0);
          if (parsed.wardrobe) {
             setWardrobe(prev => {
                const uniqueSaved = parsed.wardrobe.filter((sw: WardrobeItem) => !prev.some(p => p.id === sw.id));
                return [...prev, ...uniqueSaved];
             });
          }
        }
      } catch (e) {
        console.warn("Studio archives recovery failed.");
      }
    }
  }, []);

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    const initialLayer = { garment: null, poseImages: { [POSE_INSTRUCTIONS[0]]: url } };
    addToHistory([initialLayer]);
  };

  const handleSaveOutfit = () => {
    if (currentOutfitHistory.length === 0) return;
    const saveObj = {
      modelImageUrl,
      outfitHistory: currentOutfitHistory,
      wardrobe: wardrobe.filter(w => !w.id.startsWith('recolor-'))
    };
    localStorage.setItem('gregorious_studio_v3', JSON.stringify(saveObj));
  };

  const handleLoadOutfit = () => {
    const saved = localStorage.getItem('gregorious_studio_v3');
    if (!saved) {
      setError("No saved look found in archives.");
      return;
    }
    try {
      const parsed = JSON.parse(saved);
      setModelImageUrl(parsed.modelImageUrl);
      addToHistory(parsed.outfitHistory);
      setError(null);
      setLoadingMessage("Look restored.");
      setTimeout(() => setLoadingMessage(""), 1500);
    } catch (e) {
      setError("Failed to restore session.");
    }
  };

  const handleStartOver = () => {
    if (window.confirm("Start a new fitting session? Current styling will be cleared.")) {
      setModelImageUrl(null);
      setHistory([]);
      setHistoryStep(-1);
      setError(null);
      setStyleScore(null);
      localStorage.removeItem('gregorious_studio_v3');
    }
  };

  const handleGetStyleScore = async () => {
    if (!displayImageUrl || isScoring) return;
    setIsScoring(true);
    setError(null);
    try {
      const score = await generateStyleScore(displayImageUrl);
      setStyleScore(score);
    // Fixed: changed err: unknown to err: any to satisfy compiler in catch block
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, "critiquing your style"));
    } finally {
      setIsScoring(false);
    }
  };

  const handleAddToWardrobe = useCallback(() => {
    if (!displayImageUrl) return;
    const newLook: WardrobeItem = {
      id: `look-${Date.now()}`,
      name: `Studio Style ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      url: displayImageUrl
    };
    setWardrobe(prev => [...prev, newLook]);
    setLoadingMessage("Look captured.");
    setTimeout(() => setLoadingMessage(""), 1500);
  }, [displayImageUrl]);

  const handleRecolor = async (layerIndex: number) => {
    const layer = currentOutfitHistory[layerIndex];
    if (!layer?.garment || isLoading) return;
    
    setIsLoading(true);
    setLoadingMessage("Nano Palette Tailoring...");
    setError(null);
    try {
      const palette = ["Midnight Obsidian", "Bone Ivory", "Crimson Flame", "Royal Azure", "Deep Emerald"];
      const color = palette[Math.floor(Math.random() * palette.length)];
      const newUrl = await generateColorway(layer.garment.url, color);
      
      const newGarment: WardrobeItem = {
        ...layer.garment,
        id: `recolor-${Date.now()}`,
        name: `${layer.garment.name} (${color.split(' ')[1]})`,
        url: newUrl
      };
      
      setWardrobe(prev => [...prev, newGarment]);
      setLoadingMessage(`Nano: ${color} variant ready.`);
      setTimeout(() => setIsLoading(false), 1500);
    // Fixed: changed err: unknown to err: any to satisfy compiler in catch block
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, "recoloring your garment"));
      setIsLoading(false);
    }
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;
    
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Nano Tailoring ${garmentInfo.name}...`);
    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile);
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      const newLayer: OutfitLayer = { garment: garmentInfo, poseImages: { [currentPoseInstruction]: newImageUrl } };
      addToHistory([...currentOutfitHistory, newLayer]);
      setStyleScore(null);
    // Fixed: changed err: unknown to err: any to satisfy compiler in catch block
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, 'fitting your selection'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, currentOutfitHistory, addToHistory]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitHistory.length > 1) {
      addToHistory(currentOutfitHistory.slice(0, -1));
      setCurrentPoseIndex(0);
      setStyleScore(null);
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || currentOutfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    const pose = POSE_INSTRUCTIONS[newIndex];
    const layer = currentOutfitHistory[currentOutfitIndex];
    if (layer.poseImages[pose]) {
      setCurrentPoseIndex(newIndex);
      return;
    }
    const base = Object.values(layer.poseImages)[0];
    if (!base) return;
    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Nano Reposing...`);
    setCurrentPoseIndex(newIndex);
    try {
      const newImageUrl = await generatePoseVariation(base, pose);
      const newOutfitHistory = [...currentOutfitHistory];
      newOutfitHistory[currentOutfitIndex] = {
        ...newOutfitHistory[currentOutfitIndex],
        poseImages: {
          ...newOutfitHistory[currentOutfitIndex].poseImages,
          [pose]: newImageUrl
        }
      };
      addToHistory(newOutfitHistory);
    // Fixed: changed err: unknown to err: any on line 284 (approx) to satisfy compiler in catch block
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err, "re-posing your silhouette"));
      setCurrentPoseIndex(0);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, currentOutfitHistory, currentOutfitIndex, isLoading, addToHistory]);

  return (
    <div className="font-sans text-gray-900 bg-white selection:bg-black selection:text-white">
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-center justify-center bg-gray-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 md:pb-0">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  onSaveOutfit={handleSaveOutfit}
                  onLoadOutfit={handleLoadOutfit}
                  onUndo={undo}
                  onRedo={redo}
                  canUndo={historyStep > 0}
                  canRedo={historyStep < history.length - 1}
                />
              </div>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/95 backdrop-blur-3xl flex flex-col border-t md:border-t-0 md:border-l border-gray-100 transition-transform duration-500 ease-in-out z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-12 flex items-center justify-center bg-gray-50/50 hover:bg-gray-100 transition-colors border-b"
                  >
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                  </button>
                  <div className="p-4 md:p-6 pb-24 overflow-y-auto flex-grow flex flex-col gap-8 no-scrollbar">
                    {error && (
                      <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest animate-fade-in flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-red-100 rounded-full text-red-600">!</span>
                        {error}
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={currentOutfitHistory}
                      onRemoveLastGarment={handleRemoveLastGarment}
                      onRecolorGarment={handleRecolor}
                      onGenerateScore={handleGetStyleScore}
                      onAddToWardrobe={handleAddToWardrobe}
                      isScoring={isScoring}
                      score={styleScore}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                    />
                  </div>
              </aside>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} />
    </div>
  );
};

export default App;
