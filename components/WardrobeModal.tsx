/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import type { WardrobeItem } from '../types';
import { UploadCloudIcon, CheckCircleIcon } from './icons';
import Spinner from './Spinner';

interface WardrobePanelProps {
  onGarmentSelect: (garmentFile: File, garmentInfo: WardrobeItem) => void;
  activeGarmentIds: string[];
  isLoading: boolean;
  wardrobe: WardrobeItem[];
}

const urlToFile = (url: string, filename: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.setAttribute('crossOrigin', 'anonymous');
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context failed.'));
            ctx.drawImage(image, 0, 0);
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Blob conversion failed.'));
                resolve(new File([blob], filename, { type: blob.type || 'image/png' }));
            }, 'image/png');
        };
        image.onerror = () => reject(new Error('Image loading failed.'));
        image.src = url;
    });
};

const WardrobePanel: React.FC<WardrobePanelProps> = ({ onGarmentSelect, activeGarmentIds, isLoading, wardrobe }) => {
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleGarmentClick = async (item: WardrobeItem) => {
        if (isLoading || activeGarmentIds.includes(item.id)) return;
        setError(null);
        setProcessingId(item.id);
        try {
            const file = await urlToFile(item.url, item.name);
            onGarmentSelect(file, item);
        } catch (err) {
            setError("Unable to retrieve this piece from studio storage.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                setError('Invalid image format. Try JPG or PNG.');
                return;
            }
            const customGarmentInfo: WardrobeItem = {
                id: `custom-${Date.now()}`,
                name: file.name,
                url: URL.createObjectURL(file),
            };
            onGarmentSelect(file, customGarmentInfo);
        }
    };

  return (
    <div className="pt-6 border-t border-gray-100">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-5">Studio Wardrobe</h2>
        <div className="grid grid-cols-3 gap-3">
            {wardrobe.map((item) => {
            const isActive = activeGarmentIds.includes(item.id);
            const isProcessing = processingId === item.id;
            
            return (
                <button
                    key={item.id}
                    onClick={() => handleGarmentClick(item)}
                    disabled={isLoading || isActive}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden transition-all duration-300 group
                      ${isActive ? 'ring-2 ring-gray-900 ring-offset-2' : 'hover:scale-[1.03] shadow-sm hover:shadow-xl'}
                      ${isLoading && !isProcessing ? 'opacity-40 grayscale' : ''}
                    `}
                    aria-label={`Select ${item.name}`}
                >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white text-[9px] uppercase tracking-wider font-bold truncate w-full">{item.name}</p>
                    </div>

                    {isActive && (
                        <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center backdrop-blur-[1px]">
                            <CheckCircleIcon className="w-6 h-6 text-white" />
                        </div>
                    )}

                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-sm animate-pulse">
                            <Spinner />
                        </div>
                    )}
                </button>
            );
            })}
            
            <label htmlFor="custom-garment-upload" className={`relative aspect-[3/4] border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 transition-all hover:border-gray-900 hover:text-gray-900 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}>
                <UploadCloudIcon className="w-6 h-6 mb-1"/>
                <span className="text-[9px] uppercase tracking-[0.2em] font-bold">Import</span>
                <input id="custom-garment-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLoading}/>
            </label>
        </div>
        
        {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-[10px] uppercase tracking-wider font-bold rounded-lg border border-red-100 animate-fade-in">
                {error}
            </div>
        )}
    </div>
  );
};

export default WardrobePanel;