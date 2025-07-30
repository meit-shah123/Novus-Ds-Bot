
import React, { useState, useEffect } from 'react';
import { LinkIcon, FullScreenIcon } from './icons';
import { ComponentInfo } from '../constants';
import { FullScreenPreview } from './FullScreenPreview';

interface ResultDisplayProps {
    response: string | null;
    isLoading: boolean;
    error: string | null;
    componentNames: string[];
    componentData: ComponentInfo[];
    onCorrectionSubmit: (correctComponentName: string) => void;
    correctionSubmitted: boolean;
    forceShowCorrection?: boolean;
}

const SkeletonLoader: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3"></div>
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-24 bg-slate-700 rounded w-full mt-4"></div>
    </div>
);

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ response, isLoading, error, componentNames, componentData, onCorrectionSubmit, correctionSubmitted, forceShowCorrection = false }) => {
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [selectedComponent, setSelectedComponent] = useState('');
    const [otherComponentName, setOtherComponentName] = useState('');
    const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

    const parseResponse = () => {
        if (!response) return null;
        const lines = response.trim().split('\n');
        if (lines[0].startsWith("Component:") && lines[1]?.startsWith("Figma Link:")) {
            return {
                componentName: lines[0].replace("Component:", "").trim(),
                figmaLink: lines[1].replace("Figma Link:", "").trim()
            };
        }
        return { noMatch: response };
    };
    const parsedData = parseResponse();
    const componentInfo = parsedData?.componentName ? componentData.find(c => c.name === parsedData.componentName) : null;


    useEffect(() => {
        if (forceShowCorrection) {
            setSelectedComponent('Other');
            setOtherComponentName(''); // Reset text field when flow is triggered
        }
    }, [forceShowCorrection]);

    useEffect(() => {
        if (componentNames.length > 0 && !selectedComponent && !forceShowCorrection) {
            setSelectedComponent(componentNames[0]);
        }
    }, [componentNames, selectedComponent, forceShowCorrection]);

    useEffect(() => {
        if (isLoading || response || error) {
            setShowCorrectionForm(false);
        }
    }, [isLoading, response, error])

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const componentToSubmit = selectedComponent === 'Other' ? otherComponentName : selectedComponent;
        if (!componentToSubmit.trim()) {
            // Basic validation to prevent submitting empty names
            return;
        }
        onCorrectionSubmit(componentToSubmit);
        setShowCorrectionForm(false);
        setOtherComponentName('');
    };

    const renderMainContent = () => {
        if (isLoading) {
            return <SkeletonLoader />;
        }
        if (error) {
            return (
                <div className="text-red-400 bg-red-900/30 p-4 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                </div>
            );
        }
        
        if (!parsedData) {
            if (forceShowCorrection) return null; // Hide placeholder when showing the correction form
            return <p className="text-slate-500">Upload an image and click "Analyze" to see the result.</p>;
        }

        if (parsedData.noMatch) {
            return <p className="text-slate-300">{parsedData.noMatch}</p>;
        }

        return (
            <div className="space-y-4">
                {componentInfo?.previewUrl && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Component Preview</h3>
                        <div className="relative bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-center items-center">
                            <img src={componentInfo.previewUrl} alt={`${componentInfo.name} preview`} className="max-w-full max-h-48 object-contain rounded-md" />
                            <button
                                onClick={() => setFullScreenImageUrl(componentInfo.previewUrl)}
                                className="absolute top-2 right-2 p-1.5 bg-slate-900/50 backdrop-blur-sm rounded-full text-slate-300 hover:bg-slate-700/80 hover:text-white transition-all duration-300"
                                aria-label="View fullscreen"
                            >
                                <FullScreenIcon />
                            </button>
                        </div>
                    </div>
                )}
                <div>
                    <h3 className="text-sm font-medium text-slate-400">Matched Component</h3>
                    <p className="text-lg font-semibold text-slate-50">{parsedData.componentName}</p>
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-400">Figma Link</h3>
                    <a 
                        href={parsedData.figmaLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 hover:underline transition-colors duration-200 break-all"
                    >
                        <span className="truncate">{parsedData.figmaLink}</span>
                        <LinkIcon />
                    </a>
                </div>
            </div>
        );
    };

    const renderCorrectionSection = () => {
        const isFormVisible = showCorrectionForm || forceShowCorrection;
        const canShowImproveButton = parsedData && !parsedData.noMatch && !error && !isLoading && !isFormVisible;

        if (isLoading) return null;
        if (!isFormVisible && !canShowImproveButton) return null;
        
        return (
            <div className="mt-6 pt-4 border-t border-slate-700/50">
                {correctionSubmitted && !isFormVisible ? (
                    <div className="text-sm text-green-400 bg-green-900/30 p-3 rounded-lg text-center">
                        <p>Thank you! Your feedback will improve future analysis.</p>
                    </div>
                ) : isFormVisible ? (
                    <form onSubmit={handleFormSubmit}>
                        <label htmlFor="component-correction" className="block text-sm font-medium text-slate-300 mb-2">
                            {forceShowCorrection ? 'Please specify the component name' : 'What component is this really?'}
                        </label>
                        <div className="relative">
                            <select
                                id="component-correction"
                                value={selectedComponent}
                                onChange={(e) => setSelectedComponent(e.target.value)}
                                className="w-full appearance-none rounded-lg border border-slate-600 bg-slate-900 py-3 pl-4 pr-10 text-white transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {componentNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                        {selectedComponent === 'Other' && (
                            <div className="mt-3">
                                <label htmlFor="other-component-name" className="sr-only">New component name</label>
                                <input
                                    id="other-component-name"
                                    type="text"
                                    value={otherComponentName}
                                    onChange={(e) => setOtherComponentName(e.target.value)}
                                    className="w-full p-2 bg-slate-900 border border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                                    placeholder="Enter new component name"
                                    required
                                />
                            </div>
                        )}
                        <div className="mt-3 flex gap-2 justify-end">
                            {!forceShowCorrection && (
                                <button type="button" onClick={() => setShowCorrectionForm(false)} className="px-3 py-1.5 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                                    Cancel
                                </button>
                            )}
                            <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors">
                                Submit Correction
                            </button>
                        </div>
                    </form>
                ) : (
                    canShowImproveButton && (
                        <button onClick={() => setShowCorrectionForm(true)} className="text-sm text-indigo-400 hover:underline w-full text-center py-1">
                            Not right? Help us improve
                        </button>
                    )
                )}
            </div>
        );
    };

    return (
        <div className="bg-slate-900/70 p-6 rounded-lg h-full border border-slate-700 flex flex-col">
           <div className="flex-grow">
                {renderMainContent()}
           </div>
           {renderCorrectionSection()}
           {fullScreenImageUrl && (
                <FullScreenPreview 
                    imageUrl={fullScreenImageUrl}
                    onClose={() => setFullScreenImageUrl(null)}
                />
            )}
        </div>
    );
};
