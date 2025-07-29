
import React, { useCallback } from 'react';
import { CloseIcon, UploadIcon } from './icons';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    imagePreviewUrl: string | null;
    onClearImage: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, imagePreviewUrl, onClearImage }) => {
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageUpload(file);
        }
    }, [onImageUpload]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };


    return (
        <div 
            className="relative w-full h-64 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-slate-400 bg-slate-900/50 transition-colors duration-300"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
        >
            {imagePreviewUrl ? (
                <>
                    <img src={imagePreviewUrl} alt="Component preview" className="object-contain h-full w-full rounded-lg p-2" />
                    <button
                        onClick={onClearImage}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800/80 rounded-full text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all duration-200"
                        aria-label="Remove image"
                    >
                        <CloseIcon />
                    </button>
                </>
            ) : (
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                    <UploadIcon />
                    <p className="mt-2 text-sm">
                        <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF up to 10MB</p>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                </label>
            )}
        </div>
    );
};
