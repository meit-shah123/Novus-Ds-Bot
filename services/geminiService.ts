import { GoogleGenAI, GenerateContentResponse, Part, Content } from "@google/genai";
import { COMPONENT_LIST } from '../constants';
import { getCorrections } from './correctionService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper to find Figma link from the main list
const getFigmaLink = (componentName: string): string => {
    const componentLine = COMPONENT_LIST
        .split('\n')
        .find(line => line.trim().startsWith(componentName + ':'));
    
    if (componentLine) {
        const link = componentLine.substring(componentLine.indexOf(':') + 1).trim();
        return link;
    }
    return "Figma link not found in the list.";
};

export const identifyComponent = async (
  base64ImageData: string,
  mimeType: string,
  userNote: string
): Promise<string> => {
    const corrections = getCorrections();
    const contents: Content[] = [];

    const systemInstruction = `You are a design system assistant helping designers identify components from UI screenshots.

When a screenshot of a component is uploaded, analyze it carefully and compare its structure, purpose, or design features with the provided list of known components.

Each component has a name and a Figma link.

Your task:
- Use the screenshot’s visual description (and any optional user note) to determine the closest matching component from the list.
- Return only the most likely match.
- Use this format for your response:

Component: <Component Name>
Figma Link: <Figma Link>

If no confident match is found, respond with:
"Sorry, I couldn't confidently match this component."

---

Here is the full component list to choose from:
${COMPONENT_LIST}`;

    // Build conversation history from corrections for few-shot prompting
    if (corrections.length > 0) {
        for (const correction of corrections.reverse()) { // Process older corrections first
            // User turn: provides an image
            contents.push({
                role: 'user',
                parts: [{ inlineData: { mimeType: correction.mimeType, data: correction.imageData } }]
            });
            // Model turn: provides the correct response based on the correction
            contents.push({
                role: 'model',
                parts: [{ 
                    text: `Component: ${correction.correctComponentName}\nFigma Link: ${getFigmaLink(correction.correctComponentName)}`
                }]
            });
        }
    }

    // The final user request with the new image to analyze
    const userParts: Part[] = [];

    const promptTextParts = [];
    if (userNote) {
        promptTextParts.push(`User Note: "${userNote}"`);
    }
    promptTextParts.push("Analyze the following image and identify the component.");
    
    userParts.push({ text: promptTextParts.join('\n') });
    userParts.push({ inlineData: { mimeType, data: base64ImageData } });

    contents.push({
        role: 'user',
        parts: userParts
    });

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("The API request to Google AI failed. Please check your connection or API key.");
    }
};
