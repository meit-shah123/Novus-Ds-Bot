
import React, { useState, useCallback, useMemo } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { identifyComponent } from './services/geminiService';
import { LogoIcon } from './components/icons';
import { COMPONENT_LIST } from './constants';
import { addCorrection } from './services/correctionService';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Helper to parse component names from the constant list
const parseComponentNames = (list: string): string[] => {
    return list
        .trim()
        .split('\n')
        .map(line => line.split(':')[0].trim())
        .filter(name => name);
};


export default function App(): React.ReactNode {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [userNote, setUserNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [correctionSubmitted, setCorrectionSubmitted] = useState(false);
    const [isOtherFlow, setIsOtherFlow] = useState(false);

    const componentNames = useMemo(() => parseComponentNames(COMPONENT_LIST), []);
    const componentNamesWithOther = useMemo(() => [...componentNames, 'Other'], [componentNames]);

    const handleImageUpload = useCallback((file: File) => {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setApiResponse(null);
        setError(null);
        setCorrectionSubmitted(false);
        setIsOtherFlow(false);
    }, []);

    const handleClearImage = useCallback(() => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview(null);
        setApiResponse(null);
        setError(null);
        setImageBase64(null);
        setCorrectionSubmitted(false);
        setIsOtherFlow(false);
    }, [imagePreview]);

    const handleAnalyze = async () => {
        if (!imageFile) {
            setError("Please upload an image first.");
            return;
        }

        setIsLoading(true);
        setApiResponse(null);
        setError(null);
        setCorrectionSubmitted(false);

        try {
            // Ensure base64 is available for both flows
            const base64 = await fileToBase64(imageFile);
            const cleanBase64 = base64.split(',')[1];
            setImageBase64(cleanBase64);
            
            if (userNote.trim().toLowerCase() === 'other') {
                setIsOtherFlow(true);
                // Don't call gemini, just show the correction form
            } else {
                setIsOtherFlow(false);
                const result = await identifyComponent(cleanBase64, imageFile.type, userNote);
                setApiResponse(result);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(`Failed to analyze the image. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCorrectionSubmit = useCallback((correctComponentName: string) => {
        if (!imageBase64 || !imageFile?.type) {
            console.error("Cannot submit correction without image data.");
             // Show an error to the user if they try to submit a correction without an image
            if (!imageFile) {
                setError("Please upload an image before submitting a correction.");
            }
            return;
        }
        addCorrection({
            imageData: imageBase64,
            mimeType: imageFile.type,
            correctComponentName,
        });
        setCorrectionSubmitted(true);
        // If the user was in the "Other" flow, clear the note and reset the flow
        if (isOtherFlow) {
            setUserNote('');
            setIsOtherFlow(false);
        }
    }, [imageBase64, imageFile, isOtherFlow]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <header className="w-full max-w-5xl mx-auto mb-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <LogoIcon />
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 tracking-tight">Novus Component Assistant</h1>
                </div>
                <p className="text-slate-400 text-lg">Upload a component screenshot to identify it in the Novus Design System.</p>
            </header>
            
            <main className="w-full max-w-5xl mx-auto bg-slate-800/50 rounded-2xl shadow-2xl ring-1 ring-white/10 p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Uploader & Input */}
                    <div className="flex flex-col gap-6">
                        <ImageUploader 
                            onImageUpload={handleImageUpload} 
                            imagePreviewUrl={imagePreview} 
                            onClearImage={handleClearImage} 
                        />
                        <div>
                            <label htmlFor="user-note" className="block text-sm font-medium text-slate-300 mb-2">
                                Optional Note
                            </label>
                            <textarea
                                id="user-note"
                                value={userNote}
                                onChange={(e) => setUserNote(e.target.value)}
                                placeholder="e.g., 'This is a dropdown for selecting a country', or type 'Other' to specify a new component."
                                className="w-full h-24 p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={handleAnalyze}
                            disabled={!imageFile || isLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 transition-all duration-200"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : "Analyze Component"}
                        </button>
                    </div>

                    {/* Right Column: Results */}
                    <div className="flex flex-col">
                        <h2 className="text-lg font-semibold text-slate-200 mb-4">Analysis Result</h2>
                         <ResultDisplay 
                            response={apiResponse} 
                            isLoading={isLoading}
                            error={error}
                            componentNames={componentNamesWithOther}
                            onCorrectionSubmit={handleCorrectionSubmit}
                            correctionSubmitted={correctionSubmitted}
                            forceShowCorrection={isOtherFlow}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
