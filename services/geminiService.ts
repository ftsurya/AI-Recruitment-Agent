import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage, FinalReport, NextStep } from '../types';
import { GREETING_PROMPT, NEXT_STEP_PROMPT, FINAL_REPORT_PROMPT, nextStepSchema, finalReportSchema, ANALYZE_RESPONSE_PROMPT, textProctoringSchema } from '../constants';

const API_KEY = process.env.API_KEY;

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

if (!ai) {
  console.error("API_KEY environment variable not set. AI services will be disabled.");
}

const model = 'gemini-2.5-flash';

const generateContentWithSchema = async <T,>(prompt: string, schema: any): Promise<T> => {
  if (!ai) throw new Error("AI service is not initialized. Is the API_KEY set?");
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error("Error generating content with schema:", error);
    throw new Error("Failed to get a valid response from the AI model.");
  }
};


const generateFirstQuestion = async (jobDescription: string, resumeText: string): Promise<ChatMessage> => {
    if (!ai) throw new Error("AI service is not initialized. Is the API_KEY set?");
    const prompt = `
    ${GREETING_PROMPT}

    --- JOB DESCRIPTION ---
    ${jobDescription}

    --- RESUME ---
    ${resumeText}
    `;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt
    });

    return {
        role: 'ai',
        content: response.text,
        isGreeting: true,
    };
};

const getNextStep = async (chatHistory: ChatMessage[], jobDescription: string, resumeText: string): Promise<NextStep> => {
    const historyString = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const prompt = `
    ${NEXT_STEP_PROMPT}

    --- JOB DESCRIPTION ---
    ${jobDescription}

    --- RESUME ---
    ${resumeText}

    --- CHAT HISTORY ---
    ${historyString}
    `;

    return generateContentWithSchema<NextStep>(prompt, nextStepSchema);
};

const generateFinalReport = async (chatHistory: ChatMessage[], jobDescription: string, resumeText: string, codeSubmission?: string): Promise<FinalReport> => {
    const historyString = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const prompt = `
    ${FINAL_REPORT_PROMPT}

    --- JOB DESCRIPTION ---
    ${jobDescription}

    --- RESUME ---
    ${resumeText}

    --- FULL CHAT HISTORY ---
    ${historyString}

    ${codeSubmission ? `--- PYTHON CODE SUBMISSION ---\n${codeSubmission}` : ''}
    `;

    return generateContentWithSchema<FinalReport>(prompt, finalReportSchema);
};

const visionProctoringSchema = {
    type: Type.OBJECT,
    properties: {
        cheating_detected: { type: Type.BOOLEAN, description: "True if cheating (e.g., mobile phone usage) is detected." },
        reason: { type: Type.STRING, description: "Brief reason for cheating detection (e.g., 'Mobile phone usage', 'None')." },
        candidate_absent: { type: Type.BOOLEAN, description: "True if the candidate is not visible in the frame."}
    }
};

interface ProctoringResult {
    cheating_detected: boolean;
    reason: string;
    candidate_absent?: boolean;
}

const analyzeFrame = async (base64Image: string, streamType: 'webcam' | 'screen'): Promise<ProctoringResult> => {
    if (!ai) throw new Error("AI service is not initialized. Is the API_KEY set?");
    const prompt = streamType === 'webcam' ? `
    You are an AI proctor for an online job interview. Analyze this single image frame captured from the candidate's webcam. Your task is to detect policy violations.

    Check for two things:
    1. **Cheating:** Is the candidate holding, looking at, or interacting with a mobile phone or any other secondary device? Be very strict about this.
    2. **Presence:** Is a person clearly visible and sitting upright, facing forward towards the camera? The candidate must be present in the frame.

    Respond ONLY with a JSON object matching the provided schema.
    - If a mobile phone is detected, set "cheating_detected" to true and "reason" to "Mobile phone usage".
    - If the candidate is not visible or not properly seated, set "candidate_absent" to true.
    - If no violations are detected, set both boolean flags to false.
    ` : `
    You are an AI proctor for an online job interview. Analyze this single image frame captured from the candidate's screen share. Your task is to detect potential cheating.

    Check for the following:
    - Does the screen show any applications, websites, or documents other than the interview platform itself? The candidate is allowed to see the video feeds, a transcript, and a simple code editor provided within the platform.

    Respond ONLY with a JSON object matching the provided schema. If no cheating is detected, set "cheating_detected" to false and "reason" to "None". Crucially, set "candidate_absent" to false for all screen share analyses.
    `;

    const imagePart = {
        inlineData: { mimeType: 'image/jpeg', data: base64Image }
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }, imagePart] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: visionProctoringSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ProctoringResult;
    } catch (error) {
        console.error("Error analyzing frame:", error);
        return { cheating_detected: false, reason: "Error during analysis", candidate_absent: false };
    }
};

const analyzeTextResponse = async (responseText: string): Promise<ProctoringResult> => {
    if (!ai) throw new Error("AI service is not initialized. Is the API_KEY set?");
    const prompt = `
        ${ANALYZE_RESPONSE_PROMPT}

        --- CANDIDATE RESPONSE ---
        ${responseText}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: textProctoringSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ProctoringResult;
    } catch (error) {
        console.error("Error analyzing text response:", error);
        return { cheating_detected: false, reason: "Error during analysis" };
    }
}


export const aiRecruiterService = {
  generateFirstQuestion,
  getNextStep,
  generateFinalReport,
  analyzeFrame,
  analyzeTextResponse,
};