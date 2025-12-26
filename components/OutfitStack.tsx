
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { OutfitLayer } from '../types';
import { Trash2Icon, RotateCcwIcon } from './icons';

interface OutfitStackProps {
  outfitHistory: OutfitLayer[];
  onRemoveLastGarment: () => void;
  onRecolorGarment?: (index: number) => void;
  onGenerateScore?: () => void;
  onAddToWardrobe?: () => void;
  isScoring?: boolean;
  score?: { score: number; review: string } | null;
}

const OutfitStack: React.FC<OutfitStackProps> = ({ 
  outfitHistory, 
  onRemoveLastGarment, 
  onRecolorGarment, 
  onGenerateScore,
  onAddToWardrobe,
  isScoring,
  score
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Studio Stack</h2>
        <div className="flex gap-2">
          {outfitHistory.length > 1 && onAddToWardrobe && (
             <button 
             onClick={onAddToWardrobe}
             className="text-[9px] uppercase tracking-widest font-bold bg-black text-white px-2 py-1 rounded hover:bg-gray-800 transition-all"
           >
             Save Look
           </button>
          )}
          {outfitHistory.length > 1 && onGenerateScore && (
            <button 
              onClick={onGenerateScore}
              disabled={isScoring}
              className="text-[9px] uppercase tracking-widest font-bold bg-gray-100 text-gray-900 px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 transition-all border border-gray-200"
            >
              {isScoring ? 'Analysing...' : 'Score'}
            </button>
          )}
        </div>
      </div>

      {score && (
        <div className="mb-6 p-4 bg-black text-white rounded-xl animate-fade-in shadow-2xl">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-serif font-bold text-white">{score.score}</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest border-l border-gray-800 pl-3">Critic's Rating</span>
          </div>
          <p className="text-[11px] italic text-gray-300 leading-relaxed font-serif">"{score.review}"</p>
        </div>
      )}

      <div className="space-y-1.5">
        {outfitHistory.map((layer, index) => (
          <div
            key={layer.garment?.id || 'base'}
            className="flex items-center justify-between bg-gray-50/50 p-2 rounded-lg border border-transparent hover:border-gray-200 transition-all group"
          >
            <div className="flex items-center overflow-hidden">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 mr-3 text-[9px] font-bold text-gray-300 border border-gray-200 rounded-full">
                  {index + 1}
                </span>
                {layer.garment && (
                    <img src={layer.garment.url} alt={layer.garment.name} className="flex-shrink-0 w-10 h-10 object-cover rounded bg-white shadow-sm border border-gray-100 mr-3" />
                )}
                <span className="font-bold text-gray-900 text-[10px] uppercase tracking-wider truncate" title={layer.garment?.name}>
                  {layer.garment ? layer.garment.name : 'Studio Base'}
                </span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              {layer.garment && onRecolorGarment && (
                <button
                  onClick={() => onRecolorGarment(index)}
                  className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md hover:bg-white hover:shadow-sm border border-transparent transition-all"
                  title="Recolor"
                >
                  <RotateCcwIcon className="w-3.5 h-3.5" />
                </button>
              )}
              {index > 0 && index === outfitHistory.length - 1 && (
                <button
                  onClick={onRemoveLastGarment}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-white hover:shadow-sm border border-transparent transition-all"
                >
                  <Trash2Icon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OutfitStack;
