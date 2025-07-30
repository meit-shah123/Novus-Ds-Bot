
import React, { useEffect } from 'react';
import { CloseIcon } from './icons';

interface FullScreenPreviewProps {
    imageUrl: string;
    onClose: () => void;
}

export const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Fullscreen image preview"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-full text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all duration-200 z-10"
                aria-label="Close fullscreen view"
            >
                <CloseIcon />
            </button>
            <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                <img 
                    src={imageUrl} 
                    alt="Fullscreen component preview" 
                    className="object-contain max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
                />
            </div>
        </div>
    );
};
