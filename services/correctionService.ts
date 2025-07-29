
export interface Correction {
    imageData: string;
    mimeType: string;
    correctComponentName: string;
}

const CORRECTIONS_KEY = 'design-system-corrections';
const MAX_CORRECTIONS = 5; // Limit the number of corrections stored

export const getCorrections = (): Correction[] => {
    try {
        const storedCorrections = localStorage.getItem(CORRECTIONS_KEY);
        if (storedCorrections) {
            return JSON.parse(storedCorrections);
        }
    } catch (error) {
        console.error("Failed to parse corrections from localStorage", error);
        // If parsing fails, clear the bad data to prevent future errors
        localStorage.removeItem(CORRECTIONS_KEY);
    }
    return [];
};

export const addCorrection = (newCorrection: Correction) => {
    const corrections = getCorrections();
    
    // Add the new correction to the beginning and slice to maintain the limit
    const updatedCorrections = [newCorrection, ...corrections].slice(0, MAX_CORRECTIONS);
    
    try {
        localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(updatedCorrections));
    } catch (error) {
        console.error("Failed to save correction to localStorage", error);
    }
};
