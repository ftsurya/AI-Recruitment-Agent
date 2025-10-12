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
        cheating_reason: { type: Type.STRING, description: "Brief reason for cheating detection (e.g., 'Mobile phone usage', 'None')." },
        candidate_absent: { type: Type.BOOLEAN, description: "True if the candidate is not visible in the frame." },
        eye_contact_deviation: { type: Type.BOOLEAN, description: "True if the candidate's gaze is significantly and consistently deviated from the screen, suggesting they are reading from another source." },
        video_quality_issue: { type: Type.BOOLEAN, description: "True if there is a significant video quality issue like poor lighting or a very blurry image." },
        video_quality_reason: { type: Type.STRING, description: "Reason for video quality issue (e.g., 'Poor lighting', 'Blurry image', 'None')." }
    }
};


export interface VideoProctoringResult {
    cheating_detected: boolean;
    cheating_reason: string;
    candidate_absent: boolean;
    eye_contact_deviation: boolean;
    video_quality_issue: boolean;
    video_quality_reason: string;
}

interface TextProctoringResult {
    cheating_detected: boolean;
    reason: string;
}

const analyzeFrame = async (base64Image: string, streamType: 'webcam' | 'screen'): Promise<VideoProctoringResult> => {
    if (!ai) throw new Error("AI service is not initialized. Is the API_KEY set?");
    const prompt = streamType === 'webcam' ? `
    You are an AI proctor for an online job interview. Analyze this single image frame captured from the candidate's webcam. Your task is to detect policy violations and quality issues.

    Check for the following things:
    1.  **Cheating:** Is the candidate holding, looking at, or interacting with a mobile phone or any other secondary device? Be very strict about this.
    2.  **Presence:** Is a person clearly visible and sitting upright, facing forward towards the camera? The candidate must be present in the frame.
    3.  **Eye Contact:** Is the candidate's gaze significantly deviated away from the screen for what seems like an extended period? Infer this based on head position and eye direction. This could indicate they are reading answers. Flag this if it is very obvious.
    4.  **Video Quality:** Is the image very dark, blurry, or pixelated to the point where the candidate is not clearly visible?

    Respond ONLY with a JSON object matching the provided schema.
    - If a mobile phone is detected, set "cheating_detected" to true and "cheating_reason" to "Mobile phone usage".
    - If the candidate is not visible, set "candidate_absent" to true.
    - If significant eye contact deviation is detected, set "eye_contact_deviation" to true.
    - If there's a major video quality problem, set "video_quality_issue" to true and provide a "video_quality_reason".
    - If no issues are detected, set all boolean flags to false and reasons to "None".
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
            contents: { parts: [{ text: prompt }, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: visionProctoringSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as VideoProctoringResult;
    } catch (error) {
        console.error("Error analyzing frame:", error);
        return { cheating_detected: false, cheating_reason: "Error during analysis", candidate_absent: false, eye_contact_deviation: false, video_quality_issue: false, video_quality_reason: 'None' };
    }
};

const analyzeTextResponse = async (responseText: string): Promise<TextProctoringResult> => {
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
        return JSON.parse(jsonText) as TextProctoringResult;
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